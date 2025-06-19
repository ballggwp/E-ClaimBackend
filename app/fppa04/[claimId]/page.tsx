// app/fppa04/[claimId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Swal from 'sweetalert2'
import FPPA04Form, { FPPA04FormValues } from '@/components/FPPA04Form'
import Link from 'next/link'

interface ClaimDefaults {
  cause: string
  approverName: string
  status: string
}

interface FPPA04Data extends FPPA04FormValues {
  signatureFiles: File[]
}

export default function FPPA04DetailPage() {
  const { claimId } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [defaults, setDefaults] = useState<{
    cause: string
    approverName: string
   status: string
  }|null>(null)
  const [initial, setInitial]   = useState<FPPA04Data|null>(null)
  const [loading, setLoading]   = useState(true)
  const showBack = [
    'PENDING_MANAGER_REVIEW',
    'PENDING_USER_CONFIRM',
    'AWAITING_SIGNATURES',
    'COMPLETED',
  ].includes(defaults?.status ?? '')
  useEffect(() => {
    if (status !== 'authenticated') return
    ;(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${claimId}`,
          { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
        )
        if (!res.ok) throw new Error(await res.text())
        const { form, claim } = await res.json()

        setDefaults({
          cause: claim.cause,
          approverName: claim.approverName,
          status : claim.status
        })
        

        if (form) {
          setInitial({
            eventType:         form.eventType,
            claimRefNumber:    form.claimRefNumber,
            eventDescription:  form.eventDescription,
            productionYear:    form.productionYear.toString(),
            accidentDate:      form.accidentDate.slice(0,10),
            reportedDate:      form.reportedDate.slice(0,10),
            receivedDocDate:   form.receivedDocDate.slice(0,10),
            company:           form.company,
            factory:           form.factory,
            policyNumber:      form.policyNumber,
            surveyorRefNumber: form.surveyorRefNumber,
            items:             form.items.map((i:any) => ({
                                  category:    i.category,
                                  description: i.description,
                                  total:       i.total.toString(),
                                  exception:   i.exception.toString(),
                                })),
            adjustments:       form.adjustments.map((a:any) => ({
                                  type:        a.type,
                                  description: a.description,
                                  amount:      a.amount.toString(),
                                })),
            signatureFiles:    [],
          })
        }
      } catch (e:any) {
        console.error(e)
        Swal.fire('Error', e.message, 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [status, claimId, session])
  
  if (loading || !defaults) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>กำลังโหลด…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* ===== HEADER WITH BOTH LINKS ===== */}
    <div className="bg-white p-4 rounded-t-lg flex items-center justify-between">
      <h2 className="text-lg font-medium text-gray-800">
        Claim ID: <span className="font-semibold">{claimId}</span>
      </h2>

      <div className="flex items-center space-x-2">

        {/* ไปยัง FPPA-04 */}
         (
          <Link
            href={`/claims/${claimId}`}
            className="text-blue-600 hover:underline"
          >
            → ดู claims
          </Link>
        )
      </div>
    </div>

        {/* ==== CARD with Header + Form ==== */}
        <div className="bg-white rounded-b-xl shadow overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b">
            <h1 className="text-3xl font-bold justify-center ">รายงานสรุปรายการรับเงินค่าสินไหมทดแทน</h1>
            <p className="text-gray-600 mt-1 ">กรอกข้อมูลกรมธรรม์และรายละเอียดเคลม</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <FPPA04Form
              initialData={initial ?? undefined}
              defaults={defaults}
              onSave={() => router.push('/fppa04')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
