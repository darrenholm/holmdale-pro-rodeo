import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Ticket } from 'lucide-react';
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: 'Home', page: 'Home' },
  { name: 'About', page: 'About' },
  { name: 'Contact', page: 'Contact' },
  { name: 'Staff', page: 'Staff' }
];

export default function Sidebar() {
  const location = useLocation();

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
          <Link
            key={link.page}
            to={createPageUrl(link.page)}
            className={`px-4 py-3 rounded-lg text-base font-medium transition-all ${
              isActivePage(link.page)
                ? 'bg-green-600 text-white'
                : 'text-white hover:bg-green-600 hover:text-white'
            }`}>
            {link.name}
          </Link>
        ))}
      </nav>


    </motion.div>
  );
}