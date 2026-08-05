import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { functions } from '@/api/railwayClient';
import HeroSection from '../components/home/HeroSection';
import FeaturedEvents from '../components/home/FeaturedEvents';
import FeaturesSection from '../components/home/FeaturesSection';
import GallerySection from '../components/home/GallerySection';
import CTASection from '../components/home/CTASection';
import { isFutureEvent } from '@/lib/useTicketsOnSale';
export default function Home() {
    const { data: allEvents = [], isLoading } = useQuery({
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
    
    // "Upcoming Events" must mean upcoming. Events stay in the database forever —
    // deleting one cascades away its ticket orders and staff shifts — so the
    // website filters by date instead of relying on anyone tidying the records.
    const events = allEvents.filter(isFutureEvent);

    return (
        <div className="min-h-screen bg-stone-950">
            <HeroSection />
            <FeaturedEvents events={events} isLoading={isLoading} />
            <FeaturesSection />
            <GallerySection />
            <CTASection />
        </div>
    );
}
