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
  const [step, setStep] = useState(STEP.CHOOSE_MODE);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [rfidTagId, setRfidTagId] = useState('');
  const [ticket, setTicket] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formLoadTime, setFormLoadTime] = useState(new Date());

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const rfidInputRef = useRef(null);

  useEffect(() => {
    setFormLoadTime(new Date());
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
    if (step === STEP.SCAN_RFID || step === STEP.MANUAL_RFID) {
      rfidInputRef.current?.focus();
    }
  }, [step]);

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
    console.log('RFID onChange:', value, 'Length:', value.length);
    setRfidTagId(value);
  };

  const handleRFIDKeyDown = (e) => {
    console.log('RFID keyDown:', e.key, 'code:', e.code);
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value.trim();
      console.log('RFID Enter pressed, value:', value);
      if (value) {
        setRfidTagId(value);
        setTimeout(() => setStep(STEP.CONFIRM), 100);
      }
    }
  };

  const handleRFIDKeyUp = (e) => {
    console.log('RFID keyUp:', e.key);
  };

  const handleRFIDKeyPress = (e) => {
    console.log('RFID keyPress:', e.key);
  };

  const linkRFIDToTicket = async () => {
    if (!ticket || !rfidTagId) return;

    setLoading(true);
    try {
      await base44.entities.TicketOrder.update(ticket.id, {
        rfid_tag_id: rfidTagId
      });

      setResult({
        success: true,
        message: 'RFID linked successfully!'
      });
      setStep(STEP.SUCCESS);
    } catch (error) {
      setResult({
        success: false,
        message: 'Error linking RFID: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(STEP.CHOOSE_MODE);
    setConfirmationCode('');
    setRfidTagId('');
    setTicket(null);
    setScanning(false);
    setScanError(null);
    setResult(null);
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
                </div>
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
                <p className="text-gray-400 text-center">Present RFID wristband to scanner or enter tag ID below</p>
                <Input
                   ref={rfidInputRef}
                   type="text"
                   value={rfidTagId}
                   onChange={handleRFIDInput}
                   onKeyDown={handleRFIDKeyDown}
                   placeholder="RFID tag will appear here"
                   className="bg-stone-800 border-stone-700 text-white text-lg p-6 text-center focus:ring-2 focus:ring-green-500"
                   autoComplete="off"
                   autoFocus
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
                    <p className="font-mono">{rfidTagId}</p>
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