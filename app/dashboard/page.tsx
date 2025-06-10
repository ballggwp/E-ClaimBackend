'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface ClaimSummary {
  id: string
  status: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [claims, setClaims] = useState<ClaimSummary[]>([])

  // redirect ไปหน้า login ถ้ายังไม่ได้ล็อกอิน
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      // TODO: fetch data จาก API จริง
      setClaims([
        { id: '001', status: 'รอทีมประกันตรวจ' },
        { id: '002', status: 'เสร็จสิ้น' },
      ])
    }
  }, [status])

  if (status === 'loading') {
    return <p>กำลังโหลด...</p>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Dashboard</h1>
      <ul className="space-y-2">
        {claims.map((c) => (
          <li key={c.id} className="p-4 border rounded flex justify-between">
            <span>เคลม #{c.id}</span>
            <span>{c.status}</span>
            <button
              onClick={() => router.push(`/claims/${c.id}`)}
              className="text-blue-600"
            >
              ดูรายละเอียด
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
