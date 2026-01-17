import React from 'react';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Footer() {
    return (
        <footer className="bg-stone-950 border-t border-stone-800">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4">
                            <span className="text-amber-500">Wild West</span> Rodeo
                        </h3>
                        <p className="text-stone-400 mb-6 leading-relaxed">
                            Experience the thrill of authentic Western rodeo entertainment. 
                            Where legends are made and memories last forever.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-amber-500 hover:text-white transition-all">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-amber-500 hover:text-white transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-amber-500 hover:text-white transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-amber-500 hover:text-white transition-all">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                    
                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-6">Quick Links</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to={createPageUrl('Home')} className="text-stone-400 hover:text-amber-400 transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to={createPageUrl('Events')} className="text-stone-400 hover:text-amber-400 transition-colors">
                                    Events
                                </Link>
                            </li>
                            <li>
                                <Link to={createPageUrl('About')} className="text-stone-400 hover:text-amber-400 transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to={createPageUrl('Contact')} className="text-stone-400 hover:text-amber-400 transition-colors">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Events */}
                    <div>
                        <h4 className="text-white font-semibold mb-6">Events</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                                    Bull Riding
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                                    Barrel Racing
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                                    Bronc Riding
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                                    Team Roping
                                </a>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold mb-6">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-amber-500 mt-0.5" />
                                <span className="text-stone-400">
                                    123 Rodeo Drive<br />
                                    Western City, TX 75001
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-amber-500" />
                                <span className="text-stone-400">(555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-amber-500" />
                                <span className="text-stone-400">info@wildwestrodeo.com</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-stone-500 text-sm">
                        © 2024 Wild West Championship Rodeo. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm">
                        <a href="#" className="text-stone-500 hover:text-amber-400 transition-colors">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-stone-500 hover:text-amber-400 transition-colors">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}