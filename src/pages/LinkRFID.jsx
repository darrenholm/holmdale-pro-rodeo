import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, AlertCircle, Zap, Camera, Keyboard, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

const STEP = {
  CHOOSE_MODE: 'choose_mode',
  SCAN_QR: 'scan_qr',
  SCAN_RFID: 'scan_rfid',
  MANUAL_QR: 'manual_qr',
  MANUAL_RFID: 'manual_rfid',
  CONFIRM: 'confirm',
  SUCCESS: 'success'
};

export default function LinkRFID() {
  const [step, setStep] = useState(STEP.SCAN_QR);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [rfidTagId, setRfidTagId] = useState('');
  const [ticket, setTicket] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formLoadTime, setFormLoadTime] = useState(new Date());
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [linkedRfids, setLinkedRfids] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const rfidInputRef = useRef(null);
  const nfcAbortControllerRef = useRef(null);

  useEffect(() => {
    setFormLoadTime(new Date());
    
    // Check NFC support
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
    
    // Auto-start QR scanning
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
    if (step === STEP.SUCCESS) {
      const timer = setTimeout(() => {
        setStep(STEP.SCAN_QR);
        setConfirmationCode('');
        setRfidTagId('');
        setTicket(null);
        setScanError(null);
        setResult(null);
        setScanning(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === STEP.SCAN_RFID || step === STEP.MANUAL_RFID) {
      // Capture scanner input at document level as fallback
      const handleGlobalKeyDown = (e) => {
        console.log('Global keyDown:', e.key, 'code:', e.code);
        if (e.key === 'Enter' && rfidTagId.trim()) {
          console.log('Global Enter detected, confirming RFID:', rfidTagId);
          setStep(STEP.CONFIRM);
        }
      };

      const handleGlobalInput = (e) => {
        if (e.target === rfidInputRef.current) return; // Already handled by onChange
        console.log('Global input detected:', e);
      };

      document.addEventListener('keydown', handleGlobalKeyDown);
      document.addEventListener('input', handleGlobalInput);
      
      rfidInputRef.current?.focus();

      return () => {
        document.removeEventListener('keydown', handleGlobalKeyDown);
        document.removeEventListener('input', handleGlobalInput);
      };
    }
  }, [step, rfidTagId]);

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
    
    // Parse JSON from QR code if needed
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
    await lookupTicket(code);
  };

  const lookupTicket = async (code) => {
    setLoading(true);
    setScanError(null);

    try {
      console.log('Looking up ticket with code:', code);
      
      const tickets = await base44.entities.TicketOrder.filter({
        confirmation_code: code
      });

      console.log('Lookup result:', tickets);

      if (tickets.length === 0) {
        // Try listing all tickets to debug
        const allTickets = await base44.entities.TicketOrder.list();
        console.log('All tickets in system:', allTickets);
        
        setResult({
          success: false,
          message: `Ticket not found. Invalid confirmation code. (Searched for: ${code})`
        });
      } else {
        setTicket(tickets[0]);
        setStep(STEP.SCAN_RFID);
        setResult(null);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      setResult({
        success: false,
        message: 'Error looking up ticket: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRFIDInput = (e) => {
    const value = e.target.value;
    console.log('RFID input:', value, 'length:', value.length);
    setRfidTagId(value);
    
    // Auto-confirm if scanner sent data with Enter
    if (value.includes('\n') || value.includes('\r')) {
      const cleanValue = value.replace(/[\n\r]/g, '').trim();
      if (cleanValue) {
        setRfidTagId(cleanValue);
        setTimeout(() => setStep(STEP.CONFIRM), 50);
      }
    }
  };

  const handleRFIDKeyDown = (e) => {
    console.log('RFID keyDown:', e.key);
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = rfidTagId.trim();
      console.log('RFID Enter, value:', value);
      if (value) {
        setStep(STEP.CONFIRM);
      }
    }
  };

  const linkRFIDToTicket = async () => {
    if (!ticket || !rfidTagId) {
      console.error('Missing ticket or RFID:', { ticket, rfidTagId });
      return;
    }

    setLoading(true);
    try {
      const cleanRfidTagId = rfidTagId.trim();
      console.log('Attempting to link RFID:', { 
        ticketId: ticket.id, 
        rfidTagId: cleanRfidTagId,
        fullTicket: ticket 
      });
      
      const existingRfids = ticket.rfid_tag_ids || [];
      const maxWristbands = ticket.ticket_type === 'family' ? 4 : 1;
      
      if (existingRfids.includes(cleanRfidTagId)) {
        setResult({
          success: false,
          message: 'This RFID is already linked to this ticket'
        });
        setLoading(false);
        return;
      }
      
      if (existingRfids.length >= maxWristbands) {
        setResult({
          success: false,
          message: `Maximum ${maxWristbands} wristband(s) already linked`
        });
        setLoading(false);
        return;
      }
      
      const newRfids = [...existingRfids, cleanRfidTagId];
      const updateData = { rfid_tag_ids: newRfids };
      console.log('Update data:', updateData);
      
      const updatedTicket = await base44.entities.TicketOrder.update(ticket.id, updateData);
      
      console.log('Update successful! Updated ticket:', updatedTicket);

      setLinkedRfids(newRfids);
      const remaining = maxWristbands - newRfids.length;
      
      if (remaining > 0) {
        setResult({
          success: true,
          message: `RFID linked! ${remaining} more wristband(s) can be added.`
        });
        setTicket({ ...ticket, rfid_tag_ids: newRfids });
        setRfidTagId('');
        setStep(STEP.SCAN_RFID);
      } else {
        setResult({
          success: true,
          message: 'All wristbands linked successfully!'
        });
        setStep(STEP.SUCCESS);
      }
    } catch (error) {
      console.error('RFID linking error:', error);
      setResult({
        success: false,
        message: 'Error linking RFID: ' + error.message
      });
      setLoading(false);
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
          setTimeout(() => setStep(STEP.CONFIRM), 100);
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

  const reset = () => {
    setStep(STEP.CHOOSE_MODE);
    setConfirmationCode('');
    setRfidTagId('');
    setTicket(null);
    setScanning(false);
    setScanError(null);
    setResult(null);
    setLinkedRfids([]);
    stopNFCScan();
  };

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Link RFID to Ticket</h1>
          <p className="text-gray-400">Scan QR code, then scan RFID wristband</p>
        </div>

        {step === STEP.CHOOSE_MODE && (
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="p-12 text-center space-y-4">
              <QrCode className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Choose QR Scan Method</h2>
              <p className="text-gray-400 mb-6">Scan or enter ticket confirmation code</p>
              <div className="space-y-3">
                <Button
                   onClick={() => {
                     setStep(STEP.SCAN_QR);
                     setTimeout(() => setScanning(true), 100);
                   }}
                   className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
                 >
                   <Camera className="w-5 h-5 mr-2" />
                   Scan QR Code
                 </Button>
                <Button
                  onClick={() => setStep(STEP.MANUAL_QR)}
                  variant="outline"
                  className="w-full border-stone-700 text-white hover:bg-stone-800 px-8 py-4 text-lg"
                >
                  <Keyboard className="w-5 h-5 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                  onClick={reset}
                  variant="outline"
                  className="flex-1 border-stone-700 text-white hover:bg-stone-800"
                >
                  Cancel
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
                lookupTicket(confirmationCode.trim());
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
                    {loading ? 'Looking up...' : 'Lookup Ticket'}
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

        {(step === STEP.SCAN_QR || step === STEP.MANUAL_QR) && result && !result.success && (
          <Card className="bg-red-950 border-red-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-100 text-lg">Error</h3>
                  <p className="text-red-300">{result.message}</p>
                </div>
              </div>
              <Button
                onClick={reset}
                variant="outline"
                className="w-full border-red-800 text-red-200 hover:bg-red-900"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {(step === STEP.SCAN_RFID || step === STEP.MANUAL_RFID) && ticket && (
          <div className="space-y-4">
            <Card className="bg-stone-900 border-stone-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-green-500" />
                  Ticket Found
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-stone-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-white font-medium">{ticket.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Code:</span>
                    <span className="text-white font-mono">{ticket.confirmation_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ticket Type:</span>
                    <span className="text-white capitalize">{ticket.ticket_type}</span>
                  </div>
                  {ticket.ticket_type === 'family' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Wristbands Linked:</span>
                      <span className="text-white font-medium">{(ticket.rfid_tag_ids || []).length} / 4</span>
                    </div>
                  )}
                </div>
                {(ticket.rfid_tag_ids || []).length > 0 && (
                  <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                    <p className="text-green-400 text-sm font-medium mb-2">Linked Wristbands:</p>
                    <div className="space-y-1">
                      {ticket.rfid_tag_ids.map((rfid, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span className="text-green-200 font-mono">{rfid}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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

                <p className="text-gray-400 text-center text-sm">Or enter tag ID manually:</p>
                <Input
                   ref={rfidInputRef}
                   type="text"
                   value={rfidTagId}
                   onChange={handleRFIDInput}
                   onKeyDown={handleRFIDKeyDown}
                   placeholder="Scan or enter RFID tag ID"
                   className="bg-stone-800 border-stone-700 text-white text-lg p-6 text-center focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500"
                   autoFocus={!nfcScanning}
                   spellCheck="false"
                   inputMode="none"
                   data-scanner="rfid"
                 />
                <Button
                  onClick={reset}
                  variant="outline"
                  className="w-full border-stone-700 text-white hover:bg-stone-800"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === STEP.CONFIRM && ticket && rfidTagId && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Confirm Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result && !result.success && (
                <div className="bg-red-950 border border-red-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-100">Error</h3>
                      <p className="text-red-300 text-sm">{result.message}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-stone-800 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Customer:</p>
                  <p className="text-white font-medium">{ticket.customer_name}</p>
                </div>
                <div className="h-px bg-stone-700"></div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Ticket Code:</p>
                  <p className="text-white font-mono">{ticket.confirmation_code}</p>
                </div>
                <div className="h-px bg-stone-700"></div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">RFID Tag ID:</p>
                  <p className="text-white font-mono">{rfidTagId}</p>
                </div>
                <div className="h-px bg-stone-700"></div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Form Opened:</p>
                  <p className="text-white font-mono">{formLoadTime.toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={linkRFIDToTicket}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-6"
                  disabled={loading}
                >
                  {loading ? 'Linking...' : 'Confirm Link'}
                </Button>
                <Button
                  onClick={() => {
                    setRfidTagId('');
                    setResult(null);
                    setStep(STEP.SCAN_RFID);
                    rfidInputRef.current?.focus();
                  }}
                  variant="outline"
                  className="border-stone-700 text-white hover:bg-stone-800"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === STEP.SUCCESS && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-green-950 border-green-800">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
                  <h2 className="text-2xl font-bold text-green-100">Success!</h2>
                  <p className="text-green-300">RFID wristband linked to ticket</p>
                  <div className="bg-green-900/30 rounded-lg p-4 text-sm text-green-200 mt-4">
                    {linkedRfids.length > 0 ? (
                      <div className="space-y-2">
                        {linkedRfids.map((rfid, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <p className="font-mono">{rfid}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-mono">{rfidTagId}</p>
                    )}
                  </div>
                  <Button
                    onClick={reset}
                    className="w-full bg-green-600 hover:bg-green-700 py-6"
                  >
                    Link Another Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}