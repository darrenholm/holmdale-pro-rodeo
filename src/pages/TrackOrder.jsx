import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Truck, CheckCircle, Loader2 } from 'lucide-react';

export default function TrackOrder() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError('');
    setTracking(null);

    try {
      const response = await base44.functions.invoke('trackShipment', {
        tracking_number: trackingNumber.trim()
      });

      if (response.data?.tracking) {
        setTracking(response.data.tracking);
      } else {
        setError('Tracking information not found');
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError(err.response?.data?.error || 'Failed to track shipment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'in_transit':
        return <Truck className="w-6 h-6 text-blue-500" />;
      default:
        return <Package className="w-6 h-6 text-stone-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Track Your Order
          </h1>
          <p className="text-stone-400">
            Enter your tracking number to see your shipment status
          </p>
        </motion.div>

        <Card className="bg-stone-900 border-stone-800 mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleTrack} className="flex gap-4">
              <Input
                type="text"
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="flex-1 bg-stone-800 border-stone-700 text-white"
              />
              <Button 
                type="submit"
                disabled={loading || !trackingNumber.trim()}
                className="bg-green-500 hover:bg-green-600 text-stone-900 font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Track
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="bg-red-900/20 border-red-800 mb-8">
            <CardContent className="pt-6">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {tracking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-stone-900 border-stone-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  {getStatusIcon(tracking.status)}
                  Tracking: {trackingNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Status</span>
                  <Badge className="bg-green-500 text-stone-900">
                    {tracking.status || 'In Transit'}
                  </Badge>
                </div>

                {tracking.estimated_delivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Est. Delivery</span>
                    <span className="text-white font-semibold">
                      {tracking.estimated_delivery}
                    </span>
                  </div>
                )}

                {tracking.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Current Location</span>
                    <span className="text-white">{tracking.location}</span>
                  </div>
                )}

                {tracking.events && tracking.events.length > 0 && (
                  <div className="pt-6 border-t border-stone-700">
                    <h3 className="text-white font-semibold mb-4">Tracking History</h3>
                    <div className="space-y-4">
                      {tracking.events.map((event, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2" />
                          <div className="flex-1">
                            <p className="text-white">{event.description}</p>
                            <p className="text-stone-500 text-sm">
                              {event.location} • {event.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}