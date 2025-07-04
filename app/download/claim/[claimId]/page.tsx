// --- app/download/claim/[claimId]/page.tsx ---
"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession }          from "next-auth/react";
import { useEffect, useState } from "react";
import { Image, FileText, CheckCircle, Eye, Download } from "lucide-react";
import { createCPMFormPDF }   from "@/app/lib/CPMpdf";

interface AttachmentItem {
  id: string;
  fileName: string;
  url: string;
  uploadedAt: string;
  type: string;
}

interface ClaimMeta {
  position:string;
  department:string;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const typeLabels: Record<string, string> = {
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
  console.log(session?.user.department, session?.user.position);
  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);

    const claimFetch = fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${claimId}`,
      { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
    )
      .then(r => { if (!r.ok) throw new Error("ไม่พบข้อมูลฟอร์ม"); return r.json(); })
      .then(({ claim }) => {
        const form = claim.cpmForm;
        setClaim({
          department:session.user.department,
          position : session.user.position,
          docNum:             claim.docNum,
          approverName:       claim.approverName,
          approverPosition:   claim.approverPosition,
          signerName:         claim.signerName ?? "",
          createdByName:      claim.createdByName,
          accidentDate:       form?.accidentDate?.split('T')[0] ?? "",
          accidentTime:       form?.accidentTime      ?? "",
          location:           form?.location          ?? "",
          cause:              form?.cause             ?? "",
          repairShop:         form?.repairShop        ?? "",
          repairShopLocation: form?.repairShopLocation?? "",
          policeDate:         form?.policeDate?.split('T')[0] ?? "",
          policeTime:         form?.policeTime        ?? "",
          policeStation:      form?.policeStation     ?? "",
          damageOwnType:      form?.damageOwnType     ?? "",
          damageOtherOwn:     form?.damageOtherOwn    ?? "",
          damageDetail:       form?.damageDetail      ?? "",
          damageAmount:       form?.damageAmount      ?? 0,
          victimDetail:       form?.victimDetail      ?? "",
          partnerName:        form?.partnerName       ?? "",
          partnerPhone:       form?.partnerPhone      ?? "",
          partnerLocation:    form?.partnerLocation   ?? "",
          partnerDamageDetail:form?.partnerDamageDetail?? "",
          partnerDamageAmount:form?.partnerDamageAmount?? 0,
          partnerVictimDetail:form?.partnerVictimDetail ?? "",
        });
      });

    const attachFetch = fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${claimId}/attachments`,
      { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
    )
      .then(r => { if (!r.ok) throw new Error("ไม่สามารถโหลดไฟล์ได้"); return r.json(); })
      .then(json => setAttachments(
        Array.isArray(json) ? json : (json as any).attachments ?? []
      ));

    Promise.all([claimFetch, attachFetch])
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [claimId, session, status]);

  if (status === "loading" || loading) {
    return <p className="p-6 text-center text-gray-500">กำลังโหลด…</p>;
  }

  const byType = attachments.reduce((acc, att) => {
    (acc[att.type] = acc[att.type] || []).push(att);
    return acc;
  }, {} as Record<string, AttachmentItem[]>);

  const generateDoc = () => createCPMFormPDF(claim!);

 const previewForm = () => {
    if (!claim) return;
    // generate a fresh Blob and URL for real-time updates
    const blob = generateDoc().output("blob") as Blob;
    // revoke old URL if present to avoid memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
  };

  const downloadForm = () => {
    if (!claim) return;
    generateDoc().save(`Form-${claim.docNum}.pdf`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-gray-600 mb-4 hover:underline">
        ← กลับ
      </button>

      <h1 className="text-3xl font-bold mb-6">ไฟล์ของ Claim {claim?.docNum ?? claimId}</h1>

      {claim && (
        <div className="flex justify-center mb-8 space-x-4">
          <button onClick={previewForm} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg text-lg font-medium transition">
            🔍 ดูตัวอย่าง
          </button>
          <button onClick={downloadForm} className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-medium transition">
            📄 ดาวน์โหลดแบบฟอร์ม
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">ตัวอย่างแบบฟอร์ม</h2>
          <iframe src={previewUrl} width="100%" height="600" className="border" />
          <button onClick={() => setPreviewUrl(null)} className="mt-2 text-sm text-gray-600 hover:underline">
            ปิดตัวอย่าง
          </button>
        </div>
      )}

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {attachments.length === 0 ? (
        <p className="text-gray-600">ไม่มีไฟล์แนบ</p>
      ) : (
        Object.entries(byType).map(([type, items]) => {
          const Icon = typeIcons[type] || FileText;
          const label = typeLabels[type] || type.replace(/_/g, " ");
          return (
            <section key={type} className="mb-12">
              <header className="flex items-center mb-4">
                <Icon className="w-6 h-6 text-gray-700 mr-2" />
                <h2 className="text-2xl font-semibold">{label}</h2>
              </header>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(att => (
                  <div key={att.id} className="bg-white shadow rounded-lg p-4 flex flex-col">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline truncate" title={att.fileName}>
                      {att.fileName}
                    </a>
                    <p className="text-sm text-gray-500 mt-2">
                      อัปโหลด: {new Date(att.uploadedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <div className="mt-auto flex justify-end space-x-4 pt-4 border-t border-gray-100">
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-gray-600 hover:text-gray-800">
                        <Eye className="w-5 h-5" /><span className="text-sm">ดู</span>
                      </a>
                      <a href={att.url} download={att.fileName} className="flex items-center space-x-1 text-gray-600 hover:text-gray-800">
                        <Download className="w-5 h-5" /><span className="text-sm">ดาวน์โหลด</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
