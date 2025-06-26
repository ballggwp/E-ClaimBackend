'use client'

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from 'framer-motion'

interface ClaimSummary {
  id: string
  cause: string
  createdAt: string
  categorySub: string
}

const ALL_MAIN = [
  "Physical Assets",
  "Financial Assets",
  "Human Resources",
]

const SUB_BY_MAIN: Record<string, string[]> = {
  "Physical Assets": ["CPM", "Standard", "Heavy Machinery"],
  "Financial Assets": ["FPPA-04", "Treasury"],
  "Human Resources": ["Work Injury", "Health"],
}

export default function Fppa04ListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [mainCat, setMainCat] = useState("")
  const [subCat, setSubCat] = useState("")
  const [claims, setClaims] = useState<ClaimSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset subCat when mainCat changes
  useEffect(() => {
    setSubCat("")
  }, [mainCat])

  // Sorted sub-options
  const subOptions = useMemo(() => {
    if (!mainCat) return []
    return [...SUB_BY_MAIN[mainCat]].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    )
  }, [mainCat])

  // Fetch claims when both categories selected
  useEffect(() => {
    if (status !== 'authenticated' || !mainCat || !subCat) return
    setLoading(true)
    setError(null)

    const qs = new URLSearchParams({
      categoryMain: mainCat,
      categorySub: subCat,
      status: 'PENDING_INSURER_FORM',
    }).toString()

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims?${qs}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session!.user.accessToken}`,
      },
    })
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(data =>
        setClaims(
          data.claims
            .filter((c: any) => c.status === 'PENDING_INSURER_FORM' && c.categorySub === subCat)
            .map((c: any) => ({
              id: c.id,
              cause: c.cause,
              createdAt: c.createdAt,
              categorySub: c.categorySub,
            }))
        )
      )
      .catch(err => setError(err.toString()))
      .finally(() => setLoading(false))
  }, [mainCat, subCat, status, session])

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status !== 'authenticated') return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <h1 className="text-3xl font-extrabold text-gray-800 text-center">
            สร้าง FPPA-04
          </h1>

          {/* Category selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">หมวดหลัก</label>
              <select
                value={mainCat}
                onChange={e => setMainCat(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- เลือกหมวดหลัก --</option>
                {ALL_MAIN.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700">หมวดย่อย</label>
              <select
                value={subCat}
                onChange={e => setSubCat(e.target.value)}
                disabled={!mainCat}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">-- เลือกหมวดย่อย --</option>
                {subOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="mt-8">
            {!mainCat || !subCat ? (
              <p className="text-center text-gray-500">กรุณาเลือกหมวดหลักและหมวดย่อยก่อน</p>
            ) : loading ? (
              <p className="text-center text-indigo-600">กำลังโหลดข้อมูล...</p>
            ) : error ? (
              <p className="text-center text-red-600">Error: {error}</p>
            ) : claims.length === 0 ? (
              <p className="text-center text-gray-500">ไม่พบเคลมสำหรับหมวดนี้</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-left border-collapse">
                  <thead>
                    <tr className="bg-indigo-100">
                      {['Form ID','สาเหตุ','วันที่สร้าง','ดำเนินการ'].map(h => (
                        <th key={h} className="px-4 py-2 text-gray-700 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {claims.map(c => (
                      <motion.tr key={c.id} whileHover={{ backgroundColor: 'rgba(239,246,255,1)' }} className="transition">
                        <td className="px-4 py-3 text-sm text-gray-800">{c.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{c.cause}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{new Date(c.createdAt).toLocaleDateString('th-TH')}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/fppa04/${subCat}/new/${c.id}` +
                              `?categoryMain=${encodeURIComponent(mainCat)}` +
                              `&categorySub=${encodeURIComponent(subCat)}`}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            กรอก FPPA-04
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
