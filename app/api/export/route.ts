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

      // Filter products for this region only
      const regionProducts = productFamilies.filter(p => p.region === region);

      // Create header row with 4 Quarter Total
      const headerRow = ["Product Family", "Metric", ...periodLabels, "4 Quarter Total"];
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

      // Add data rows for each product family in this region
      for (const product of regionProducts) {
        const submission = allSubmissions?.find(
          (s) => s.region === region && s.product_family_id === product.id
        );

        const metrics = [
          "Customer Revenue",
          "Derate %",
          "Net Revenue",
          "VAM $",
          "VAM %",
          "NRE Revenue",
        ];

        metrics.forEach((metric, metricIdx) => {
          const row: any[] = [
            metricIdx === 0 ? product.name : "",
            metric,
          ];

          let quarterTotal = 0;
          const firstFourPeriods = activePeriods.slice(0, 4); // Q1-Q4 only

          firstFourPeriods.forEach((period) => {
            let value: any = "";

            if (metric === "Customer Revenue") {
              value = submission?.[`${period}_customer_revenue`] || 0;
              quarterTotal += value;
            } else if (metric === "Derate %") {
              value = submission?.[`${period}_derate_percent`] || 0;
              // Don't sum percentages
            } else if (metric === "Net Revenue") {
              const revenue = submission?.[`${period}_customer_revenue`] || 0;
              const derate = submission?.[`${period}_derate_percent`] || 0;
              value = calculateNetRevenue(revenue, derate);
              quarterTotal += value;
            } else if (metric === "VAM $") {
              value = submission?.[`${period}_bom_cost`] || 0;
              quarterTotal += value;
            } else if (metric === "VAM %") {
              const vamDollar = submission?.[`${period}_bom_cost`] || 0;
              const revenue = submission?.[`${period}_customer_revenue`] || 0;
              const derate = submission?.[`${period}_derate_percent`] || 0;
              const netRev = calculateNetRevenue(revenue, derate);
              value = netRev > 0 ? (vamDollar / netRev) * 100 : 0;
              // Don't sum percentages
            } else if (metric === "NRE Revenue") {
              value = submission?.[`${period}_nre_revenue`] || 0;
              quarterTotal += value;
            }

            row.push(value);
          });

          // Add Year 2 and Year 3 if applicable (but don't include in 4 Quarter Total)
          if (settings.time_horizon === "3year") {
            ["year2", "year3"].forEach((period) => {
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
              } else if (metric === "VAM %") {
                const bom = submission?.[`${period}_bom_cost`] || 0;
                const revenue = submission?.[`${period}_customer_revenue`] || 0;
                const derate = submission?.[`${period}_derate_percent`] || 0;
                const netRev = calculateNetRevenue(revenue, derate);
                const vam = netRev - bom;
                value = netRev > 0 ? (vam / netRev) * 100 : 0;
              } else if (metric === "NRE Revenue") {
                value = submission?.[`${period}_nre_revenue`] || 0;
              }

              row.push(value);
            });
          }

          // Add 4 Quarter Total
          if (metric === "Derate %") {
            row.push(""); // Don't total derate percentage
          } else if (metric === "VAM %") {
            // Calculate VAM% for 4 quarter total
            let totalVamDollar = 0;
            let totalNetRevenue = 0;

            firstFourPeriods.forEach((period) => {
              totalVamDollar += submission?.[`${period}_bom_cost`] || 0;
              const revenue = submission?.[`${period}_customer_revenue`] || 0;
              const derate = submission?.[`${period}_derate_percent`] || 0;
              totalNetRevenue += calculateNetRevenue(revenue, derate);
            });

            const vamPctTotal = totalNetRevenue > 0 ? (totalVamDollar / totalNetRevenue) * 100 : 0;
            row.push(vamPctTotal);
          } else {
            row.push(quarterTotal);
          }

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
                // Derate % and VAM %
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

    // Section 1: Global Aggregation (All Sites Combined)
    summarySheet.addRow(["GLOBAL AGGREGATION"]);
    summarySheet.getRow(1).font = { bold: true, size: 14 };
    summarySheet.addRow([]);

    const globalHeaderRow = ["Metric", ...periodLabels, "4 Quarter Total"];
    summarySheet.addRow(globalHeaderRow);
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
      "Total VAM $",
      "Total NRE Revenue",
      "Group VAM %",
    ];

    globalMetrics.forEach((metric) => {
      const row: any[] = [metric];

      let quarterTotal = 0;
      const firstFourPeriods = activePeriods.slice(0, 4);

      firstFourPeriods.forEach((period) => {
        let total = 0;

        if (metric === "Total Customer Revenue") {
          allSubmissions?.forEach((sub) => {
            total += sub[`${period}_customer_revenue`] || 0;
          });
          quarterTotal += total;
        } else if (metric === "Total Net Revenue") {
          allSubmissions?.forEach((sub) => {
            const revenue = sub[`${period}_customer_revenue`] || 0;
            const derate = sub[`${period}_derate_percent`] || 0;
            total += calculateNetRevenue(revenue, derate);
          });
          quarterTotal += total;
        } else if (metric === "Total VAM $") {
          allSubmissions?.forEach((sub) => {
            total += sub[`${period}_bom_cost`] || 0;
          });
          quarterTotal += total;
        } else if (metric === "Total NRE Revenue") {
          allSubmissions?.forEach((sub) => {
            total += sub[`${period}_nre_revenue`] || 0;
          });
          quarterTotal += total;
        } else if (metric === "Group VAM %") {
          let totalVamDollar = 0;
          let totalNetRev = 0;

          allSubmissions?.forEach((sub) => {
            totalVamDollar += sub[`${period}_bom_cost`] || 0;
            const revenue = sub[`${period}_customer_revenue`] || 0;
            const derate = sub[`${period}_derate_percent`] || 0;
            totalNetRev += calculateNetRevenue(revenue, derate);
          });

          total = totalNetRev > 0 ? (totalVamDollar / totalNetRev) * 100 : 0;
        }

        row.push(total);
      });

      // Add Year 2 and Year 3 if applicable
      if (settings.time_horizon === "3year") {
        ["year2", "year3"].forEach((period) => {
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
          } else if (metric === "Total VAM $") {
            allSubmissions?.forEach((sub) => {
              total += sub[`${period}_bom_cost`] || 0;
            });
          } else if (metric === "Total NRE Revenue") {
            allSubmissions?.forEach((sub) => {
              total += sub[`${period}_nre_revenue`] || 0;
            });
          } else if (metric === "Group VAM %") {
            let totalVamDollar = 0;
            let totalNetRev = 0;

            allSubmissions?.forEach((sub) => {
              totalVamDollar += sub[`${period}_bom_cost`] || 0;
              const revenue = sub[`${period}_customer_revenue`] || 0;
              const derate = sub[`${period}_derate_percent`] || 0;
              totalNetRev += calculateNetRevenue(revenue, derate);
            });

            total = totalNetRev > 0 ? (totalVamDollar / totalNetRev) * 100 : 0;
          }

          row.push(total);
        });
      }

      // Add 4 Quarter Total
      if (metric === "Group VAM %") {
        row.push(""); // Don't total percentages
      } else {
        row.push(quarterTotal);
      }

      summarySheet.addRow(row);
    });

    // Add spacing
    summarySheet.addRow([]);
    summarySheet.addRow([]);

    // Section 2: Regional Breakout (Totals by Region)
    summarySheet.addRow(["REGIONAL BREAKOUT"]);
    summarySheet.getRow(summarySheet.rowCount).font = { bold: true, size: 14 };
    summarySheet.addRow([]);

    for (const region of regions) {
      const regionName = region.charAt(0).toUpperCase() + region.slice(1);
      
      // Region header
      summarySheet.addRow([regionName]);
      summarySheet.getRow(summarySheet.rowCount).font = { bold: true, size: 12 };

      // Region metrics header
      const regionHeader = ["Metric", ...periodLabels, "4 Quarter Total"];
      summarySheet.addRow(regionHeader);
      summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
      summarySheet.getRow(summarySheet.rowCount).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9E1F2" },
      };

      // Get all submissions for this region
      const regionSubmissions = allSubmissions?.filter((s) => s.region === region) || [];

      // Calculate region totals (not per product, just totals)
      const regionMetrics = [
        "Total Customer Revenue",
        "Total Net Revenue",
        "Total VAM $",
        "Total NRE Revenue",
        "Group VAM %",
      ];

      regionMetrics.forEach((metric) => {
        const row: any[] = [metric];

        let quarterTotal = 0;
        const firstFourPeriods = activePeriods.slice(0, 4);

        firstFourPeriods.forEach((period) => {
          let total = 0;

          if (metric === "Total Customer Revenue") {
            regionSubmissions.forEach((sub) => {
              total += sub[`${period}_customer_revenue`] || 0;
            });
            quarterTotal += total;
          } else if (metric === "Total Net Revenue") {
            regionSubmissions.forEach((sub) => {
              const revenue = sub[`${period}_customer_revenue`] || 0;
              const derate = sub[`${period}_derate_percent`] || 0;
              total += calculateNetRevenue(revenue, derate);
            });
            quarterTotal += total;
          } else if (metric === "Total VAM $") {
            regionSubmissions.forEach((sub) => {
              total += sub[`${period}_bom_cost`] || 0;
            });
            quarterTotal += total;
          } else if (metric === "Total NRE Revenue") {
            regionSubmissions.forEach((sub) => {
              total += sub[`${period}_nre_revenue`] || 0;
            });
            quarterTotal += total;
          } else if (metric === "Group VAM %") {
            let totalVamDollar = 0;
            let totalNetRev = 0;

            regionSubmissions.forEach((sub) => {
              totalVamDollar += sub[`${period}_bom_cost`] || 0;
              const revenue = sub[`${period}_customer_revenue`] || 0;
              const derate = sub[`${period}_derate_percent`] || 0;
              totalNetRev += calculateNetRevenue(revenue, derate);
            });

            total = totalNetRev > 0 ? (totalVamDollar / totalNetRev) * 100 : 0;
          }

          row.push(total);
        });

        // Add Year 2 and Year 3 if applicable
        if (settings.time_horizon === "3year") {
          ["year2", "year3"].forEach((period) => {
            let total = 0;

            if (metric === "Total Customer Revenue") {
              regionSubmissions.forEach((sub) => {
                total += sub[`${period}_customer_revenue`] || 0;
              });
            } else if (metric === "Total Net Revenue") {
              regionSubmissions.forEach((sub) => {
                const revenue = sub[`${period}_customer_revenue`] || 0;
                const derate = sub[`${period}_derate_percent`] || 0;
                total += calculateNetRevenue(revenue, derate);
              });
            } else if (metric === "Total VAM $") {
              regionSubmissions.forEach((sub) => {
                total += sub[`${period}_bom_cost`] || 0;
              });
            } else if (metric === "Total NRE Revenue") {
              regionSubmissions.forEach((sub) => {
                total += sub[`${period}_nre_revenue`] || 0;
              });
            } else if (metric === "Group VAM %") {
              let totalVamDollar = 0;
              let totalNetRev = 0;

              regionSubmissions.forEach((sub) => {
                totalVamDollar += sub[`${period}_bom_cost`] || 0;
                const revenue = sub[`${period}_customer_revenue`] || 0;
                const derate = sub[`${period}_derate_percent`] || 0;
                totalNetRev += calculateNetRevenue(revenue, derate);
              });

              total = totalNetRev > 0 ? (totalVamDollar / totalNetRev) * 100 : 0;
            }

            row.push(total);
          });
        }

        // Add 4 Quarter Total
        if (metric === "Group VAM %") {
          row.push(""); // Don't total percentages
        } else {
          row.push(quarterTotal);
        }

        summarySheet.addRow(row);
      });

      // Add spacing between regions
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
        if (colNumber > 1 && typeof cell.value === "number") {
          // Check if it's a percentage row
          const cellValue = row.getCell(1).value?.toString() || "";
          if (cellValue.includes("VAM %")) {
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
