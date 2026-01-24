# CLAUDE.md - AI Assistant Guide for Forecast Platform

This document provides comprehensive guidance for AI assistants (like Claude) working with this codebase. It explains the project structure, conventions, patterns, and workflows to enable effective code assistance.

## Project Overview

**Purpose**: A web-based financial forecasting platform that enables a Lead PM to collect, calculate, and consolidate financial data from regional PMs across three regions: China, Penang, and Mexico.

**Key Goal**: Replace manual Excel management with a database-first approach while maintaining Excel export capability for professional reporting.

**Target Users**:
- **Administrators**: Configure forecasting cycles, manage product catalogs, export consolidated reports
- **Regional PMs**: Submit financial data for their respective regions

## Technology Stack

### Core Framework & Runtime
- **Next.js 15**: Using App Router (not Pages Router)
- **React 19**: Latest React with Server/Client Components
- **TypeScript 5**: Strict mode enabled
- **Node.js**: Target ES2017 in tsconfig

### Database & Backend
- **Supabase**: PostgreSQL database with Row Level Security (RLS)
- **@supabase/supabase-js**: Client library for database operations

### UI & Styling
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **Custom CSS Variables**: Defined in `app/globals.css`
- **No UI Component Library**: Pure Tailwind components (no Shadcn despite PRD mention)

### Excel Generation
- **ExcelJS 4.4**: Client-side Excel file generation and formatting

### Deployment
- **Vercel**: Primary hosting platform (configured for zero-config deployment)

## Project Structure

```
forecast-platform/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Home page with navigation
│   ├── globals.css              # Global Tailwind styles
│   ├── admin/
│   │   └── page.tsx            # Admin control center (Client Component)
│   ├── submit/[region]/
│   │   └── page.tsx            # Dynamic regional portals (Client Component)
│   └── api/export/
│       └── route.ts            # Excel export API endpoint (Server Component)
│
├── lib/                         # Shared utilities and configurations
│   ├── supabase.ts             # Supabase client initialization
│   ├── types.ts                # TypeScript type definitions
│   └── calculations.ts         # Financial calculation utilities
│
├── DATABASE_SCHEMA.md          # SQL schema documentation
├── PRD.md                      # Product Requirements Document
├── README.md                   # User-facing documentation
├── CLAUDE.md                   # This file - AI assistant guide
│
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.mjs          # PostCSS configuration
└── .gitignore                  # Git ignore rules
```

## Database Schema

### Tables

**1. settings** - Global configuration (singleton table)
- `time_horizon`: 'quarterly' (4 columns) or '3year' (6 columns)
- Label fields: `q1_label`, `q2_label`, `q3_label`, `q4_label`, `year2_label`, `year3_label`
- Only one row should exist in this table

**2. product_families** - Product catalog
- `name`: Product family name (unique)
- `sort_order`: Display order (integer)
- Deletion cascades to regional_submissions

**3. regional_submissions** - Financial data from regions
- `region`: 'china' | 'penang' | 'mexico'
- `product_family_id`: FK to product_families
- For each period (q1-q4, year2, year3): 4 fields
  - `{period}_customer_revenue`: Manual input
  - `{period}_derate_percent`: Manual input
  - `{period}_bom_cost`: Manual input
  - `{period}_nre_revenue`: Manual input
- UNIQUE constraint on (region, product_family_id)

### Key Relationships
- `regional_submissions.product_family_id` → `product_families.id` (ON DELETE CASCADE)
- One submission per region per product family

## Type System

### Core Types (lib/types.ts)

```typescript
type TimeHorizon = 'quarterly' | '3year'
type Region = 'china' | 'penang' | 'mexico'
type Period = 'q1' | 'q2' | 'q3' | 'q4' | 'year2' | 'year3'

interface Settings { /* See lib/types.ts:7 */ }
interface ProductFamily { /* See lib/types.ts:20 */ }
interface RegionalSubmission { /* See lib/types.ts:27 */ }
interface CalculatedRow { /* See lib/types.ts:73 */ }
interface ColumnConfig { /* See lib/types.ts:86 */ }
```

