import React from 'react';
import { motion } from 'framer-motion';

const sponsors = [
  { name: 'Wrangler', logo: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200&h=100&fit=crop' },
  { name: 'Justin Boots', logo: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&h=100&fit=crop' },
  { name: 'Cinch Jeans', logo: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=200&h=100&fit=crop' },
  { name: 'Montana Silversmiths', logo: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=200&h=100&fit=crop' },
  { name: 'Resistol Hats', logo: 'https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?w=200&h=100&fit=crop' },
  { name: 'Ariat', logo: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=100&fit=crop' },
  { name: 'Purina Feed', logo: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=100&fit=crop' },
  { name: 'Dodge Ram', logo: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&h=100&fit=crop' }
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