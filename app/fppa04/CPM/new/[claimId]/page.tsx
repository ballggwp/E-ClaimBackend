'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Swal from 'sweetalert2'
import FPPA04Form, { FPPA04CPMFormValues } from '@/components/FPPA04CPM'
import Link from 'next/link'

export default function NewFPPA04CPMPage() {
  const { claimId }       = useParams()
  const router            = useRouter()
  const { data: session } = useSession()
  const STORAGE_KEY       = `FPPA04-${claimId}-draft`

  const [defaults, setDefaults] = useState<{ docNum:string; cause:string; approverName:string; status:string;signerName:string } | null>(null)
  const [draft,   setDraft]     = useState<FPPA04CPMFormValues | null>(null)
  const [loading, setLoading]   = useState(true)

  // load draft from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setDraft(JSON.parse(saved))
  }, [STORAGE_KEY])

  // persist draft on every change
  const handleDraftChange = useCallback((newVals: FPPA04CPMFormValues) => {
    setDraft(newVals)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVals))
    } catch {}
  }, [STORAGE_KEY])

  useEffect(() => {
    if (!session) return
    ;(async () => {
      try {
        setLoading(true)
        // 1) fetch claim to get defaults
        const claimRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${claimId}`,
          { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
        )
        if (!claimRes.ok) throw new Error(await claimRes.text())
        const { claim } = await claimRes.json()
        setDefaults({
          docNum:       claim.docNum,
          cause:        claim.cpmForm?.cause || '',
          approverName: claim.approverName,
          status:       claim.status,
          signerName:claim.signerName
        })

        // 2) ensure FPPA04 base exists
        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.user.accessToken}`
            },
            body: JSON.stringify({ claimId, categoryMain: 'Physical Assets', categorySub: 'CPM' })
          }
        )

        // 3) fetch existing form data (if any)
        const f04Res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${claimId}`,
          { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
        )
        if (f04Res.ok) {
          const { form } = await f04Res.json()
          if (form) {
            const seeded: FPPA04CPMFormValues = {
              eventType:        form.eventType,
              claimRefNumber:   form.claimRefNumber,
              eventDescription: form.eventDescription,
              productionYear:   String(form.productionYear),
              accidentDate:     form.accidentDate.slice(0,10),
              reportedDate:     form.reportedDate.slice(0,10),
              receivedDocDate:  form.receivedDocDate.slice(0,10),
              company:          form.company,
              factory:          form.factory,
              policyNumber:     form.policyNumber,
              surveyorRefNumber:form.surveyorRefNumber,
              items:            form.items.map((i:any) => ({ category: i.category, description: i.description, total: String(i.total), exception: String(i.exception) })),
              adjustments:      form.adjustments.map((a:any) => ({ type: a.type, description: a.description, amount: String(a.amount) })),
              signatureFiles:   [], // existing URLs handled in form
              insurancePayout:  String(form.insurancePayout),
              //netAmount:        String(form.netAmount)
            }
            setDraft(seeded)
          }
        }
      } catch (err:any) {
        console.error(err)
        Swal.fire('Error', err.message, 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [session, claimId])

  if (loading || !defaults) {
    return <div className="flex items-center justify-center h-screen"><p>กำลังโหลด…</p></div>
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* header */}
        <div className="bg-white p-4 rounded-t-lg flex justify-between">
          <h2 className="text-lg font-medium text-gray-800">
            Claim ID: <span className="font-semibold">{claimId}</span>
          </h2>
          <Link href={`/claims/cpm/${claimId}`} className="text-blue-600 hover:underline">→ ดู claims</Link>
        </div>
        {/* form card */}
        <div className="bg-white rounded-b-xl shadow">
          <div className="px-8 py-6 border-b">
            <h1 className="text-3xl font-bold">รายงานสรุปรายการรับเงินค่าสินไหมทดแทน</h1>
            <p className="text-gray-600 mt-1">กรอกข้อมูลกรมธรรม์และรายละเอียดเคลม</p>
          </div>
          <div className="px-8 py-6">
            <FPPA04Form
              defaults={defaults}
              initialData={draft!}
              onChange={handleDraftChange}
              onSave={async (vals) => {
                // clear draft then navigate
                localStorage.removeItem(STORAGE_KEY)
                router.push(`/dashboard`)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}