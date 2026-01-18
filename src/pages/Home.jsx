import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import HeroSection from '../components/home/HeroSection';
import EventsShowcase from '../components/home/EventsShowcase';
import FeaturesSection from '../components/home/FeaturesSection';
import GallerySection from '../components/home/GallerySection';
import CTASection from '../components/home/CTASection';
import SponsorTicker from '../components/SponsorTicker';

export default function Home() {
    const { data: events = [], isLoading } = useQuery({
        queryKey: ['events'],
        queryFn: () => base44.entities.Event.list('date', 10)
    });
    
    const featuredEvent = events.find(e => e.is_featured) || events[0];
    
    return (
        <div className="min-h-screen bg-stone-950">
            <HeroSection featuredEvent={featuredEvent} />
            <SponsorTicker />
            <EventsShowcase events={events} isLoading={isLoading} />
            <FeaturesSection />
            <GallerySection />
            <CTASection />
        </div>
    );
}