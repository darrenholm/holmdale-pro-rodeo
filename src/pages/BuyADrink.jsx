import { useFeatureFlags } from '@/lib/useFeatureFlags';

// Inside the component, before the return:
const { data: flags, isLoading: flagsLoading } = useFeatureFlags();

if (flagsLoading) return (
  <div className="min-h-screen bg-gradient-to-b from-amber-900 to-stone-900 flex items-center justify-center">
    <p className="text-amber-300 text-lg">Loading…</p>
  </div>
);

if (!flags?.buy_friend_drink?.enabled) return (
  <div className="min-h-screen bg-gradient-to-b from-amber-900 to-stone-900 flex items-center justify-center px-4">
    <div className="text-center">
      <div className="text-5xl mb-4">🤠</div>
      <h1 className="text-2xl font-bold text-amber-400 mb-2">Coming Soon</h1>
      <p className="text-stone-400">This feature isn't available yet. Check back closer to the event!</p>
    </div>
  </div>
);
