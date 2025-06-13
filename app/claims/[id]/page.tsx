// app/claims/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ClaimForm, ClaimFormValues, User } from '@/components/ClaimForm'

interface ClaimPayload {
  id: string
  status: string
  // … all the other fields you need …
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
}

export default function EditClaimPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [claim, setClaim] = useState<ClaimPayload | null>(null)
  const [approvers, setApprovers] = useState<User[]>([])
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
  const [error, setError] = useState<string | null>(null)

  // fetch the existing claim
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch(`${process.env.NEXT_PUBLIC_COMPANY_API_URL}/api/claims/${id}`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    })
      .then(r => r.json())
      .then((data: { claim: ClaimPayload }) => {
        setClaim(data.claim)
        // seed values into the form
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
  }, [status, id])

  // fetch approvers same as New page
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch(`${process.env.NEXT_PUBLIC_COMPANY_API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    })
      .then(r => r.json())
      .then(data => setApprovers(data.users))
      .catch(console.error)
  }, [status])

  if (!claim) return <p>Loading…</p>

  // **only** lock the form when status is NOT DRAFT
  const readOnly = claim.status !== 'DRAFT'

  const handleSubmit = async (
    vals: ClaimFormValues,
    f: typeof files,
    saveAsDraft: boolean
  ) => {
    setSubmitting(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.set('saveAsDraft', saveAsDraft.toString())
      formData.set('approverId', vals.approverId)
      Object.entries(vals).forEach(([k, v]) => {
        if (k !== 'approverId') formData.set(k, v as string)
      })
      f.damageFiles.forEach(f => formData.append('damageFiles', f))
      f.estimateFiles.forEach(f => formData.append('estimateFiles', f))
      f.otherFiles.forEach(f => formData.append('otherFiles', f))

      // **PUT** when editing existing claim
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_COMPANY_API_URL}/api/claims/${id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session!.user.accessToken}`,
          },
          body: formData,
        }
      )
      if (!res.ok) throw new Error(await res.text())
      router.push('/claims')
    } catch (e: any) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <ClaimForm
      values={values}
      files={files}
      onChange={e =>
        setValues(v => ({ ...v, [e.target.name]: e.target.value }))
      }
      onFileChange={(e, field) =>
        setFiles(f => ({
          ...f,
          [field]: [...f[field], ...Array.from(e.target.files!)]
        }))
      }
      onSubmit={handleSubmit}
      approverList={approvers}
      submitting={submitting}
      error={error}
      readOnly={readOnly}
    />
  )
}
