'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Swal from 'sweetalert2'
import FPPA04Form, { FPPA04FormValues } from '@/components/FPPA04Form'

interface ClaimDefaults {
  cause: string
}

interface FPPA04Data extends FPPA04FormValues {}

export default function FPPA04DetailPage() {
  const { claimId } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [defaults, setDefaults] = useState<ClaimDefaults | null>(null)
  const [initial, setInitial] = useState<FPPA04Data | null>(null)
  const [loading, setLoading] = useState(true)

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

        setDefaults({ cause: claim.cause })

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
            adjustments:       form.adjustments.map((a:any)=>({
                                  type:        a.type,
                                  description: a.description,
                                  amount:      a.amount.toString(),
                                })),
            signatureFiles:    [], // Convert string[] to File[] or leave as empty array
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
    return <div className="flex items-center justify-center h-screen"><p className="text-gray-600">กำลังโหลด…</p></div>
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-800">
            FPPA04 — Claim {claimId}
          </h1>
          <p className="mt-1 text-gray-500">
            กรอกข้อมูลกรมธรรม์และรายละเอียดเคลม
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8">
          {/* Claim Defaults */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                เลขที่แบบฟอร์มแจ้งอุบัติเหตุ
              </label>
              <input
                readOnly
                value={claimId}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                สาเหตุของอุบัติเหตุ
              </label>
              <textarea
                readOnly
                value={defaults.cause}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 h-20 resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">
                เหตุการณ์
              </label>
              <input
                readOnly
                value={initial?.eventDescription || ''}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {/* FPPA04 Form */}
          <FPPA04Form
            initialData={
            initial ?? {
              eventType: '',
              eventDescription: '',
              claimRefNumber: '',
              productionYear: '',
              accidentDate: '',
              reportedDate: '',
              receivedDocDate: '',
              company: '',
              factory: '',
              policyNumber: '',
              surveyorRefNumber: '',
              items: [],
              adjustments: [],
              signatureFiles: [],
            }
          }
            onSave={() => router.push('/fppa04')}
          />
        </div>
      </div>
    </div>
  )
}
