import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingBag, Loader2, MapPin } from 'lucide-react';

export default function Shop() {
  const [cartItems, setCartItems] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showOrderReview, setShowOrderReview] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutTicket, setCheckoutTicket] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingMethod, setShippingMethod] = useState('ship'); // 'ship' or 'pickup'
  const [shippingAddress, setShippingAddress] = useState({
    postal_code: '',
    country: 'CA'
  });
  const checkoutRef = useRef(null);
  const monerisCheckoutRef = useRef(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  useEffect(() => {
    // Load Moneris Checkout script
    if (!document.getElementById('moneris-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'moneris-checkout-script';
      script.src = 'https://gateway.moneris.com/chkt/js/chkt_v1.00.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      try {
        if (monerisCheckoutRef.current?.closeCheckout) {
          monerisCheckoutRef.current.closeCheckout();
        }
      } catch (e) {
        console.error('Error closing checkout:', e);
      }
    };
  }, []);

  const calculateShipping = async (postalCode, country) => {
    try {
      const response = await base44.functions.invoke('getShippingRates', {
        destination: { postal_code: postalCode, country },
        packages: cartItems.map(item => ({
          weight: item.weight || 0.5,
          length: item.length || 10,
          width: item.width || 10,
          height: item.height || 10
        }))
      });
      // Get shipping cost from response
      const shippingCost = response.data?.shipping_cost || 15;
      return parseFloat(shippingCost);
    } catch (error) {
      console.error('Shipping calculation error:', error);
      return 15; // Default shipping cost
    }
  };

  useEffect(() => {
    if (showCheckout && checkoutTicket && typeof window.monerisCheckout !== 'undefined') {
      const myCheckout = new window.monerisCheckout();
      monerisCheckoutRef.current = myCheckout;

      myCheckout.setMode('prod');
      myCheckout.setCheckoutDiv('monerisCheckout');

      myCheckout.setCallback('page_loaded', () => {
        console.log('Moneris checkout loaded');
      });

      myCheckout.setCallback('cancel_transaction', () => {
        console.log('Transaction cancelled');
        setShowCheckout(false);
        setCheckoutTicket(null);
        setShowAddressModal(false);
      });

      myCheckout.setCallback('error_event', (error) => {
        console.error('Moneris error:', error);
        alert('Payment error occurred');
        setShowCheckout(false);
        setCheckoutTicket(null);
      });

      myCheckout.setCallback('payment_complete', async (data) => {
        console.log('Payment complete:', data);
        setShowCheckout(false);
        setCartItems([]);
        window.location.href = '/checkout-success';
      });

      myCheckout.startCheckout(checkoutTicket);
    }
  }, [showCheckout, checkoutTicket]);

  const handleAddToCart = (product) => {
    setCartItems([...cartItems, product]);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const hst = (subtotal + shippingCost) * 0.13;
  const cartTotal = subtotal + shippingCost + hst;

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;

    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      alert('Checkout is only available from the published app. Please open this in a new window.');
      return;
    }

    setShowAddressModal(true);
  };

  const handleApproveOrder = async () => {
    setShowOrderReview(false);
    try {
      const response = await base44.functions.invoke('createMonarisCheckout', {
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: 1
        })),
        shipping_address: shippingAddress,
        shipping_cost: shippingCost
      });

      if (response.data?.ticket) {
        setCheckoutTicket(response.data.ticket);
        setShowCheckout(true);
        setShowAddressModal(false);
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckout = async () => {
    if (shippingMethod === 'ship' && !shippingAddress.postal_code) {
      alert('Please enter your postal code');
      return;
    }

    setIsCheckingOut(true);
    try {
      if (shippingMethod === 'pickup') {
        setShippingCost(0);
      } else {
        // Calculate shipping based on postal code
        const shipping = await calculateShipping(shippingAddress.postal_code, shippingAddress.country);
        setShippingCost(shipping);
      }
      setShowAddressModal(false);
      setShowOrderReview(true);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to calculate shipping. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Complete Your Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              <div id="monerisCheckout" ref={checkoutRef}></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-green-500 text-sm font-semibold tracking-wider uppercase mb-4 block">
            Shop
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Holmdale Pro Rodeo Store
          </h1>
          <p className="text-stone-400 max-w-2xl mx-auto">
            Gear up with authentic rodeo merchandise. Show your support with quality apparel.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-stone-400 py-20">No products available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-stone-900 border-stone-800 sticky top-28">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-green-500" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-stone-400 mb-4">Items in cart: <span className="text-white font-bold text-lg">{cartItems.length}</span></p>
                  
                  {cartItems.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto mb-4 pb-4 border-b border-stone-700">
                      {cartItems.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex justify-between text-stone-400">
                            <span>{item.name}</span>
                            <span className="text-white">${item.price.toFixed(2)}</span>
                          </div>
                          {(item.selectedSize || item.selectedColor) && (
                            <div className="text-xs text-stone-500 mt-0.5">
                              {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                              {item.selectedSize && item.selectedColor && <span> • </span>}
                              {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-700 space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-stone-400">Subtotal</span>
                     <span className="text-white">${subtotal.toFixed(2)}</span>
                   </div>
                   {shippingCost > 0 && (
                     <div className="flex justify-between text-sm">
                       <span className="text-stone-400">Shipping</span>
                       <span className="text-white">${shippingCost.toFixed(2)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-sm">
                     <span className="text-stone-400">HST (13%)</span>
                     <span className="text-white">${hst.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between mb-6 pt-2 border-t border-stone-700">
                     <span className="text-stone-300 font-semibold">Total</span>
                     <span className="text-2xl font-bold text-green-500">
                       ${cartTotal.toFixed(2)}
                     </span>
                   </div>

                  <Button
                    onClick={handleProceedToCheckout}
                    disabled={cartItems.length === 0}
                    className="w-full bg-green-500 hover:bg-green-600 text-stone-900 font-semibold py-6 text-lg"
                  >
                    Proceed to Checkout
                  </Button>
                  
                  {cartItems.length === 0 && (
                    <p className="text-center text-stone-500 text-sm mt-4">
                      Add items to get started
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Order Review Modal */}
        <Dialog open={showOrderReview} onOpenChange={setShowOrderReview}>
          <DialogContent className="bg-stone-900 border-stone-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Review Your Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-3 max-h-64 overflow-y-auto pb-4 border-b border-stone-700">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="text-xs text-stone-400 mt-1">
                          {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                          {item.selectedSize && item.selectedColor && <span> • </span>}
                          {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                        </p>
                      )}
                    </div>
                    <p className="text-white font-semibold">${item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Subtotal</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Shipping</span>
                  <span className="text-white">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Tax (13%)</span>
                  <span className="text-white">${hst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-700">
                  <span className="text-stone-300 font-semibold">Total</span>
                  <span className="text-lg font-bold text-green-500">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowOrderReview(false);
                    setShowAddressModal(true);
                  }}
                  variant="outline"
                  className="flex-1 border-stone-700 text-white hover:bg-stone-800"
                >
                  Back
                </Button>
                <Button
                  onClick={handleApproveOrder}
                  disabled={isCheckingOut}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-stone-900 font-semibold"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Approve & Pay'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Address Modal */}
        <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
          <DialogContent className="bg-stone-900 border-stone-800 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-500" />
                Shipping Address
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-stone-400 text-sm">
                Enter your postal code to calculate accurate shipping rates
              </p>
              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-stone-300">Postal Code</Label>
                <Input
                  id="postal_code"
                  type="text"
                  placeholder="e.g., K0A 1K0"
                  value={shippingAddress.postal_code}
                  onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value.toUpperCase()})}
                  className="bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country" className="text-stone-300">Country</Label>
                <select
                  id="country"
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-stone-800 border border-stone-700 text-white"
                >
                  <option value="CA">Canada</option>
                  <option value="US">United States</option>
                </select>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut || !shippingAddress.postal_code}
                className="w-full bg-green-500 hover:bg-green-600 text-stone-900 font-semibold py-6 text-lg mt-6"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}