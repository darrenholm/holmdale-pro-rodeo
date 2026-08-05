import { useQuery } from '@tanstack/react-query';
import { useFeatureFlags } from '@/lib/useFeatureFlags';

const API = import.meta.env.VITE_RAILWAY_API_URL || 'https://api.holmdalerodeo.ca/api';

/**
 * Is this event still in the future?
 *
 * `event.date` comes back as UTC midnight. Parsing that directly and rendering
 * it in Toronto lands on the previous calendar day, so the same noon shim used
 * everywhere else in this codebase applies here too.
 *
 * The comparison is against the *start* of today, not the current moment, so an
 * event still sells on its own day right up until midnight rather than blinking
 * out at 12:01 am.
 */
export function isFutureEvent(event) {
  if (!event?.date) return false;
  const day = new Date(String(event.date).replace('T00:00:00.000Z', 'T12:00:00.000Z'));
  if (isNaN(day.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return day >= startOfToday;
}

/** A single event may only be sold if sales are open AND it hasn't happened yet. */
export function isEventSellable(event, ticketsOnSale) {
  return Boolean(ticketsOnSale) && isFutureEvent(event);
}

/**
 * Whether admission tickets are on sale to the public right now.
 *
 * Two independent conditions, both required:
 *
 *  1. The `online_admission` feature flag is on. This is the deliberate switch,
 *     toggled from staff.holmdalerodeo.ca/feature-flags.html, so opening and
 *     closing sales is never a code change and a deploy.
 *
 *  2. At least one event in the calendar is still in the future. Without this
 *     the site happily sells tickets to a rodeo that already happened — which is
 *     exactly what it did for the days after the 2026 event, because the flag
 *     was left on and nothing else was checking the date. A flag someone has to
 *     remember to flip is not a safeguard; the calendar is.
 *
 * Condition 2 also makes the whole thing self-correcting: add the 2027 events
 * and sales come back on their own, no code change and nothing to remember.
 *
 * Fails closed. While either query is loading, or if the API is unreachable,
 * this reports "not on sale":
 *   - Defaulting open would flash a Buy Tickets button on every page load that
 *     then disappears once the data lands, which looks broken.
 *   - An outage must never be able to open sales for an event that has none.
 */
export function useTicketsOnSale() {
  const { data: flags, isLoading: flagsLoading, isError: flagsError } = useFeatureFlags();

  const { data: events, isLoading: eventsLoading, isError: eventsError } = useQuery({
    queryKey: ['events', 'sellable-window'],
    queryFn: async () => {
      const res = await fetch(`${API}/events`);
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    },
    staleTime: 60_000,
    retry: false
  });

  if (flagsLoading || flagsError || !flags) return false;
  if (!flags.online_admission?.enabled) return false;

  if (eventsLoading || eventsError || !Array.isArray(events)) return false;
  return events.some(isFutureEvent);
}
