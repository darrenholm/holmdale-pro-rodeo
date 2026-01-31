import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, AlertCircle, CreditCard, Minus, Camera, Keyboard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BarRedemption() {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [rfidMode, setRfidMode] = useState(false);
  const [credits, setCredits] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanning]);

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
      if (err.name === 'NotAllowedError') {
        setScanError('Camera permission denied. Enable camera in browser settings.');
      } else if (err.name === 'NotFoundError') {
        setScanError('No camera found on device.');
      } else {
        setScanError('Camera error: ' + err.message);
      }
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
        onScanSuccess(code.data);
        return;
      }
    }

    animationRef.current = requestAnimationFrame(tick);
  };

  const onScanSuccess = async (decodedText) => {
   stopCamera();
   setScanning(false);
   if (rfidMode) {
     // Scan RFID - look up by tag ID
     await lookupCreditsByRFID(decodedText);
   } else {
     // Scan QR - look up by confirmation code
     setConfirmationCode(decodedText);
     await lookupCreditsDirectly(decodedText);
   }
  };

  const startScanning = () => {
    setResult(null);
    setScanError(null);
    setManualMode(false);
    setScanning(true);
  };

  const handleManualEntry = () => {
    setManualMode(true);
    setScanError(null);
    setResult(null);
    setScanning(false);
  };

  const lookupCredits = async (e) => {
    e.preventDefault();
    await lookupCreditsDirectly(confirmationCode.trim());
  };

  const lookupCreditsByRFID = async (rfidTagId) => {
   setLoading(true);
   setResult(null);

   try {
     const tickets = await base44.entities.TicketOrder.filter({
       rfid_tag_id: rfidTagId
     });

     if (tickets.length === 0) {
       setResult({
         success: false,
         message: 'RFID tag not linked to any ticket'
       });
       setCredits(null);
     } else {
       const ticket = tickets[0];
       const creditRecords = await base44.entities.BarCredit.filter({
         customer_email: ticket.customer_email
       });

       if (creditRecords.length === 0) {
         setResult({
           success: false,
           message: 'No bar credits found for this customer'
         });
         setCredits(null);
       } else {
         const credit = creditRecords[0];
         if (credit.status !== 'confirmed') {
           setResult({
             success: false,
             message: 'Credits not confirmed - payment may be pending'
           });
           setCredits(null);
         } else if (credit.remaining_credits <= 0) {
           setResult({
             success: false,
             message: 'No credits remaining'
           });
           setCredits(credit);
         } else {
           setCredits(credit);
           setResult(null);
         }
       }
     }
   } catch (error) {
     setResult({
       success: false,
       message: 'Error looking up credits: ' + error.message
     });
     setCredits(null);
   } finally {
     setLoading(false);
   }
  };

  const lookupCreditsDirectly = async (code) => {
   setLoading(true);
   setResult(null);

   try {
     const creditRecords = await base44.entities.BarCredit.filter({
       confirmation_code: code
     });

     if (creditRecords.length === 0) {
       setResult({
         success: false,
         message: 'Invalid confirmation code'
       });
       setCredits(null);
     } else {
       const credit = creditRecords[0];

       if (credit.status !== 'confirmed') {
         setResult({
           success: false,
           message: 'Credits not confirmed - payment may be pending'
         });
         setCredits(null);
       } else if (credit.remaining_credits <= 0) {
         setResult({
           success: false,
           message: 'No credits remaining'
         });
         setCredits(credit);
       } else {
         setCredits(credit);
         setResult(null);
       }
     }
   } catch (error) {
     setResult({
       success: false,
       message: 'Error looking up credits: ' + error.message
     });
     setCredits(null);
   } finally {
     setLoading(false);
   }
  };

  const redeemCredit = async () => {
    if (!credits) return;

    setLoading(true);
    try {
      const newRemaining = credits.remaining_credits - 1;
      const newStatus = newRemaining === 0 ? 'depleted' : 'confirmed';

      await base44.entities.BarCredit.update(credits.id, {
        remaining_credits: newRemaining,
        status: newStatus
      });

      setResult({
        success: true,
        message: 'Credit redeemed successfully',
        remaining: newRemaining
      });

      // Update local state
      setCredits({
        ...credits,
        remaining_credits: newRemaining,
        status: newStatus
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Error redeeming credit: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setConfirmationCode('');
    setCredits(null);
    setResult(null);
    setScanning(false);
    setScanError(null);
    setManualMode(false);
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bar Credit Redemption</h1>
          <p className="text-gray-400">Enter confirmation code to redeem credits</p>
        </div>

        {scanError && !manualMode && !scanning && (
          <Card className="bg-red-950 border-red-800 mb-4">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-100 mb-1">Camera Error</h3>
                  <p className="text-red-300 text-sm">{scanError}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => setScanError(null)}
                  variant="outline"
                  className="flex-1 border-red-800 text-red-200 hover:bg-red-900"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleManualEntry}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!scanning && !credits && !result && !manualMode && !scanError && (
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="p-12 text-center space-y-4">
              <Camera className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Scan Bar Credit</h2>
              <p className="text-gray-400 mb-6">Point camera at QR code</p>
              <div className="space-y-3">
                <Button 
                  onClick={startScanning}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Camera
                </Button>
                <Button 
                  onClick={handleManualEntry}
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

        {manualMode && !credits && !result && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Manual Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={lookupCredits} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    placeholder="Enter confirmation code"
                    className="bg-stone-800 border-stone-700 text-white text-lg p-6"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 py-6"
                    disabled={!confirmationCode.trim() || loading}
                  >
                    {loading ? 'Looking up...' : 'Lookup Credits'}
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

        {scanning && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Point camera at QR code</CardTitle>
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

        {result && !credits && (
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

        {credits && (
          <div className="space-y-4">
            <Card className="bg-stone-900 border-stone-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-500" />
                  Credit Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-stone-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-white font-medium">{credits.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{credits.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Purchased:</span>
                    <span className="text-white">{credits.quantity}</span>
                  </div>
                  <div className="h-px bg-stone-700 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold text-lg">Remaining:</span>
                    <span className={`text-3xl font-bold ${
                      credits.remaining_credits > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {credits.remaining_credits}
                    </span>
                  </div>
                </div>

                {credits.remaining_credits > 0 ? (
                  <Button
                    onClick={redeemCredit}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                    disabled={loading}
                  >
                    <Minus className="w-5 h-5 mr-2" />
                    {loading ? 'Redeeming...' : 'Redeem 1 Credit'}
                  </Button>
                ) : (
                  <div className="bg-red-950 border border-red-800 rounded-lg p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-200 font-semibold">No Credits Remaining</p>
                  </div>
                )}

                <Button
                  onClick={reset}
                  variant="outline"
                  className="w-full border-stone-700 text-white hover:bg-stone-800"
                >
                  Lookup Different Code
                </Button>
              </CardContent>
            </Card>

            {result && result.success && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-green-950 border-green-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-center">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-100 text-lg">Credit Redeemed!</h3>
                        <p className="text-green-300">
                          {result.remaining} {result.remaining === 1 ? 'credit' : 'credits'} remaining
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}