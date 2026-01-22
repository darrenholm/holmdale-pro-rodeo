import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Camera, AlertTriangle, AlertCircle } from 'lucide-react';

export default function GateScan() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (scanning && !scanner) {
      // Check if running in iframe
      if (window.self !== window.top) {
        setError('Camera access is blocked in preview mode. Please use the published app to scan tickets.');
        setScanning(false);
        return;
      }

      try {
        const html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true
          },
          false
        );

        html5QrcodeScanner.render(onScanSuccess, onScanError);
        setScanner(html5QrcodeScanner);
      } catch (err) {
        console.error('Scanner initialization error:', err);
        setError('Failed to initialize scanner: ' + err.message);
        setScanning(false);
      }
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanning]);

  const onScanSuccess = async (decodedText) => {
    if (scanner) {
      await scanner.clear();
      setScanner(null);
    }
    setScanning(false);
    await validateTicket(decodedText);
  };

  const onScanError = (error) => {
    // Ignore scan errors (happens continuously while scanning)
  };

  const validateTicket = async (confirmationCode) => {
    try {
      // Find ticket by confirmation code
      const tickets = await base44.entities.TicketOrder.filter({
        confirmation_code: confirmationCode
      });

      if (tickets.length === 0) {
        setResult({
          success: false,
          message: 'Invalid ticket - confirmation code not found',
          type: 'invalid'
        });
        return;
      }

      const ticket = tickets[0];

      // Check if already scanned
      if (ticket.scanned) {
        setResult({
          success: false,
          message: 'Ticket already used',
          type: 'used',
          ticket,
          scannedAt: ticket.scanned_at
        });
        return;
      }

      // Check if ticket is confirmed
      if (ticket.status !== 'confirmed') {
        setResult({
          success: false,
          message: 'Ticket not confirmed - payment may be pending',
          type: 'pending',
          ticket
        });
        return;
      }

      // Get event details
      const event = await base44.entities.Event.get(ticket.event_id);

      // Mark as scanned
      await base44.entities.TicketOrder.update(ticket.id, {
        scanned: true,
        scanned_at: new Date().toISOString()
      });

      setResult({
        success: true,
        message: 'Valid ticket - Entry granted',
        ticket,
        event
      });

    } catch (error) {
      setResult({
        success: false,
        message: 'Error validating ticket: ' + error.message,
        type: 'error'
      });
    }
  };

  const startScanning = async () => {
    setResult(null);
    setError(null);
    
    // Check for camera permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setScanning(true);
    } catch (err) {
      console.error('Camera permission error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Camera access error: ' + err.message);
      }
    }
  };

  const resetScanner = () => {
    setResult(null);
    setScanning(false);
    setError(null);
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gate Scanner</h1>
          <p className="text-gray-400">Scan ticket QR codes for entry validation</p>
        </div>

        {error && (
          <Card className="bg-red-950 border-red-800 mb-4">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-100 mb-1">Camera Error</h3>
                  <p className="text-red-300 text-sm">{error}</p>
                  {window.self !== window.top && (
                    <p className="text-red-400 text-xs mt-2">
                      You're viewing this in preview mode. Open the published app directly to use the scanner.
                    </p>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => setError(null)}
                className="w-full mt-4 bg-stone-800 hover:bg-stone-700"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {!scanning && !result && !error && (
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="p-12 text-center">
              <Camera className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Ready to Scan</h2>
              <p className="text-gray-400 mb-6">Click below to start scanning tickets</p>
              <Button 
                onClick={startScanning}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Scanner
              </Button>
            </CardContent>
          </Card>
        )}

        {scanning && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Scanning...</CardTitle>
            </CardHeader>
            <CardContent>
              <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
              <Button 
                onClick={resetScanner}
                variant="outline"
                className="w-full mt-4 border-stone-700 text-white hover:bg-stone-800"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className={`${result.success ? 'bg-green-950 border-green-800' : 'bg-red-950 border-red-800'}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                ) : (
                  result.type === 'used' ? (
                    <AlertTriangle className="w-12 h-12 text-yellow-500" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-500" />
                  )
                )}
                <div>
                  <CardTitle className={result.success ? 'text-green-100' : 'text-red-100'}>
                    {result.success ? 'ENTRY GRANTED' : 'ENTRY DENIED'}
                  </CardTitle>
                  <p className={`text-sm ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.ticket && (
                <div className={`rounded-lg p-4 ${result.success ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                  <h3 className="font-semibold text-white mb-3">Ticket Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Customer:</span>
                      <span className="text-white font-medium">{result.ticket.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{result.ticket.customer_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ticket Type:</span>
                      <span className="text-white capitalize">{result.ticket.ticket_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quantity:</span>
                      <span className="text-white">{result.ticket.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Confirmation:</span>
                      <span className="text-white font-mono">{result.ticket.confirmation_code}</span>
                    </div>
                  </div>
                  {result.event && (
                    <div className="mt-4 pt-4 border-t border-stone-700">
                      <h4 className="font-semibold text-white mb-2">Event</h4>
                      <div className="text-sm space-y-1">
                        <p className="text-white font-medium">{result.event.title}</p>
                        <p className="text-gray-400">{result.event.date} at {result.event.time}</p>
                        <p className="text-gray-400">{result.event.venue}</p>
                      </div>
                    </div>
                  )}
                  {result.scannedAt && (
                    <div className="mt-3 pt-3 border-t border-stone-700">
                      <p className="text-xs text-yellow-400">
                        Previously scanned: {new Date(result.scannedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <Button 
                onClick={resetScanner}
                className="w-full bg-stone-800 hover:bg-stone-700 text-white"
              >
                Scan Next Ticket
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}