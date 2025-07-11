// --- app/download/claim/[claimId]/page.tsx ---
"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
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
  approverDepartment: string;
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
  datePendingManager: string;
  dateCompleted: string;
}

export default function DownloadClaimDetailPage() {
  const { claimId } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [claim, setClaim] = useState<ClaimMeta | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [fppa04Data, setFppa04Data] = useState<Fppa04CPMData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'cpm' | 'fppa04' | null>(null);
    const [modalImage, setModalImage] = useState<string | null>(null);
  // Insurance upload state
  const [insuranceFiles, setInsuranceFiles] = useState<File[]>([]);
  const openImageModal = (url: string) => setModalImage(url);

  // Close image modal
  const closeImageModal = () => setModalImage(null);
  const typeLabels: Record<string, string> = {
    DAMAGE_IMAGE: "รูปภาพความเสียหาย",
    ESTIMATE_DOC: "เอกสารประเมินราคา",
    OTHER_DOCUMENT: "เอกสารอื่น ๆ",
    USER_CONFIRM_DOC: "เอกสารยืนยัน",
    INSURANCE_DOC: "ไฟล์ประกันเพิ่มเติม",
  };

  const typeIcons: Record<string, React.ElementType> = {
    DAMAGE_IMAGE: Image,
    ESTIMATE_DOC: FileText,
    OTHER_DOCUMENT: FileText,
    USER_CONFIRM_DOC: CheckCircle,
    INSURANCE_DOC: FileText,
  };

  // Handle multi-file selection safely
  const handleInsuranceFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;
    setInsuranceFiles(prev => [...prev, ...Array.from(files)]);
  };
  const removeInsuranceFile = (idx: number) => {
    setInsuranceFiles(prev => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);

    (async () => {
      try {
        const [resClaim, resAttach, resFppa] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${claimId}`, {
            headers: { Authorization: `Bearer ${session!.user.accessToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${claimId}/attachments`, {
            headers: { Authorization: `Bearer ${session!.user.accessToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${claimId}`, {
            headers: { Authorization: `Bearer ${session!.user.accessToken}` },
          }),
        ]);

        if (!resClaim.ok) throw new Error('ไม่พบข้อมูลฟอร์ม');
        const { claim: raw } = await resClaim.json();
        const dates = raw.statusDates || {};
        const form = raw.cpmForm;
        setClaim({
          approverDepartment: raw.approverDepartment,
          createdAt: raw.createdAt,
          signerPosition: raw.signerPosition,
          phoneNum: form.phoneNum ?? '',
          department: session!.user.department,
          position: raw.position ?? raw.signerPosition,
          docNum: raw.docNum,
          approverName: raw.approverName,
          approverPosition: raw.approverPosition,
          signerName: raw.signerName ?? '',
          createdByName: raw.createdByName,
          accidentDate: form.accidentDate?.split('T')[0] ?? '',
          accidentTime: form.accidentTime ?? '',
          location: form.location ?? '',
          cause: form.cause ?? '',
          repairShop: form.repairShop ?? '',
          repairShopLocation: form.repairShopLocation ?? '',
          policeDate: form.policeDate?.split('T')[0] ?? '',
          policeTime: form.policeTime ?? '',
          policeStation: form.policeStation ?? '',
          damageOwnType: form.damageOwnType ?? '',
          damageOtherOwn: form.damageOtherOwn ?? '',
          damageDetail: form.damageDetail ?? '',
          damageAmount: form.damageAmount ?? 0,
          victimDetail: form.victimDetail ?? '',
          partnerName: form.partnerName ?? '',
          partnerPhone: form.partnerPhone ?? '',
          partnerLocation: form.partnerLocation ?? '',
          partnerDamageDetail: form.partnerDamageDetail ?? '',
          partnerDamageAmount: form.partnerDamageAmount ?? 0,
          partnerVictimDetail: form.partnerVictimDetail ?? '',
          datePendingManager: dates['PENDING_MANAGER_REVIEW'] ?? '',
          dateCompleted: dates['COMPLETED'] ?? '',
        });

        if (resAttach.ok) {
          const attJson = await resAttach.json();
          setAttachments(Array.isArray(attJson) ? attJson : attJson.attachments || []);
        }

        if (!resFppa.ok) throw new Error('ไม่สามารถโหลด FPPA04');
        const { form: fppaForm } = await resFppa.json();
        setFppa04Data(fppaForm);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, claimId, session]);

  const handlePreview = (type: 'cpm' | 'fppa04') => {
    if (type === 'cpm' && claim) {
      const blob = createCPMFormPDF(claim).output('blob') as Blob;
      previewUrl && URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewType('cpm');
    }
    if (type === 'fppa04' && fppa04Data && claim) {
      const blob = createFPPA04CPMPDF({
        ...fppa04Data,
        approverName: claim.approverName,
        signerName: claim.signerName,
        signerPosition: claim.signerPosition,
        datePendingManager: claim.datePendingManager,
        dateCompleted: claim.dateCompleted,
      }).output('blob') as Blob;
      previewUrl && URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewType('fppa04');
    }
  };

  const handleDownload = (type: 'cpm' | 'fppa04') => {
    if (type === 'cpm' && claim)
      createCPMFormPDF(claim).save(`CPM-${claim.docNum}.pdf`);
    if (type === 'fppa04' && fppa04Data && claim)
      createFPPA04CPMPDF({
        ...fppa04Data,
        approverName: claim.approverName,
        signerName: claim.signerName,
        signerPosition: claim.signerPosition,
        datePendingManager: claim.datePendingManager,
        dateCompleted: claim.dateCompleted,
      }).save(`FPA04-CPM-${claim.docNum}.pdf`);
  };

  if (status === 'loading' || loading)
    return <p className="p-6 text-center text-gray-500">กำลังโหลด…</p>;

  const byType = attachments.reduce((acc, att) => {
    (acc[att.type] ||= []).push(att);
    return acc;
  }, {} as Record<string, AttachmentItem[]>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-gray-600 mb-4 hover:underline">← กลับ</button>
      <h1 className="text-3xl font-bold mb-6">ไฟล์ Claim {claim?.docNum}</h1>

      {/* Preview / Download Buttons */}
      <div className="flex space-x-4 mb-8">
        <button onClick={() => handlePreview('cpm')} className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg">🔍 ดู CPM</button>
        <button onClick={() => handleDownload('cpm')} className="bg-blue-600 text-white py-3 px-6 rounded-lg">📄 ดาวน์โหลด CPM</button>
        <button onClick={() => handlePreview('fppa04')} disabled={!claim || !fppa04Data} className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg disabled:opacity-50">🔍 ดู FPA04</button>
        <button onClick={() => handleDownload('fppa04')} disabled={!claim || !fppa04Data} className="bg-green-600 text-white py-3 px-6 rounded-lg disabled:opacity-50">📄 ดาวน์โหลด FPA04</button>
      </div>

      {/* Preview Iframe */}
      {previewUrl && (
        <div className="mb-8">
          <iframe src={previewUrl} width="100%" height={600} className="border" />
          <button onClick={() => {
              previewUrl && URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
              setPreviewType(null);
            }} className="mt-2 text-sm text-gray-600 hover:underline">ปิดตัวอย่าง</button>
        </div>
      )}

      {/* Attachment Sections */}
      {attachments.length === 0 ? (
        <p className="text-gray-600">ไม่มีไฟล์แนบ</p>
      ) : (
        Object.entries(byType).map(([type, items]) => (
          <section key={type} className="mb-12">
            <header className="flex items-center mb-4">
              {React.createElement(typeIcons[type] || FileText, { className: 'w-6 h-6 text-gray-700 mr-2' })}
              <h2 className="text-2xl font-semibold">{typeLabels[type]}</h2>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(att => (
                <div key={att.id} className="bg-white shadow rounded-lg p-4 flex flex-col">
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline truncate">{att.fileName}</a>
                  <p className="text-sm text-gray-500 mt-2">อัปโหลด: {new Date(att.uploadedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <div className="mt-auto flex justify-end space-x-4 pt-4 border-t border-gray-100">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"><Eye className="w-5 h-5"/><span className="text-sm">ดู</span></a>
                    <a href={att.url} download={att.fileName} className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"><Download className="w-5 h-5"/><span className="text-sm">ดาวน์โหลด</span></a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* INSURANCE Upload Section */}
      {session?.user.role === 'INSURANCE' && claim?.dateCompleted && (
        <div className="mt-6 space-y-4 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">อัปโหลดไฟล์ประกันเพิ่มเติม</h2>
          <input type="file" multiple onChange={handleInsuranceFiles} className="block w-full text-sm text-gray-600 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          {insuranceFiles.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              {insuranceFiles.map((file, idx) => {
                const url = URL.createObjectURL(file);
                const isImage = file.type.startsWith('image/');
                return (
                  <div key={idx} className="border rounded-lg p-2 flex flex-col items-center">
                    {isImage
                      ? <img src={url} className="h-24 object-cover mb-2 cursor-pointer" onClick={() => openImageModal(url)} />
                      : <FileText className="w-8 h-8 text-gray-600 mb-2" />
                    }
                    <p className="text-xs truncate text-center">{file.name}</p>
                    <button onClick={() => removeInsuranceFile(idx)} className="mt-1 text-red-600 hover:text-red-800">✕</button>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={async () => {
            if (insuranceFiles.length === 0) { await Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์ก่อนส่ง' }); return; }
            const fd = new FormData(); insuranceFiles.forEach(f => fd.append('attachments', f));
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${claimId}/attachments`, { method: 'POST', headers: { Authorization: `Bearer ${session!.user.accessToken}` }, body: fd });
            if (!res.ok) { const msg = await res.text(); throw new Error(msg); }
            await Swal.fire({ icon: 'success', title: 'ส่งไฟล์เรียบร้อย' });
            setInsuranceFiles([]);
            router.refresh();
          }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">ส่งไฟล์</button>
        </div>
      )}
    </div>
  );
}