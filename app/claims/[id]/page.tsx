'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface ClaimDetail {
  id: string
  userId: string
  approverId: string
  date: string
  time: string
  location: string
  cause: string
  attachments: {
    damageFiles: string[]
    estimateFiles: string[]
    otherFiles: string[]
  }
  approverName?: string
}

export default function ClaimDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/claims/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.claim) throw new Error('ไม่พบเคลมนี้')
        setClaim(data.claim)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!claim) return <p>No claim data.</p>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl mb-4">รายละเอียดเคลม #{claim.id}</h1>
      <p><strong>ผู้ขอเคลม (User):</strong> {claim.userId}</p>
      <p><strong>ผู้เซ็นเอกสาร (Approver):</strong> {claim.approverName || claim.approverId}</p>
      <p><strong>วันที่/เวลา:</strong> {claim.date} {claim.time}</p>
      <p><strong>สถานที่:</strong> {claim.location}</p>
      <p><strong>สาเหตุ:</strong> {claim.cause}</p>

      <section className="mt-6">
        <h2 className="text-xl mb-2">ไฟล์แนบ</h2>
        <div>
          <h3 className="font-medium">รูปภาพความเสียหาย</h3>
          <ul className="list-disc ml-6">
            {claim.attachments.damageFiles.map(name => (
              <li key={name}>
                <a href={`/uploads/${name}`} target="_blank" className="underline text-blue-600">
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <h3 className="font-medium">เอกสารสำรวจความเสียหาย</h3>
          <ul className="list-disc ml-6">
            {claim.attachments.estimateFiles.map(name => (
              <li key={name}>
                <a href={`/uploads/${name}`} target="_blank" className="underline text-blue-600">
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <h3 className="font-medium">เอกสารเพิ่มเติมอื่นๆ</h3>
          <ul className="list-disc ml-6">
            {claim.attachments.otherFiles.map(name => (
              <li key={name}>
                <a href={`/uploads/${name}`} target="_blank" className="underline text-blue-600">
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-6 flex space-x-4">
        {/* ปุ่ม action: ปรับตาม role */}
        <button
          onClick={() => {/* TODO: call PATCH /api/claims/${id}/status?status=CHANGE_REQUESTED */}}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          ขอแก้ไขข้อมูล
        </button>
        <button
          onClick={() => {/* TODO: call PATCH /api/claims/${id}/status?status=REJECTED */}}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          ปฏิเสธ
        </button>
        <button
          onClick={() => {/* TODO: call PATCH /api/claims/${id}/status?status=APPROVED */}}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          อนุมัติ
        </button>
      </div>
    </div>
  )
}