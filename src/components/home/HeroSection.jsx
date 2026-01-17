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
          backgroundImage: `url('https://images.unsplash.com/photo-1609342122563-a43ac8917a3a?w=1920&q=80')`
        }}>

                <div className="absolute inset-0 bg-black/60" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 border border-green-500/20 rotate-45 hidden lg:block" />
            <div className="absolute bottom-40 right-20 w-24 h-24 border border-green-500/20 rotate-12 hidden lg:block" />
            
            {/* Content */}
            <div className="ml-1 px-48 text-center relative z-10 max-w-7xl">
                <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-8 text-left">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/a90833e02_LogoBevel.png"
                        alt="Holmdale Pro Rodeo"
                        className="max-w-[250px]"
                    />
                </motion.div>
                
                <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }} className="pl-3">

                    <span className="inline-block px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium tracking-wider uppercase mb-6">
                        Experience the Thrill
                    </span>
                </motion.div>
                
                <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}>

                    <span className="block">Holmdale</span>
                    <span className="text-green-500">
                        Pro Rodeo
                    </span>
                </motion.h1>
                
                <motion.p className="bg-slate-950 text-[#ffffff] mb-10 mx-auto text-lg font-semibold leading-relaxed opacity-55 rounded-[20px] md:text-xl max-w-2xl"

        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}>Where legends are made and the spirit of the West comes alive. Join us for heart-pounding action, world-class riders, and unforgettable memories.



        </motion.p>
                
                {featuredEvent &&
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 text-stone-400 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-500" />
                            <span className="bg-slate-950 text-[#ffffff] mx-3 px-3 py-1 font-bold opacity-100 rounded-[10px]">July 31 - August 2, 2026</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-500" />
                            <span className="bg-slate-950 text-[#ffffff] font-bold rounded-[10px]">588 Sideroad 10 S., Walkerton, ON</span>
                        </div>
                    </motion.div>
        }
                
                <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}>

                    <Link to={createPageUrl('Events')}>
                        <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-green-500/25 transition-all duration-300 hover:shadow-green-500/40 hover:scale-105">

                            Get Your Tickets
                        </Button>
                    </Link>
                    <Link to={createPageUrl('About')}>
                        <Button
              size="lg"
              variant="outline"
              className="border-stone-600 text-stone-300 hover:bg-stone-800 hover:text-white px-8 py-6 text-lg font-semibold transition-all duration-300">

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
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}>

                <ChevronDown className="w-8 h-8 text-green-500/60" />
            </motion.div>
        </section>);

}