'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Claim {
  id: string
  cause: string
  status: string
  submittedAt: string
  createdAt: string
  updatedAt: string
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL!

export default function ClaimListPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/api/claims`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => {
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลเคลมได้')
        return res.json()
      })
      .then(data => setClaims(data.claims))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>กำลังโหลด...</p>
  if (error) return <p className="text-red-600">Error: {error}</p>

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">รายการเคลม</h1>
      <Link href="/claims/new">
        <a className="mb-4 inline-block bg-green-600 text-white px-4 py-2 rounded">
          แจ้งเคลมใหม่
        </a>
      </Link>
      <ul className="space-y-4">
        {claims.map(c => (
          <li key={c.id} className="p-4 border rounded flex justify-between">
            <div>
              <p><strong>Claim #{c.id}</strong></p>
              <p>สาเหตุ: {c.cause}</p>
              <p>สถานะ: {c.status}</p>
              <p>ส่งเมื่อ: {new Date(c.submittedAt).toLocaleString()}</p>
              <p>สร้างเมื่อ: {new Date(c.createdAt).toLocaleString()}</p>
              <p>อัปเดตเมื่อ: {new Date(c.updatedAt).toLocaleString()}</p>
            </div>
            <Link href={`/claims/${c.id}`}>
              <a className="text-blue-600">ดูรายละเอียด</a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
