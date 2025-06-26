"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewClaimPage() {
  const router = useRouter();

  // Hard-coded for now—swap out with an API fetch if you like
  const MAIN_CATEGORIES = [
    "Physical Assets",
    "Personnel",
    "Other",
  ] as const;
  const SUB_CATEGORIES: Record<typeof MAIN_CATEGORIES[number], string[]> = {
    "Physical Assets": ["CPM", "Equipment", "Building"],
    "Personnel": ["Health", "Liability"],
    "Other": ["General", "Misc"],
  };

  const [categoryMain, setCategoryMain] = useState<keyof typeof SUB_CATEGORIES | "">("");
  const [subOptions, setSubOptions] = useState<string[]>([]);
  const [categorySub, setCategorySub] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

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

    router.push(
      `/${categorySub}/new?${new URLSearchParams({
        categoryMain,
        categorySub,
      }).toString()}`
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-4">สร้างเคลมใหม่</h1>
        <p className="text-center text-gray-600 mb-6">กรุณาเลือกประเภทหลักและประเภทย่อยเพื่อดำเนินการต่อ</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทหลัก
            </label>
            <select
              value={categoryMain}
              onChange={(e) => setCategoryMain(e.target.value as keyof typeof SUB_CATEGORIES)}
              required
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="" disabled>
                -- เลือกประเภทหลัก --
              </option>
              {MAIN_CATEGORIES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Category (dependent) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทย่อย
            </label>
            <select
              value={categorySub}
              onChange={(e) => setCategorySub(e.target.value)}
              required
              disabled={!categoryMain}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 transition"
            >
              <option value="" disabled>
                {categoryMain
                  ? "-- เลือกประเภทย่อย --"
                  : "โปรดเลือกประเภทหลักก่อน"}
              </option>
              {subOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 bg-indigo-600 text-white font-medium rounded-md shadow hover:bg-indigo-700 transition"
          >
            {categorySub
              ? `ถัดไป: กรอกแบบฟอร์ม ${categorySub}`
              : "ถัดไป: กรอกแบบฟอร์ม"}
          </button>
        </form>
      </div>
    </div>
  );
}
