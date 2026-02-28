import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/shared/Navbar';
import Sidebar from './components/shared/Sidebar';
import Footer from './components/shared/Footer';
import SponsorTicker from './components/SponsorTicker';
export default function Layout({ children }) {
    const location = useLocation();
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return (
        <div className="min-h-screen bg-stone-950">
                    <Navbar />
                    {isDesktop && <Sidebar />}
                    <main className={isDesktop ? "ml-48" : ""}>
                        <SponsorTicker />
                        {children}
                    </main>
                    <Footer />
                </div>
    );
}