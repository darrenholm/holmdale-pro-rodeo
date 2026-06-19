import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API = 'https://rodeo-fresh-production-7348.up.railway.app/api';

// Ensure a sponsor-entered website is an absolute URL so the link doesn't
// resolve relative to holmdalerodeo.ca (e.g. "example.com" → "https://example.com").
function normalizeUrl(url) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function SponsorTicker() {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/sponsors/public`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => { if (!cancelled && Array.isArray(data)) setSponsors(data); })
      .catch(() => { /* leave ticker empty on failure */ });
    return () => { cancelled = true; };
  }, []);

  if (sponsors.length === 0) return null;

  // Repeat the list so the belt stays full even with only a few sponsors,
  // then duplicate the whole belt so the scroll loops seamlessly.
  const belt = [];
  while (belt.length < 8) belt.push(...sponsors);
  const loop = [...belt, ...belt];

  return (
    <div className="bg-white border-t border-stone-200 py-8 overflow-hidden">
      <div className="relative">
        <div className="flex">
          <motion.div
            className="flex gap-12 items-center"
            animate={{ x: [0, -100 * belt.length] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: belt.length * 2.5,
                ease: 'linear'
              }
            }}
          >
            {loop.map((sponsor, index) => {
              const logo = (
                <img
                  src={sponsor.logo_url}
                  alt={sponsor.name}
                  title={sponsor.name}
                  className="w-full h-full object-contain transition-opacity"
                />
              );
              const href = normalizeUrl(sponsor.website);
              return (
                <div
                  key={index}
                  className="flex-shrink-0 w-30 h-7 bg-stone-50 rounded-lg flex items-center justify-center overflow-hidden transition-all"
                >
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-full flex items-center justify-center"
                    >
                      {logo}
                    </a>
                  ) : logo}
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
