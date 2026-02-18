import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import GallerySection from '../components/home/GallerySection';
import CTASection from '../components/home/CTASection';

export default function Home() {
    const { data: events = [], isLoading } = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const response = await base44.functions.invoke('getEventsFromRailway');
            return response.data?.data || [];
        }
    });
    
    const featuredEvent = events.find(e => e.is_featured) || events[0];
    
    return (
        <div className="min-h-screen bg-stone-950">
            <HeroSection featuredEvent={featuredEvent} />
            <FeaturesSection />
            <GallerySection />
            <CTASection />
        </div>
    );
}