---
name: Sleeping Sheep Clerk auth
description: Clerk whitelabel auth wiring quirks in the sleeping-sheep client (base path, provider order, theming)
---

# Clerk auth in sleeping-sheep

- Auth is Replit-managed Clerk (whitelabel). Web is cookie-based: no token getters/Bearer headers, `proxyUrl` set unconditionally from `VITE_CLERK_PROXY_URL` (empty in dev is fine).
- `basePath` + `stripBase` live in `src/lib/base-path.ts`. **Why:** pages importing them from `App.tsx` created a circular import (App imports pages), causing brittle HMR ("useSettings must be used within SettingsProvider" / invalid hook call during hot updates).
- Provider order: `SettingsProvider` must wrap `ClerkProvider` so Clerk `localization`/appearance can read `t.auth` and `isNight`. QueryClient stays inside Clerk; a listener clears the react-query cache when the signed-in user changes.
- Clerk card is themed per app palette (night #1d1839/#8275e8 dark theme, day #f7eedd/#cf9445) with `cssLayerName: "clerk"`; index.css declares `@layer theme, base, clerk, components, utilities;` before the tailwind import, and vite uses `tailwindcss({ optimize: false })`.
- Sessions/sheep are still global — no per-user data linking yet (offered as follow-up).
