# Forecast Platform - Product Requirements Document

## 1. Project Overview
A web-based forecasting platform designed for a Lead PM to collect, calculate, and consolidate financial data from regional PMs in China, Penang, and Mexico. The system replaces manual Excel management with a "Database-First" approach, ensuring data integrity and professional reporting.

## 2. Technical Stack
- **Framework**: Next.js (App Router)
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Excel Engine**: exceljs
- **UI Components**: Tailwind CSS + Shadcn UI

## 3. Functional Requirements

### A. Admin Settings (The "Control Center")
- **Flexible Time Horizon**: Toggle between "Quarterly Only" (4 columns) or "3-Year Plan" (4 quarters + 2 full years).
- **Dynamic Labels**: Input fields to name each column (e.g., "Q1 26", "Q2 26", "Year 2", "Year 3").
- **Product Catalog**: Add/Edit/Delete Product Family names that appear in PM dropdowns.
- **Cycle Management**: A "Reset" button to clear regional data for the next cycle.

### B. Regional Submission Portals (China, Penang, Mexico)
- **Unique Access**: 3 specific URLs (e.g., `/submit/china`) that allow regional PMs to enter data.
- **Dynamic Entry Table**:
  - **Rows**: Defined by the Admin's Product Family list.
  - **Columns**: 4 or 6 columns based on the Admin's selected horizon.
  - **The "Calculated Row" Stack**: For every Product Family, the PM sees:
    1. **Customer Revenue** (Manual Input)
    2. **Derate %** (Manual Input)
    3. **Net Revenue** (Auto-calc: $Revenue \times (1 - Derate)$)
    4. **BOM Cost** (Manual Input)
    5. **BOM %** (Auto-calc: $BOM / Net Revenue$)
    6. **NRE Revenue** (Manual Input)
- **Validation**: Submit is only enabled when all inputs for all active columns are filled.

### C. The Excel Master Export (4-Tab System)
- **Tabs 1-3 (Regional)**: Contains the full 6-row stack for every Product Family for that specific region.
- **Tab 4 (Summary)**:
  - **Top Section (Global Aggregation)**:
    - **Summations**: Total Customer Revenue, Net Revenue, BOM, and NRE for the entire group.
    - **Calculations**: The "Group BOM %" is recalculated at the total level ($\sum Total BOM / \sum Total Net Revenue$).
  - **Bottom Section (Regional Breakout)**: A copy of the China, Penang, and Mexico tables stacked vertically for quick comparison.

## 4. Definition of Done (For Claude Code)
- **Environment**: Set up Next.js with Supabase schemas for settings, products, and submissions.
- **Logic**: Implement the 6-row financial calculation engine in both the UI and the Excel export.
- **Flexibility**: Ensure the UI and Excel file adapt automatically when "Year 2" and "Year 3" columns are enabled.
- **UI**: Create a clean, table-based interface with sticky headers for easy data entry.
- **Export**: Create a "Download Master Forecast" button that generates a multi-tab .xlsx file using exceljs.
