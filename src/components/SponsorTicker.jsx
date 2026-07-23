import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API = 'https://api.holmdalerodeo.ca/api';

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

  // Title sponsors get a large static card above the belt; the belt scrolls
  // everyone else. Falls back to everyone-in-the-belt if none are Title.
  const titleSponsors = sponsors.filter(s => s.level === 'Title');
  const beltSponsors = titleSponsors.length > 0 ? sponsors.filter(s => s.level !== 'Title') : sponsors;

  // Repeat the list so the belt stays full even with only a few sponsors,
  // then duplicate the whole belt so the scroll loops seamlessly.
  const belt = [];
  while (belt.length < 8 && beltSponsors.length > 0) belt.push(...beltSponsors);
  const loop = [...belt, ...belt];

  // Each logo box is a fixed size (w-40 = 160px) with a gap-12 (48px) between
  // boxes, so one full belt is belt.length * 208px wide. Scrolling exactly that
  // distance lines the second copy up over the first for a seamless loop.
  const ITEM_STRIDE = 208;

  return (
    <div className="bg-white border-t border-stone-200 py-8 overflow-hidden">
      {titleSponsors.length > 0 && (
        <div className="mb-8 px-4">
          <div className="text-center text-stone-500 text-xs font-bold tracking-[0.3em] uppercase mb-4">
            Title Sponsors
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {titleSponsors.map(sponsor => {
              const logo = (
                <img
                  src={sponsor.logo_url}
                  alt={sponsor.name}
                  title={sponsor.name}
                  className="max-w-full max-h-full object-contain"
                />
              );
              const href = normalizeUrl(sponsor.website);
              return (
                <div
                  key={sponsor.id}
                  className="h-20 sm:h-24 w-full max-w-md px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm"
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
          </div>
        </div>
      )}
      <div className="relative">
        <div className="flex">
          <motion.div
            className="flex gap-12 items-center"
            animate={{ x: [0, -ITEM_STRIDE * belt.length] }}
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
                  className="max-w-full max-h-full object-contain transition-opacity"
                />
              );
              const href = normalizeUrl(sponsor.website);
              return (
                <div
                  key={index}
                  className="flex-shrink-0 w-40 h-12 px-3 bg-stone-50 rounded-lg flex items-center justify-center overflow-hidden transition-all"
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
