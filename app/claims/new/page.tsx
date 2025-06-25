// app/claims/new/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewClaimPage() {
  const router = useRouter();

  // Hard‐coded for now—swap out with an API fetch if you like
  const MAIN_CATEGORIES = [
    "Physical Assets",
    "Personnel",
    "Other",
  ] as const;
  const SUB_CATEGORIES: Record<typeof MAIN_CATEGORIES[number], string[]> = {
    "Physical Assets": ["CPM", "Equipment", "Building"],
    "Personnel":        ["Health", "Liability"],
    "Other":            ["General", "Misc"],
  };

  const [categoryMain, setCategoryMain] = useState<keyof typeof SUB_CATEGORIES | "">("");
  const [subOptions,   setSubOptions]   = useState<string[]>([]);
  const [categorySub,  setCategorySub]  = useState<string>("");
  const [error,        setError]        = useState<string | null>(null);

  // Whenever the main category changes, update the sub‐dropdown
  useEffect(() => {
    if (categoryMain) {
      setSubOptions(SUB_CATEGORIES[categoryMain]);
      setCategorySub("");
    } else {
      setSubOptions([]);
      setCategorySub("");
    }
  }, [categoryMain]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryMain || !categorySub) {
      setError("กรุณาเลือกทั้งประเภทหลักและประเภทย่อย");
      return;
    }

    // Navigate to the CPM form step, passing the selections in the query string
    router.push(
      `/${categorySub}/new?${new URLSearchParams({
        categoryMain,
        categorySub,
      }).toString()}`
    );
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">สร้างเคลมใหม่</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Category */}
        <div>
          <label className="block text-sm font-medium mb-1">ประเภทหลัก</label>
          <select
            value={categoryMain}
            onChange={e => setCategoryMain(e.target.value as typeof categoryMain)}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="" disabled>-- เลือกประเภทหลัก --</option>
            {MAIN_CATEGORIES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Sub Category (dependent) */}
        <div>
          <label className="block text-sm font-medium mb-1">ประเภทย่อย</label>
          <select
            value={categorySub}
            onChange={e => setCategorySub(e.target.value)}
            required
            disabled={!categoryMain}
            className="w-full border px-3 py-2 rounded disabled:bg-gray-100"
          >
            <option value="" disabled>
              {categoryMain ? "-- เลือกประเภทย่อย --" : "โปรดเลือกประเภทหลักก่อน"}
            </option>
            {subOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
        >
          ถัดไป: กรอกแบบฟอร์ม CPM
        </button>
      </form>
    </div>
  );
}
