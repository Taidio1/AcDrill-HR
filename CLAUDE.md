# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run typecheck    # TypeScript check (tsc --noEmit)
npm test             # run all tests (Jest, --runInBand)
npx jest src/features/auth/authService.test.ts  # run a single test file
```

## Architecture

**AcDrill-HR-Next** is a Next.js 15 PWA (Polish language) serving two user roles — `worker` and `admin` — for drilling-crew field teams.

### Route groups
- `app/(auth)/login` — Supabase email+password login
- `app/(worker)/worker/…` — mobile worker views (dashboard, time tracking, payslips, documents, issues, leaves)
- `app/(admin)/admin/…` — admin views (employees, hours, payroll, leaves, issues, documents)
- `app/auth/callback` — Supabase OAuth callback
- `app/page.tsx` — entry point that redirects based on auth state

### Data & service layer

All data operations are typed against the `AppServices` interface in [`src/services/contracts.ts`](src/services/contracts.ts). The canonical domain types live in [`src/types/entities.ts`](src/types/entities.ts).

`src/services/index.ts` currently exports `mockServices` from `src/mocks/`. When connecting a real Supabase backend, replace that export with a real implementation of `AppServices` — the contract is the migration boundary.

### State management (Zustand — `src/store/appStore.ts`)

Three stores:
- `useAuthStore` — current `User | null` + hydration flag; populated by `AuthListener` via Supabase `onAuthStateChange`
- `useWorkStore` — active `WorkSession | null` persisted to `localStorage` under key `acdrill-work-session`
- `useToastStore` — single auto-clearing toast message (2.8 s)

### Auth flow

`AuthListener` (rendered inside `Providers`) subscribes to Supabase auth events. On `SIGNED_IN` / `INITIAL_SESSION` it calls `resolveProfile(userId)` which queries the `profiles` Supabase table and returns a typed `ProfileResult`. The component then routes to `/worker/dashboard` or `/admin/dashboard` based on role.

### React Query

`queryClient` at [`src/lib/queryClient.ts`](src/lib/queryClient.ts) — `staleTime: 15_000`, `retry: 1` for queries, `retry: 0` for mutations.

### Feature modules (`src/features/`)

Each feature contains:
- a Zod schema (validated with `react-hook-form` + `@hookform/resolvers/zod`)
- optional business logic utilities

### Styling

Tailwind CSS with a custom palette and scale in [`src/theme/theme.ts`](src/theme/theme.ts). Colors are referenced by name in Tailwind classes (e.g. `text-orange`, `bg-canvas`, `border-line`). Fonts: `Archivo` (headings), `IBM Plex Sans` (body), `IBM Plex Mono` (monospace).

### Testing

Tests are `.test.ts` files co-located with source. Jest uses `ts-jest` with the `@/` path alias mapped to the repo root. Tests mock Supabase via `jest.mock('@/src/lib/supabase', ...)`. Test descriptions and assertions are written in Polish.

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Falls back to `http://127.0.0.1:54321` and a placeholder key when env vars are absent (safe for local dev with mock services).
