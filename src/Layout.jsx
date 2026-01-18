import React from 'react';
import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-stone-950">
            <Navbar />
            <main>
                {children}
            </main>
            <Footer />
        </div>
    );
}