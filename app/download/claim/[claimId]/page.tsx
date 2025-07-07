// --- app/download/claim/[claimId]/page.tsx ---
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Image, FileText, CheckCircle, Eye, Download } from "lucide-react";
import { createCPMFormPDF } from "@/app/lib/CPMpdf";
import { createFPPA04CPMPDF, type Fppa04CPMData } from '@/app/lib/FPPA04CPMpdf';

interface AttachmentItem {
  id: string;
  fileName: string;
  url: string;
  uploadedAt: string;
  type: string;
}

interface ClaimMeta {
  createdAt: string;
  signerPosition: string;
  phoneNum: string;
  position: string;
  department: string;
  docNum: string;
  approverName: string;
  approverPosition: string;
  signerName: string;
  createdByName: string;
  accidentDate: string;
  accidentTime: string;
  location: string;
  cause: string;
  repairShop?: string;
  repairShopLocation?: string;
  policeDate?: string;
  policeTime?: string;
  policeStation?: string;
  damageOwnType: string;
  damageOtherOwn?: string;
  damageDetail?: string;
  damageAmount?: number;
  victimDetail?: string;
  partnerName?: string;
  partnerPhone?: string;
  partnerLocation?: string;
  partnerDamageDetail?: string;
  partnerDamageAmount?: number;
  partnerVictimDetail?: string;
}

