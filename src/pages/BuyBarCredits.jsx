import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Plus, Minus, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const PRICE_PER_CREDIT = 7; // $7 per credit

export default function BuyBarCredits() {
  const [quantity, setQuantity] = useState(10);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [orderComplete, setOrderComplete] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const code = urlParams.get('code');
    
    if (success === 'true' && code) {
      setOrderComplete(true);
      setConfirmationCode(code);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkoutMutation = useMutation({
    mutationFn: async (data) => {
      // Check if running in iframe
      if (window.self !== window.top) {
        throw new Error('Checkout only works from the published app URL, not in preview mode.');
      }

      const response = await base44.functions.invoke('createBarCreditCheckoutMoneris', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_self');
      }
    },
    onError: (error) => {
      alert(error.message || 'Failed to create checkout session');
    }
  });

  const handleCheckout = (e) => {
    e.preventDefault();
    
    if (!customerInfo.name || !customerInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    checkoutMutation.mutate({
      quantity,
      price_per_credit: PRICE_PER_CREDIT,
      customer_info: customerInfo
    });
  };

  const total = quantity * PRICE_PER_CREDIT;

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-stone-950 p-4 pt-20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-green-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Credits Purchased!</h1>
            <Card className="bg-stone-900 border-stone-800 mb-6">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400 mb-4">Your confirmation code:</p>
                <p className="text-4xl font-bold text-green-500 font-mono mb-6">{confirmationCode}</p>
                <p className="text-sm text-gray-500">Show this code at the bar to redeem your credits</p>
              </CardContent>
            </Card>
            <Button
              onClick={() => {
                setOrderComplete(false);
                setConfirmationCode('');
                setQuantity(10);
                setCustomerInfo({ name: '', email: '', phone: '' });
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Purchase More Credits
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">Bar Credits</h1>
          <p className="text-gray-400 text-lg">Purchase drink credits for easy bar service</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Credit Selection */}
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                Select Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    variant="outline"
                    size="icon"
                    className="bg-stone-800 border-stone-700 text-white hover:bg-stone-700 h-12 w-12"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white">{quantity}</div>
                    <div className="text-sm text-gray-400">Credits</div>
                  </div>
                  <Button
                    onClick={() => setQuantity(quantity + 1)}
                    variant="outline"
                    size="icon"
                    className="bg-stone-800 border-stone-700 text-white hover:bg-stone-700 h-12 w-12"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 20].map((preset) => (
                    <Button
                      key={preset}
                      onClick={() => setQuantity(preset)}
                      variant={quantity === preset ? "default" : "outline"}
                      className={quantity === preset 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "bg-stone-800 border-stone-700 text-white hover:bg-stone-700"
                      }
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-stone-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price per credit:</span>
                  <span className="text-white">${PRICE_PER_CREDIT.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quantity:</span>
                  <span className="text-white">{quantity}</span>
                </div>
                <div className="h-px bg-stone-700 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total:</span>
                  <span className="text-green-500 text-xl font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <Label className="text-gray-400">Full Name *</Label>
                  <Input
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="bg-stone-800 border-stone-700 text-white"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label className="text-gray-400">Email *</Label>
                  <Input
                    type="email"
                    required
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="bg-stone-800 border-stone-700 text-white"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label className="text-gray-400">Phone Number</Label>
                  <Input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="bg-stone-800 border-stone-700 text-white"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  You'll receive a confirmation code after payment to redeem your credits at the bar
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}