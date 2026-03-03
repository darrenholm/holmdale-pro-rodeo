import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { functions } from '@/api/railwayClient';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import GallerySection from '../components/home/GallerySection';
import CTASection from '../components/home/CTASection';
export default function Home() {
    const { data: events = [], isLoading } = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            try {
                const result = await functions.invoke('getEventsFromRailway');
                return result.data || [];
            } catch (error) {
                console.error('Failed to fetch events:', error);
                return [];
            }
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false
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
