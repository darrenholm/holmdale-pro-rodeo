import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CTASection() {
    return (
        <section className="relative py-32 px-6 overflow-hidden">
            {/* Background */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-fixed"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=1920&q=80')`
                }}
            >
                <div className="absolute inset-0 bg-stone-950/85" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-amber-500/10 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-amber-500/10 rounded-full" />
            
            <div className="relative z-10 max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium mb-6">
                        <Ticket className="w-4 h-4" />
                        Limited Seats Available
                    </div>
                    
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Don't Miss the
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                            Ride of Your Life
                        </span>
                    </h2>
                    
                    <p className="text-xl text-stone-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Secure your tickets now and be part of the most exciting rodeo event of the year. 
                        Premium seats are selling fast!
                    </p>
                    
                    <Link to={createPageUrl('Events')}>
                        <Button 
                            size="lg" 
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-10 py-7 text-lg font-semibold shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:shadow-amber-500/50 hover:scale-105"
                        >
                            Get Tickets Now
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}