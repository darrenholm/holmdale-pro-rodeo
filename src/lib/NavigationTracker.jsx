import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function NavigationTracker() {
    const location = useLocation();

    // Scroll to top on navigation
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

    return null;
}