### Type Conventions
- Database types match Supabase schema exactly
- All database fields use snake_case
- TypeScript/React code uses camelCase
- Nullable fields are typed as `Type | null`, not optional (`Type?`)

## Financial Calculations

### Core Business Logic (lib/calculations.ts)

**1. Net Revenue Calculation**
```typescript
Net Revenue = Customer Revenue × (1 - Derate% / 100)
```
- Function: `calculateNetRevenue(customerRevenue, deratePercent)`
- Used in: Regional submission forms, Excel export

**2. BOM Percentage Calculation**
```typescript
BOM% = (BOM Cost / Net Revenue) × 100
```
- Function: `calculateBomPercent(bomCost, netRevenue)`
- Special case: Returns 0 if netRevenue === 0 (prevents division by zero)

**3. Group BOM% (Summary Tab Only)**
```typescript
Group BOM% = (Σ All BOM Costs / Σ All Net Revenues) × 100
```
- Calculated at aggregated level, NOT average of individual BOM%
- Used only in Excel export summary tab

### The "6-Row Stack" Pattern

For each Product Family in each Region, data is displayed in this exact order:
1. Customer Revenue (input)
2. Derate % (input)
3. Net Revenue (calculated)
4. BOM Cost (input)
5. BOM % (calculated)
6. NRE Revenue (input)

This pattern appears in:
- Regional submission forms (app/submit/[region]/page.tsx)
- Excel export regional tabs (app/api/export/route.ts)

## Code Patterns & Conventions

### Client vs Server Components

**Client Components** (have "use client" directive):
- `app/admin/page.tsx` - Needs state management and user interaction
- `app/submit/[region]/page.tsx` - Dynamic forms with state

**Server Components** (no directive):
- `app/layout.tsx` - Static layout
- `app/page.tsx` - Static home page
- `app/api/export/route.ts` - API route handler

### State Management Pattern

All forms use React useState with Map for efficient lookups:
```typescript
const [submissions, setSubmissions] = useState<Map<string, any>>(new Map());

// Get value
const value = submissions.get(productId)?.[field] || "";

// Set value (immutable update)
setSubmissions(new Map(submissions.set(productId, updated)));
```

### Supabase Query Pattern

**Standard CRUD operations**:
```typescript
// SELECT
const { data } = await supabase
  .from("table_name")
  .select("*")
  .single(); // or .order("field") for multiple

// INSERT
const { error } = await supabase
  .from("table_name")
  .insert({ field: value });

// UPDATE
const { error } = await supabase
  .from("table_name")
  .update({ field: value })
  .eq("id", id);

// DELETE
const { error } = await supabase
  .from("table_name")
  .delete()
  .eq("id", id);
```

**Error handling**: Check `error` object, but UI doesn't display detailed errors to users

### Dynamic Routing

**Region Parameter**:
- Route: `app/submit/[region]/page.tsx`
- Valid values: 'china', 'penang', 'mexico'
- Access via: `use(params)` in Next.js 15 (async params)
- Validation: Check against valid regions array

### Excel Export Architecture

**Location**: `app/api/export/route.ts`

**Process**:
1. Fetch all data (settings, products, submissions)
2. Create workbook with ExcelJS
3. Generate 4 tabs:
   - Tab 1: China (6-row stack per product)
   - Tab 2: Penang (6-row stack per product)
   - Tab 3: Mexico (6-row stack per product)
   - Tab 4: Summary (Global totals + Regional breakout)
4. Apply formatting (borders, bold headers, number formats)
5. Return as blob with proper headers

**Export Trigger**: `GET /api/export` or direct link/button

## Development Workflows

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Create .env.local with:
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 3. Set up database (run SQL from DATABASE_SCHEMA.md in Supabase)

