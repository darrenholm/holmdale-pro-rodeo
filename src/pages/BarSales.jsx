import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Scan, DollarSign, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ticketOptions = [
    { quantity: 10, label: '10 Tickets', color: 'bg-blue-500' },
    { quantity: 25, label: '25 Tickets', color: 'bg-green-500' },
    { quantity: 50, label: '50 Tickets', color: 'bg-purple-500' },
    { quantity: 100, label: '100 Tickets', color: 'bg-orange-500' }
];

const TICKET_PRICE = 0.07; // $0.07 per ticket including tax

export default function BarSales() {
    const [step, setStep] = useState('scan'); // scan, select, checkout, success
    const [rfidTagId, setRfidTagId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutTicket, setCheckoutTicket] = useState(null);
    const [error, setError] = useState('');
    const monerisCheckoutRef = useRef(null);
    const queryClient = useQueryClient();

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

    useEffect(() => {
        if (showCheckout && checkoutTicket && typeof window.monerisCheckout !== 'undefined') {
            const myCheckout = new window.monerisCheckout();
            monerisCheckoutRef.current = myCheckout;

            myCheckout.setMode('prod');
            myCheckout.setCheckoutDiv('monerisCheckout');

            myCheckout.setCallback('cancel_transaction', () => {
                setShowCheckout(false);
                setCheckoutTicket(null);
            });

            myCheckout.setCallback('error_event', (error) => {
                console.error('Moneris error:', error);
                alert('Payment error occurred');
                setShowCheckout(false);
                setCheckoutTicket(null);
            });

            myCheckout.setCallback('payment_complete', async (data) => {
                console.log('Payment complete:', data);
                
                // Update the most recent pending purchase to completed
                const purchases = await base44.entities.BarPurchase.filter({ 
                    rfid_tag_id: rfidTagId,
                    status: 'pending'
                });
                
                if (purchases.length > 0) {
                    await base44.entities.BarPurchase.update(purchases[0].id, {
                        transaction_id: data.ticket,
                        status: 'completed'
                    });
                }

                setShowCheckout(false);
                setStep('success');
                queryClient.invalidateQueries(['barPurchases']);
            });

            myCheckout.startCheckout(checkoutTicket);
        }
    }, [showCheckout, checkoutTicket, rfidTagId, queryClient]);

    const scanRFID = async () => {
        setIsScanning(true);
        try {
            if ('NDEFReader' in window) {
                const ndef = new NDEFReader();
                await ndef.scan();
                
                ndef.addEventListener('reading', async ({ serialNumber }) => {
                    const tagId = serialNumber;
                    setRfidTagId(tagId);
                    
                    // Look up customer from linked ticket
                    const allTickets = await base44.entities.TicketOrder.list();
                    const tickets = allTickets.filter(t => 
                        t.rfid_wristbands && t.rfid_wristbands.some(w => w.tag_id === tagId)
                    );
                    if (tickets.length > 0) {
                        const ticket = tickets[0];
                        const wristband = ticket.rfid_wristbands.find(w => w.tag_id === tagId);
                        
                        // Check if wristband is verified for 19+
                        if (!wristband.is_19_plus) {
                            setError('This wristband is not verified for 19+. Please visit ID check station first.');
                            setIsScanning(false);
                            return;
                        }
                        
                        setCustomerName(ticket.customer_name);
                    }
                    
                    setStep('select');
                    setIsScanning(false);
                });
            } else {
                alert('NFC not supported on this device');
                setIsScanning(false);
            }
        } catch (error) {
            console.error('NFC Error:', error);
            alert('Failed to scan RFID. Please try again.');
            setIsScanning(false);
        }
    };

    const createCheckout = useMutation({
        mutationFn: async (checkoutData) => {
            const response = await base44.functions.invoke('createBarTokenCheckout', checkoutData);
            return response.data;
        }
    });

    const handlePurchase = async () => {
        try {
            const totalPrice = selectedQuantity * TICKET_PRICE;
            
            // Create pending purchase record first
            const purchase = await base44.entities.BarPurchase.create({
                rfid_tag_id: rfidTagId,
                customer_name: customerName,
                ticket_quantity: selectedQuantity,
                total_price: totalPrice,
                status: 'pending'
            });

            const result = await createCheckout.mutateAsync({
                rfidTagId,
                ticketQuantity: selectedQuantity,
                customerName
            });

            if (result.ticket) {
                setCheckoutTicket(result.ticket);
                setShowCheckout(true);
            } else {
                // Mark as failed if checkout creation fails
                await base44.entities.BarPurchase.update(purchase.id, { status: 'failed' });
                alert('Failed to create checkout session');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Payment checkout failed');
        }
    };

    const resetFlow = () => {
        setStep('scan');
        setRfidTagId('');
        setCustomerName('');
        setSelectedQuantity(null);
        setShowCheckout(false);
        setCheckoutTicket(null);
        setError('');
    };

    if (showCheckout) {
        return (
            <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-stone-900 border-stone-800">
                        <CardHeader>
                            <CardTitle className="text-white">Complete Payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div id="monerisCheckout"></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg w-full"
                >
                    <Card className="bg-stone-900 border-stone-800 p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Purchase Complete!</h2>
                        <p className="text-stone-400 mb-6">{selectedQuantity} bar tickets added to wristband</p>

                        <div className="bg-stone-800/50 rounded-xl p-4 mb-6 text-left space-y-2">
                            <div className="flex justify-between">
                                <span className="text-stone-400">RFID Tag</span>
                                <span className="text-white font-mono">{rfidTagId}</span>
                            </div>
                            {customerName && (
                                <div className="flex justify-between">
                                    <span className="text-stone-400">Customer</span>
                                    <span className="text-white">{customerName}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-stone-400">Tickets</span>
                                <span className="text-green-400 font-bold">{selectedQuantity} tickets</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-400">Total</span>
                                <span className="text-green-400 font-bold">${(selectedQuantity * TICKET_PRICE).toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <Button 
                            onClick={resetFlow}
                            className="w-full bg-green-500 hover:bg-green-600 text-stone-900"
                        >
                            Process Another Sale
                        </Button>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <Link 
                    to={createPageUrl('Staff')}
                    className="inline-flex items-center gap-2 text-stone-400 hover:text-green-400 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Staff Dashboard
                </Link>

                <Card className="bg-stone-900 border-stone-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-green-500" />
                            Bar Ticket Sales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <div className="bg-red-950/50 border border-red-700 rounded-lg p-4 text-red-300">
                                {error}
                                <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
                            </div>
                        )}
                        {step === 'scan' && (
                            <div className="text-center py-12">
                                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Scan className="w-12 h-12 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Scan RFID Wristband</h3>
                                <p className="text-stone-400 mb-8">Hold the wristband near the device to scan</p>
                                <Button
                                    onClick={scanRFID}
                                    disabled={isScanning}
                                    className="bg-green-500 hover:bg-green-600 text-stone-900 px-8 py-6 text-lg"
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <Scan className="w-5 h-5 mr-2" />
                                            Start Scan
                                        </>
                                    )}
                                </Button>

                            </div>
                        )}

                        {step === 'select' && (
                            <div>
                                <div className="bg-stone-800/50 rounded-lg p-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-400">RFID Tag:</span>
                                        <span className="text-white font-mono">{rfidTagId}</span>
                                    </div>
                                    {customerName && (
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-stone-400">Customer:</span>
                                            <span className="text-white">{customerName}</span>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-4">Select Ticket Quantity</h3>
                                <p className="text-stone-400 text-sm mb-4">$0.07 per ticket (tax included)</p>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {ticketOptions.map((option) => (
                                        <button
                                            key={option.quantity}
                                            onClick={() => setSelectedQuantity(option.quantity)}
                                            className={`p-6 rounded-xl border-2 transition-all ${
                                                selectedQuantity === option.quantity
                                                    ? 'border-green-500 bg-green-500/10'
                                                    : 'border-stone-700 bg-stone-800/50 hover:border-stone-600'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center mx-auto mb-3`}>
                                                <DollarSign className="w-6 h-6 text-white" />
                                            </div>
                                            <p className="text-2xl font-bold text-white">{option.label}</p>
                                            <p className="text-stone-400 text-sm mt-1">${(option.quantity * TICKET_PRICE).toFixed(2)}</p>
                                        </button>
                                    ))}
                                </div>

                                {selectedQuantity && (
                                    <div className="bg-stone-800 rounded-lg p-4 mb-6">
                                        <div className="flex justify-between text-stone-300 mb-2">
                                            <span>Ticket Quantity</span>
                                            <span>{selectedQuantity} tickets</span>
                                        </div>
                                        <div className="flex justify-between text-stone-300 mb-2">
                                            <span>Price per Ticket</span>
                                            <span>${TICKET_PRICE.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-stone-700 pt-2 mt-2">
                                            <div className="flex justify-between text-lg font-bold">
                                                <span className="text-white">Total (tax included)</span>
                                                <span className="text-green-400">${(selectedQuantity * TICKET_PRICE).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        onClick={resetFlow}
                                        variant="outline"
                                        className="flex-1 border-stone-700 text-white hover:bg-stone-800"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handlePurchase}
                                        disabled={!selectedQuantity || createCheckout.isPending}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-stone-900"
                                    >
                                        {createCheckout.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Proceed to Payment
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}