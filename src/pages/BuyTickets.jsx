import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { railwayAuth } from '@/components/railwayAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Ticket, Users, CheckCircle, ArrowLeft, Minus, Plus, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ticketTypes = [
    {
        id: 'general',
        name: 'General Admission',
        description: 'Standard arena seating with great views of all the action',
        priceKey: 'general_price',
        availableKey: 'general_available',
        color: 'border-green-500/50 bg-green-500/10'
    },
    {
        id: 'child',
        name: 'Child Ticket (5-12 years)',
        description: 'Discounted ticket for children ages 5 to 12 years',
        priceKey: 'child_price',
        availableKey: 'child_available',
        color: 'border-green-500/50 bg-green-500/10'
    },
    {
        id: 'family',
        name: 'Family Ticket (2 Adults + 2 Children)',
        description: 'Perfect for families - includes 2 adult and 2 child tickets',
        priceKey: 'family_price',
        availableKey: 'family_available',
        color: 'border-green-500/50 bg-green-500/10'
    }
];

export default function BuyTickets() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    const queryClient = useQueryClient();
    
    const [quantities, setQuantities] = useState({
        general: 0,
        child: 0,
        family: 0
    });
    const [barTickets, setBarTickets] = useState(0);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        postal_code: ''
    });
    const [orderComplete, setOrderComplete] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [isInIframe, setIsInIframe] = useState(window.self !== window.top);
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutTicket, setCheckoutTicket] = useState(null);
    const checkoutRef = useRef(null);
    const monerisCheckoutRef = useRef(null);

    useEffect(() => {
        // Cleanup on unmount
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
    
    const { data: event, isLoading, error } = useQuery({
      queryKey: ['event', eventId],
      queryFn: async () => {
          console.log('[BuyTickets] Fetching event with ID:', eventId);
          try {
              const result = await railwayAuth.callWithAuth('getEventsFromRailway');
              console.log('[BuyTickets] Railway API result:', result);
              const events = result?.data || [];
              console.log('[BuyTickets] Found events:', events.length);
              const foundEvent = events.find(e => e.id === eventId);
              if (!foundEvent) {
                  console.error('[BuyTickets] Event not found with ID:', eventId);
                  console.log('[BuyTickets] Available event IDs:', events.map(e => e.id));
                  throw new Error(`Event not found: ${eventId}`);
              }
              console.log('[BuyTickets] Found event:', foundEvent.title);

              // Fetch current tier data from Railway endpoint
              const tierResponse = await base44.functions.invoke('getEventCurrentTier', { eventId });
              const tierData = tierResponse.data;

              foundEvent.tierData = {
                  currentTier: tierData.currentTier,
                  ticketsSold: tierData.ticketsSold,
                  tier1: {
                      quantity: tierData.tiers.tier1.quantity,
                      sold: tierData.tiers.tier1.sold,
                      price: parseFloat(tierData.tiers.tier1.adultPrice)
                  },
                  tier2: {
                      quantity: tierData.tiers.tier2.quantity,
                      sold: tierData.tiers.tier2.sold,
                      price: parseFloat(tierData.tiers.tier2.adultPrice)
                  },
                  tier3: {
                      quantity: tierData.tiers.tier3.quantity,
                      sold: tierData.tiers.tier3.sold,
                      price: parseFloat(tierData.tiers.tier3.adultPrice)
                  },
                  adultPrice: parseFloat(tierData.adultPrice),
                  childPrice: tierData.childPrice || 10,
                  familyPrice: parseFloat(tierData.familyPrice)
              };

              return foundEvent;
          } catch (error) {
              console.error('[BuyTickets] Error fetching event:', error);
              throw error;
          }
      },
      enabled: !!eventId,
      retry: false
    });
    
    useEffect(() => {
        // Load Moneris Checkout script
        if (!document.getElementById('moneris-checkout-script')) {
            const script = document.createElement('script');
            script.id = 'moneris-checkout-script';
            script.src = 'https://gateway.moneris.com/chkt/js/chkt_v1.00.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    useEffect(() => {
        if (showCheckout && checkoutTicket && typeof window.monerisCheckout !== 'undefined') {
            const myCheckout = new window.monerisCheckout();
            monerisCheckoutRef.current = myCheckout;

            myCheckout.setMode('prod');
            myCheckout.setCheckoutDiv('monerisCheckout');

            myCheckout.setCallback('page_loaded', () => {
                console.log('Moneris checkout loaded');
            });

            myCheckout.setCallback('cancel_transaction', () => {
                console.log('Transaction cancelled');
                setShowCheckout(false);
                setCheckoutTicket(null);
            });

            myCheckout.setCallback('error_event', (error) => {
                console.error('Moneris error:', error);
                alert('Payment error occurred');
                setShowCheckout(false);
                setCheckoutTicket(null);
            });

            myCheckout.setCallback('payment_receipt', (data) => {
                console.log('Payment receipt:', data);
            });

            myCheckout.setCallback('payment_complete', async (data) => {
                console.log('Payment complete:', data);
                try {
                    // Send to backend to update status and send email with QR code
                    const result = await base44.functions.invoke('handleTicketPaymentSuccess', {
                        confirmation_code: confirmationCode
                    });
                    console.log('Email sent:', result);
                } catch (error) {
                    console.error('Error processing payment:', error);
                }
                setOrderComplete(true);
                setShowCheckout(false);
            });

            myCheckout.startCheckout(checkoutTicket);
        }
    }, [showCheckout, checkoutTicket, confirmationCode]);

    const createCheckout = useMutation({
        mutationFn: async (checkoutData) => {
            try {
                const response = await base44.functions.invoke('createTicketCheckoutMoneris', checkoutData);
                console.log('[Checkout] Response:', response);
                console.log('[Checkout] Response.data:', response.data);
                return response.data;
            } catch (error) {
                console.error('[Checkout] Error:', error);
                throw error;
            }
        }
    });

    const createOrder = useMutation({
        mutationFn: async (orderData) => {
            const code = `WW-${Date.now().toString(36).toUpperCase()}`;
            const order = await base44.entities.TicketOrder.create({
                ...orderData,
                confirmation_code: code,
                status: 'pending'
            });
            return { order, code };
        },
        onSuccess: (data) => {
            setConfirmationCode(data.code);
            setOrderComplete(true);
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
        }
    });
    
    // Calculate tier-based pricing from Railway
    const tierData = event?.tierData;
    const currentTier = tierData?.currentTier || 1;

    // Calculate remaining in CURRENT tier
    let ticketsRemaining = 1000;
    let nextTierPrice = null;
    let nextTierAvailable = null;

    if (tierData && tierData[`tier${currentTier}`]) {
        const currentTierData = tierData[`tier${currentTier}`];
        ticketsRemaining = Math.max(0, (currentTierData.quantity || 1000) - (currentTierData.sold || 0));
        console.log(`[BuyTickets] Tier ${currentTier}: ${currentTierData.quantity} total - ${currentTierData.sold} sold = ${ticketsRemaining} remaining`);

        // Get next tier info if available
        if (currentTier < 3) {
            const nextTier = currentTier + 1;
            const nextTierData = tierData[`tier${nextTier}`];
            if (nextTierData) {
                nextTierPrice = nextTierData.price;
                nextTierAvailable = (nextTierData.quantity || 1000) - (nextTierData.sold || 0);
            }
        }
    }
    
    // Get prices for each ticket type
    const adultPrice = tierData?.adultPrice || (currentTier === 1 ? 30 : currentTier === 2 ? 35 : 40);
    const childPrice = tierData?.childPrice || 10;
    const familyPrice = tierData?.familyPrice || (currentTier === 1 ? 70 : currentTier === 2 ? 80 : 90);
    
    // Calculate totals across all ticket types
    const generalSubtotal = quantities.general * adultPrice;
    const childSubtotal = quantities.child * childPrice;
    const familySubtotal = quantities.family * familyPrice;
    const barTicketsSubtotal = barTickets * 7; // $7 per pack of 10
    const subtotal = generalSubtotal + childSubtotal + familySubtotal + barTicketsSubtotal;
    const hst = subtotal * 0.13;
    const totalPrice = subtotal + hst;
    const totalQuantity = quantities.general + quantities.child + quantities.family;
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isInIframe) {
            alert('Checkout is only available from the published app. Please open this in a new window.');
            return;
        }

        if (totalQuantity === 0) {
            alert('Please select at least one ticket');
            return;
        }

        try {
            const checkoutData = {
                tickets: quantities,
                barTickets: barTickets,
                barCredits: barTickets * 7, // $7 worth of credits per pack
                eventId: eventId,
                customerEmail: customerInfo.email,
                customerName: customerInfo.name,
                customerPhone: customerInfo.phone
            };

            // Get Moneris checkout ticket
            const result = await createCheckout.mutateAsync(checkoutData);
            if (result.ticket) {
                setConfirmationCode(result.confirmation_code);
                setCheckoutTicket(result.ticket);
                setShowCheckout(true);
            } else {
                alert('Failed to create checkout session');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Payment checkout failed. Please check your payment credentials and try again.');
        }
    };
    
    if (!eventId) {
        return (
            <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6 flex items-center justify-center">
                <Card className="bg-stone-900 border-stone-800 p-12 text-center max-w-md">
                    <Ticket className="w-16 h-16 text-stone-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Event Selected</h3>
                    <p className="text-stone-400 mb-6">Please select an event to purchase tickets.</p>
                    <Link to={createPageUrl('Events')}>
                        <Button className="bg-green-500 hover:bg-green-600 text-stone-900">
                            Browse Events
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6 flex items-center justify-center">
                <Card className="bg-stone-900 border-stone-800 p-12 text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Error Loading Event</h3>
                    <p className="text-stone-400 mb-6">{error.message || 'Failed to load event details'}</p>
                    <Link to={createPageUrl('Events')}>
                        <Button className="bg-green-500 hover:bg-green-600 text-stone-900">
                            Back to Events
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-8 w-32 mb-8" />
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-64 rounded-xl" />
                            <Skeleton className="h-96 rounded-xl" />
                        </div>
                        <Skeleton className="h-96 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6 flex items-center justify-center">
                <Card className="bg-stone-900 border-stone-800 p-12 text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Event Not Found</h3>
                    <p className="text-stone-400 mb-6">This event may no longer be available.</p>
                    <Link to={createPageUrl('Events')}>
                        <Button className="bg-green-500 hover:bg-green-600 text-stone-900">
                            Browse Events
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }
    
    if (orderComplete) {
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
                        <h2 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h2>
                        <p className="text-stone-400 mb-6">Thank you for your purchase. Your tickets have been reserved.</p>
                        
                        <div className="bg-stone-800 rounded-xl p-6 mb-6">
                            <p className="text-stone-400 text-sm mb-2">Confirmation Code</p>
                            <p className="text-3xl font-bold text-green-400 font-mono">{confirmationCode}</p>
                        </div>
                        
                        <div className="text-left bg-stone-800/50 rounded-xl p-4 mb-6 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-stone-400">Event</span>
                                <span className="text-white font-medium">{event?.title}</span>
                            </div>
                            {quantities.general > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-stone-400">General Admission</span>
                                    <span className="text-white font-medium">{quantities.general}x @ ${adultPrice.toFixed(2)}</span>
                                </div>
                            )}
                            {quantities.child > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-stone-400">Child Tickets</span>
                                    <span className="text-white font-medium">{quantities.child}x @ ${childPrice.toFixed(2)}</span>
                                </div>
                            )}
                            {quantities.family > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-stone-400">Family Packages</span>
                                    <span className="text-white font-medium">{quantities.family}x @ ${familyPrice.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-stone-400">Total</span>
                                <span className="text-green-400 font-bold">${totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <p className="text-stone-500 text-sm mb-6">
                            A confirmation email has been sent to {customerInfo.email}
                        </p>
                        
                        <Link to={createPageUrl('Events')}>
                            <Button className="w-full bg-green-500 hover:bg-green-600 text-stone-900">
                                Browse More Events
                            </Button>
                        </Link>
                    </Card>
                </motion.div>
            </div>
        );
    }
    
    if (showCheckout) {
        return (
            <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-stone-900 border-stone-800">
                        <CardHeader>
                            <CardTitle className="text-white">Complete Your Purchase</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div id="monerisCheckout" ref={checkoutRef}></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <Link 
                    to={createPageUrl('Events')}
                    className="inline-flex items-center gap-2 text-stone-400 hover:text-green-400 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Events
                </Link>
                
                <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Event Info */}
                            <Card className="bg-stone-900 border-stone-800 overflow-hidden">
                                <div className="relative h-48 md:h-64">
                                    <img 
                                        src={event?.image_url || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=1200&q=80'}
                                        alt={event?.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <h1 className="text-3xl font-bold text-white mb-2">{event?.title}</h1>
                                        <div className="flex flex-wrap gap-4 text-sm text-stone-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-green-500" />
                                                {event?.id === '696b7bdc81676e7ff80617a1' ? 'July 31 - August 2, 2026' : format(new Date(event?.date), 'EEEE, MMMM d, yyyy')}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-green-500" />
                                                {event?.time}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-green-500" />
                                                {event?.venue || 'Main Arena'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            
                            {/* Ticket Selection */}
                            <Card className="bg-stone-900 border-stone-800">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Ticket className="w-5 h-5 text-green-500" />
                                        Select Ticket Type
                                    </CardTitle>
                                    <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-semibold">Tier {currentTier}: {ticketsRemaining} tickets remaining</p>
                                                <p className="text-stone-300 text-sm">${tierData?.[`tier${currentTier}`]?.price || (currentTier === 1 ? '30' : currentTier === 2 ? '35' : '40')}/ticket</p>
                                            </div>
                                            <Badge className="bg-green-500 text-stone-900 text-lg px-4 py-1">
                                                CURRENT
                                            </Badge>
                                        </div>
                                        {nextTierPrice && (
                                            <p className="text-stone-400 text-xs mt-3 pt-3 border-t border-green-500/20">
                                                Next tier: {nextTierAvailable} tickets at ${nextTierPrice}/ticket
                                            </p>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {ticketTypes.map((type) => {
                                        const isAvailable = ticketsRemaining > 0;
                                        const quantity = quantities[type.id];
                                        
                                        let price = 0;
                                        if (type.id === 'general') {
                                            price = adultPrice;
                                        } else if (type.id === 'child') {
                                            price = childPrice;
                                        } else if (type.id === 'family') {
                                            price = familyPrice;
                                        }
                                        
                                        return (
                                            <div key={type.id} className={`p-4 rounded-xl border-2 transition-all ${
                                                quantity > 0 ? 'border-green-500 bg-green-500/10' : isAvailable ? 'border-stone-700 bg-stone-800/50' : 'border-stone-800 bg-stone-800/30 opacity-50'
                                            }`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="text-white font-semibold mb-1">{type.name}</h3>
                                                        <p className="text-stone-400 text-sm">{type.description}</p>
                                                        {type.id !== 'child' && (
                                                            <Badge 
                                                                variant="outline" 
                                                                className={`mt-2 ${isAvailable ? 'border-green-500/50 text-green-400' : 'border-red-500/50 text-red-400'}`}
                                                            >
                                                                {isAvailable ? `Tier ${currentTier} pricing` : 'Sold Out'}
                                                            </Badge>
                                                        )}
                                                        {type.id === 'child' && isAvailable && (
                                                            <Badge 
                                                                variant="outline" 
                                                                className="mt-2 border-green-500/50 text-green-400"
                                                            >
                                                                Fixed price
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-green-400">${price.toFixed(2)}</p>
                                                        <p className="text-stone-500 text-sm">per ticket</p>
                                                    </div>
                                                </div>
                                                {isAvailable && (
                                                    <div className="flex items-center gap-3 pt-3 border-t border-stone-700">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setQuantities({...quantities, [type.id]: Math.max(0, quantity - 1)})}
                                                            className="border-stone-600 text-white hover:bg-stone-700 h-8 w-8"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                        <span className="text-white font-semibold w-8 text-center">{quantity}</span>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setQuantities({...quantities, [type.id]: quantity + 1})}
                                                            className="border-stone-600 text-white hover:bg-stone-700 h-8 w-8"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            {/* Bar Tickets */}
                            <Card className="bg-stone-900 border-stone-800">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        🍺 Bar Tickets (Optional)
                                    </CardTitle>
                                    <p className="text-stone-400 text-sm mt-2">
                                        Pre-purchase bar tickets and get them loaded onto your wristband at entry! Each pack includes 10 tickets ($0.70 each).
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-stone-800/50 rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-white font-semibold mb-1">Bar Ticket Pack (10 tickets)</h3>
                                                <p className="text-stone-400 text-sm">Auto-loaded to your wristband at check-in</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-400">$7.00</p>
                                                <p className="text-stone-500 text-sm">per pack</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pt-3 border-t border-stone-700">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setBarTickets(Math.max(0, barTickets - 1))}
                                                className="border-stone-600 text-white hover:bg-stone-700 h-8 w-8"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </Button>
                                            <span className="text-white font-semibold w-12 text-center">{barTickets}</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setBarTickets(barTickets + 1)}
                                                className="border-stone-600 text-white hover:bg-stone-700 h-8 w-8"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                            <span className="text-stone-400 text-sm ml-auto">
                                                = {barTickets * 10} bar tickets (${(barTickets * 7).toFixed(2)})
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            {/* Customer Info */}
                             <Card className="bg-stone-900 border-stone-800">
                                 <CardHeader>
                                     <CardTitle className="text-white flex items-center gap-2">
                                         <Users className="w-5 h-5 text-green-500" />
                                         Ticket Details
                                     </CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                     <form onSubmit={handleSubmit} className="space-y-6">
                                         {/* Customer Info */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="name" className="text-stone-300">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    value={customerInfo.name}
                                                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                                    className="mt-2 bg-stone-800 border-stone-700 text-white"
                                                    placeholder="John Doe"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="email" className="text-stone-300">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={customerInfo.email}
                                                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                                    className="mt-2 bg-stone-800 border-stone-700 text-white"
                                                    placeholder="john@example.com"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="postal_code" className="text-stone-300">Postal Code</Label>
                                                <Input
                                                    id="postal_code"
                                                    value={customerInfo.postal_code}
                                                    onChange={(e) => setCustomerInfo({ ...customerInfo, postal_code: e.target.value })}
                                                    className="mt-2 bg-stone-800 border-stone-700 text-white"
                                                    placeholder="A1A 1A1"
                                                />
                                            </div>
                                        </div>
                                        
                                        <Button 
                                                             type="submit"
                                                             disabled={createCheckout.isPending || totalQuantity === 0}
                                                             className="w-full bg-green-500 hover:bg-green-600 text-stone-900 font-semibold py-6 text-lg"
                                                         >
                                                             {createCheckout.isPending ? (
                                                                 <>
                                                                     <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                                     Redirecting to Checkout...
                                                                 </>
                                                             ) : (
                                                                 <>
                                                                     Complete Purchase - ${totalPrice.toFixed(2)}
                                                                 </>
                                                             )}
                                                         </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Order Summary */}
                        <div>
                            <Card className="bg-stone-900 border-stone-800 sticky top-28">
                                <CardHeader>
                                    <CardTitle className="text-white">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {quantities.general > 0 && (
                                        <div className="flex justify-between text-stone-300">
                                            <span>{quantities.general}x General Admission</span>
                                            <span>${(quantities.general * adultPrice).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {quantities.child > 0 && (
                                        <div className="flex justify-between text-stone-300">
                                            <span>{quantities.child}x Child Tickets</span>
                                            <span>${(quantities.child * childPrice).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {quantities.family > 0 && (
                                       <div className="flex justify-between text-stone-300">
                                           <span>{quantities.family}x Family Packages</span>
                                           <span>${(quantities.family * familyPrice).toFixed(2)}</span>
                                       </div>
                                    )}
                                    {barTickets > 0 && (
                                       <div className="flex justify-between text-stone-300">
                                           <span>{barTickets}x Bar Ticket Packs</span>
                                           <span>${(barTickets * 7).toFixed(2)}</span>
                                       </div>
                                    )}
                                    {(totalQuantity > 0 || barTickets > 0) && (
                                        <>
                                            <div className="flex justify-between text-stone-300">
                                                <span>Subtotal</span>
                                                <span>${subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-stone-300">
                                                <span>HST (13%)</span>
                                                <span>${hst.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-stone-800 pt-4">
                                                <div className="flex justify-between text-lg font-bold">
                                                    <span className="text-white">Total</span>
                                                    <span className="text-green-400">${totalPrice.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {totalQuantity === 0 && (
                                        <div className="text-center text-stone-400 py-4">Select tickets above to see pricing</div>
                                    )}
                                    
                                    <div className="bg-stone-800/50 rounded-lg p-4 text-sm text-stone-400">
                                        <p className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            Instant confirmation
                                        </p>
                                        <p className="flex items-start gap-2 mt-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            E-tickets sent to your email
                                        </p>
                                        <p className="flex items-start gap-2 mt-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            Show confirmation code at entry
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
            </div>
        </div>
    );
}