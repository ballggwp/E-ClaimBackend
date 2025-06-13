'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ClaimSummary {
  id: string
  status: string
  submittedAt: string
  cause: string
  createdAt: string
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status !== 'authenticated') return

    ;(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims`, {
          headers: {
            Authorization: `Bearer ${session!.user.accessToken}`,
          },
        })
        if (!res.ok) throw new Error(await res.text())
        const { claims } = await res.json()
        setClaims(claims)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [status, session, router])

  if (loading || status === 'loading') return <p className="p-6">Loading…</p>
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            สวัสดี, {session?.user.name}
          </h1>
          <Link
            href="/claims/new"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
          >
            + สร้างเคลมใหม่
          </Link>
        </header>

        {/* Draft Claims */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">ร่าง (Drafts)</h2>
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
                {claims.filter(c => c.status === 'DRAFT').map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 border-t">
                    <td className="px-6 py-3">
                      <Link href={`/claims/${c.id}`} className="text-blue-600 hover:underline">
                        {c.id}
                      </Link>
                    </td>
                    <td className="px-6 py-3">{c.cause}</td>
                    <td className="px-6 py-3">{new Date(c.createdAt).toLocaleDateString('th-TH')}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Other Claims */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">เคลมอื่น ๆ</h2>
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
                {claims
                  .filter(c => c.status !== 'DRAFT')
                  .map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 border-t">
                      <td className="px-6 py-3">
                        <Link href={`/claims/${c.id}`} className="text-blue-600 hover:underline">
                          {c.id}
                        </Link>
                      </td>
                      <td className="px-6 py-3">{c.cause}</td>
                      <td className="px-6 py-3">{new Date(c.submittedAt).toLocaleDateString('th-TH')}</td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
