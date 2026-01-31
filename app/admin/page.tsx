"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Settings, ProductFamily, TimeHorizon } from "@/lib/types";
import Link from "next/link";

export default function AdminPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [productFamilies, setProductFamilies] = useState<ProductFamily[]>([]);
  const [newProductName, setNewProductName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
    }

    setLoading(false);
  }

  async function updateTimeHorizon(horizon: TimeHorizon) {
    if (!settings) return;

    const { error } = await supabase
      .from("settings")
      .update({ time_horizon: horizon })
      .eq("id", settings.id);

    if (!error) {
      setSettings({ ...settings, time_horizon: horizon });
    }
  }

  async function updateColumnLabel(field: string, value: string) {
    if (!settings) return;

    const { error } = await supabase
      .from("settings")
      .update({ [field]: value })
      .eq("id", settings.id);

    if (!error) {
      setSettings({ ...settings, [field]: value } as Settings);
    }
  }

  async function addProductFamily() {
    if (!newProductName.trim()) return;

    const { error } = await supabase
      .from("product_families")
      .insert({ 
        name: newProductName.trim(),
        sort_order: productFamilies.length 
      });

    if (!error) {
      setNewProductName("");
      loadData();
    }
  }

  async function deleteProductFamily(id: string) {
    if (!confirm("Delete this product family? This will also delete all regional submissions for it.")) {
      return;
    }

    const { error } = await supabase
      .from("product_families")
      .delete()
      .eq("id", id);

    if (!error) {
      loadData();
    }
  }

  async function resetAllData() {
    if (!confirm("Are you sure you want to reset ALL regional submission data? This cannot be undone!")) {
      return;
    }

    const { error } = await supabase
      .from("regional_submissions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

    if (!error) {
      alert("All regional data has been reset!");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Control Center</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Time Horizon Section */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Time Horizon</h2>
          <div className="flex gap-4">
            <button
              onClick={() => updateTimeHorizon("quarterly")}
              className={`px-6 py-3 rounded-lg font-medium ${
                settings?.time_horizon === "quarterly"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Quarterly Only (4 columns)
            </button>
            <button
              onClick={() => updateTimeHorizon("3year")}
              className={`px-6 py-3 rounded-lg font-medium ${
                settings?.time_horizon === "3year"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              3-Year Plan (6 columns)
            </button>
          </div>
        </section>

        {/* Column Labels Section */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Column Labels</h2>
          <div className="grid grid-cols-2 gap-4">
            {["q1", "q2", "q3", "q4"].map((q) => (
              <div key={q}>
                <label className="block text-sm font-medium mb-1">
                  {q.toUpperCase()} Label
                </label>
                <input
                  type="text"
                  value={settings?.[`${q}_label` as keyof Settings] as string || ""}
                  onChange={(e) => updateColumnLabel(`${q}_label`, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            ))}
            {settings?.time_horizon === "3year" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Year 2 Label
                  </label>
                  <input
                    type="text"
                    value={settings?.year2_label || ""}
                    onChange={(e) => updateColumnLabel("year2_label", e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Year 3 Label
                  </label>
                  <input
                    type="text"
                    value={settings?.year3_label || ""}
                    onChange={(e) => updateColumnLabel("year3_label", e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Product Families Section */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Product Families</h2>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addProductFamily()}
              placeholder="Enter new product family name"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={addProductFamily}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {productFamilies.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <span className="font-medium">{product.name}</span>
                <button
                  onClick={() => deleteProductFamily(product.id)}
                  className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
            {productFamilies.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No product families yet. Add one above!
              </p>
            )}
          </div>
        </section>

        {/* Cycle Management Section */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Cycle Management</h2>
          <button
            onClick={resetAllData}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Reset All Regional Data
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This will clear all submissions from all regions. Use this to start a new forecasting cycle.
          </p>
        </section>

        {/* Export Section */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Export Data</h2>
          <Link
            href="/api/export"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Download Master Forecast (Excel)
          </Link>
          <p className="text-sm text-gray-600 mt-2">
            Generates a 4-tab Excel file with regional data and summary.
          </p>
        </section>
      </div>
    </div>
  );
}
