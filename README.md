# holmdale-pro-rodeo

Public marketing and ticket-purchase site for Holmdale Pro Rodeo. Deployed at **holmdalerodeo.ca**.

## Stack

- Vite + React 18
- React Router v6
- Tailwind CSS + shadcn/ui
- TanStack Query
- Moneris (payment gateway)

## Backend API

This frontend talks to the Railway-hosted Express API at `https://rodeo-fresh-production-7348.up.railway.app/api`. Source lives in the [`rodeo-fresh`](../rodeo-fresh) repo.

Override the API base URL locally with `VITE_RAILWAY_API_URL` in `.env.local`.

## Local development

```bash
npm install
npm run dev
```

Default dev server: `http://localhost:5173`.

```bash
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Repo structure

```
src/
  pages/         # React Router pages (public + some staff/admin — see migration note below)
  components/
    ui/          # shadcn/ui primitives
    home/        # homepage sections
    shared/      # legacy raw-HTML pages (e.g. manage-sponsors.html)
  api/
    railwayClient.js  # fetch wrapper for the Railway API; auto-logs-in
                      # via VITE_AUTH_PASSWORD env var (transitional —
                      # see SECURITY-DEBT.md SD-001)
    client.js         # `rodeo` object (functions / entities / auth) used
                      # by the older pages; wraps railwayClient
  lib/           # shared utilities + hooks
```

## Sibling repos

- [`rodeo-fresh`](../rodeo-fresh) — backend API on Railway
- [`holmdale-staff-portal`](../holmdale-staff-portal) — staff site at staff.holmdalerodeo.ca

## Outstanding cleanup

- **~17 staff/admin React pages in `src/pages/` belong in `holmdale-staff-portal`** and are scheduled to be moved: RefundTickets, ManageEvents, GateScan, IDCheck, Bartender, BarSales, FoodAdmin, FoodKiosk, RFIDRegistry, RFIDTest, StaffList, StaffScheduling, AssignStaff, ImportStaff, TicketSalesReport, UpdatePrices, TestRailway.


Known security debt is tracked in [SECURITY-DEBT.md](./SECURITY-DEBT.md).
