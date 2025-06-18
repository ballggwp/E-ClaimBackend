'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Claim {
  id: string
  status: string
  createdAt: string | null
  submittedAt: string | null
}

const statusBadgeColor = (status: string) => {
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

export default function ClaimsPage() {
  const { data: session, status } = useSession()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    ;(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session!.user.accessToken}`,
          },
        })
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.message || res.statusText)
        }
        const { claims } = await res.json()
        setClaims(claims)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [status, session])

  if (status === 'loading') return <p className="p-6">Loading session…</p>
  if (status === 'unauthenticated') return <p className="p-6">กรุณา <Link href="/login" className="text-blue-600 underline">เข้าสู่ระบบ</Link> ก่อน</p>
  if (loading) return <p className="p-6">กำลังโหลดรายการเคลม…</p>
  if (error) return <p className="text-red-600 p-6">เกิดข้อผิดพลาด: {error}</p>

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow p-8 space-y-10">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">รายการเคลม</h1>
          <Link
            href="/claims/new"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
          >
            + สร้างเคลมใหม่
          </Link>
        </header>

        {claims.length === 0 ? (
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
                {claims.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-6 py-3">
                      <Link href={`/claims/${c.id}`} className="text-blue-600 hover:underline">
                        {c.id}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadgeColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString('th-TH')
                        : '-'}
                    </td>
                    <td className="px-6 py-3">
                      {c.submittedAt
                        ? new Date(c.submittedAt).toLocaleDateString('th-TH')
                        : '-'}
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
  )
}