export default function DownloadClaimDetailPage() {
  const { claimId } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [claim, setClaim] = useState<ClaimMeta | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [fppa04ClaimMeta, setFppa04ClaimMeta] = useState<{ approverName: string } | null>(null);
  const [fppa04Data, setFppa04Data] = useState<Fppa04CPMData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'cpm' | 'fppa04' | null>(null);

  const typeLabels: Record<string,string> = {
    DAMAGE_IMAGE:     "รูปภาพความเสียหาย",
    ESTIMATE_DOC:     "เอกสารประเมินราคา",
    OTHER_DOCUMENT:   "เอกสารอื่น ๆ",
    USER_CONFIRM_DOC: "เอกสารยืนยัน",
  };
  const typeIcons: Record<string, React.ElementType> = {
    DAMAGE_IMAGE:     Image,
    ESTIMATE_DOC:     FileText,
    OTHER_DOCUMENT:   FileText,
    USER_CONFIRM_DOC: CheckCircle,
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);

    // Fetch CPM form
    const fetchClaim = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${claimId}`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` }
    })
      .then(r => { if (!r.ok) throw new Error('ไม่พบข้อมูลฟอร์ม'); return r.json(); })
      .then(({ claim }) => {
        const form = claim.cpmForm;
        setClaim({
          createdAt:          form.createdAt,
          signerPosition:    claim.signerPosition,
          phoneNum:          form.phoneNum ?? '',
          department:        session!.user.department,
          position:          session!.user.position,
          docNum:            claim.docNum,
          approverName:      claim.approverName,
          approverPosition:  claim.approverPosition,
          signerName:        claim.signerName ?? '',
          createdByName:     claim.createdByName,
          accidentDate:      form.accidentDate?.split('T')[0] ?? '',
          accidentTime:      form.accidentTime ?? '',
          location:          form.location ?? '',
          cause:             form.cause ?? '',
          repairShop:        form.repairShop ?? '',
          repairShopLocation:form.repairShopLocation ?? '',
          policeDate:        form.policeDate?.split('T')[0] ?? '',
          policeTime:        form.policeTime ?? '',
          policeStation:     form.policeStation ?? '',
          damageOwnType:     form.damageOwnType ?? '',
          damageOtherOwn:    form.damageOtherOwn ?? '',
          damageDetail:      form.damageDetail ?? '',
          damageAmount:      form.damageAmount ?? 0,
          victimDetail:      form.victimDetail ?? '',
          partnerName:       form.partnerName ?? '',
          partnerPhone:      form.partnerPhone ?? '',
          partnerLocation:   form.partnerLocation ?? '',
          partnerDamageDetail:form.partnerDamageDetail ?? '',
          partnerDamageAmount:form.partnerDamageAmount ?? 0,
          partnerVictimDetail:form.partnerVictimDetail ?? '',
        });
      });

    // Fetch attachments
    const fetchAttachments = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${claimId}/attachments`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` }
    })
      .then(r => { if (!r.ok) throw new Error('ไม่สามารถโหลดไฟล์ได้'); return r.json(); })
      .then(json => setAttachments(Array.isArray(json) ? json : json.attachments || []));

    // Fetch FPA04-CPM via Express endpoint
    const fetchFppa04 = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${claimId}`, {
    headers:{ Authorization:`Bearer ${session!.user.accessToken}` }
  })
    .then(r => r.ok ? r.json() : null)
    .then((data: { form: Fppa04CPMData; claim: { approverName: string } } | null) => {
      if (data?.form) {
        setFppa04Data(data.form);
        setFppa04ClaimMeta({ approverName: data.claim.approverName });
      }
    });

    Promise.all([fetchClaim, fetchAttachments, fetchFppa04])
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [claimId, session, status]);

  const handlePreview = (type:'cpm'|'fppa04') => {
    if (type === 'cpm' && claim) {
      const blob = createCPMFormPDF(claim).output('blob') as Blob;
      previewUrl && URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewType('cpm');
    }
    if (type === 'fppa04' && fppa04Data) {
      const blob = createFPPA04CPMPDF({
  // spread your FPA04 form data
  ...fppa04Data!,
  // pull approverName from the CPM claim state
  approverName: claim!.approverName
}).output("blob") as Blob;
      previewUrl && URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewType('fppa04');
    }
  };

  const handleDownload = (type:'cpm'|'fppa04') => {
    if (type === 'cpm' && claim) createCPMFormPDF(claim).save(`CPM-${claim.docNum}.pdf`);
    if (type === 'fppa04' && fppa04Data && claim) createFPPA04CPMPDF({
  ...fppa04Data!,
  approverName: claim!.approverName
}).save(`FPA04-CPM-${claim!.docNum}.pdf`);
  };

  if (status === 'loading' || loading) return <p className="p-6 text-center text-gray-500">กำลังโหลด…</p>;

  const byType = attachments.reduce((acc,att) => { (acc[att.type]=acc[att.type]||[]).push(att); return acc; },{} as Record<string,AttachmentItem[]>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-gray-600 mb-4 hover:underline">← กลับ</button>
      <h1 className="text-3xl font-bold mb-6">ไฟล์ Claim {claim?.docNum}</h1>

      <div className="flex space-x-4 mb-8">
        <button onClick={()=>handlePreview('cpm')}                    className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg">🔍 ดู CPM</button>
        <button onClick={()=>handleDownload('cpm')}                   className="bg-blue-600 text-white py-3 px-6 rounded-lg">📄 ดาวน์โหลด CPM</button>
        <button onClick={()=>handlePreview('fppa04')}                 disabled={!fppa04Data} className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg">🔍 ดู FPA04</button>
        <button onClick={()=>handleDownload('fppa04')}                disabled={!fppa04Data} className="bg-green-600 text-white py-3 px-6 rounded-lg">📄 ดาวน์โหลด FPA04</button>
      </div>

      {previewUrl && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">{previewType==='cpm'?'ตัวอย่าง CPM':'ตัวอย่าง FPA04-CPM'}</h2>
          <iframe src={previewUrl} width="100%" height="600" className="border" />
          <button onClick={()=>{setPreviewUrl(null);setPreviewType(null);}} className="mt-2 text-sm text-gray-600 hover:underline">ปิดตัวอย่าง</button>
        </div>
      )}

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {attachments.length===0 ? (
        <p className="text-gray-600">ไม่มีไฟล์แนบ</p>
      ) : (
        Object.entries(byType).map(([type,items]) => (
          <section key={type} className="mb-12">
            <header className="flex items-center mb-4">
              {React.createElement(typeIcons[type]||FileText,{className:'w-6 h-6 text-gray-700 mr-2'})}
              <h2 className="text-2xl font-semibold">{typeLabels[type]||type}</h2>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(att => (
                <div key={att.id} className="bg-white shadow rounded-lg p-4 flex flex-col">
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline truncate" title={att.fileName}>{att.fileName}</a>
                  <p className="text-sm text-gray-500 mt-2">อัปโหลด: {new Date(att.uploadedAt).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'})}</p>
                  <div className="mt-auto flex justify-end space-x-4 pt-4 border-t border-gray-100">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-_GRAY-600 hover:text-gray-800"><Eye className="w-5 h-5"/><span className="text-sm">ดู</span></a>
                    <a href={att.url} download={att.fileName} className="flex items-center space-x-1 text-Gray-600 hover:text-gray-800"><Download className="w-5 h-5"/><span className="text-sm">ดาวน์โหลด</span></a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
