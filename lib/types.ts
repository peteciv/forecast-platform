// Type definitions for the forecast platform

export type TimeHorizon = 'quarterly' | '3year';

export type Region = 'china' | 'penang' | 'mexico';

export interface Settings {
  id: string;
  time_horizon: TimeHorizon;
  q1_label: string;
  q2_label: string;
  q3_label: string;
  q4_label: string;
  year2_label: string | null;
  year3_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFamily {
  id: string;
  name: string;
  sort_order: number | null;
  created_at: string;
}

export interface RegionalSubmission {
  id: string;
  region: Region;
  product_family_id: string;
  
  // Q1
  q1_customer_revenue: number | null;
  q1_derate_percent: number | null;
  q1_bom_cost: number | null;
  q1_nre_revenue: number | null;
  
  // Q2
  q2_customer_revenue: number | null;
  q2_derate_percent: number | null;
  q2_bom_cost: number | null;
  q2_nre_revenue: number | null;
  
  // Q3
  q3_customer_revenue: number | null;
  q3_derate_percent: number | null;
  q3_bom_cost: number | null;
  q3_nre_revenue: number | null;
  
  // Q4
  q4_customer_revenue: number | null;
  q4_derate_percent: number | null;
  q4_bom_cost: number | null;
  q4_nre_revenue: number | null;
  
  // Year 2 (optional)
  year2_customer_revenue: number | null;
  year2_derate_percent: number | null;
  year2_bom_cost: number | null;
  year2_nre_revenue: number | null;
  
  // Year 3 (optional)
  year3_customer_revenue: number | null;
  year3_derate_percent: number | null;
  year3_bom_cost: number | null;
  year3_nre_revenue: number | null;
  
  submitted_at: string | null;
  updated_at: string;
}

// Calculated values for display
export interface CalculatedRow {
  productFamily: string;
  customerRevenue: number;
  deratePercent: number;
  netRevenue: number; // customerRevenue * (1 - deratePercent/100)
  bomCost: number;
  bomPercent: number; // (bomCost / netRevenue) * 100
  nreRevenue: number;
}

// Period type for dynamic columns
export type Period = 'q1' | 'q2' | 'q3' | 'q4' | 'year2' | 'year3';

export interface ColumnConfig {
  period: Period;
  label: string;
  enabled: boolean;
}
