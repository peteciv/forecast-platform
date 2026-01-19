# Database Schema for Supabase

Run these SQL commands in your Supabase SQL Editor to set up the database.

## 1. Settings Table
Stores global configuration for time horizons and column labels.

```sql
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

-- Insert default settings
INSERT INTO settings (time_horizon) VALUES ('quarterly');
```

## 2. Product Families Table
Stores the list of product families per region.

```sql
CREATE TABLE product_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL CHECK (region IN ('china', 'penang', 'mexico')),
  name TEXT NOT NULL,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(region, name)
);

-- Create indexes
CREATE INDEX idx_product_families_sort ON product_families(sort_order);
CREATE INDEX idx_product_families_region ON product_families(region);
```

## 3. Regional Submissions Table
Stores the financial data submitted by each region.

```sql
CREATE TABLE regional_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL CHECK (region IN ('china', 'penang', 'mexico')),
  product_family_id UUID NOT NULL REFERENCES product_families(id) ON DELETE CASCADE,
  
  -- Q1 Data
  q1_customer_revenue NUMERIC(15,2),
  q1_derate_percent NUMERIC(5,2),
  q1_bom_cost NUMERIC(15,2),
  q1_nre_revenue NUMERIC(15,2),
  
  -- Q2 Data
  q2_customer_revenue NUMERIC(15,2),
  q2_derate_percent NUMERIC(5,2),
  q2_bom_cost NUMERIC(15,2),
  q2_nre_revenue NUMERIC(15,2),
  
  -- Q3 Data
  q3_customer_revenue NUMERIC(15,2),
  q3_derate_percent NUMERIC(5,2),
  q3_bom_cost NUMERIC(15,2),
  q3_nre_revenue NUMERIC(15,2),
  
  -- Q4 Data
  q4_customer_revenue NUMERIC(15,2),
  q4_derate_percent NUMERIC(5,2),
  q4_bom_cost NUMERIC(15,2),
  q4_nre_revenue NUMERIC(15,2),
  
  -- Year 2 Data (optional)
  year2_customer_revenue NUMERIC(15,2),
  year2_derate_percent NUMERIC(5,2),
  year2_bom_cost NUMERIC(15,2),
  year2_nre_revenue NUMERIC(15,2),
  
  -- Year 3 Data (optional)
  year3_customer_revenue NUMERIC(15,2),
  year3_derate_percent NUMERIC(5,2),
  year3_bom_cost NUMERIC(15,2),
  year3_nre_revenue NUMERIC(15,2),
  
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one submission per region per product
  UNIQUE(region, product_family_id)
);

-- Create indexes
CREATE INDEX idx_regional_submissions_region ON regional_submissions(region);
CREATE INDEX idx_regional_submissions_product ON regional_submissions(product_family_id);
```

## 4. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_submissions ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can restrict later with authentication)
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true);
CREATE POLICY "Allow all on product_families" ON product_families FOR ALL USING (true);
CREATE POLICY "Allow all on regional_submissions" ON regional_submissions FOR ALL USING (true);
```

## Setup Instructions

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste all the SQL commands above
5. Click "Run" to execute

This will create all the necessary tables for your forecast platform!
