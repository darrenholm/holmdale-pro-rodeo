import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EventsShowcase({ events }) {
    if (!events || events.length === 0) return null;
    
    return (
        <section className="py-24 px-6 bg-stone-950">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.span 
                        className="inline-block text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        Mark Your Calendar
                    </motion.span>
                    <motion.h2 
                        className="text-4xl md:text-5xl font-bold text-white mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        Upcoming Events
                    </motion.h2>
                    <motion.div 
                        className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto"
                        initial={{ width: 0 }}
                        whileInView={{ width: 96 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    />
                </div>
                
                {/* Events Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.slice(0, 3).map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card className="bg-stone-900 border-stone-800 overflow-hidden group hover:border-amber-500/30 transition-all duration-500">
                                {/* Image */}
                                <div className="relative h-52 overflow-hidden">
                                    <img 
                                        src={event.image_url || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600&q=80'}
                                        alt={event.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
                                    {event.is_featured && (
                                        <Badge className="absolute top-4 right-4 bg-amber-500 text-stone-900 font-semibold">
                                            Featured
                                        </Badge>
                                    )}
                                </div>
                                
                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">
                                        {event.title}
                                    </h3>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-stone-400 text-sm">
                                            <Calendar className="w-4 h-4 text-amber-500" />
                                            <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-stone-400 text-sm">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            <span>{event.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-stone-400 text-sm">
                                            <MapPin className="w-4 h-4 text-amber-500" />
                                            <span>{event.venue || 'Main Arena'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                                        <div>
                                            <span className="text-stone-500 text-sm">Starting at</span>
                                            <p className="text-amber-400 font-bold text-xl">
                                                ${event.general_price || 25}
                                            </p>
                                        </div>
                                        <Link to={`${createPageUrl('BuyTickets')}?eventId=${event.id}`}>
                                            <Button className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold group/btn">
                                                Buy Tickets
                                                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
                
                {/* View All Button */}
                <motion.div 
                    className="text-center mt-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <Link to={createPageUrl('Events')}>
                        <Button 
                            variant="outline" 
                            size="lg"
                            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                        >
                            View All Events
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}