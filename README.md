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
    base44Client.js   # compatibility shim used by ~18 pages; aliases
                      # base44.* calls to railwayClient
  lib/           # shared utilities + hooks
```

## Sibling repos

- [`rodeo-fresh`](../rodeo-fresh) — backend API on Railway
- [`holmdale-staff-portal`](../holmdale-staff-portal) — staff site at staff.holmdalerodeo.ca

## Migration in progress

This repo is being cleaned up after a Base44 → Railway platform migration. Outstanding work:

- **~17 staff/admin React pages in `src/pages/` belong in `holmdale-staff-portal`** and are scheduled to be moved: RefundTickets, ManageEvents, GateScan, IDCheck, Bartender, BarSales, FoodAdmin, FoodKiosk, RFIDRegistry, RFIDTest, StaffList, StaffScheduling, AssignStaff, ImportStaff, TicketSalesReport, UpdatePrices, TestRailway.
- **`src/api/base44Client.js` removal is blocked on adding public endpoints to `rodeo-fresh`** and refactoring four public pages (Shop, TrackOrder, ResendTicket, CheckoutSuccess) to use them. The shim is currently imported by ~18 pages.

Known security debt is tracked in [SECURITY-DEBT.md](./SECURITY-DEBT.md).
