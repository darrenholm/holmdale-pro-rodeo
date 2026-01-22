import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, AlertCircle, CreditCard, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BarRedemption() {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [credits, setCredits] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookupCredits = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const creditRecords = await base44.entities.BarCredit.filter({
        confirmation_code: confirmationCode.trim()
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
  };

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bar Credit Redemption</h1>
          <p className="text-gray-400">Enter confirmation code to redeem credits</p>
        </div>

        {!credits && !result && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Lookup Credits</CardTitle>
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
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 py-6"
                  disabled={!confirmationCode.trim() || loading}
                >
                  {loading ? 'Looking up...' : 'Lookup Credits'}
                </Button>
              </form>
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