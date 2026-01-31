# Forecast Platform

A web-based forecasting platform for collecting, calculating, and consolidating financial data from regional PMs in China, Penang, and Mexico.

## Features

- **Admin Control Center**: Configure time horizons, manage product families, and export data
- **Regional Submission Portals**: Dedicated entry points for each region
- **Dynamic Calculations**: Automatic Net Revenue and BOM% calculations
- **Excel Export**: Generate comprehensive 4-tab Excel reports

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

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open `DATABASE_SCHEMA.md` in this project
4. Copy and run all SQL commands to create tables

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
3. **Configure Labels**: Customize column labels for each period
4. **Manage Products**: Add or remove product families
5. **Export Data**: Download consolidated Excel report
6. **Reset Cycle**: Clear all regional data to start a new forecasting cycle

### For Regional PMs

1. **Access Your Portal**:
   - China: `/submit/china`
   - Penang: `/submit/penang`
   - Mexico: `/submit/mexico`

2. **Enter Data**: Fill in all fields for each product family:
   - Customer Revenue (manual input)
   - Derate % (manual input)
   - Net Revenue (auto-calculated)
   - BOM Cost (manual input)
   - BOM % (auto-calculated)
   - NRE Revenue (manual input)

3. **Submit**: Button enables only when all fields are complete

## Excel Export Structure

The export generates a `.xlsx` file with 4 tabs:

1. **China Tab**: Full 6-row data stack for all products
2. **Penang Tab**: Full 6-row data stack for all products
3. **Mexico Tab**: Full 6-row data stack for all products
4. **Summary Tab**:
   - Global aggregated totals and Group BOM%
   - Regional breakout (all regions stacked for comparison)

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
│   ├── types.ts            # TypeScript type definitions
│   └── calculations.ts     # Financial calculation utilities
├── DATABASE_SCHEMA.md      # SQL schema for Supabase
└── PRD.md                  # Product requirements document
```

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
