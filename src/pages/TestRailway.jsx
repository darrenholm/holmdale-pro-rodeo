import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { railwayAuth } from '@/components/railwayAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

export default function TestRailway() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  const testEndpoint = async (name, functionName, requiresAuth) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    setError(prev => ({ ...prev, [name]: null }));
    try {
      let data;
      if (requiresAuth) {
        console.log(`Testing ${name} with auth...`);
        data = await railwayAuth.callWithAuth(functionName);
      } else {
        const response = await base44.functions.invoke(functionName);
        data = response.data;
      }
      console.log(`${name} from Railway:`, data);
      setResults(prev => ({ ...prev, [name]: data }));
    } catch (err) {
      console.error(`Error fetching ${name}:`, err);
      console.error('Full error object:', err);
      console.error('Error response:', err.response);
      setError(prev => ({ ...prev, [name]: err.message + (err.response?.data?.error ? ' - ' + err.response.data.error : '') }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const endpoints = [
    { name: 'Events', functionName: 'getEventsFromRailway' },
    { name: 'Products', functionName: 'getProductsFromRailway' },
    { name: 'Staff', functionName: 'getStaffFromRailway', requiresAuth: true },
    { name: 'Shifts', functionName: 'getShiftsFromRailway', requiresAuth: true },
  ];

  return (
    <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Railway API Test</h1>

        <div className="grid gap-6">
          {endpoints.map(endpoint => (
            <Card key={endpoint.name} className="bg-stone-900 border-stone-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Test {endpoint.name}
                  {endpoint.requiresAuth && (
                    <span className="ml-2 text-xs text-yellow-500">(Requires Auth Token)</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => testEndpoint(endpoint.name, endpoint.functionName, endpoint.requiresAuth)} 
                  disabled={loading[endpoint.name]}
                  className="bg-green-500 hover:bg-green-600 text-stone-900"
                >
                  {loading[endpoint.name] ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Get ${endpoint.name}`
                  )}
                </Button>

                {error[endpoint.name] && (
                  <div className="bg-red-950 border border-red-700 rounded p-3 text-red-300">
                    {error[endpoint.name]}
                  </div>
                )}

                {results[endpoint.name] && (
                  <div className="bg-stone-800 rounded p-4">
                    <pre className="text-stone-300 text-sm overflow-auto max-h-96">
                      {JSON.stringify(results[endpoint.name], null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}