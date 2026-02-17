import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

export default function TestRailway() {
  const [events, setEvents] = useState(null);
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testGetEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('getEventsFromRailway');
      console.log('Events from Railway:', response.data);
      setEvents(response.data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('getProductsFromRailway');
      console.log('Products from Railway:', response.data);
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Railway API Test</h1>

        <div className="grid gap-6">
          {/* Events Test */}
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Test Get Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testGetEvents} 
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-stone-900"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Get Events from Railway'
                )}
              </Button>

              {error && (
                <div className="bg-red-950 border border-red-700 rounded p-3 text-red-300">
                  {error}
                </div>
              )}

              {events && (
                <div className="bg-stone-800 rounded p-4">
                  <pre className="text-stone-300 text-sm overflow-auto max-h-96">
                    {JSON.stringify(events, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Test */}
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Test Get Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testGetProducts} 
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-stone-900"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Get Products from Railway'
                )}
              </Button>

              {error && (
                <div className="bg-red-950 border border-red-700 rounded p-3 text-red-300">
                  {error}
                </div>
              )}

              {products && (
                <div className="bg-stone-800 rounded p-4">
                  <pre className="text-stone-300 text-sm overflow-auto max-h-96">
                    {JSON.stringify(products, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}