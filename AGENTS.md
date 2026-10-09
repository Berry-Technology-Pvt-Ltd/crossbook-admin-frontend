# Admin Frontend — Development Notes

This is the CrossBook Admin Portal: a Next.js 16 (App Router, Turbopack) application on React 19, using TanStack Query, Zustand, Axios, and Tailwind CSS.

- Dev server: `npm run dev` (port 3001)
- Build: `npm run build`
- Start (production): `npm run start`

See `ADMIN_FRONTEND_ARCHITECTURE.md` at the repo root for the full architecture overview, including the admin auth model (dedicated credentials plus an `x-admin-key` master-key bypass) and known security follow-ups.
