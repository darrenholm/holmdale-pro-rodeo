import React from 'react';
import { motion } from 'framer-motion';

const sponsors = [
  { name: 'Matcrete', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/efd619f55_Matcretelogo.png' },
  { name: 'John Ernewein Limited', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/f11da2363_ErneweinLogo2.jpg' }
];

export default function SponsorTicker() {
  return (
    <div className="bg-white border-t border-stone-200 py-12 overflow-hidden">
      <div className="mb-6 text-center">
        <h3 className="text-stone-600 text-sm font-semibold tracking-wider uppercase">
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
                className="flex-shrink-0 w-48 h-24 bg-stone-50 rounded-lg flex items-center justify-center overflow-hidden grayscale hover:grayscale-0 transition-all"
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