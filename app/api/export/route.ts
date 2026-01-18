import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { supabase } from "@/lib/supabase";
import { calculateNetRevenue, calculateBomPercent } from "@/lib/calculations";
import type { Settings, ProductFamily, Region, Period } from "@/lib/types";

export async function GET() {
  try {
    // Load settings
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .single();

    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 500 });
    }

    // Load product families
    const { data: productFamilies } = await supabase
      .from("product_families")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!productFamilies || productFamilies.length === 0) {
      return NextResponse.json({ error: "No product families found" }, { status: 404 });
    }

    // Load all submissions
    const { data: allSubmissions } = await supabase
      .from("regional_submissions")
      .select("*");

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // Get active periods
    const activePeriods: Period[] = ["q1", "q2", "q3", "q4"];
    if (settings.time_horizon === "3year") {
      activePeriods.push("year2", "year3");
    }

    const periodLabels = activePeriods.map((period) => {
      const labelMap: Record<Period, string> = {
        q1: settings.q1_label,
        q2: settings.q2_label,
        q3: settings.q3_label,
        q4: settings.q4_label,
        year2: settings.year2_label || "Year 2",
        year3: settings.year3_label || "Year 3",
      };
      return labelMap[period];
    });

    // Create regional tabs
    const regions: Region[] = ["china", "penang", "mexico"];
    const regionData: Record<Region, any> = {
      china: {},
      penang: {},
      mexico: {},
    };

    for (const region of regions) {
      const worksheet = workbook.addWorksheet(
        region.charAt(0).toUpperCase() + region.slice(1)
      );

      // Create header row
      const headerRow = ["Product Family", "Metric", ...periodLabels];
      worksheet.addRow(headerRow);

      // Style header
      const headerRowObj = worksheet.getRow(1);
      headerRowObj.font = { bold: true, size: 12 };
      headerRowObj.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      headerRowObj.font = { bold: true, color: { argb: "FFFFFFFF" } };

      // Add data rows for each product family
      for (const product of productFamilies) {
        const submission = allSubmissions?.find(
          (s) => s.region === region && s.product_family_id === product.id
        );

        const metrics = [
          "Customer Revenue",
          "Derate %",
          "Net Revenue",
          "BOM Cost",
          "BOM %",
          "NRE Revenue",
        ];

        metrics.forEach((metric, metricIdx) => {
          const row: any[] = [
            metricIdx === 0 ? product.name : "",
            metric,
          ];

          activePeriods.forEach((period) => {
            let value: any = "";

            if (metric === "Customer Revenue") {
              value = submission?.[`${period}_customer_revenue`] || 0;
            } else if (metric === "Derate %") {
              value = submission?.[`${period}_derate_percent`] || 0;
            } else if (metric === "Net Revenue") {
              const revenue = submission?.[`${period}_customer_revenue`] || 0;
              const derate = submission?.[`${period}_derate_percent`] || 0;
              value = calculateNetRevenue(revenue, derate);
            } else if (metric === "BOM Cost") {
              value = submission?.[`${period}_bom_cost`] || 0;
            } else if (metric === "BOM %") {
              const bom = submission?.[`${period}_bom_cost`] || 0;
              const revenue = submission?.[`${period}_customer_revenue`] || 0;
              const derate = submission?.[`${period}_derate_percent`] || 0;
              const netRev = calculateNetRevenue(revenue, derate);
              value = calculateBomPercent(bom, netRev);
            } else if (metric === "NRE Revenue") {
              value = submission?.[`${period}_nre_revenue`] || 0;
            }

            row.push(value);
          });

          worksheet.addRow(row);
        });
      }

      // Auto-size columns
      worksheet.columns.forEach((column, idx) => {
        if (idx === 0) column.width = 25;
        else if (idx === 1) column.width = 20;
        else column.width = 15;
      });

      // Apply number formatting
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell, colNumber) => {
            if (colNumber > 2) {
              const metricIndex = ((rowNumber - 2) % 6);
              if (metricIndex === 1 || metricIndex === 4) {
                // Derate % and BOM %
                cell.numFmt = '0.00"%"';
              } else {
                // Currency
                cell.numFmt = '"$"#,##0.00';
              }
            }
          });
        }
      });

      // Store regional totals for summary
      regionData[region] = {
        productFamilies,
        submissions: allSubmissions?.filter((s) => s.region === region) || [],
      };
    }

    // Create Summary Tab
    const summarySheet = workbook.addWorksheet("Summary");

    summarySheet.addRow(["GLOBAL AGGREGATION"]);
    summarySheet.getRow(1).font = { bold: true, size: 14 };
    summarySheet.addRow([]);

    // Calculate global totals
    const headerRow = ["Metric", ...periodLabels];
    summarySheet.addRow(headerRow);
    summarySheet.getRow(3).font = { bold: true };
    summarySheet.getRow(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    summarySheet.getRow(3).font = { bold: true, color: { argb: "FFFFFFFF" } };

    const globalMetrics = [
      "Total Customer Revenue",
      "Total Net Revenue",
      "Total BOM Cost",
      "Total NRE Revenue",
      "Group BOM %",
    ];

    globalMetrics.forEach((metric) => {
      const row: any[] = [metric];

      activePeriods.forEach((period) => {
        let total = 0;

        if (metric === "Total Customer Revenue") {
          allSubmissions?.forEach((sub) => {
            total += sub[`${period}_customer_revenue`] || 0;
          });
        } else if (metric === "Total Net Revenue") {
          allSubmissions?.forEach((sub) => {
            const revenue = sub[`${period}_customer_revenue`] || 0;
            const derate = sub[`${period}_derate_percent`] || 0;
            total += calculateNetRevenue(revenue, derate);
          });
        } else if (metric === "Total BOM Cost") {
          allSubmissions?.forEach((sub) => {
            total += sub[`${period}_bom_cost`] || 0;
          });
        } else if (metric === "Total NRE Revenue") {
          allSubmissions?.forEach((sub) => {
            total += sub[`${period}_nre_revenue`] || 0;
          });
        } else if (metric === "Group BOM %") {
          let totalBom = 0;
          let totalNetRev = 0;

          allSubmissions?.forEach((sub) => {
            totalBom += sub[`${period}_bom_cost`] || 0;
            const revenue = sub[`${period}_customer_revenue`] || 0;
            const derate = sub[`${period}_derate_percent`] || 0;
            totalNetRev += calculateNetRevenue(revenue, derate);
          });

          total = calculateBomPercent(totalBom, totalNetRev);
        }

        row.push(total);
      });

      summarySheet.addRow(row);
    });

    // Add spacing
    summarySheet.addRow([]);
    summarySheet.addRow([]);

    // Add regional breakout
    summarySheet.addRow(["REGIONAL BREAKOUT"]);
    summarySheet.getRow(summarySheet.rowCount).font = { bold: true, size: 14 };
    summarySheet.addRow([]);

    for (const region of regions) {
      const regionName = region.charAt(0).toUpperCase() + region.slice(1);
      summarySheet.addRow([regionName]);
      summarySheet.getRow(summarySheet.rowCount).font = { bold: true, size: 12 };

      const regionHeader = ["Product Family", "Metric", ...periodLabels];
      summarySheet.addRow(regionHeader);
      summarySheet.getRow(summarySheet.rowCount).font = { bold: true };

      for (const product of productFamilies) {
        const submission = allSubmissions?.find(
          (s) => s.region === region && s.product_family_id === product.id
        );

        const metrics = [
          "Customer Revenue",
          "Net Revenue",
          "BOM Cost",
          "NRE Revenue",
        ];

        metrics.forEach((metric, metricIdx) => {
          const row: any[] = [
            metricIdx === 0 ? product.name : "",
            metric,
          ];

          activePeriods.forEach((period) => {
            let value: any = 0;

            if (metric === "Customer Revenue") {
              value = submission?.[`${period}_customer_revenue`] || 0;
            } else if (metric === "Net Revenue") {
              const revenue = submission?.[`${period}_customer_revenue`] || 0;
              const derate = submission?.[`${period}_derate_percent`] || 0;
              value = calculateNetRevenue(revenue, derate);
            } else if (metric === "BOM Cost") {
              value = submission?.[`${period}_bom_cost`] || 0;
            } else if (metric === "NRE Revenue") {
              value = submission?.[`${period}_nre_revenue`] || 0;
            }

            row.push(value);
          });

          summarySheet.addRow(row);
        });
      }

      summarySheet.addRow([]);
    }

    // Format summary sheet columns
    summarySheet.columns.forEach((column, idx) => {
      if (idx === 0) column.width = 25;
      else if (idx === 1) column.width = 20;
      else column.width = 15;
    });

    // Apply number formatting to summary
    summarySheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (colNumber > 2 && typeof cell.value === "number") {
          // Check if it's a percentage row
          const cellValue = row.getCell(1).value?.toString() || "";
          if (cellValue.includes("BOM %")) {
            cell.numFmt = '0.00"%"';
          } else {
            cell.numFmt = '"$"#,##0.00';
          }
        }
      });
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="forecast-master-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate export", details: error.message },
      { status: 500 }
    );
  }
}
