import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Ticket, Users, CheckCircle, ArrowLeft, Minus, Plus, Loader2, AlertCircle } from 'lucide-react';
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
        id: 'premium',
        name: 'Premium Seating',
        description: 'Prime viewing positions with extra legroom and cup holders',
        priceKey: 'premium_price',
        availableKey: 'premium_available',
        color: 'border-blue-500/50 bg-blue-500/10'
    },
    {
        id: 'vip',
        name: 'VIP Box',
        description: 'Private box seating with complimentary refreshments and meet & greet',
        priceKey: 'vip_price',
        availableKey: 'vip_available',
        color: 'border-green-500/50 bg-green-500/10'
    }
];

export default function BuyTickets() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    const queryClient = useQueryClient();
    
    const [selectedType, setSelectedType] = useState('general');
    const [quantity, setQuantity] = useState(1);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        postal_code: ''
    });
    const [orderComplete, setOrderComplete] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [isInIframe, setIsInIframe] = useState(window.self !== window.top);
    
    const { data: event, isLoading } = useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            const events = await base44.entities.Event.filter({ id: eventId });
            return events[0];
        },
        enabled: !!eventId
    });
    
    const createCheckout = useMutation({
        mutationFn: async (checkoutData) => {
            const response = await base44.functions.invoke('createCheckout', checkoutData);
            return response.data;
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
    
    const selectedTicketType = ticketTypes.find(t => t.id === selectedType);
    const ticketPrice = event?.[selectedTicketType?.priceKey] || 0;
    const ticketAvailable = event?.[selectedTicketType?.availableKey] || 0;
    const totalPrice = ticketPrice * quantity;
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isInIframe) {
            alert('Checkout is only available from the published app. Please open this in a new window.');
            return;
        }

        try {
            const checkoutData = {
                ticketType: selectedType,
                quantity: quantity,
                eventId: eventId,
                customerEmail: customerInfo.email,
                customerName: customerInfo.name,
                customerPhone: customerInfo.phone
            };

            // Create order record first
            const code = `WW-${Date.now().toString(36).toUpperCase()}`;
            await base44.entities.TicketOrder.create({
                event_id: eventId,
                customer_name: customerInfo.name,
                customer_email: customerInfo.email,
                customer_phone: customerInfo.phone,
                ticket_type: selectedType,
                quantity: quantity,
                total_price: totalPrice,
                confirmation_code: code,
                status: 'pending'
            });

            // Then redirect to Stripe checkout
            const result = await createCheckout.mutateAsync(checkoutData);
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Checkout error:', error);
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
                            <div className="flex justify-between">
                                <span className="text-stone-400">Tickets</span>
                                <span className="text-white font-medium">{quantity}x {selectedTicketType?.name}</span>
                            </div>
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
                
                {isLoading ? (
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-64 rounded-xl" />
                            <Skeleton className="h-96 rounded-xl" />
                        </div>
                        <Skeleton className="h-96 rounded-xl" />
                    </div>
                ) : isInIframe ? (
                    <Card className="bg-stone-900 border-stone-800 p-12 text-center max-w-md mx-auto">
                        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Checkout Not Available</h3>
                        <p className="text-stone-400 mb-6">Checkout is only available from the published app. Please open this link in a new window to continue.</p>
                    </Card>
                ) : (
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
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {ticketTypes.map((type) => {
                                        const price = event?.[type.priceKey] || 0;
                                        const available = event?.[type.availableKey] || 0;
                                        const isSelected = selectedType === type.id;
                                        const isAvailable = available > 0;
                                        
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => isAvailable && setSelectedType(type.id)}
                                                disabled={!isAvailable}
                                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                                    isSelected 
                                                        ? 'border-green-500 bg-green-500/10' 
                                                        : isAvailable 
                                                            ? 'border-stone-700 bg-stone-800/50 hover:border-stone-600' 
                                                            : 'border-stone-800 bg-stone-800/30 opacity-50 cursor-not-allowed'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-white font-semibold mb-1">{type.name}</h3>
                                                        <p className="text-stone-400 text-sm">{type.description}</p>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={`mt-2 ${isAvailable ? 'border-green-500/50 text-green-400' : 'border-red-500/50 text-red-400'}`}
                                                        >
                                                            {isAvailable ? `${available} seats available` : 'Sold Out'}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-green-400">${price}</p>
                                                        <p className="text-stone-500 text-sm">per ticket</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                            
                            {/* Quantity & Customer Info */}
                            <Card className="bg-stone-900 border-stone-800">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-green-500" />
                                        Ticket Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Quantity */}
                                        <div>
                                            <Label className="text-stone-300 mb-3 block">Number of Tickets</Label>
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="border-stone-700 text-white hover:bg-stone-800"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <span className="text-2xl font-bold text-white w-12 text-center">{quantity}</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setQuantity(Math.min(ticketAvailable, quantity + 1))}
                                                    className="border-stone-700 text-white hover:bg-stone-800"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        
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
                                            disabled={createCheckout.isPending || ticketAvailable === 0}
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
                                    <div className="flex justify-between text-stone-300">
                                        <span>{selectedTicketType?.name}</span>
                                        <span>${ticketPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-stone-300">
                                        <span>Quantity</span>
                                        <span>× {quantity}</span>
                                    </div>
                                    <div className="border-t border-stone-800 pt-4">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span className="text-white">Total</span>
                                            <span className="text-green-400">${totalPrice.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
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
                )}
            </div>
        </div>
    );
}