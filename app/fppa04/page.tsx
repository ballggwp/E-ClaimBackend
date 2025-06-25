// app/fppa04/page.tsx
'use client'

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ClaimSummary {
  id: string
  cause: string
  createdAt: string
}

const ALL_MAIN = [
  "Physical Assets",
  "Financial Assets",
  "Human Resources",
  // …add your other mains here…
]

const SUB_BY_MAIN: Record<string,string[]> = {
  "Physical Assets": ["CPM", "Standard", "Heavy Machinery"],
  "Financial Assets": ["FPPA-04", "Treasury"],
  "Human Resources": ["Work Injury", "Health"],
  // …etc…
}

export default function Fppa04ListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

   const [mainCat, setMainCat] = useState('')       // หมวดหลัก
  const [subCat, setSubCat]   = useState('')       // หมวดย่อย
  const [claims,  setClaims ] = useState<ClaimSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError   ] = useState<string|null>(null)

  // When both mainCat & subCat are chosen, fetch matching claims
  useEffect(() => {
    if (status !== 'authenticated') return
    if (!mainCat || !subCat) return

    setLoading(true)
    setError(null)
    const qs = new URLSearchParams({
      categoryMain: mainCat,
      categorySub:  subCat,
      status:       'PENDING_INSURER_FORM',
    }).toString()
    console.log(qs)
    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL!}/api/claims?${qs}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session!.user.accessToken}`,
        },
      }
    )
    
      .then(r => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
      .then(data => {
  setClaims(
    data.claims.filter((c: any) => c.status === 'PENDING_INSURER_FORM')
  )
})
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [mainCat, subCat, status, session])

  // When mainCat changes, reset subCat
  useEffect(() => {
    setSubCat("")
  }, [mainCat])

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }
  if (status !== 'authenticated') return <p className="p-6">Loading…</p>

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8 space-y-6">
        <h1 className="text-2xl font-bold">สร้าง FPPA-04</h1>

        {/* --- Category selectors --- */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">หมวดหลัก</label>
            <select
              value={mainCat}
              onChange={e => setMainCat(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">-- เลือกหมวดหลัก --</option>
              {ALL_MAIN.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">หมวดย่อย</label>
            <select
              value={subCat}
              onChange={e => setSubCat(e.target.value)}
              disabled={!mainCat}
              className="w-full border px-3 py-2 rounded disabled:bg-gray-100"
            >
              <option value="">-- เลือกหมวดย่อย --</option>
              {mainCat && SUB_BY_MAIN[mainCat].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Results --- */}
        {!mainCat || !subCat ? (
          <p className="text-gray-500">กรุณาเลือกหมวดหลักและหมวดย่อยก่อน</p>
        ) : loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p className="text-red-600">Error: {error}</p>
        ) : claims.length === 0 ? (
          <p className="text-gray-500">ไม่พบเคลมสำหรับหมวดนี้</p>
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
                    <Link
                      href={`/fppa04/${subCat}/new/${c.id}` +
                        `?categoryMain=${encodeURIComponent(mainCat)}` +
                        `&categorySub=${encodeURIComponent(subCat)}`}
                      className="text-blue-600 hover:underline"
                    >
                      กรอก FPPA-04
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
