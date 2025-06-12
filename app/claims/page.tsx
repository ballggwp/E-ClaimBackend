'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Claim {
  id: string
  status: string
  createdAt: string
  submittedAt: string | null
}

export default function ClaimsPage() {
  const { data: session, status } = useSession()
  const [claims,   setClaims]  = useState<Claim[]>([])
  const [loading,  setLoading] = useState(true)
  const [error,    setError]   = useState<string|null>(null)

  useEffect(() => {
    // only run once we know we’re logged in
    if (status !== 'authenticated') return
    //console.log('SESSION.USER:', session?.user)
    //console.log('ABOUT TO SEND HEADER:', session?.user.accessToken);
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_COMPANY_API_URL}/api/claims`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // ← Make sure this is exactly session.user.accessToken
              Authorization: `Bearer ${session!.user.accessToken}`,
            },
          }
        )
        if (!res.ok) {
          // capture the JSON error message
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

  if (status === 'loading')      return <p>Loading session…</p>
  if (status === 'unauthenticated')
    return <p>Please <Link href="/login">login</Link> first.</p>
  if (loading)                    return <p>Loading your claims…</p>
  if (error)                      return <p className="text-red-600">Error loading claims: {error}</p>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">รายการเคลม</h1>
        <Link
          href="/claims/new"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + สร้างเคลมใหม่
        </Link>
      </header>

      {claims.length === 0 ? (
        <p>ยังไม่มีรายการเคลม</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">ID</th>
              <th className="border px-4 py-2 text-left">สถานะ</th>
              <th className="border px-4 py-2 text-left">สร้างเมื่อ</th>
              <th className="border px-4 py-2 text-left">ส่งเมื่อ</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">
                  <Link
                    href={`/claims/${c.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {c.id}
                  </Link>
                </td>
                <td className="border px-4 py-2">{c.status}</td>
                <td className="border px-4 py-2">
                  {new Date(c.createdAt).toLocaleString()}
                </td>
                <td className="border px-4 py-2">
                  {c.submittedAt
                    ? new Date(c.submittedAt).toLocaleString()
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
