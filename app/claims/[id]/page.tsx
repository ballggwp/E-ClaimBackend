// app/claims/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ClaimForm, ClaimFormValues, User } from '@/components/ClaimForm'
import Swal from 'sweetalert2'
import Link from 'next/link'

interface Attachment {
  id: string
  fileName: string
  url: string
  type: 'DAMAGE_IMAGE' | 'ESTIMATE_DOC' | 'OTHER_DOCUMENT'
  createdAt?: string
}

interface ClaimPayload {
  insurerComment: any
  id: string
  status: string
  approverId: string
  accidentDate: string
  accidentTime: string
  location: string
  cause: string
  policeDate?: string
  policeTime?: string
  policeStation?: string
  damageOwnType: 'mitrphol' | 'other'
  damageOtherOwn: string
  damageDetail: string
  damageAmount: string
  victimDetail: string
  partnerName: string
  partnerPhone: string
  partnerLocation: string
  partnerDamageDetail: string
  partnerDamageAmount: string
  partnerVictimDetail: string
  attachments: Attachment[]
  createdByName : string
}

export default function ClaimDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [claim, setClaim] = useState<ClaimPayload | null>(null)
  const [values, setValues] = useState<ClaimFormValues>({
    approverId: '',
    accidentDate: '',
    accidentTime: '',
    location: '',
    cause: '',
    policeDate: '',
    policeTime: '',
    policeStation: '',
    damageOwnType: 'mitrphol',
    damageOtherOwn: '',
    damageDetail: '',
    damageAmount: '',
    victimDetail: '',
    partnerName: '',
    partnerPhone: '',
    partnerLocation: '',
    partnerDamageDetail: '',
    partnerDamageAmount: '',
    partnerVictimDetail: '',
  })
  const [files, setFiles] = useState({
    damageFiles: [] as File[],
    estimateFiles: [] as File[],
    otherFiles: [] as File[],
  })
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const isInsurer = session?.user.role === 'INSURANCE'

  // Fetch claim details once
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${id}`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    })
      .then(res => res.json())
      .then((data: { claim: ClaimPayload }) => {
        setClaim(data.claim)
        // Seed form values
        setValues({
          approverId: data.claim.approverId,
          accidentDate: data.claim.accidentDate.slice(0,10),
          accidentTime: data.claim.accidentTime,
          location: data.claim.location,
          cause: data.claim.cause,
          policeDate: data.claim.policeDate?.slice(0,10) || '',
          policeTime: data.claim.policeTime || '',
          policeStation: data.claim.policeStation || '',
          damageOwnType: data.claim.damageOwnType,
          damageOtherOwn: data.claim.damageOtherOwn,
          damageDetail: data.claim.damageDetail,
          damageAmount: String(data.claim.damageAmount ?? ''),
          victimDetail: data.claim.victimDetail,
          partnerName: data.claim.partnerName,
          partnerPhone: data.claim.partnerPhone,
          partnerLocation: data.claim.partnerLocation,
          partnerDamageDetail: data.claim.partnerDamageDetail,
          partnerDamageAmount: String(data.claim.partnerDamageAmount ?? ''),
          partnerVictimDetail: data.claim.partnerVictimDetail,
          
        })
      })
      .catch(console.error)
  }, [status, id, session])

  // Approvers list state
  const [approvers, setApprovers] = useState<User[]>([])

  // Fetch approvers list
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    })
      .then(res => res.json())
      .then(data => setApprovers(data.users))
      .catch(console.error)
  }, [status, session])

  if (!claim) return <p className="p-6">Loading…</p>
  const allowed = [
    'PENDING_MANAGER_REVIEW',
    'PENDING_USER_CONFIRM',
    'AWAITING_SIGNATURES',
    'COMPLETED',
  ]
  // Editable only when status is DRAFT or AWAITING_EVIDENCE
  const editableStatuses = ['DRAFT', 'AWAITING_EVIDENCE']
  const canEdit =
    session!.user.role !== 'INSURANCE' &&
    editableStatuses.includes(claim.status)
  const readOnly = !canEdit
  // Handle file selection
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof files
  ) => {
    if (!e.target.files) return
    setFiles(prev => ({
      ...prev,
      [field]: [...prev[field], ...Array.from(e.target.files!)],
    }))
  }

  // Handle form submission (update)
  const handleSubmit = async (
    vals: ClaimFormValues,
    f: typeof files,
    saveAsDraft: boolean
  ) => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.set('saveAsDraft', saveAsDraft.toString())
      fd.set('approverId', vals.approverId)
      Object.entries(vals).forEach(([k, v]) => k !== 'approverId' && fd.set(k, v as string))
      f.damageFiles.forEach(file => fd.append('damageFiles', file))
      f.estimateFiles.forEach(file => fd.append('estimateFiles', file))
      f.otherFiles.forEach(file => fd.append('otherFiles', file))

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        body: fd,
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/claims')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle insurer actions
  const handleAction = async (action: 'approve' | 'reject' | 'request_evidence') => {
    let comment: string | undefined

  // For reject / request_evidence, prompt for a comment
  if (action === 'reject' || action === 'request_evidence') {
    const { value: text } = await Swal.fire({
      title: action === 'reject' ? 'กรุณาใส่เหตุผลการปฏิเสธ' : 'ขอเอกสารเพิ่มเติม กรุณาอธิบาย',
      input: 'textarea',
      inputPlaceholder: 'พิมพ์ข้อความที่นี่...',
      inputAttributes: { 'aria-label': 'Your comment' },
      showCancelButton: true
    })
    if (!text) {
      // user cancelled or empty
      return
    }
    comment = text
  }
    setActionLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${id}/action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session!.user.accessToken}`,
          },
          body: JSON.stringify({ action ,comment}),
        }
      )
      if (!res.ok) throw new Error(await res.text())

    // instead of using res.json() directly:
    const detailRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${id}`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    })
    const { claim: freshClaim } = await detailRes.json()
    setClaim(freshClaim)
    router.push('/dashboard')
  } catch (e: any) {
    alert(e.message)
  } finally {
    setActionLoading(false)
  }
  }

  // Map field to attachment type
  const typeMap = {
    damageFiles: 'DAMAGE_IMAGE',
    estimateFiles: 'ESTIMATE_DOC',
    otherFiles: 'OTHER_DOCUMENT',
  } as const
  
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      {/* 2) Insurer’s comment, if any */}
    {claim.insurerComment && (
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
        <h4 className="font-semibold">Comment from Insurer:</h4>
        <p className="whitespace-pre-wrap">{claim.insurerComment}</p>
      </div>
    )}
    <div className="mb-6 text-gray-700">
  <span className="font-semibold">ผู้กรอกแบบฟอร์ม:</span> {claim.createdByName}
</div>
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Claim Detail: {claim.id}</h1>
      {/* … your other claim fields … */}
      <p>Status: <span className="font-semibold">{claim.status}</span></p>

      {allowed.includes(claim.status) && (
        <Link
          href={`/fppa04/${claim.id}`}
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          → ไปยัง FPPA-04
        </Link>
      )}
    </div>
      {/* Form Section */}
      <ClaimForm
        values={values}
        files={files}
        onChange={(e: { target: { name: any; value: any } }) => setValues((v: any) => ({ ...v, [e.target.name]: e.target.value }))}
        onFileChange={handleFileChange}
        onSubmit={handleSubmit}
        approverList={approvers}
        submitting={submitting}
        error={null}
        readOnly={readOnly}
        isEvidenceFlow={claim.status === 'AWAITING_EVIDENCE'}
      />
      
      { (
        <section className="pt-6 border-t space-y-10">
          <h2 className="text-2xl font-bold">ไฟล์แนบ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* รูปภาพความเสียหาย */}
            <div>
              <h3 className="text-lg font-semibold mb-4">รูปภาพความเสียหาย</h3>
              <div className="grid grid-cols-1 gap-4">
                {claim.attachments.filter(a => a.type === 'DAMAGE_IMAGE').map(att => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg shadow hover:shadow-lg transition">
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      {/\.(jpe?g|png)$/i.test(att.url) ? (
                        <img src={att.url} alt={att.fileName} className="object-cover h-full w-full" />
                      ) : (
                        <span className="text-6xl text-gray-400">📄</span>
                      )}
                    </div>
                    <p className="mt-2 px-2 py-1 text-sm text-gray-700 truncate bg-white border-t">{att.fileName}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* เอกสารสำรวจความเสียหาย */}
            <div>
              <h3 className="text-lg font-semibold mb-4">เอกสารสำรวจความเสียหาย</h3>
              <div className="grid grid-cols-1 gap-4">
                {claim.attachments.filter(a => a.type === 'ESTIMATE_DOC').map(att => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg shadow hover:shadow-lg transition">
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      {/\.(jpe?g|png)$/i.test(att.url) ? (
                        <img src={att.url} alt={att.fileName} className="object-cover h-full w-full" />
                      ) : (
                        <span className="text-6xl text-gray-400">📄</span>
                      )}
                    </div>
                    <p className="mt-2 px-2 py-1 text-sm text-gray-700 truncate bg-white border-t">{att.fileName}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* เอกสารเพิ่มเติมอื่น ๆ */}
            <div>
              <h3 className="text-lg font-semibold mb-4">เอกสารเพิ่มเติมอื่น ๆ</h3>
              <div className="grid grid-cols-1 gap-4">
                {claim.attachments.filter(a => a.type === 'OTHER_DOCUMENT').map(att => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg shadow hover:shadow-lg transition">
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      {/\.(jpe?g|png)$/i.test(att.url) ? (
                        <img src={att.url} alt={att.fileName} className="object-cover h-full w-full" />
                      ) : (
                        <span className="text-6xl text-gray-400">📄</span>
                      )}
                    </div>
                    <p className="mt-2 px-2 py-1 text-sm text-gray-700 truncate bg-white border-t">{att.fileName}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Insurer Action Buttons */}
      {isInsurer && claim.status === 'PENDING_INSURER_REVIEW' && (
        <div className="flex space-x-4">
          <button
            onClick={() => handleAction('approve')}
            disabled={actionLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={actionLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded"
          >
            Reject
          </button>
          <button
            onClick={() => handleAction('request_evidence')}
            disabled={actionLoading}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded"
          >
            Request Evidence
          </button>
        </div>
      )}
      {readOnly && (
          <p className="text-gray-600 italic pt-6 text-sm">
            แบบฟอร์มนี้อยู่ในสถานะรอการดำเนินการ (view‐only)
          </p>
        )}
    </div>
  )
}
