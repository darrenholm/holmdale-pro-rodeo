import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Menu, X, Ticket } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LOGO_URL } from '@/lib/constants';

const navLinks = [
{ name: 'Home', page: 'Home' },
{ name: 'About', page: 'About' },
{ name: 'Contact', page: 'Contact' },
{ name: 'Staff', page: 'Staff' }];


export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePage = (pageName) => {
    const currentPath = location.pathname;
    const pagePath = createPageUrl(pageName);
    return currentPath === pagePath;
  };

  return (
    <>
            <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-stone-950/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`
        }
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}>

                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="py-2 flex items-center justify-between">
                        {/* Logo */}
                        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                            <img src={LOGO_URL} alt="Holmdale Pro Rodeo" className="h-10 w-auto" />
                        </Link>
                        
                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.page}
                                    to={createPageUrl(link.page)}
                                    className={`text-sm font-semibold transition-colors ${
                                        isActivePage(link.page) ? 'text-green-400' : 'text-stone-300 hover:text-white'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                        
                        {/* Mobile Menu Button */}
                        <button className="text-white p-2 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </motion.nav>
            
            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen &&
        <motion.div
          className="fixed inset-0 z-40 bg-stone-950 pt-20 px-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}>
                        <div className="flex flex-col items-center gap-4 pt-8">
                            <img src={LOGO_URL} alt="Holmdale Pro Rodeo" className="h-16 w-auto mb-4" />
                            {navLinks.map((link) =>
            <Link
              key={link.page}
              to={createPageUrl(link.page)}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-2xl font-semibold ${
              isActivePage(link.page) ?
              'text-green-400' :
              'text-white'}`
              }>
                                    {link.name}
                                </Link>
            )}
                        </div>
                    </motion.div>
        }
            </AnimatePresence>
        </>);

}