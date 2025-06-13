'use client'

import { useSession }        from 'next-auth/react'
import { useRouter }         from 'next/navigation'
import { useEffect, useState } from 'react'
import Link                  from 'next/link'

interface ClaimSummary {
  id:           string
  status:       string
  submittedAt:  string
  cause:        string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [claims, setClaims]   = useState<ClaimSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string|null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status !== 'authenticated') return

    ;(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims`,
          {
            headers: {
              Authorization: `Bearer ${session!.user.accessToken}`,
            },
          }
        )
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">
          สวัสดี, {session?.user.name}
        </h1>
        <Link
          href="/claims/new"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          + สร้างเคลมใหม่
        </Link>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-medium">ร่าง (Drafts)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Form ID</th>
                <th className="px-4 py-2 text-left">Cause</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
  {claims
  .filter(c => c.status === 'DRAFT')
  .map(c => (
    <tr key={c.id} className="border-t">
      <td className="px-4 py-2">
        <Link href={`/claims/${c.id}`} className="text-blue-600 hover:underline">
          {c.id}
        </Link>
      </td>
      <td className="px-4 py-2">{c.cause}</td>
      <td className="px-4 py-2">
        {new Date(c.submittedAt).toLocaleDateString("th-TH")}
      </td>
      <td className="px-4 py-2">{c.status}</td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-medium">เคลมอื่น ๆ</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Form ID</th>
                <th className="px-4 py-2 text-left">Cause</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {claims
                .filter(c => c.status !== 'DRAFT')
                .map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-2">
                      <Link
                        href={`/claims/${c.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {c.id}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{c.cause}</td>
                    <td className="px-4 py-2">
                      {new Date(c.submittedAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-4 py-2">{c.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}