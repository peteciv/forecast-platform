"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import type { Settings, ProductFamily, RegionalSubmission, Region, Period } from "@/lib/types";
import { calculateNetRevenue, calculateBomPercent, formatCurrency, formatPercent } from "@/lib/calculations";
import Link from "next/link";

export default function RegionalSubmitPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = use(params);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [productFamilies, setProductFamilies] = useState<ProductFamily[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const regionName = region.charAt(0).toUpperCase() + region.slice(1);
  const validRegion = ["china", "penang", "mexico"].includes(region);

  useEffect(() => {
    if (validRegion) {
      loadData();
    }
  }, [region, validRegion]);

  async function loadData() {
    setLoading(true);

    // Load settings
    const { data: settingsData } = await supabase
      .from("settings")
      .select("*")
      .single();

    if (settingsData) {
      setSettings(settingsData);
    }

    // Load product families
    const { data: productsData } = await supabase
      .from("product_families")
      .select("*")
      .order("sort_order", { ascending: true });

    if (productsData) {
      setProductFamilies(productsData);

      // Load existing submissions for this region
      const { data: submissionsData } = await supabase
        .from("regional_submissions")
        .select("*")
        .eq("region", region);

      const submissionsMap = new Map();
      submissionsData?.forEach((sub) => {
        submissionsMap.set(sub.product_family_id, sub);
      });
      setSubmissions(submissionsMap);
    }

    setLoading(false);
  }

  function getValue(productId: string, field: string): string {
    const submission = submissions.get(productId);
    return submission?.[field]?.toString() || "";
  }

  function setValue(productId: string, field: string, value: string) {
    const current = submissions.get(productId) || { product_family_id: productId, region };
    const updated = { ...current, [field]: value === "" ? null : parseFloat(value) };
    setSubmissions(new Map(submissions.set(productId, updated)));
  }

  function getActivePeriods(): Period[] {
    const periods: Period[] = ["q1", "q2", "q3", "q4"];
    if (settings?.time_horizon === "3year") {
      periods.push("year2", "year3");
    }
    return periods;
  }

  function getPeriodLabel(period: Period): string {
    if (!settings) return period;
    const labelMap: Record<Period, string> = {
      q1: settings.q1_label,
      q2: settings.q2_label,
      q3: settings.q3_label,
      q4: settings.q4_label,
      year2: settings.year2_label || "Year 2",
      year3: settings.year3_label || "Year 3",
    };
    return labelMap[period];
  }

  function isFormComplete(): boolean {
    if (productFamilies.length === 0) return false;

    const activePeriods = getActivePeriods();
    
    for (const product of productFamilies) {
      for (const period of activePeriods) {
        const fields = [
          `${period}_customer_revenue`,
          `${period}_derate_percent`,
          `${period}_bom_cost`,
          `${period}_nre_revenue`,
        ];

        for (const field of fields) {
          const value = getValue(product.id, field);
          if (value === "" || value === null) {
            return false;
          }
        }
      }
    }

    return true;
  }

  async function handleSubmit() {
    if (!isFormComplete()) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    setSaving(true);

    // Prepare data for upsert
    const dataToSave = Array.from(submissions.values()).map((sub) => ({
      ...sub,
      region,
      submitted_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("regional_submissions")
      .upsert(dataToSave, {
        onConflict: "region,product_family_id",
      });

    setSaving(false);

    if (error) {
      alert("Error saving data: " + error.message);
    } else {
      alert("Data submitted successfully!");
      loadData();
    }
  }

  if (!validRegion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Region</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const activePeriods = getActivePeriods();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{regionName} Portal</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ← Back to Home
          </Link>
        </div>

        {productFamilies.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">
              No product families have been configured yet. Please contact your administrator.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto mb-6">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold border-r">Product Family</th>
                    <th className="px-4 py-3 text-left font-semibold border-r">Metric</th>
                    {activePeriods.map((period) => (
                      <th key={period} className="px-4 py-3 text-center font-semibold border-r min-w-[150px]">
                        {getPeriodLabel(period)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productFamilies.map((product, idx) => {
                    const rows = [
                      { label: "Customer Revenue", field: "customer_revenue", type: "input" },
                      { label: "Derate %", field: "derate_percent", type: "input" },
                      { label: "Net Revenue", field: "net_revenue", type: "calculated" },
                      { label: "BOM Cost", field: "bom_cost", type: "input" },
                      { label: "BOM %", field: "bom_percent", type: "calculated" },
                      { label: "NRE Revenue", field: "nre_revenue", type: "input" },
                    ];

                    return rows.map((row, rowIdx) => (
                      <tr
                        key={`${product.id}-${row.field}`}
                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} ${
                          rowIdx === rows.length - 1 ? "border-b-2 border-gray-300" : ""
                        }`}
                      >
                        {rowIdx === 0 && (
                          <td
                            rowSpan={rows.length}
                            className="px-4 py-2 font-medium border-r align-top pt-4"
                          >
                            {product.name}
                          </td>
                        )}
                        <td className={`px-4 py-2 text-sm border-r ${row.type === "calculated" ? "bg-blue-50 font-medium" : ""}`}>
                          {row.label}
                        </td>
                        {activePeriods.map((period) => {
                          const fieldName = `${period}_${row.field}`;

                          if (row.type === "calculated") {
                            let calculatedValue = "";
                            
                            if (row.field === "net_revenue") {
                              const revenue = parseFloat(getValue(product.id, `${period}_customer_revenue`)) || 0;
                              const derate = parseFloat(getValue(product.id, `${period}_derate_percent`)) || 0;
                              const netRev = calculateNetRevenue(revenue, derate);
                              calculatedValue = netRev > 0 ? formatCurrency(netRev) : "";
                            } else if (row.field === "bom_percent") {
                              const bom = parseFloat(getValue(product.id, `${period}_bom_cost`)) || 0;
                              const revenue = parseFloat(getValue(product.id, `${period}_customer_revenue`)) || 0;
                              const derate = parseFloat(getValue(product.id, `${period}_derate_percent`)) || 0;
                              const netRev = calculateNetRevenue(revenue, derate);
                              const bomPct = calculateBomPercent(bom, netRev);
                              calculatedValue = netRev > 0 ? formatPercent(bomPct) : "";
                            }

                            return (
                              <td
                                key={`${period}-${row.field}`}
                                className="px-4 py-2 text-center border-r bg-blue-50 font-medium text-blue-900"
                              >
                                {calculatedValue}
                              </td>
                            );
                          }

                          return (
                            <td key={`${period}-${row.field}`} className="px-2 py-1 border-r">
                              <input
                                type="number"
                                step="0.01"
                                value={getValue(product.id, fieldName)}
                                onChange={(e) => setValue(product.id, fieldName, e.target.value)}
                                className="w-full px-2 py-1 border rounded text-center"
                                placeholder="0.00"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => loadData()}
                className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
              >
                Reset to Saved
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormComplete() || saving}
                className={`px-6 py-3 rounded-lg font-medium ${
                  isFormComplete() && !saving
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {saving ? "Saving..." : "Submit Data"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
