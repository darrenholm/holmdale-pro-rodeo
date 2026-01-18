import React from 'react';
import { motion } from 'framer-motion';

const sponsors = [
  { name: 'Western Outfitters', logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=100&fit=crop' },
  { name: 'Ranch Supply Co', logo: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=200&h=100&fit=crop' },
  { name: 'Cowboy Gear', logo: 'https://images.unsplash.com/photo-1516796181074-bf453fbfa3e6?w=200&h=100&fit=crop' },
  { name: 'Prairie Feed', logo: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=100&fit=crop' },
  { name: 'Livestock Pro', logo: 'https://images.unsplash.com/photo-1553531087-6bb33b3f6f82?w=200&h=100&fit=crop' },
  { name: 'Rodeo Equipment', logo: 'https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=200&h=100&fit=crop' },
  { name: 'Farm & Ranch', logo: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=200&h=100&fit=crop' },
  { name: 'Western Bank', logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=100&fit=crop' }
];

export default function SponsorTicker() {
  return (
    <div className="bg-stone-900 border-t border-stone-800 py-12 overflow-hidden">
      <div className="mb-6 text-center">
        <h3 className="text-stone-400 text-sm font-semibold tracking-wider uppercase">
          Proud Partners & Sponsors
        </h3>
      </div>
      
      <div className="relative">
        <div className="flex">
          <motion.div
            className="flex gap-12 items-center"
            animate={{
              x: [0, -100 * sponsors.length]
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear"
              }
            }}
          >
            {[...sponsors, ...sponsors].map((sponsor, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-48 h-24 bg-stone-800 rounded-lg flex items-center justify-center overflow-hidden grayscale hover:grayscale-0 transition-all"
              >
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}