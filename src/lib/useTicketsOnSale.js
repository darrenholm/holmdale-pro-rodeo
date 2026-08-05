import { useFeatureFlags } from '@/lib/useFeatureFlags';

/**
 * Whether admission tickets are currently on sale to the public.
 *
 * Backed by the existing `online_admission` feature flag, so turning sales on or
 * off is a toggle on staff.holmdalerodeo.ca/feature-flags.html rather than a code
 * change and a deploy. Everything ticket-related on the public site keys off this
 * one hook: the nav button, the hero CTA, event prices, availability badges and
 * the Buy Tickets page itself.
 *
 * Fails closed. While the flag is still loading, or if the API is unreachable, it
 * reports "not on sale":
 *   - Defaulting open would flash a Buy Tickets button on every page load that
 *     then disappears once the flag arrives, which looks broken.
 *   - An API outage must never be able to open sales for an event that has none.
 *
 * The cost of failing closed is that a brief API blip hides the buy buttons.
 * Given the flag is cached for a minute and sales are a deliberate, announced
 * event, that is the cheaper failure.
 */
export function useTicketsOnSale() {
  const { data, isLoading, isError } = useFeatureFlags();
  if (isLoading || isError || !data) return false;
  return Boolean(data.online_admission?.enabled);
}
