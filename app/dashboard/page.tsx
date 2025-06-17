'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ClaimSummary {
  id: string
  cause: string
  status: string
  submittedAt: string
  createdAt: string
  user: {
    name: string
    email: string
    role: string            // ← make sure your API returns this!
  }
}

const statusColor = (status: string) => {
  switch (status) {
    case "DRAFT": return "bg-gray-200 text-gray-700"
    case "PENDING_INSURER_REVIEW": return "bg-yellow-100 text-yellow-800"
    case "AWAITING_EVIDENCE": return "bg-orange-100 text-orange-800"
    case "PENDING_MANAGER_REVIEW": return "bg-yellow-200 text-yellow-900"
    case "PENDING_USER_CONFIRM": return "bg-purple-100 text-purple-800"
    case "AWAITING_SIGNATURES": return "bg-blue-100 text-blue-800"
    case "COMPLETED": return "bg-green-100 text-green-800"
    case "REJECTED": return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [claims, setClaims] = useState<ClaimSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isInsurer = session?.user.role === 'INSURANCE'
  console.log(isInsurer)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status !== 'authenticated') return

    ;(async () => {
      try {
        // 1) Insurers load *all* non-draft claims;
        //    others load only their own.
        const endpoint = isInsurer
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims?excludeStatus=DRAFT`
          : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims?userEmail=${session!.user.email}`

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setClaims(data.claims)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [status, session, router, isInsurer])

  if (loading || status === 'loading') return <p className="p-6">Loading…</p>
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>

  // 2) If INSURANCE, hide any claim where user.role==='INSURANCE'
  const visible = claims;

  // 3) Split into sections:
  const draftClaims = visible.filter(c => c.status === 'DRAFT')
  const pendingInsurer = visible.filter(c => c.status === 'PENDING_INSURER_REVIEW')
  const otherClaims = visible.filter(
    c => c.status !== 'DRAFT' && c.status !== 'PENDING_INSURER_REVIEW'
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            สวัสดี, {session?.user.name}
          </h1>
          <Link
            href="/claims/new"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg"
          >
            + สร้างเคลมใหม่
          </Link>
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
              ? 'เคลมอื่น ๆ (ยกเว้น Draft & Pending Insurer)'
              : 'เคลมอื่น ๆ (ยกเว้น Draft)'
          }
          claims={otherClaims}
          emptyText="ไม่มีรายการ"
        />
      </div>
    </div>
  )
}

function Section({
  title,
  claims,
  emptyText,
}: {
  title: string
  claims: ClaimSummary[]
  emptyText: string
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
                <th className="px-6 py-3 text-left font-medium">Cause</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 border-t">
                  <td className="px-6 py-3">
                    <Link href={`/claims/${c.id}`} className="text-blue-600 hover:underline">
                      {c.id}
                    </Link>
                  </td>
                  <td className="px-6 py-3">{c.cause}</td>
                  <td className="px-6 py-3">
                    {new Date(c.submittedAt || c.createdAt).toLocaleDateString('th-TH')}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
    
  )
  
}
