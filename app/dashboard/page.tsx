"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface ClaimSummary {
  id: string;
  cause: string;
  status: string;
  submittedAt: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
  insurerComment?: string;
  createdByName: true;
}

const statusColor = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray-200 text-gray-700";
    case "PENDING_INSURER_REVIEW":
      return "bg-yellow-100 text-yellow-800";
    case "AWAITING_EVIDENCE":
      return "bg-orange-100 text-orange-800";
    case "PENDING_MANAGER_REVIEW":
      return "bg-yellow-200 text-yellow-900";
    case "PENDING_USER_CONFIRM":
      return "bg-purple-100 text-purple-800";
    case "AWAITING_SIGNATURES":
      return "bg-blue-100 text-blue-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 📦 All hooks at the top
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const isInsurer = session?.user.role === "INSURANCE";

  // 🔄 Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 🔄 Fetch claims once authenticated or when role changes
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const endpoint = isInsurer
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims?excludeStatus=DRAFT`
          : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims?userEmail=${
              session!.user.email
            }`;

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setClaims(data.claims);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session, isInsurer]);

  // 🔍 Compute filtered list of claims
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return claims;
    return claims.filter(
      (c) =>
        c.id.toLowerCase().includes(term) ||
        c.cause.toLowerCase().includes(term) ||
        c.status.toLowerCase().includes(term)
    );
  }, [searchTerm, claims]);

  // ⏳ Early returns after all hooks
  if (status === "loading" || loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  // 🚪 Split out sections
  const draftClaims = filtered.filter((c) => c.status === "DRAFT");
  const pendingInsurer = filtered.filter(
    (c) => c.status === "PENDING_INSURER_REVIEW"
  );
  const otherClaims = filtered.filter((c) => {
    if (session?.user.role === "USER") return c.status !== "DRAFT";
    if (session?.user.role === "INSURANCE")
      return c.status !== "PENDING_INSURER_REVIEW";
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        {/* White “card” container */}
        <div className="bg-white rounded-xl shadow p-8 space-y-10">
          {/* Header */}
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">
              สวัสดี, {session?.user.name}
            </h1>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหา..."
                className="border border-gray-300 px-3 py-1 rounded focus:outline-none focus:border-blue-500"
              />
              <Link
                href="/claims/new"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
              >
                + สร้างเคลมใหม่
              </Link>
            </div>
          </header>

          {/* non-insurers: see your drafts */}
          {!isInsurer && (
            <Section
              title="ร่าง (Drafts)"
              claims={draftClaims}
              emptyText="ไม่มีร่างเคลม"
            />
          )}

          {/* insurers: see pending-insurer first */}
          {isInsurer && (
            <Section
              title="รอตรวจสอบประกัน (Pending Insurer Review)"
              claims={pendingInsurer}
              emptyText="ไม่มีรายการรอตรวจสอบ"
            />
          )}

          {/* everybody: then the rest */}
          <Section
            title={
              isInsurer
                ? "เคลมอื่น ๆ (ยกเว้น Draft & Pending Insurer)"
                : "เคลมอื่น ๆ (ยกเว้น Draft)"
            }
            claims={otherClaims}
            emptyText="ไม่มีรายการ"
          />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  claims,
  emptyText,
}: {
  title: string;
  claims: ClaimSummary[];
  emptyText: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700">{title}</h2>
      {claims.length === 0 ? (
        <p className="p-6 text-gray-500">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Form ID</th>
                <th className="px-6 py-3 text-left font-medium">CreatedBy</th>
                <th className="px-6 py-3 text-left font-medium">Cause</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 border-t">
                  <td className="px-6 py-3">
                    <Link
                      href={`/claims/${c.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {c.id}
                    </Link>
                  </td>
                  <td className="px-6 py-3">{c.createdByName}</td>
                  <td className="px-6 py-3">{c.cause}</td>
                  <td className="px-6 py-3">
                    {new Date(c.submittedAt || c.createdAt).toLocaleDateString(
                      "th-TH"
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {c.insurerComment ? (
                      <span className="block truncate max-w-xs">
                        {c.insurerComment}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
