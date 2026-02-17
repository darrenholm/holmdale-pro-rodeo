import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Camera, Keyboard, QrCode, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const STEP = {
  SCAN_QR: 'scan_qr',
  SCAN_RFID: 'scan_rfid',
  MANUAL_QR: 'manual_qr',
  MANUAL_RFID: 'manual_rfid',
  VERIFY: 'verify',
  SCAN_WRISTBANDS: 'scan_wristbands',
  SUCCESS: 'success',
  ERROR: 'error'
};

export default function GateScan() {
  const [step, setStep] = useState(STEP.SCAN_QR);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [rfidTagId, setRfidTagId] = useState('');
  const [ticket, setTicket] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [wristbandsScanned, setWristbandsScanned] = useState([]);
  const [currentWristbandIndex, setCurrentWristbandIndex] = useState(0);
  const [totalWristbandsNeeded, setTotalWristbandsNeeded] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const rfidInputRef = useRef(null);
  const nfcAbortControllerRef = useRef(null);

  useEffect(() => {
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
    setScanning(true);
  }, []);

  useEffect(() => {
    if (scanning && step === STEP.SCAN_QR) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanning, step]);

  useEffect(() => {
    if (step === STEP.SCAN_RFID && nfcSupported && !nfcScanning) {
      startNFCScan();
    }
  }, [step]);

  useEffect(() => {
    if (step === STEP.SUCCESS || step === STEP.ERROR) {
      const timer = setTimeout(() => {
        reset();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === STEP.SCAN_RFID || step === STEP.MANUAL_RFID) {
      const handleGlobalKeyDown = (e) => {
        if (e.key === 'Enter' && rfidTagId.trim()) {
          verifyTicket(rfidTagId.trim());
        }
      };

      document.addEventListener('keydown', handleGlobalKeyDown);
      rfidInputRef.current?.focus();

      return () => {
        document.removeEventListener('keydown', handleGlobalKeyDown);
      };
    }

    if (step === STEP.SCAN_WRISTBANDS) {
      rfidInputRef.current?.focus();
    }
  }, [step, rfidTagId, wristbandsScanned]);

  const startCamera = async () => {
    try {
      if (window.self !== window.top) {
        setScanError('Camera blocked in preview. Open published app URL.');
        setScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setScanError('Camera error: ' + err.message);
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        onQRScanSuccess(code.data);
        return;
      }
    }

    animationRef.current = requestAnimationFrame(tick);
  };

  const onQRScanSuccess = async (decodedText) => {
    stopCamera();
    setScanning(false);
    
    let code = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.confirmation_code) {
        code = parsed.confirmation_code;
      }
    } catch (e) {
      // Not JSON, use as-is
    }
    
    setConfirmationCode(code);
    await verifyTicket(code);
  };

  const verifyTicket = async (identifier) => {
    setLoading(true);
    setScanError(null);

    try {
      let tickets = [];
      
      // Check if it's a confirmation code or RFID
      if (identifier.includes('-') || identifier.length < 10) {
        // Likely confirmation code
        tickets = await base44.entities.TicketOrder.filter({
          confirmation_code: identifier
        });
      } else {
        // Likely RFID
        const allTickets = await base44.entities.TicketOrder.list();
        tickets = allTickets.filter(t => 
          t.rfid_wristbands && t.rfid_wristbands.some(w => w.tag_id === identifier)
        );
      }

      if (tickets.length === 0) {
        setResult({
          success: false,
          message: 'Ticket not found. Invalid code or RFID.',
          type: 'not_found'
        });
        setStep(STEP.ERROR);
      } else {
        const foundTicket = tickets[0];
        
        if (foundTicket.scanned) {
          setResult({
            success: false,
            message: `Already scanned at ${format(new Date(foundTicket.scanned_at), 'h:mm a')}`,
            type: 'already_scanned',
            ticket: foundTicket
          });
          setStep(STEP.ERROR);
        } else {
          // Mark as scanned
          await base44.entities.TicketOrder.update(foundTicket.id, {
            scanned: true,
            scanned_at: new Date().toISOString()
          });
          
          setTicket(foundTicket);
          
          // Calculate total wristbands needed
          const totalWristbands = (foundTicket.quantityAdult || 0) + (foundTicket.quantityChild || 0);
          
          if (totalWristbands > 0) {
            // Need to scan wristbands
            setTotalWristbandsNeeded(totalWristbands);
            setWristbandsScanned([]);
            setCurrentWristbandIndex(0);
            setStep(STEP.SCAN_WRISTBANDS);
          } else {
            // No wristbands needed, go straight to success
            setResult({
              success: true,
              message: 'Entry approved!',
              ticket: foundTicket
            });
            setStep(STEP.SUCCESS);
          }
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        success: false,
        message: 'Error verifying ticket: ' + error.message,
        type: 'error'
      });
      setStep(STEP.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleRFIDInput = (e) => {
    const value = e.target.value;
    setRfidTagId(value);
    
    if (value.includes('\n') || value.includes('\r')) {
      const cleanValue = value.replace(/[\n\r]/g, '').trim();
      if (cleanValue) {
        setRfidTagId(cleanValue);
        setTimeout(() => verifyTicket(cleanValue), 50);
      }
    }
  };

  const handleRFIDKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = rfidTagId.trim();
      if (value) {
        verifyTicket(value);
      }
    }
  };

  const startNFCScan = async () => {
    if (!nfcSupported) return;

    try {
      const ndef = new NDEFReader();
      nfcAbortControllerRef.current = new AbortController();
      
      await ndef.scan({ signal: nfcAbortControllerRef.current.signal });
      
      setNfcScanning(true);

      ndef.addEventListener('reading', (event) => {
        if (event.serialNumber) {
          setRfidTagId(event.serialNumber);
          stopNFCScan();
          setTimeout(() => verifyTicket(event.serialNumber), 100);
        }
      });

      ndef.addEventListener('readingerror', () => {
        setNfcScanning(false);
      });

    } catch (error) {
      setNfcScanning(false);
    }
  };

  const stopNFCScan = () => {
    if (nfcAbortControllerRef.current) {
      nfcAbortControllerRef.current.abort();
      nfcAbortControllerRef.current = null;
    }
    setNfcScanning(false);
  };

  const handleWristbandScan = async (e, scannedRfidTag) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Check for duplicates
    if (wristbandsScanned.includes(scannedRfidTag)) {
      alert('This wristband has already been scanned for this ticket');
      setRfidTagId('');
      return;
    }

    const newScanned = [...wristbandsScanned, scannedRfidTag];
    setWristbandsScanned(newScanned);
    setRfidTagId('');

    if (newScanned.length >= totalWristbandsNeeded) {
      // All wristbands scanned, update ticket
      const updatedWristbands = newScanned.map((tag_id, index) => ({
        tag_id,
        is_19_plus: index < (ticket.quantityAdult || 0) // Adults are first
      }));

      await base44.entities.TicketOrder.update(ticket.id, {
        rfid_wristbands: updatedWristbands
      });

      setResult({
        success: true,
        message: 'Entry approved!',
        ticket: { ...ticket, rfid_wristbands: updatedWristbands }
      });
      setStep(STEP.SUCCESS);
    } else {
      setCurrentWristbandIndex(newScanned.length);
    }
  };

  const reset = () => {
    setStep(STEP.SCAN_QR);
    setConfirmationCode('');
    setRfidTagId('');
    setTicket(null);
    setScanning(true);
    setScanError(null);
    setResult(null);
    setWristbandsScanned([]);
    setCurrentWristbandIndex(0);
    setTotalWristbandsNeeded(0);
    stopNFCScan();
  };

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gate Scanner</h1>
          <p className="text-gray-400">Scan tickets for entry validation</p>
        </div>

        {step === STEP.SCAN_QR && scanning && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Scan Ticket QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-green-500 w-64 h-64 rounded-lg"></div>
                </div>
              </div>
              {scanError && (
                <div className="bg-red-950 border border-red-800 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{scanError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    stopCamera();
                    setScanning(false);
                    setStep(STEP.MANUAL_QR);
                  }}
                  variant="outline"
                  className="flex-1 border-stone-700 text-white hover:bg-stone-800"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Manual Entry
                </Button>
                <Button
                  onClick={() => {
                    stopCamera();
                    setScanning(false);
                    setStep(STEP.SCAN_RFID);
                  }}
                  variant="outline"
                  className="flex-1 border-stone-700 text-white hover:bg-stone-800"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Scan RFID
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === STEP.MANUAL_QR && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Enter Confirmation Code</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                verifyTicket(confirmationCode.trim());
              }} className="space-y-4">
                <Input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="e.g., CONF-123456"
                  className="bg-stone-800 border-stone-700 text-white text-lg p-6"
                  autoFocus
                />
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 py-6"
                    disabled={!confirmationCode.trim() || loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Ticket'}
                  </Button>
                  <Button
                    type="button"
                    onClick={reset}
                    variant="outline"
                    className="border-stone-700 text-white hover:bg-stone-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === STEP.SCAN_RFID && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                Scan RFID Wristband
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {nfcSupported && !nfcScanning && (
                <Button 
                  onClick={startNFCScan}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-6 mb-4"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Scan NFC Wristband
                </Button>
              )}

              {nfcScanning && (
                <div className="bg-purple-900/20 border-2 border-purple-500 rounded-lg p-6 text-center mb-4">
                  <Zap className="w-12 h-12 text-purple-400 mx-auto mb-2 animate-pulse" />
                  <p className="text-purple-200 font-medium">Hold wristband near phone...</p>
                  <Button
                    onClick={stopNFCScan}
                    variant="outline"
                    className="mt-4 border-purple-600 text-purple-200 hover:bg-purple-900"
                  >
                    Cancel NFC Scan
                  </Button>
                </div>
              )}

              <p className="text-gray-400 text-center text-sm">Or enter RFID manually:</p>
              <Input
                ref={rfidInputRef}
                type="text"
                value={rfidTagId}
                onChange={handleRFIDInput}
                onKeyDown={handleRFIDKeyDown}
                placeholder="Scan or enter RFID tag ID"
                className="bg-stone-800 border-stone-700 text-white text-lg p-6 text-center"
                autoFocus={!nfcScanning}
                spellCheck="false"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => verifyTicket(rfidTagId.trim())}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!rfidTagId.trim() || loading}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
                <Button
                  onClick={reset}
                  variant="outline"
                  className="border-stone-700 text-white hover:bg-stone-800"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === STEP.SCAN_WRISTBANDS && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Scan RFID Wristbands
                </div>
                <Badge className="bg-purple-600 text-white">
                  {currentWristbandIndex + 1} / {totalWristbandsNeeded}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-stone-800/50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-stone-300">Customer:</span>
                  <span className="text-white font-semibold">{ticket.customer_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-300">Ticket Type:</span>
                  <span className="text-white font-semibold capitalize">{ticket.ticket_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-300">Total Wristbands:</span>
                  <span className="text-white font-semibold">{totalWristbandsNeeded}</span>
                </div>
                {ticket.quantityAdult > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-stone-300">Adults:</span>
                    <span className="text-white font-semibold">{ticket.quantityAdult}</span>
                  </div>
                )}
                {ticket.quantityChild > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-stone-300">Children:</span>
                    <span className="text-white font-semibold">{ticket.quantityChild}</span>
                  </div>
                )}
              </div>

              {wristbandsScanned.length > 0 && (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                  <p className="text-green-300 font-semibold mb-2">Scanned Wristbands:</p>
                  <div className="space-y-1">
                    {wristbandsScanned.map((tag, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-100 font-mono">{tag}</span>
                        <Badge className="ml-auto bg-green-700 text-white text-xs">
                          {idx < (ticket.quantityAdult || 0) ? '19+' : 'Child'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-purple-900/20 border-2 border-purple-500 rounded-lg p-6">
                <p className="text-purple-200 font-semibold text-center mb-4">
                  {currentWristbandIndex < (ticket.quantityAdult || 0)
                    ? `Scan Adult Wristband #${currentWristbandIndex + 1} (19+)`
                    : `Scan Child Wristband #${currentWristbandIndex - (ticket.quantityAdult || 0) + 1}`
                  }
                </p>
                <input
                  ref={rfidInputRef}
                  type="text"
                  value={rfidTagId}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const cleanValue = rawValue.replace(/[\n\r]/g, '').trim();

                    setRfidTagId(cleanValue);

                    // Process immediately when we have a valid tag (8+ chars)
                    if (cleanValue && cleanValue.length >= 8 && !wristbandsScanned.includes(cleanValue)) {
                      setRfidTagId('');
                      handleWristbandScan(null, cleanValue);
                    }
                  }}
                  placeholder="Scan wristband RFID..."
                  className="flex h-9 w-full rounded-md border border-stone-700 bg-stone-800 px-3 py-6 text-lg shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-white text-center"
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              <Button
                onClick={reset}
                variant="outline"
                className="w-full border-stone-700 text-white hover:bg-stone-800"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {step === STEP.SUCCESS && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-green-950 border-green-800">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto" />
                  <h2 className="text-3xl font-bold text-green-100">Entry Approved!</h2>
                  <div className="bg-green-900/30 rounded-lg p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-300 text-sm">Customer:</span>
                      <span className="text-green-100 font-semibold">{result.ticket.customer_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300 text-sm">Ticket Type:</span>
                      <span className="text-green-100 font-semibold capitalize">{result.ticket.ticket_type}</span>
                    </div>
                    {result.ticket.ticket_type === 'family' && (
                      <div className="flex justify-between items-center">
                        <span className="text-green-300 text-sm">Party Size:</span>
                        <span className="text-green-100 font-semibold">
                          <Users className="w-4 h-4 inline mr-1" />
                          {result.ticket.quantityAdult || 2} Adults, {result.ticket.quantityChild || 2} Children
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-green-300 text-sm">Code:</span>
                      <span className="text-green-100 font-mono text-sm">{result.ticket.confirmation_code}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === STEP.ERROR && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-red-950 border-red-800">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  {result.type === 'already_scanned' ? (
                    <AlertCircle className="w-20 h-20 text-yellow-400 mx-auto" />
                  ) : (
                    <XCircle className="w-20 h-20 text-red-400 mx-auto" />
                  )}
                  <h2 className="text-3xl font-bold text-red-100">
                    {result.type === 'already_scanned' ? 'Already Scanned' : 'Entry Denied'}
                  </h2>
                  <p className="text-red-300 text-lg">{result.message}</p>
                  {result.ticket && (
                    <div className="bg-red-900/30 rounded-lg p-4">
                      <p className="text-red-200 text-sm">{result.ticket.customer_name}</p>
                      <p className="text-red-300 text-xs font-mono">{result.ticket.confirmation_code}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}