# Forecast Platform

A web-based forecasting platform for collecting, calculating, and consolidating financial data from regional PMs in China, Penang, and Mexico.

## Features

- **Admin Control Center**: Configure time horizons, manage product families by region, and export data
- **Regional Submission Portals**: Dedicated entry points for each region (China, Penang, Mexico)
- **Region-Specific Product Families**: Each region maintains its own unique product catalog
- **Customizable Period Labels**: Set custom labels for each time period (e.g., Q127, Q227, FY27)
- **Dynamic Calculations**: Automatic Net Revenue and BOM% calculations
- **Excel Export**: Generate comprehensive 4-tab Excel reports
- **Auto-Save**: All admin settings save automatically

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Excel Export**: ExcelJS
- **Styling**: Tailwind CSS
- **Hosting**: Vercel-ready

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Database

1. Go to your Supabase project dashboard (https://supabase.com/dashboard)
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy and paste this SQL to create all tables:

```sql
-- 1. Create Settings Table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_horizon TEXT NOT NULL CHECK (time_horizon IN ('quarterly', '3year')),
  q1_label TEXT NOT NULL DEFAULT 'Period 1',
  q2_label TEXT NOT NULL DEFAULT 'Period 2',
  q3_label TEXT NOT NULL DEFAULT 'Period 3',
  q4_label TEXT NOT NULL DEFAULT 'Period 4',
  year2_label TEXT DEFAULT 'Year 2',
  year3_label TEXT DEFAULT 'Year 3',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (time_horizon, q1_label, q2_label, q3_label, q4_label) 
VALUES ('quarterly', '', '', '', '');

-- 2. Create Product Families Table (Region-Specific)
CREATE TABLE product_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL CHECK (region IN ('china', 'penang', 'mexico')),
  name TEXT NOT NULL,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(region, name)
);

CREATE INDEX idx_product_families_sort ON product_families(sort_order);
CREATE INDEX idx_product_families_region ON product_families(region);

-- 3. Create Regional Submissions Table
CREATE TABLE regional_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL CHECK (region IN ('china', 'penang', 'mexico')),
  product_family_id UUID NOT NULL REFERENCES product_families(id) ON DELETE CASCADE,
  
  q1_customer_revenue NUMERIC(15,2),
  q1_derate_percent NUMERIC(5,2),
  q1_bom_cost NUMERIC(15,2),
  q1_nre_revenue NUMERIC(15,2),
  
  q2_customer_revenue NUMERIC(15,2),
  q2_derate_percent NUMERIC(5,2),
  q2_bom_cost NUMERIC(15,2),
  q2_nre_revenue NUMERIC(15,2),
  
  q3_customer_revenue NUMERIC(15,2),
  q3_derate_percent NUMERIC(5,2),
  q3_bom_cost NUMERIC(15,2),
  q3_nre_revenue NUMERIC(15,2),
  
  q4_customer_revenue NUMERIC(15,2),
  q4_derate_percent NUMERIC(5,2),
  q4_bom_cost NUMERIC(15,2),
  q4_nre_revenue NUMERIC(15,2),
  
  year2_customer_revenue NUMERIC(15,2),
  year2_derate_percent NUMERIC(5,2),
  year2_bom_cost NUMERIC(15,2),
  year2_nre_revenue NUMERIC(15,2),
  
  year3_customer_revenue NUMERIC(15,2),
  year3_derate_percent NUMERIC(5,2),
  year3_bom_cost NUMERIC(15,2),
  year3_nre_revenue NUMERIC(15,2),
  
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(region, product_family_id)
);

CREATE INDEX idx_regional_submissions_region ON regional_submissions(region);
CREATE INDEX idx_regional_submissions_product ON regional_submissions(product_family_id);

-- 4. Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true);
CREATE POLICY "Allow all on product_families" ON product_families FOR ALL USING (true);
CREATE POLICY "Allow all on regional_submissions" ON regional_submissions FOR ALL USING (true);
```

5. Click "Run" to execute the SQL

**Note**: See `DATABASE_SCHEMA.md` for detailed schema documentation.

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these values in your Supabase project:
- Project Settings → API → Project URL
- Project Settings → API → anon/public key

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### For Administrators

1. **Access Admin Center**: Navigate to `/admin`
2. **Set Time Horizon**: Choose between "Quarterly Only" (4 columns) or "3-Year Plan" (6 columns)
3. **Configure Period Labels**: Set custom labels for each period (e.g., Q127, Q227, Q327, FY27)
   - Labels start blank - enter your own titles
   - Changes save automatically as you type
4. **Manage Product Families by Region**: 
   - Click tabs for China, Penang, or Mexico
   - Add unique product families for each region
   - Each region has its own independent product catalog
5. **Export Data**: Download consolidated Excel report with all regional data
6. **Reset Cycle**: Clear all regional submissions to start a new forecasting cycle

### For Regional PMs

1. **Access Your Portal**:
   - China: `/submit/china`
   - Penang: `/submit/penang`
   - Mexico: `/submit/mexico`
   - Each region only sees their own product families

2. **Enter Data**: Fill in all fields for each product family:
   - Customer Revenue (manual input)
   - Derate % (manual input)
   - Net Revenue (auto-calculated: Revenue × (1 - Derate%/100))
   - BOM Cost (manual input)
   - BOM % (auto-calculated: (BOM Cost / Net Revenue) × 100)
   - NRE Revenue (manual input)

3. **Submit**: Button enables only when all fields are complete
   - Data saves to database immediately
   - Can update and resubmit anytime

## Excel Export Structure

The export generates a `.xlsx` file with 4 tabs:

1. **China Tab**: Full 6-row data stack for all China product families
2. **Penang Tab**: Full 6-row data stack for all Penang product families
3. **Mexico Tab**: Full 6-row data stack for all Mexico product families
4. **Summary Tab**:
   - Global aggregated totals and Group BOM%
   - Regional breakout (all regions stacked for comparison)

**Note**: Each region can have different product families in their respective tabs.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
forecast-platform/
├── app/
│   ├── admin/              # Admin control center
│   ├── submit/[region]/    # Dynamic regional portals
│   ├── api/export/         # Excel export endpoint
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── types.ts            # TypeScript type definitions (with Region support)
│   └── calculations.ts     # Financial calculation utilities
├── DATABASE_SCHEMA.md      # SQL schema for Supabase
├── PRD.md                  # Product requirements document
└── SETUP_COMPLETE.md       # Setup summary and current status
```

## Key Implementation Details

### Region-Specific Product Families

Product families are now region-specific:
- Each region (China, Penang, Mexico) has its own product catalog
- Admin manages products via tabs in the admin interface
- Regional portals automatically filter to show only their products
- Database enforces uniqueness per region: `UNIQUE(region, name)`

### Customizable Period Labels

Period labels are fully customizable:
- Start blank by default
- Admin can enter any text (Q127, Q227, FY27, etc.)
- Labels appear in regional portals and Excel exports
- Auto-save on change

### Auto-Save Functionality

All admin changes save automatically:
- Time horizon selection
- Period label edits (saves as you type)
- Product family additions/deletions

No "Save" button needed!

## Calculations

### Net Revenue
```
Net Revenue = Customer Revenue × (1 - Derate% / 100)
```

### BOM Percentage
```
BOM% = (BOM Cost / Net Revenue) × 100
```

### Group BOM% (Summary Tab)
```
Group BOM% = (Sum of All BOM Costs / Sum of All Net Revenues) × 100
```

## Support

For issues or questions, refer to `PRD.md` for detailed specifications.

## License

Private project - All rights reserved
