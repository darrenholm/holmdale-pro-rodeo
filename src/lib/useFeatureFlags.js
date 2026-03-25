import { useQuery } from '@tanstack/react-query';

const API = 'https://rodeo-fresh-production-7348.up.railway.app/api';

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const res = await fetch(`${API}/features`);
      if (!res.ok) throw new Error('Failed to fetch feature flags');
      return res.json();
    },
    staleTime: 60_000,   // cache for 1 minute
    retry: false,
  });
}
