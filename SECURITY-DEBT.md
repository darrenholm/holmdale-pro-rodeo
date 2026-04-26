# Security Debt — holmdale-pro-rodeo

Issues acknowledged but not yet fixed. Each entry has a target removal date.

---

## SD-001 — Silent shared auto-login as darren@holmgraphics.ca

**Status:** Open
**Target removal:** 2026-06-25 (60 days from acknowledgement on 2026-04-26, or before next year's ticket sales open — whichever comes first)
**Severity:** High (privacy + credential exposure)

### What's happening

`src/api/railwayClient.js` configures an auto-login that silently authenticates every public visitor as `darren@holmgraphics.ca`. The credentials come from environment variables (`VITE_AUTH_EMAIL`, `VITE_AUTH_PASSWORD`) set in the Vercel project, but Vite **inlines all `VITE_*` variables into the deployed client JavaScript bundle at build time**. Anyone who opens browser dev tools on `holmdalerodeo.ca` and searches the bundled JS can read `VITE_AUTH_PASSWORD`.

Beyond the credential exposure, this means **every concurrent visitor's session is identical to the owner's session** — they have the same JWT, the same role, the same permissions on the Railway API.

### Pages that depend on this auto-login

The public-facing flows below currently call **staff-authenticated** endpoints. They only function because the auto-login fires before the request goes out.

| Page | What breaks without auto-login | Endpoint(s) currently called |
|------|---------------------------------|------------------------------|
| `src/pages/Shop.jsx` | Shop browse and merch checkout | `entities.Product.list()` (already public — fine), `getShippingRates` (already public — fine), `createMonarisCheckout` (not in FUNCTION_MAP — already broken on origin, falls through to `api.post('/createMonarisCheckout')` which 404s) |
| `src/pages/TrackOrder.jsx` | Order tracking by tracking number | `functions.invoke('trackShipment')` → `GET /api/shipping/track/:tracking_number` (authenticated) |
| `src/pages/ResendTicket.jsx` | Customer self-service to resend a ticket email | `functions.invoke('searchTickets')` → `POST /api/ticket-orders/search` (authenticated); `functions.invoke('resendTicketEmail')` → `POST /api/email/resend-ticket` (authenticated) |
| `src/pages/CheckoutSuccess.jsx` | Confirmation page shown after Moneris payment | `entities.TicketOrder.filter()` → `GET /api/ticket-orders` (authenticated); `entities.TicketOrder.update()` → `PUT /api/ticket-orders/:id` (authenticated); `functions.invoke('sendTicketConfirmation')` (already public — fine) |

`CheckoutSuccess.jsx` is the most critical of the four — a customer who just paid via Moneris hits this page immediately and would be unable to see their confirmation if the auto-login broke.

### The fix (Path B)

Add public, rate-limited endpoints to the `rodeo-fresh` backend for the customer-facing flows, then refactor the four pages above to call those instead of the staff-authenticated endpoints:

1. **`GET /api/ticket-orders/by-confirmation/:code`** — already exists (returns a single ticket order by confirmation code). `CheckoutSuccess.jsx` should switch from `entities.TicketOrder.filter()` to `functions.invoke('getTicketByConfirmationRailway', { code })` (already mapped to this public endpoint). The status update in CheckoutSuccess (`entities.TicketOrder.update`) needs a public equivalent OR should be removed if not needed customer-side.
2. **`POST /api/email/resend-ticket-public`** — new public route. Takes `{ confirmation_code, email }`, verifies the email matches the order, sends the ticket email. Rate-limit by IP and by email (e.g. 3 attempts per email per hour). `ResendTicket.jsx` switches from `searchTickets` + `resendTicketEmail` to this single call.
3. **`GET /api/orders/track/:tracking_number`** — new public route, or make the existing `/api/shipping/track/:tracking_number` public. Rate-limit by IP. `TrackOrder.jsx` switches over.
4. **`POST /api/moneris/merch-checkout`** — already exists per the FUNCTION_MAP (`createMerchandiseCheckout`). Repoint `Shop.jsx` line 144 from `createMonarisCheckout` (typo'd, broken) to `createMerchandiseCheckout`.

Once all four pages stop calling authenticated endpoints, remove `AUTH_EMAIL`, `AUTH_PASSWORD`, the `login()` method, and the 401/403 retry from `railwayClient.js`. Replace with a `redirectToLogin()` that bounces to `staff.holmdalerodeo.ca/login.html` for any 401/403 (which should now only ever happen if a real staff user has an expired token on a staff page).

### Mitigation until removal

- `VITE_AUTH_PASSWORD` lives in Vercel env vars — never commit it to source.
- Rotate the password monthly (or on any suspicion of leak).
- The `darren@holmgraphics.ca` account in the `users` table should have the **minimum role** required for the four public flows above — specifically: read on `ticket_orders`, update on `ticket_orders.status` (only for the post-Moneris confirmation update), call `/email/resend-ticket`, call `/shipping/track`. Should NOT have admin role, write access to events, write access to staff, etc.
- Audit Railway API logs periodically for unexpected use of this token from non-customer flows.

#### Reference: SQL for role minimization (DO NOT PASTE-AND-RUN)

⚠️ **Verify the schema before running anything below.** The exact column names and shape of the role data may have drifted since this was written. The auth model uses both a `role` column (legacy single-string) and a `roles` column (JSONB array, added in commit `14a7da7`); confirm both exist and which is authoritative before updating. Run `\d users` in `psql` first.

The snippets are intentionally **commented out** — copy individual lines into a console after you've verified them, don't run the whole block.

```sql
-- Step 1 — see current state of the row, including both role columns:
-- SELECT id, email, role, roles FROM users WHERE email = 'darren@holmgraphics.ca';

-- Step 2 — see what role values other users currently have, for context:
-- SELECT DISTINCT role FROM users;
-- SELECT DISTINCT jsonb_array_elements_text(roles) AS r FROM users;

-- Step 3 — once you've confirmed which role name maps to "minimum permissions
-- needed for the four public flows" (likely a custom role you'd need to define
-- server-side in middleware/auth.js — e.g. 'public_proxy'), apply with:

-- UPDATE users
--    SET role  = 'public_proxy',
--        roles = '["public_proxy"]'::jsonb
--  WHERE email = 'darren@holmgraphics.ca';

-- Step 4 — verify after:
-- SELECT id, email, role, roles FROM users WHERE email = 'darren@holmgraphics.ca';

-- Note: changing this user's role will cause ALL public visitor sessions
-- to operate with the new role (since they all share this account via the
-- auto-login). Test the four public flows in a browser AFTER this change
-- to confirm they still work.
```

### Verification on removal

When SD-001 is closed:

- [ ] All four public pages can complete their flow with no `auth_token` in localStorage and no auto-login
- [ ] `railwayClient.js` no longer references `AUTH_EMAIL` or `AUTH_PASSWORD`
- [ ] `VITE_AUTH_PASSWORD` removed from Vercel env vars
- [ ] `darren@holmgraphics.ca` user in `users` table either deleted or password rotated to something not used by any deployed code
- [ ] Confirm in deployed bundle (browser dev tools → Sources → search) that no credential strings appear
