// app/fppa04/CPM/[viewClaimId]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession }        from 'next-auth/react'
import { useEffect, useState } from 'react'
import Swal                  from 'sweetalert2'
import FPPA04Form, { FPPA04CPMFormValues } from '@/components/FPPA04CPM'
import Link from 'next/link'

interface ViewDefaults {
  docNum:       string
  cause:        string
  approverName: string
  status:       string
}

export default function ViewCPMPage() {
  const { viewClaimId } = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()

  const [defaults, setDefaults] = useState<ViewDefaults| null>(null)
  const [initial,  setInitial]  = useState<FPPA04CPMFormValues | null>(null)
  const [error,    setError]    = useState<string| null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return

    ;(async () => {
      try {
        // 1) GET your CPM base+variant + claim for cause/approverName/status
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${viewClaimId}`,
          { headers: { Authorization: `Bearer ${session!.user.accessToken}` }}
        )
        if (!res.ok) throw new Error(await res.text())
        const { form, claim } = await res.json()
        console.log(claim)
        // 2) seed the form header defaults
        setDefaults({
          docNum:       claim.docNum,  
          cause:        claim.cpmForm.cause,
          approverName: claim.approverName,
          status:       claim.status,
        })

        // 3) seed the CPM variant data if present
        if (form) {
          setInitial({
            eventType:        form.eventType,
            claimRefNumber:   form.claimRefNumber,
            eventDescription: form.eventDescription,
            productionYear:   form.productionYear.toString(),
            accidentDate:     form.accidentDate.slice(0,10),
            reportedDate:     form.reportedDate.slice(0,10),
            receivedDocDate:  form.receivedDocDate.slice(0,10),
            company:          form.company,
            factory:          form.factory,
            policyNumber:     form.policyNumber,
            surveyorRefNumber:form.surveyorRefNumber,
            items:            form.items.map((i:any) => ({
                                 category:    i.category,
                                 description: i.description,
                                 total:       i.total.toString(),
                                 exception:   i.exception.toString(),
                               })),
            adjustments:      form.adjustments.map((a:any) => ({
                                 type:        a.type,
                                 description: a.description,
                                 amount:      a.amount.toString(),
                               })),
            signatureFiles: [],
            signatureUrls: form.signatureFiles             // ไฟล์ใหม่ให้ว่าง
          })
        }
      } catch (e: any) {
        setError(e.message)
      }
    })()
  }, [status, viewClaimId, session])

  if (!defaults || !initial) {
    return <div className="p-6">{error ? `Error: ${error}` : 'Loading…'}</div>
  }

  return (
   <div className="min-h-screen bg-white-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="bg-grey p-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">
            Claim ID: <span className="font-semibold">{viewClaimId}</span>
          </h2>
          <Link href={`/claims/cpm/${viewClaimId}`} className="text-blue-600 hover:underline">
            → ดู claims
          </Link>
        </div>
      <h1 className="text-2xl font-bold mb-4">ดูแบบฟอร์ม CPM</h1>
      <FPPA04Form
        defaults={defaults}
        initialData={initial}
        onSave={() => {}}
      />

      {/* only show manager/user buttons */}
      {defaults.status === 'PENDING_MANAGER_REVIEW' && session?.user.role === "MANAGER" && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={async () => {
              await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${viewClaimId}/manager`, {
                method: 'POST',
                headers: {
                  'Content-Type':'application/json',
                  Authorization: `Bearer ${session!.user.accessToken}`,
                },
                body: JSON.stringify({ action:'approve'}),
              })
              router.replace('/dashboard')
            }}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            อนุมัติ
          </button>
          <button
            onClick={async () => {
              const { value: note } = await Swal.fire({ input: 'textarea', inputLabel: 'หมายเหตุ (ถ้ามี)' })
              await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${viewClaimId}/manager`, {
                method: 'POST',
                headers: {
                  'Content-Type':'application/json',
                  Authorization: `Bearer ${session!.user.accessToken}`,
                },
                body: JSON.stringify({ action:'reject', comment: "Manager-"+note||'' }),
              })
              router.replace('/dashboard')
            }}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            ปฏิเสธ
          </button>
        </div>
      )}

      {defaults.status === 'PENDING_USER_CONFIRM' && session?.user.role === "USER" && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={async () => {
              await fetch(`/api/claims/${viewClaimId}/confirm`, {
                method: 'PATCH',
                headers: {
                  'Content-Type':'application/json',
                  Authorization: `Bearer ${session!.user.accessToken}`,
                },
              })
              router.replace('/dashboard')
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            ยืนยัน
          </button>
          <button
            onClick={async () => {
              const { value: note } = await Swal.fire({ input: 'textarea', inputLabel: 'หมายเหตุ (ถ้ามี)' })
              await fetch(`/api/claims/${viewClaimId}/review`, {
                method: 'PATCH',
                headers: {
                  'Content-Type':'application/json',
                  Authorization: `Bearer ${session!.user.accessToken}`,
                },
                body: JSON.stringify({ action:'reject', comment: note||'' }),
              })
              router.replace('/dashboard')
            }}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            ปฏิเสธ
          </button>
        </div>
      )}
    </div>
    </div>
  )
}