# 4. Start development server
npm run dev
```

### Development Scripts

```bash
npm run dev     # Start dev server on localhost:3000
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

### Adding New Features

**When adding a new input field**:
1. Update database schema in Supabase
2. Update TypeScript types in `lib/types.ts`
3. Update form UI in `app/submit/[region]/page.tsx`
4. Update Excel export in `app/api/export/route.ts`
5. Test all three regions

**When adding a new calculation**:
1. Add function to `lib/calculations.ts`
2. Export and type it properly
3. Use in both UI and Excel export
4. Document the formula in comments

**When adding a new page**:
1. Create folder in `app/` directory
2. Add `page.tsx` (Server Component by default)
3. Add "use client" only if state/effects needed
4. Update navigation in `app/page.tsx` if needed

### Common Pitfalls to Avoid

❌ **Don't**: Use Pages Router patterns (`getServerSideProps`, `getStaticProps`)
✅ **Do**: Use App Router patterns (Server Components, async params)

❌ **Don't**: Import Supabase client in Server Components without proper handling
✅ **Do**: Use client in Client Components or API routes

❌ **Don't**: Average BOM% for summary calculations
✅ **Do**: Calculate Group BOM% from totals: Σ(BOM) / Σ(Net Revenue)

❌ **Don't**: Forget to update Excel export when changing data structure
✅ **Do**: Always update all 4 tabs when modifying data model

❌ **Don't**: Use relative imports like `../../lib/supabase`
✅ **Do**: Use path alias `@/lib/supabase` (configured in tsconfig)

❌ **Don't**: Modify database schema without updating TypeScript types
✅ **Do**: Keep types.ts in sync with database schema

### Testing Approach

**No automated tests currently** - Manual testing workflow:

1. **Admin Flow**:
   - Toggle time horizon (quarterly ↔ 3-year)
   - Update column labels
   - Add/delete product families
   - Export Excel file
   - Reset cycle (clears regional data)

2. **Regional PM Flow**:
   - Access each region portal
   - Enter data for all products
   - Verify calculated fields (Net Revenue, BOM%)
   - Submit when all required fields filled
   - Verify data persists on reload

3. **Excel Export Verification**:
   - Check all 4 tabs present
   - Verify regional tabs have 6-row stacks
   - Verify summary tab has global totals + regional breakout
   - Check number formatting and borders
   - Verify Group BOM% calculation

### Common Debugging Steps

**Database connection issues**:
1. Check `.env.local` exists and has correct values
2. Verify Supabase project is active
3. Check browser console for CORS errors
4. Verify RLS policies allow operations

**Calculation errors**:
1. Check for null/undefined values in inputs
2. Verify division by zero handling in BOM%
3. Console.log intermediate values
4. Check number parsing in forms (parseFloat)

**Excel export issues**:
1. Check if all data fetched correctly
2. Verify ExcelJS version compatibility
3. Test with minimal dataset first
4. Check browser compatibility for blob downloads

## File Modification Guidelines

### When to Modify Each File

**lib/types.ts** - Modify when:
- Adding new database tables
- Adding fields to existing tables
- Creating new interfaces for components
- Changing data structures

**lib/supabase.ts** - Rarely modify unless:
- Changing Supabase configuration
- Adding custom Supabase client options
- Implementing advanced features (realtime, auth)

**lib/calculations.ts** - Modify when:
- Adding new financial formulas
- Adding new formatting utilities
- Implementing data transformation helpers

**app/admin/page.tsx** - Modify when:
- Adding admin controls
- Changing settings configuration
- Adding product management features
- Implementing cycle management

**app/submit/[region]/page.tsx** - Modify when:
- Changing submission form layout
- Adding new input fields
- Modifying validation logic
- Adding region-specific features

**app/api/export/route.ts** - Modify when:
- Changing Excel format
- Adding new tabs
- Modifying calculations in summary
- Changing styling/formatting

