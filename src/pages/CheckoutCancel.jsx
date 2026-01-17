import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CheckoutCancel() {
    return (
        <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full"
            >
                <Card className="bg-stone-900 border-stone-800 p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Payment Cancelled</h2>
                    <p className="text-stone-400 mb-6">Your payment was cancelled. No charges have been made to your account. Feel free to try again.</p>
                    
                    <Link to={createPageUrl('Events')}>
                        <Button className="w-full bg-green-500 hover:bg-green-600 text-stone-900 font-semibold py-6">
                            Try Again
                        </Button>
                    </Link>
                    
                    <Link to={createPageUrl('Home')}>
                        <Button variant="outline" className="w-full mt-3 border-stone-600 text-stone-300 hover:bg-stone-800">
                            Back to Home
                        </Button>
                    </Link>
                </Card>
            </motion.div>
        </div>
    );
}