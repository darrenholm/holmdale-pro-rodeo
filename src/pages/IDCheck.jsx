import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Zap, Loader2, ArrowLeft, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function IDCheck() {
  const [rfidTagId, setRfidTagId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcScanning, setNfcScanning] = useState(false);

  const rfidInputRef = useRef(null);
  const nfcAbortControllerRef = useRef(null);

  useEffect(() => {
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        reset();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [result]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter' && rfidTagId.trim()) {
        verifyAndUpdate(rfidTagId.trim());
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    rfidInputRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [rfidTagId]);

  const verifyAndUpdate = async (tagId) => {
    setLoading(true);
    try {
      const allTickets = await base44.entities.TicketOrder.list();
      const ticket = allTickets.find(t => 
        t.rfid_wristbands && t.rfid_wristbands.some(w => w.tag_id === tagId)
      );

      if (!ticket) {
        setResult({
          success: false,
          message: 'Wristband not found. Not linked to any ticket.'
        });
        setLoading(false);
        return;
      }

      const wristband = ticket.rfid_wristbands.find(w => w.tag_id === tagId);
      
      if (wristband.is_19_plus) {
        setResult({
          success: false,
          message: 'Already verified as 19+',
          type: 'already_verified',
          customerName: ticket.customer_name
        });
        setLoading(false);
        return;
      }

      // Update the wristband to 19+
      const updatedWristbands = ticket.rfid_wristbands.map(w => 
        w.tag_id === tagId ? { ...w, is_19_plus: true } : w
      );

      await base44.entities.TicketOrder.update(ticket.id, {
        rfid_wristbands: updatedWristbands
      });

      setResult({
        success: true,
        message: 'ID Verified - 19+ Approved',
        customerName: ticket.customer_name,
        tagId: tagId
      });
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        success: false,
        message: 'Error: ' + error.message
      });
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
        setTimeout(() => verifyAndUpdate(cleanValue), 50);
      }
    }
  };

  const handleRFIDKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = rfidTagId.trim();
      if (value) {
        verifyAndUpdate(value);
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
          setTimeout(() => verifyAndUpdate(event.serialNumber), 100);
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
    setRfidTagId('');
    setResult(null);
    stopNFCScan();
    rfidInputRef.current?.focus();
  };

  if (result) {
    return (
      <div className="min-h-screen bg-stone-950 p-4 pt-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className={result.success ? 'bg-green-950 border-green-800' : 'bg-red-950 border-red-800'}>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                {result.success ? (
                  <>
                    <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto" />
                    <h2 className="text-3xl font-bold text-green-100">{result.message}</h2>
                    <div className="bg-green-900/30 rounded-lg p-6 space-y-2">
                      {result.customerName && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-300 text-sm">Customer:</span>
                          <span className="text-green-100 font-semibold">{result.customerName}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-green-300 text-sm">RFID Tag:</span>
                        <span className="text-green-100 font-mono text-sm">{result.tagId}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-4 text-green-400">
                        <BadgeCheck className="w-5 h-5" />
                        <span className="font-bold">19+ Verified</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {result.type === 'already_verified' ? (
                      <BadgeCheck className="w-20 h-20 text-yellow-400 mx-auto" />
                    ) : (
                      <XCircle className="w-20 h-20 text-red-400 mx-auto" />
                    )}
                    <h2 className="text-3xl font-bold text-red-100">{result.message}</h2>
                    {result.customerName && (
                      <div className="bg-red-900/30 rounded-lg p-4">
                        <p className="text-red-200 text-sm">{result.customerName}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        <Link 
          to={createPageUrl('Staff')}
          className="inline-flex items-center gap-2 text-stone-400 hover:text-green-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff Dashboard
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ID Check - 19+ Verification</h1>
          <p className="text-gray-400">Scan wristband to verify age and approve for alcohol service</p>
        </div>

        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-purple-500" />
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
            <Button
              onClick={() => verifyAndUpdate(rfidTagId.trim())}
              className="w-full bg-green-600 hover:bg-green-700 py-6"
              disabled={!rfidTagId.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <BadgeCheck className="w-5 h-5 mr-2" />
                  Verify 19+ & Approve
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}