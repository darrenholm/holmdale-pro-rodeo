import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CheckoutSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    return (
        <div className="min-h-screen bg-stone-950 py-20 px-6 flex items-center justify-center">
            <div className="max-w-lg w-full">
                <Card className="bg-stone-900 border-stone-800 p-8 text-center">
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
                    
                    <Link to={createPageUrl('Shop')}>
                        <Button className="w-full bg-green-500 hover:bg-green-600 text-stone-900 font-semibold py-6">
                            Continue Shopping
                        </Button>
                    </Link>
                    
                    <Link to={createPageUrl('TrackOrder')}>
                        <Button variant="outline" className="w-full mt-3 border-stone-600 text-stone-300 hover:bg-stone-800">
                            Track Your Order
                        </Button>
                    </Link>
                    
                    <Link to={createPageUrl('Home')}>
                        <Button variant="outline" className="w-full mt-3 border-stone-600 text-stone-300 hover:bg-stone-800">
                            Back to Home
                        </Button>
                    </Link>
                </Card>
            </div>
        </div>
    );
}