import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronDown, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HeroSection({ featuredEvent }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const eventDate = new Date('2026-07-31T12:00:00');
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = eventDate - now;
      
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/ed30acab0__92A6935-AlvinstonRodeo2023-Sunday-2.jpg')`
        }}>

                <div className="absolute inset-0 bg-black/60" />
            </div>
            
            {/* Logo */}
            <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }} className="mb-12 px-24 py-6 absolute top-8 left-10z-20">

                <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/a90833e02_LogoBevel.png"
          alt="Holmdale Pro Rodeo" className="pt-1 pb-1 max-w-[100px] md:max-w-[150px]" />


            </motion.div>
            
            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 border border-green-500/20 rotate-45 hidden lg:block" />
            <div className="absolute bottom-40 right-20 w-24 h-24 border border-green-500/20 rotate-12 hidden lg:block" />
            
            {/* Content */}
            <div className="px-5 text-center relative z-10 max-w-7xl">
                <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }} className="flex justify-end md:justify-center">

                    <span className="bg-green-600/20 text-green-400 mt-48 mb-1 pt-1 pr-16 pl-20 text-sm font-medium text-center uppercase tracking-wider rounded-full inline-block border border-green-500/30 -mb-4">EXPERIENCE THE THRILL

          </span>
                </motion.div>
                
                <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}>

                    <span className="mt-16 block">Holmdale</span>
                    <span className="text-green-500 mx-auto my-5">Pro Rodeo

          </span>
                </motion.h1>
                
                <motion.p className="bg-slate-950 text-[#ffffff] mb-10 mx-auto text-lg font-semibold leading-relaxed opacity-55 rounded-[20px] md:text-xl max-w-2xl"

        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}>Where legends are made and the spirit of the West comes alive. Join us for heart-pounding action, world-class riders, and unforgettable memories.



        </motion.p>
                
                {featuredEvent && (
                  <>
                    <motion.div
                      className="flex flex-wrap items-center justify-center gap-4 text-stone-400 mb-8"
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
                        <span className="bg-slate-950 text-[#ffffff] px-4 py-1 font-bold rounded-[10px]">588 Sideroad 10 S., Walkerton, ON</span>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex justify-center gap-4 mb-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.4 }}>
                      <div className="bg-stone-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 text-center min-w-[80px]">
                        <div className="text-3xl font-bold text-green-400">{countdown.days}</div>
                        <div className="text-xs text-stone-400 uppercase mt-1">Days</div>
                      </div>
                      <div className="bg-stone-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 text-center min-w-[80px]">
                        <div className="text-3xl font-bold text-green-400">{countdown.hours}</div>
                        <div className="text-xs text-stone-400 uppercase mt-1">Hours</div>
                      </div>
                      <div className="bg-stone-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 text-center min-w-[80px]">
                        <div className="text-3xl font-bold text-green-400">{countdown.minutes}</div>
                        <div className="text-xs text-stone-400 uppercase mt-1">Minutes</div>
                      </div>
                      <div className="bg-stone-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 text-center min-w-[80px]">
                        <div className="text-3xl font-bold text-green-400">{countdown.seconds}</div>
                        <div className="text-xs text-stone-400 uppercase mt-1">Seconds</div>
                      </div>
                    </motion.div>
                  </>
                )}
                
                <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}>

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