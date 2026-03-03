import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, ArrowRight, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FeaturedEvents({ events = [], isLoading }) {
    if (isLoading) {
        return (
            <section className="py-20 px-6 bg-stone-950">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <Skeleton className="h-6 w-40 mx-auto mb-4" />
                        <Skeleton className="h-10 w-64 mx-auto" />
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-80 rounded-xl" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!events.length) return null;

    return (
        <section className="py-20 px-6 bg-stone-950">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <motion.span
                        className="inline-block text-green-500 text-sm font-semibold tracking-wider uppercase mb-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        Don't Miss Out
                    </motion.span>
                    <motion.h2
                        className="text-3xl md:text-5xl font-bold text-white"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        Upcoming Events
                    </motion.h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card className="bg-stone-900 border-stone-800 overflow-hidden group hover:border-green-500/30 transition-all duration-300 h-full flex flex-col">
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={event.image_url || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600&q=80'}
                                        alt={event.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {event.is_featured && (
                                        <Badge className="absolute top-3 left-3 bg-green-500 text-stone-900 font-semibold">
                                            Featured
                                        </Badge>
                                    )}
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">
                                        {event.title}
                                    </h3>

                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex items-center gap-2 text-stone-300">
                                            <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>
                                                {event.id === '696b7bdc81676e7ff80617a1'
                                                    ? 'July 31 - August 2, 2026'
                                                    : format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-stone-300">
                                            <Clock className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>{event.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-stone-300">
                                            <MapPin className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>{event.venue || 'Main Arena'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        {event.id !== '696b7bdc81676e7ff80617a1' ? (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-stone-500 text-xs block">Starting at</span>
                                                    <span className="text-2xl font-bold text-green-400">
                                                        ${event.general_price || 30}
                                                    </span>
                                                </div>
                                                <Link to={`${createPageUrl('BuyTickets')}?eventId=${event.id}`}>
                                                    <Button className="bg-green-500 hover:bg-green-600 text-stone-900 font-semibold gap-2">
                                                        <Ticket className="w-4 h-4" />
                                                        Buy Tickets
                                                    </Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xl font-bold text-green-400">Free Entry</span>
                                                <Badge variant="outline" className="border-green-500/50 text-green-400">
                                                    Open Event
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="text-center mt-10"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <Link to={createPageUrl('Events')}>
                        <Button variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10 font-semibold gap-2">
                            View All Events
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