**app/layout.tsx** - Rarely modify unless:
- Adding global providers
- Changing metadata
- Adding analytics
- Implementing global layouts

**Configuration files** - Modify when:
- Adding Tailwind plugins/themes (tailwind.config.ts)
- Adding Next.js features (next.config.ts)
- Changing TypeScript strictness (tsconfig.json)
- Adding new dependencies (package.json)

## Environment Variables

**Required Variables** (in `.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Finding Values**:
- Go to Supabase Dashboard
- Project Settings → API
- Copy "Project URL" and "anon/public" key

**Security Notes**:
- `NEXT_PUBLIC_*` variables are exposed to browser
- Anon key is safe to expose (protected by RLS)
- Never commit `.env.local` to git (already in .gitignore)

## Deployment

### Vercel Deployment

**Automatic Deployment**:
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy (automatic on every push)

**Manual Build**:
```bash
npm run build   # Creates .next/ folder
npm run start   # Serves production build
```

### Pre-Deployment Checklist

- [ ] All TypeScript errors resolved (`npm run build` succeeds)
- [ ] Environment variables configured in Vercel
- [ ] Database schema matches code types
- [ ] Excel export tested with real data
- [ ] All three regions tested
- [ ] Admin controls tested
- [ ] No console errors in production build

## Useful Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Run linter

# Database (in Supabase SQL Editor)
SELECT * FROM settings;
SELECT * FROM product_families ORDER BY sort_order;
SELECT * FROM regional_submissions WHERE region = 'china';

# Git (if making changes)
git status                     # Check changes
git add .                      # Stage changes
git commit -m "message"        # Commit
git push                       # Push to remote
```

## Architecture Decisions & Rationale

### Why Supabase?
- PostgreSQL reliability for financial data
- Real-time capabilities (future expansion)
- Built-in Row Level Security
- Easy Vercel integration

### Why Next.js 15 App Router?
- Server Components reduce client bundle
- Better SEO for landing pages
- Simplified routing with file-based structure
- API routes in same project

### Why ExcelJS?
- Client-side generation (no server processing)
- Full Excel formatting control
- Mature library with good TypeScript support
- Generates true .xlsx files

### Why No UI Component Library?
- Small project with custom needs
- Tailwind provides sufficient primitives
- Avoid dependency bloat
- Full control over styling

## Future Enhancements (Ideas for Extension)

**Potential Features**:
- User authentication (Supabase Auth)
- Email notifications for submissions
- Data validation rules (min/max values)
- Historical data tracking (multiple cycles)
- Charts/graphs in summary view
- CSV import for bulk data entry
- Approval workflows
- Comments/notes on submissions
- Audit logs for changes
- Multi-language support

**Technical Improvements**:
- Add automated tests (Jest, Playwright)
- Implement optimistic UI updates
- Add loading skeletons
- Improve error messaging
- Add data backup/restore
- Implement soft deletes
- Add database migrations system

## Getting Help

**For AI Assistants**:
- Always read existing code before suggesting changes
- Maintain consistency with established patterns
- Preserve the 6-row stack structure
- Test changes across all three regions
- Update types when changing database schema
- Reference this document for conventions

**Documentation References**:
- README.md - User guide and setup
- PRD.md - Product requirements
- DATABASE_SCHEMA.md - Database structure
- This file (CLAUDE.md) - Development guide

**External Documentation**:
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [ExcelJS Docs](https://github.com/exceljs/exceljs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Summary of Key Principles

1. **Database First**: All data operations go through Supabase
2. **Type Safety**: Maintain strict TypeScript typing
3. **6-Row Stack**: Preserve the calculation structure
4. **Regional Parity**: All three regions work identically
5. **Excel Fidelity**: Export must match database exactly
6. **Simple & Clean**: Avoid over-engineering
7. **Convention over Configuration**: Follow established patterns

---

**Last Updated**: 2026-01-24
**Codebase Version**: 0.1.0
**Maintained For**: Claude Code and other AI assistants
