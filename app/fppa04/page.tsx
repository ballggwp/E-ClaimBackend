// app/fppa04/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ClaimSummary { id:string; cause:string; createdAt:string }

export default function FPPA04ListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [claims, setClaims] = useState<ClaimSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status !== 'authenticated') return

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
      .then(data => setClaims(data.claims))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [status, session, router])

  if (loading) return <p className="p-6">Loading…</p>
  if (error)   return <p className="p-6 text-red-600">Error: {error}</p>

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">รายการรอกรอก FPPA04</h1>
        {claims.length === 0 ? (
          <p className="text-gray-500">ไม่มีรายการ</p>
        ) : (
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Form ID</th>
                <th className="p-3 text-left">สาเหตุ</th>
                <th className="p-3 text-left">วันที่สร้าง</th>
                <th className="p-3 text-left">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{c.id}</td>
                  <td className="p-3">{c.cause}</td>
                  <td className="p-3">
                    {new Date(c.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="p-3">
                    <Link href={`/fppa04/${c.id}`} className="text-blue-600 hover:underline">
                      กรอก
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
