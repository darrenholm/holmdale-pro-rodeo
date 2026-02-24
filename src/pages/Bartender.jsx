import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, entities } from '@/api/railwayClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scan, Wine, AlertCircle, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LOGO_URL } from '@/lib/constants';

export default function Bartender() {
    const [step, setStep] = useState('scan'); // scan, redeem, success
    const [rfidTagId, setRfidTagId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [ticketsPurchased, setTicketsPurchased] = useState(0);
    const [drinksRedeemed, setDrinksRedeemed] = useState(0);
    const [drinksToRedeem, setDrinksToRedeem] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [barPurchaseId, setBarPurchaseId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const availableCredits = ticketsPurchased - drinksRedeemed;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const scanRFID = async () => {
        setIsScanning(true);
        setError('');
        try {
            if ('NDEFReader' in window) {
                const ndef = new NDEFReader();
                await ndef.scan();
                
                ndef.addEventListener('reading', async ({ serialNumber }) => {
                    const tagId = serialNumber;
                    setRfidTagId(tagId);
                    
                    // Look up all active bar purchases by RFID tag
                    const purchases = await entities.BarPurchase.filter({ 
                        rfid_tag_id: tagId
                    });
                    
                    const activePurchases = purchases.filter(p => p.status !== 'failed');
                    
                    if (activePurchases.length === 0) {
                        setError('No active bar purchase found for this wristband.');
                        setIsScanning(false);
                        return;
                    }
                    
                    // Sum all tickets and drinks across multiple purchases
                    const totalTickets = activePurchases.reduce((sum, p) => sum + (p.ticket_quantity || 0), 0);
                    const totalRedeemed = activePurchases.reduce((sum, p) => sum + (p.drinks_redeemed || 0), 0);
                    
                    setBarPurchaseId(activePurchases.map(p => p.id).join(',')); // Store all IDs
                    setCustomerName(activePurchases[0].customer_name);
                    setTicketsPurchased(totalTickets);
                    setDrinksRedeemed(totalRedeemed);
                    setDrinksToRedeem('');
                    setStep('redeem');
                    setIsScanning(false);
                });
            } else {
                setError('NFC not supported on this device');
                setIsScanning(false);
            }
        } catch (error) {
            console.error('NFC Error:', error);
            setError('Failed to scan RFID. Please try again.');
            setIsScanning(false);
        }
    };

    const handleRedeem = async () => {
        const drinks = parseInt(drinksToRedeem);
        
        if (isNaN(drinks) || drinks <= 0) {
            setError('Please enter a valid number of drinks');
            return;
        }
        
        if (drinks > availableCredits) {
            setError(`Customer only has ${availableCredits} credits available`);
            return;
        }
        
        setIsProcessing(true);
        try {
            // Update all bar purchases proportionally
            const purchaseIds = barPurchaseId.split(',');
            const purchasesToUpdate = await Promise.all(
                purchaseIds.map(id => entities.BarPurchase.filter({ id }))
            );
            
            let drinksToDistribute = drinks;
            for (const purchaseArray of purchasesToUpdate) {
                if (purchaseArray.length === 0) continue;
                const purchase = purchaseArray[0];
                const available = (purchase.ticket_quantity || 0) - (purchase.drinks_redeemed || 0);
                const drinksForThisPurchase = Math.min(available, drinksToDistribute);
                
                await entities.BarPurchase.update(purchase.id, {
                    drinks_redeemed: (purchase.drinks_redeemed || 0) + drinksForThisPurchase
                });
                
                drinksToDistribute -= drinksForThisPurchase;
                if (drinksToDistribute === 0) break;
            }
            
            setStep('success');
            setIsProcessing(false);
        } catch (error) {
            console.error('Redemption error:', error);
            setError('Failed to redeem drinks. Please try again.');
            setIsProcessing(false);
        }
    };

    const resetFlow = () => {
        setStep('scan');
        setRfidTagId('');
        setCustomerName('');
        setTicketsPurchased(0);
        setDrinksRedeemed(0);
        setDrinksToRedeem('');
        setError('');
        setBarPurchaseId('');
    };

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
                        <h2 className="text-3xl font-bold text-white mb-2">Drinks Redeemed!</h2>
                        <p className="text-stone-400 mb-6">{drinksToRedeem} drink(s) for {customerName}</p>

                        <div className="bg-stone-800/50 rounded-xl p-4 mb-6 text-left space-y-2">
                            <div className="flex justify-between">
                                <span className="text-stone-400">Customer</span>
                                <span className="text-white">{customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-400">Drinks Redeemed</span>
                                <span className="text-white">{drinksToRedeem}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-400">Credits Remaining</span>
                                <span className="text-green-400 font-bold">{availableCredits - parseInt(drinksToRedeem)}</span>
                            </div>
                        </div>
                        
                        <Button 
                            onClick={resetFlow}
                            className="w-full bg-green-500 hover:bg-green-600 text-stone-900"
                        >
                            Process Next Order
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
                            <Wine className="w-6 h-6 text-green-500" />
                            Bar Ticket Redemption
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <div className="bg-red-950/50 border border-red-700 rounded-lg p-4 text-red-300 flex gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p>{error}</p>
                                    <button onClick={() => setError('')} className="mt-2 underline text-sm">Dismiss</button>
                                </div>
                            </div>
                        )}

                        {step === 'scan' && (
                            <div className="text-center py-12">
                                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Scan className="w-12 h-12 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Scan Wristband</h3>
                                <p className="text-stone-400 mb-8">Hold the wristband near the device to begin</p>
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

                        {step === 'redeem' && (
                            <div className="space-y-6">
                                <div className="bg-stone-800/50 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-stone-400">Customer</span>
                                        <span className="text-white font-semibold">{customerName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-400">Available Credits</span>
                                        <span className="text-green-400 font-bold text-2xl">{availableCredits}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-stone-300 block mb-3 font-semibold">Number of Drinks to Redeem</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={availableCredits}
                                        value={drinksToRedeem}
                                        onChange={(e) => setDrinksToRedeem(e.target.value)}
                                        className="bg-stone-800 border-stone-700 text-white text-lg py-6"
                                        placeholder="Enter number of drinks"
                                    />
                                    <p className="text-stone-500 text-sm mt-2">Max: {availableCredits} drinks available</p>
                                </div>

                                {drinksToRedeem && !isNaN(parseInt(drinksToRedeem)) && parseInt(drinksToRedeem) > 0 && (
                                    <div className="bg-stone-800 rounded-lg p-4">
                                        <div className="flex justify-between text-stone-300 mb-2">
                                            <span>Drinks to Redeem</span>
                                            <span>{drinksToRedeem}</span>
                                        </div>
                                        <div className="flex justify-between text-stone-300">
                                            <span>Credits Remaining</span>
                                            <span className="text-green-400 font-bold">{availableCredits - parseInt(drinksToRedeem)}</span>
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
                                        onClick={handleRedeem}
                                        disabled={!drinksToRedeem || isProcessing}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-stone-900 font-semibold"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Redeem {drinksToRedeem || '0'} Drink{drinksToRedeem !== '1' ? 's' : ''}
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