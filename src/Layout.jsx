import React from 'react';
import Navbar from './components/shared/Navbar';
import Sidebar from './components/shared/Sidebar';
import Footer from './components/shared/Footer';
import SponsorTicker from './components/SponsorTicker';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-stone-950">
            <Navbar />
            <SponsorTicker />
            <main>
                {children}
            </main>
            <Footer />
        </div>
    );
}