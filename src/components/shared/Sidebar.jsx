import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Ticket, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: 'Home', page: 'Home' },
  { name: 'About', page: 'About' },
  { name: 'Contact', page: 'Contact' },
  { name: 'Staff', page: 'Staff', submenu: [
    { name: 'Purchase Tickets', page: 'BuyTickets' },
    { name: 'Buy Bar Credits', page: 'BuyBarCredits' }
  ] }
];

export default function Sidebar() {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const isActivePage = (pageName) => {
    const currentPath = location.pathname;
    const pagePath = createPageUrl(pageName);
    return currentPath === pagePath;
  };

  return (
    <motion.div
      className="hidden md:fixed md:left-0 md:top-0 md:h-screen md:w-48 md:bg-green-500 md:flex md:flex-col md:pt-8 md:px-6 md:z-40 md:shadow-lg"
      initial={{ x: -256 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}>
      
      {/* Logo placeholder */}
      <div className="mb-12 h-16"></div>
      
      {/* Navigation Links */}
      <nav className="flex flex-col gap-2 flex-1">
        {navLinks.map((link) => (
          <div key={link.page}>
            {link.submenu ? (
              <div>
                <button
                  onClick={() => setOpenSubmenu(openSubmenu === link.page ? null : link.page)}
                  className={`w-full px-4 py-3 rounded-lg text-base font-medium transition-all flex items-center justify-between ${
                    isActivePage(link.page)
                      ? 'bg-green-600 text-white'
                      : 'text-white hover:bg-green-600 hover:text-white'
                  }`}
                >
                  {link.name}
                  <ChevronDown className={`w-4 h-4 transition-transform ${openSubmenu === link.page ? 'rotate-180' : ''}`} />
                </button>
                {openSubmenu === link.page && (
                  <div className="ml-4 mt-2 flex flex-col gap-2">
                    {link.submenu.map((sublink) => (
                      <Link
                        key={sublink.page}
                        to={createPageUrl(sublink.page)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActivePage(sublink.page)
                            ? 'bg-green-600 text-white'
                            : 'text-white hover:bg-green-600 hover:text-white'
                        }`}
                      >
                        {sublink.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={createPageUrl(link.page)}
                className={`px-4 py-3 rounded-lg text-base font-medium transition-all ${
                  isActivePage(link.page)
                    ? 'bg-green-600 text-white'
                    : 'text-white hover:bg-green-600 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            )}
          </div>
        ))}
      </nav>


    </motion.div>
  );
}