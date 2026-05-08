# CLAUDE.md — Forecast Platform

## Project overview

Web-based financial forecasting platform for a Lead PM (likely Flex/Honeywell day-job context) to collect and consolidate financial data from regional PMs in **China, Penang, and Mexico**. Replaces manual Excel management with a "Database-First" approach: regional PMs submit via per-region URLs, the Lead PM exports a 4-tab consolidated `.xlsx`.

**Status:** Dormant per the project inventory (last commit removed Supabase credentials from docs; multiple stop-and-go `UPDATES_SESSION*.md` files). Treat as wake-it-up-when-needed.

## Tech stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Database**: Supabase (PostgreSQL)
- **Excel engine**: ExcelJS
- **Styling**: Tailwind CSS (+ Shadcn UI per PRD)
- **Hosting**: Vercel-ready

## Files

| File | Role |
|---|---|
| `PRD.md` | Product requirements — read this first for intent |
| `README.md` | Setup, usage guide, full SQL schema for Supabase |
| `DATABASE_SCHEMA.md` | Detailed schema docs |
| `DEPLOYMENT_GUIDE.md` | Vercel deploy steps |
| `SETUP_COMPLETE.md` | Setup summary + current status |
| `UPDATES_SESSION2.md`, `UPDATES_SESSION2_PART2.md` | Historical session notes (stop-and-go) |
| `app/admin/` | Admin control center (time horizon, period labels, product families) |
| `app/submit/[region]/` | Dynamic regional portals (`/submit/china`, `/submit/penang`, `/submit/mexico`) |
| `app/api/export/` | Excel export endpoint |
| `lib/supabase.ts` | Supabase client |
| `lib/calculations.ts` | Net Revenue + BOM% formulas |
| `lib/types.ts` | TypeScript types |
| `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (gitignored) |

## Run / build

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm start
```

## Core domain model

Three tables (full SQL in README/DATABASE_SCHEMA.md):
- `settings` — singleton-ish; time horizon (`quarterly` | `3year`), 6 period labels
- `product_families` — region-scoped (`UNIQUE(region, name)`); each region has its own catalog
- `regional_submissions` — one row per (region, product_family); 24 financial fields covering up to 6 periods

Per Product Family per period, the **6-row stack** is:
1. Customer Revenue (manual)
2. Derate % (manual)
3. Net Revenue = `Customer Revenue × (1 - Derate%/100)` (auto)
4. BOM Cost (manual)
5. BOM % = `(BOM Cost / Net Revenue) × 100` (auto)
6. NRE Revenue (manual)

Summary tab also computes a **Group BOM%** at the global level: `Σ BOM Cost / Σ Net Revenue × 100` (NOT an average of regional BOM%s).

## Critical gotchas

- **RLS policies are wide-open** (`USING (true)`) per the SQL in README. Acceptable for an internal tool, but never expose this beyond trusted users without locking them down.
- **`UNIQUE(region, product_family_id)`** on submissions means a re-submit overwrites the prior row. There is no submission history.
- **Region is hard-coded to three values** (`china | penang | mexico`) in CHECK constraints. Adding a region requires a schema migration, not just a UI tweak.
- **Period labels start blank** by default — exports will show empty headers if the admin hasn't filled them in yet.
- **Auto-save in admin** writes on every keystroke (per README). Watch for excessive Supabase writes during heavy editing.

## Plan files

If a plan file exists for active work, it's in `~/.claude/plans/` matching this project's name.
