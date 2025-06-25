'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Swal from 'sweetalert2'
import FPPA04Form, { FPPA04CPMFormValues } from '@/components/FPPA04CPM'
import Link from 'next/link'

export default function NewFPPA04CPMPage() {
  const { claimId }          = useParams()
  const router              = useRouter()
  const { data: session }   = useSession()
  const categoryMain        = 'Physical Assets'
  const categorySub         = 'CPM'
  console.log(categoryMain,categorySub)
  const [defaults, setDefaults] = useState<{
    cause:        string
    approverName: string
    status:       string
  } | null>(null)
  const [initial, setInitial] = useState<FPPA04CPMFormValues | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    ;(async () => {
      setLoading(true)
      try {
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.user.accessToken}`,
        }

        // 1) CREATE the CPM record unconditionally
        const createRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              claimId,
              categoryMain,  // <-- map to your Prisma fields
              categorySub,
            })
          }
        )
        if (!createRes.ok) {
          throw new Error(await createRes.text())
        }

        // 2) Now fetch the newly-created base + existing CPM form (if any)
        const res2 = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${claimId}`, { headers }
        )
        if (!res2.ok) {
          throw new Error(await res2.text())
        }

        const { form, claim } = await res2.json()

        // 3) seed your header defaults
        setDefaults({
          cause:        claim.cause,
          approverName: claim.approverName,
          status:       claim.status,
        })

        // 4) if we have variant data already (unlikely on first create), seed it too
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
            signatureFiles:   [],
          })
        }
      } catch (err:any) {
        console.error(err)
        Swal.fire('Error', err.message, 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [session, claimId, categoryMain, categorySub])

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
        {/* HEADER */}
        <div className="bg-white p-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">
            Claim ID: <span className="font-semibold">{claimId}</span>
          </h2>
          <Link href={`/claims/${claimId}`} className="text-blue-600 hover:underline">
            → ดู claims
          </Link>
        </div>
        {/* FORM CARD */}
        <div className="bg-white rounded-b-xl shadow overflow-hidden">
          <div className="px-8 py-6 border-b">
            <h1 className="text-3xl font-bold">รายงานสรุปรายการรับเงินค่าสินไหมทดแทน</h1>
            <p className="text-gray-600 mt-1">กรอกข้อมูลกรมธรรม์และรายละเอียดเคลม</p>
          </div>
          <div className="px-8 py-6">
            <FPPA04Form
              defaults={defaults}
              initialData={initial ?? undefined}
              onSave={() => router.push('/fppa04')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
