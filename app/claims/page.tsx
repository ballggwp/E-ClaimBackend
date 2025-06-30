"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface Claim {
  id: string;
  docNum: string;
  status: string;
  createdAt: string | null;
  submittedAt: string | null;
  createdByName: string | null;
  createdByEmail: string;
  approverId?: string;
}

const statusBadgeColor = (status: string) => {
  switch (status) {
    case "DRAFT":                       return "bg-gray-200 text-gray-700";
    case "PENDING_APPROVER_REVIEW":     return "bg-blue-100 text-blue-800";
    case "PENDING_INSURER_REVIEW":      return "bg-yellow-100 text-yellow-800";
    case "AWAITING_EVIDENCE":           return "bg-orange-100 text-orange-800";
    case "PENDING_MANAGER_REVIEW":      return "bg-yellow-200 text-yellow-900";
    case "PENDING_USER_CONFIRM":        return "bg-purple-100 text-purple-800";
    case "AWAITING_SIGNATURES":         return "bg-blue-100 text-blue-800";
    case "COMPLETED":                   return "bg-green-100 text-green-800";
    case "REJECTED":                    return "bg-red-100 text-red-800";
    default:                            return "bg-gray-100 text-gray-800";
  }
};

export default function ClaimsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [claims, setClaims]     = useState<Claim[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch all claims
  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.user.accessToken}`,
            },
          }
        );
        if (!res.ok) throw new Error(await res.text());
        const body = await res.json();
        setClaims(body.claims);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session]);

  // Role + approver filtering
  const visible = useMemo(() => {
    if (!session) return [];
    const { role, name, employeeNumber } = session.user;
    const myId = String(employeeNumber);

    return claims.filter((c) => {
      const isApprover = c.status !== "DRAFT" && c.approverId === myId;

      // 1) Always show claims you approve
      if (isApprover) return true;

      // 2) USER only sees own claims
      if (role === "USER") {
        return c.createdByName === name;
      }

      // 3) INSURANCE or MANAGER see all except drafts
      if (role === "INSURANCE" || role === "MANAGER") {
        if(isApprover){
          return c.status !== "DRAFT"
        }
        else{
            return c.status !== "DRAFT"&&c.status !=="PENDING_APPROVER_REVIEW";
        }
      }

      return false;
    });
  }, [claims, session]);

  // Split approver vs others
  const approverClaims = useMemo(() => {
    if (!session) return [];
    const myId = String(session.user.employeeNumber);
    return visible.filter(
      (c) => c.status !== "DRAFT" && c.approverId === myId
    );
  }, [visible, session]);
  const insurerreview = useMemo(() => {
    if (!session) return [];
    return visible.filter(
      (c) => c.status == "PENDING_INSURER_REVIEW"
    );
  }, [visible, session]);

  const otherClaims = visible.filter((c) => !approverClaims.includes(c));

  // Loading / error states
  if (status === "loading" || loading) {
    return <p className="p-6">Loading…</p>;
  }
  if (error) {
    return <p className="p-6 text-red-600">เกิดข้อผิดพลาด: {error}</p>;
  }
  if (!session) {
    return <p className="p-6">Redirecting…</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow p-8 space-y-8">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">รายการเคลม</h1>
            <Link
              href="/claims/new"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
            >
              + สร้างเคลมใหม่
            </Link>
          </header>
          {session.user.role==="INSURER" && (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-700">
                รายการที่รอการอนุมัติ
              </h2>
              <div className="overflow-x-auto bg-white rounded-xl shadow">
                <table className="min-w-full text-sm text-gray-700">
                  <thead className="bg-gray-100 text-left">
                    <tr>
                      <th className="px-6 py-3 font-semibold">ID</th>
                      <th className="px-6 py-3 font-semibold">สถานะ</th>
                      <th className="px-6 py-3 font-semibold">สร้างเมื่อ</th>
                      <th className="px-6 py-3 font-semibold">ส่งเมื่อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insurerreview.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-3">
                          <Link
                            href={`/claims/${c.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {c.docNum}
                          </Link>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadgeColor(
                              c.status
                            )}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString("th-TH")
                            : "–"}
                        </td>
                        <td className="px-6 py-3">
                          {c.submittedAt
                            ? new Date(c.submittedAt).toLocaleDateString("th-TH")
                            : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {/* Section: Claims You Approve */}
          {approverClaims.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-700">
                รายการที่คุณอนุมัติ
              </h2>
              <div className="overflow-x-auto bg-white rounded-xl shadow">
                <table className="min-w-full text-sm text-gray-700">
                  <thead className="bg-gray-100 text-left">
                    <tr>
                      <th className="px-6 py-3 font-semibold">ID</th>
                      <th className="px-6 py-3 font-semibold">สถานะ</th>
                      <th className="px-6 py-3 font-semibold">สร้างเมื่อ</th>
                      <th className="px-6 py-3 font-semibold">ส่งเมื่อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approverClaims.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-3">
                          <Link
                            href={`/claims/${c.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {c.docNum}
                          </Link>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadgeColor(
                              c.status
                            )}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString("th-TH")
                            : "–"}
                        </td>
                        <td className="px-6 py-3">
                          {c.submittedAt
                            ? new Date(c.submittedAt).toLocaleDateString("th-TH")
                            : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {/* Section: Other Visible Claims */}
          <h2 className="text-2xl font-semibold text-gray-700">
                เคลมของคุณ
              </h2>
          {otherClaims.length === 0 ? (
            <p className="text-gray-600">ยังไม่มีรายการเคลม</p>
          ) : (
            <div className="overflow-x-auto bg-white shadow rounded-xl">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-6 py-3 font-semibold">ID</th>
                    <th className="px-6 py-3 font-semibold">สถานะ</th>
                    <th className="px-6 py-3 font-semibold">สร้างเมื่อ</th>
                    <th className="px-6 py-3 font-semibold">ส่งเมื่อ</th>
                  </tr>
                </thead>
                <tbody>
                  {otherClaims.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-3">
                        <Link
                          href={`/claims/${c.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {c.docNum}
                        </Link>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadgeColor(
                            c.status
                          )}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString("th-TH")
                          : "–"}
                      </td>
                      <td className="px-6 py-3">
                        {c.submittedAt
                          ? new Date(c.submittedAt).toLocaleDateString("th-TH")
                          : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
