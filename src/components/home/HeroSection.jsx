import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronDown, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HeroSection({ featuredEvent }) {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?w=1920&q=80')`
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-stone-950" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 border border-amber-500/20 rotate-45 hidden lg:block" />
            <div className="absolute bottom-40 right-20 w-24 h-24 border border-amber-500/20 rotate-12 hidden lg:block" />
            
            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="inline-block px-4 py-2 bg-amber-600/20 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium tracking-wider uppercase mb-6">
                        Experience the Thrill
                    </span>
                </motion.div>
                
                <motion.h1 
                    className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                >
                    <span className="block">Holmdale</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500">
                        Pro Rodeo
                    </span>
                </motion.h1>
                
                <motion.p 
                    className="text-lg md:text-xl text-stone-300 mb-10 max-w-2xl mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    Where legends are made and the spirit of the West comes alive. 
                    Join us for heart-pounding action, world-class riders, and unforgettable memories.
                </motion.p>
                
                {featuredEvent && (
                    <motion.div
                        className="flex flex-wrap items-center justify-center gap-4 text-stone-400 mb-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-amber-500" />
                            <span>July 31 - August 2, 2026</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-amber-500" />
                            <span>{featuredEvent.venue || 'Main Arena'}</span>
                        </div>
                    </motion.div>
                )}
                
                <motion.div 
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <Link to={createPageUrl('Events')}>
                        <Button 
                            size="lg" 
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-105"
                        >
                            Get Your Tickets
                        </Button>
                    </Link>
                    <Link to={createPageUrl('About')}>
                        <Button 
                            size="lg" 
                            variant="outline" 
                            className="border-stone-600 text-stone-300 hover:bg-stone-800 hover:text-white px-8 py-6 text-lg font-semibold transition-all duration-300"
                        >
                            Learn More
                        </Button>
                    </Link>
                </motion.div>
            </div>
            
            {/* Scroll Indicator */}
            <motion.div 
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
                <ChevronDown className="w-8 h-8 text-amber-500/60" />
            </motion.div>
        </section>
    );
}