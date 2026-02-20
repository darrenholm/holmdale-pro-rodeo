import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/shared/Navbar';
import Sidebar from './components/shared/Sidebar';
import Footer from './components/shared/Footer';
import SponsorTicker from './components/SponsorTicker';

export default function Layout({ children }) {
    const location = useLocation();
    
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);
    
    return (
        <div className="min-h-screen bg-stone-950">
                    <Navbar />
                    <Sidebar />
                    <main className="md:ml-48">
                        <SponsorTicker />
                        {children}
                    </main>
                    <Footer />
                </div>
    );
}