// app/download/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface ClaimItem {
  id: string;
  docNum: string;
  status: string;
  createdByName: string;
  cause: string;
  updatedAt: string;
}

const MAIN_CATEGORIES = ["Physical Assets", "Personnel", "Other"] as const;
type MainCategory = (typeof MAIN_CATEGORIES)[number];

const SUB_CATEGORIES: Record<MainCategory, string[]> = {
  "Physical Assets": ["CPM", "Equipment", "Building"],
  Personnel: ["Health", "Liability"],
  Other: ["General", "Misc"],
};

export default function DownloadSelectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mainCat, setMainCat] = useState<MainCategory | "">("");
  const [subCat, setSubCat] = useState<string>("");
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!mainCat || !subCat) {
      setError("กรุณาเลือกทั้ง Category และ Sub");
      return;
    }
    if (status !== "authenticated") {
      setError("กรุณาเข้าสู่ระบบก่อนใช้งาน");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const params: Record<string, string> = {
        categoryMain: mainCat,
        categorySub: subCat,
        excludeStatus: "DRAFT",
      };
      if (session!.user.role !== "INSURANCE") {
        params.userEmail = session!.user.email!;
      }
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims?${qs}`,
        { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      const { claims: data } = (await res.json()) as { claims: ClaimItem[] };
      const filtered = data.filter((c) => c.status === "COMPLETED");
      setClaims(filtered);
      if (filtered.length === 0) {
        setError("ไม่พบฟอร์มที่คุณมีสิทธิ์ดาวน์โหลด");
      }
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาดระหว่างค้นหา");
    } finally {
      setLoading(false);
    }
  };

  const availableSubs = mainCat ? SUB_CATEGORIES[mainCat] : [];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          ดาวน์โหลดไฟล์แบบฟอร์ม
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-medium">Category Main</label>
            <select
              value={mainCat}
              onChange={(e) => {
                setMainCat(e.target.value as MainCategory);
                setSubCat("");
              }}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-300"
            >
              <option value="">-- เลือก Main --</option>
              {MAIN_CATEGORIES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Sub Category</label>
            <select
              value={subCat}
              onChange={(e) => setSubCat(e.target.value)}
              disabled={!mainCat}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            >
              <option value="">-- เลือก Sub --</option>
              {availableSubs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="block w-2/3 sm:w-1/2 lg:w-1/3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-lg font-medium transition mx-auto"
        >
          {loading ? "กำลังค้นหา…" : "🔍 ค้นหา"}
        </button>
        {error && <p className="text-center text-red-600 mb-4">{error}</p>}

        {claims.length > 0 && (
          <div className="mt-10 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Form ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Created By
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Cause
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Updated At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      router.push(`/download/claim/${subCat}/${c.id}`)
                    }
                  >
                    <td className="px-6 py-5 text-base text-gray-800 whitespace-nowrap">
                      {c.docNum}
                    </td>
                    <td className="px-6 py-5 text-base text-gray-800 whitespace-nowrap">
                      {c.createdByName}
                    </td>
                    <td className="px-6 py-5 text-base text-gray-800 whitespace-nowrap">
                      {c.cause}
                    </td>
                    <td className="px-6 py-5 text-base text-gray-800 whitespace-nowrap">
                      {format(new Date(c.updatedAt), "d MMM yyyy", {
                        locale: th,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
