import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function CheckoutSuccess() {
    const [sessionId, setSessionId] = useState(null);
    const [confirmationCode, setConfirmationCode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [emailSent, setEmailSent] = useState(false);
    const [orderType, setOrderType] = useState(null);

    useEffect(() => {
        const sendConfirmation = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const sid = urlParams.get('session_id');
                const code = urlParams.get('confirmation_code');
                
                setSessionId(sid);
                setConfirmationCode(code);

                // If confirmation code exists, it's a ticket order
                if (code) {
                    setOrderType('ticket');
                    
                    // Find the ticket order
                    const orders = await base44.entities.TicketOrder.filter({
                        confirmation_code: code
                    });

                    if (orders.length > 0) {
                        const order = orders[0];
                        
                        // Only process if not already confirmed
                        if (order.status !== 'confirmed') {
                            // Update status to confirmed
                            await base44.entities.TicketOrder.update(order.id, {
                                status: 'confirmed'
                            });

                            // Send confirmation email with QR code
                            await base44.functions.invoke('sendTicketConfirmation', {
                                ticket_order_id: order.id
                            });
                        }

                        setEmailSent(true);
                    }
                } else if (sid) {
                    setOrderType('merchandise');
                }
            } catch (error) {
                console.error('Error processing confirmation:', error);
            } finally {
                setIsLoading(false);
            }
        };

        sendConfirmation();
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

    // Ticket order success
    if (orderType === 'ticket') {
        return (
            <div className="bg-stone-950 min-h-screen pt-24 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <Card className="bg-stone-900 border-stone-800">
                        <CardContent className="p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Tickets Confirmed! 🎟️</h2>
                            <p className="text-stone-400 mb-6">Your ticket purchase has been confirmed.</p>
                            
                            {confirmationCode && (
                                <div className="bg-stone-800 rounded-xl p-6 mb-6">
                                    <p className="text-stone-400 text-sm mb-2">Confirmation Code</p>
                                    <p className="text-2xl font-bold text-green-400">{confirmationCode}</p>
                                </div>
                            )}

                            {emailSent ? (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
                                    <Mail className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                    <p className="text-green-400 font-semibold mb-2">Email Sent!</p>
                                    <p className="text-stone-400 text-sm">
                                        Your tickets with QR code have been sent to your email.<br />
                                        Please check your inbox for your entry pass.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-stone-800 rounded-xl p-6 mb-6">
                                    <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
                                    <p className="text-stone-400 text-sm">
                                        Sending your tickets to your email...
                                    </p>
                                </div>
                            )}
                            
                            <p className="text-stone-500 text-sm mb-6">
                                Show the QR code from your email at the gate for entry.
                            </p>
                            
                            <div className="space-y-3">
                                <Link to={createPageUrl('Events')}>
                                    <Button className="w-full bg-green-500 hover:bg-green-600 text-stone-900 font-semibold py-6">
                                        View More Events
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

    // Merchandise order success
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
                        
                        {sessionId && (
                            <div className="bg-stone-800 rounded-xl p-6 mb-6">
                                <p className="text-stone-400 text-sm mb-2">Session ID</p>
                                <p className="text-sm font-mono text-green-400 break-all">{sessionId}</p>
                            </div>
                        )}
                        
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