import React from 'react';
import { motion } from 'framer-motion';

const sponsors = [
  { name: 'Matcrete', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/1f9b3b5e2_Matcretelogo.png' },
  { name: 'John Ernewein Limited', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/f11da2363_ErneweinLogo2.jpg' },
  { name: 'Gay Lea', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/e6c521061_GayLea.jpg' }
];

export default function SponsorTicker() {
  return (
    <div className="bg-white border-t border-stone-200 py-5 overflow-hidden">
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
                className="flex-shrink-0 w-48 h-18 bg-stone-50 rounded-lg flex items-center justify-center overflow-hidden transition-all"
              >
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="w-full h-full object-cover transition-opacity"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}