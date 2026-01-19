import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CheckoutSuccess() {
    const [sessionId, setSessionId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const sid = urlParams.get('session_id');
            setSessionId(sid);
        } catch (error) {
            console.error('Error parsing session ID:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="bg-stone-950 min-h-screen pt-24 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <p className="text-stone-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!sessionId) {
        return (
            <div className="bg-stone-950 min-h-screen pt-24 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <Card className="bg-stone-900 border-stone-800">
                        <CardContent className="p-8 text-center">
                            <p className="text-stone-400">No session found. Please complete checkout first.</p>
                            <Link to={createPageUrl('Shop')} className="mt-4 inline-block">
                                <Button className="bg-green-500 hover:bg-green-600 text-stone-900">
                                    Return to Shop
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-stone-950 min-h-screen pt-24 pb-20 px-6">
            <div className="max-w-2xl mx-auto">
                <Card className="bg-stone-900 border-stone-800">
                    <CardContent className="p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h2>
                        <p className="text-stone-400 mb-6">Thank you for your purchase. Your order has been confirmed and will be shipped soon.</p>
                        
                        <div className="bg-stone-800 rounded-xl p-6 mb-6">
                            <p className="text-stone-400 text-sm mb-2">Session ID</p>
                            <p className="text-sm font-mono text-green-400 break-all">{sessionId}</p>
                        </div>
                        
                        <p className="text-stone-500 text-sm mb-6">
                            You will receive a confirmation email with tracking information once your order ships.
                        </p>
                        
                        <div className="space-y-3">
                            <Link to={createPageUrl('Shop')}>
                                <Button className="w-full bg-green-500 hover:bg-green-600 text-stone-900 font-semibold py-6">
                                    Continue Shopping
                                </Button>
                            </Link>
                            
                            <Link to={createPageUrl('TrackOrder')}>
                                <Button variant="outline" className="w-full border-stone-600 text-stone-300 hover:bg-stone-800">
                                    Track Your Order
                                </Button>
                            </Link>
                            
                            <Link to={createPageUrl('Home')}>
                                <Button variant="outline" className="w-full border-stone-600 text-stone-300 hover:bg-stone-800">
                                    Back to Home
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}