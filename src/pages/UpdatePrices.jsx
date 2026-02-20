import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { railwayAuth } from '@/components/railwayAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, DollarSign } from 'lucide-react';

export default function UpdatePrices() {
    const [updating, setUpdating] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleUpdate = async () => {
        setUpdating(true);
        setSuccess(false);
        
        try {
            const token = localStorage.getItem('railway_auth_token');
            
            if (!token) {
                throw new Error('No authentication token found. Please refresh the page.');
            }
            
            const result = await base44.functions.invoke('fixEventPrices', { token });
            console.log('Update result:', result);
            
            if (result.data?.success) {
                setSuccess(true);
                setTimeout(() => window.location.reload(), 2000);
            } else {
                throw new Error(result.data?.error || 'Update failed');
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to update prices: ' + (error.response?.data?.error || error.message));
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
            <div className="max-w-2xl mx-auto">
                <Card className="bg-stone-900 border-stone-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-green-500" />
                            Update Event Prices
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-stone-300">
                            Click the button below to update Saturday and Sunday Rodeo events to start at $30.
                        </p>
                        
                        <Button
                            onClick={handleUpdate}
                            disabled={updating || success}
                            className="w-full bg-green-500 hover:bg-green-600 text-stone-900 font-semibold"
                        >
                            {updating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating Prices...
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Prices Updated!
                                </>
                            ) : (
                                'Update Prices to $30'
                            )}
                        </Button>
                        
                        {success && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                <p className="text-green-400 text-sm">
                                    Successfully updated event prices! Refresh the Events page to see the changes.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}