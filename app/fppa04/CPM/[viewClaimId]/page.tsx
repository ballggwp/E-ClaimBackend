"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChangeEvent, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from "react";
import Swal from "sweetalert2";
import FPPA04Form, { FPPA04CPMFormValues } from "@/components/FPPA04CPM";
import { CheckCircle, FileText, XCircle } from "lucide-react";
import Link from "next/link";
import { createCPMFormPDF } from "@/app/lib/CPMpdf";
import { createFPPA04CPMPDF, type Fppa04CPMData } from '@/app/lib/FPPA04CPMpdf';

interface ViewDefaults {
  signerName:string;
  docNum: string;
  cause: string;
  approverName: string;
  status: string;
}
interface ClaimMeta {
  approverDepartment:string;
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
  datePendingManager: string;   // ISO when status went to PENDING_MANAGER_REVIEW
  dateCompleted:      string; 
}
interface AttachmentItem {
  id: string;
  fileName: string;
  url: string;
  type: string;
}
export default function ViewCPMPage() {
  const { viewClaimId } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [claim, setClaim] = useState<ClaimMeta | null>(null);
  const [defaults, setDefaults] = useState<ViewDefaults | null>(null);
  const [initial, setInitial] = useState<FPPA04CPMFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userFiles, setUserFiles] = useState<File[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null); // For image inspection
  const [fppa04Data, setFppa04Data] = useState<Fppa04CPMData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const [attachments, setAttachments] = useState<AttachmentItem[]>([]); 
  const [previewType, setPreviewType] = useState<'cpm' | 'fppa04' | null>(null);
  // Handle file uploads
  const handleUserFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setUserFiles((prev) => [...prev, ...newFiles]); // append แทน override
  };

  // Remove selected files
  const removeFile = (index: number) => {
    setUserFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Open image in modal
  const openImageModal = (url: string) => setModalImage(url);

  // Close image modal
  const closeImageModal = () => setModalImage(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    (async () => {
      try {
        // 1) Fetch CPM metadata + form
        const res1 = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${viewClaimId}`,
          { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
        );
        if (!res1.ok) throw new Error('ไม่พบข้อมูลฟอร์ม');
        const { claim: raw } = await res1.json();
        const dates = raw.statusDates ?? {};
        const form = raw.cpmForm;

        // Flatten
        const flat: ClaimMeta = {
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
          dateCompleted: dates['COMPLETED'] ?? ''
        };

        setClaim(flat);
        setDefaults({
          signerName: flat.signerName,
          docNum: flat.docNum,
          cause: flat.cause,
          approverName: flat.approverName,
          status: raw.status
        });
        const attRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${viewClaimId}/attachments`,
          { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
        );
        if (attRes.ok) {
          const attJson = await attRes.json();
          setAttachments(Array.isArray(attJson) ? attJson : attJson.attachments || []);
        }


        // 2) Fetch FPPA04 form
        const res2 = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${viewClaimId}`,
          { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
        );
        if (!res2.ok) throw new Error(await res2.text());
        const { form: fppaForm } = await res2.json();
        setFppa04Data(fppaForm);

        setInitial({
          eventType: fppaForm.eventType,
          claimRefNumber: fppaForm.claimRefNumber,
          eventDescription: fppaForm.eventDescription,
          productionYear: fppaForm.productionYear.toString(),
          accidentDate: fppaForm.accidentDate.slice(0,10),
          reportedDate: fppaForm.reportedDate.slice(0,10),
          receivedDocDate: fppaForm.receivedDocDate.slice(0,10),
          company: fppaForm.company,
          factory: fppaForm.factory,
          policyNumber: fppaForm.policyNumber,
          surveyorRefNumber: fppaForm.surveyorRefNumber,
          items: fppaForm.items.map((i: { category: any; description: any; total: { toString: () => any; }; exception: { toString: () => any; }; }) => ({
            category: i.category,
            description: i.description,
            total: i.total.toString(),
            exception: i.exception.toString()
          })),
          adjustments: fppaForm.adjustments.map((a: { type: any; description: any; amount: { toString: () => any; }; }) => ({
            type: a.type,
            description: a.description,
            amount: a.amount.toString()
          })),
          signatureFiles: [],
          signatureUrls: fppaForm.signatureFiles,
          insurancePayout: fppaForm.insurancePayout
        });

      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [status, viewClaimId, session]);
const handlePreview = (type:'cpm'|'fppa04') => {
    if (type === 'cpm' && claim) {
      const blob = createCPMFormPDF(claim).output('blob') as Blob;
      previewUrl && URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewType('cpm');
    }
    if (type === 'fppa04' && fppa04Data && claim) {
      const blob = createFPPA04CPMPDF({
  // spread your FPA04 form data
  ...fppa04Data!,
  // pull approverName from the CPM claim state
  approverName: claim!.approverName,
  signerName:claim!.signerName,
  signerPosition:claim!.signerPosition,
   datePendingManager: claim.datePendingManager,
      dateCompleted:      claim.dateCompleted,
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
  approverName: claim!.approverName,
  signerName:claim!.signerName,
  signerPosition:claim!.signerPosition,
   datePendingManager: claim.datePendingManager,
      dateCompleted:      claim.dateCompleted,
}).save(`FPA04-CPM-${claim!.docNum}.pdf`);
  };
  if (!defaults || !initial) {
    return <div className="p-6">{error ? `Error: ${error}` : "Loading…"}</div>;
  }
  
const userConfirmDocs = attachments.filter((a: { type: string; }) => a.type === 'USER_CONFIRM_DOC');
  return (
    <div className="min-h-screen bg-white-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="bg-grey p-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">
            Claim ID: <span className="font-semibold">{defaults.docNum}</span>
          </h2>
          <Link
            href={`/claims/cpm/${viewClaimId}`}
            className="text-blue-600 hover:underline"
          >
            → ดู claims
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-4">ดูแบบฟอร์ม CPM</h1>
        <FPPA04Form
          defaults={defaults}
          initialData={initial}
          onSave={() => {}}
        />
        {/* Preview / Download buttons */}
        
      {/* Download Section */}
        {(defaults.status === 'PENDING_USER_CONFIRM' || defaults.status === 'COMPLETED') && (
          <>
            <label className="block text-sm font-medium text-gray-700 my-2">กรุณาเซ็นเอกสารนี้ส่งมาที่ประกัน</label>
            <div className="flex space-x-4 mb-8">
              <button onClick={() => handleDownload('cpm')} disabled={!claim} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                📄 ดาวน์โหลด CPM
              </button>
              <button onClick={() => handleDownload('fppa04')} disabled={!claim || !fppa04Data} className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                📄 ดาวน์โหลด ฟปภ04
              </button>
            </div>
          </>
        )}

        {/* Preview Iframe */}
        {previewUrl && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">{previewType === 'cpm' ? 'ตัวอย่าง CPM' : 'ตัวอย่าง FPA04-CPM'}</h2>
            <iframe src={previewUrl} width="100%" height={600} className="border" />
            <button onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewType(null); }} className="mt-2 text-sm text-gray-600 hover:underline">ปิดตัวอย่าง</button>
          </div>
        )}

        {/* User-confirm docs (completed) */}
        {defaults.status === 'COMPLETED' && userConfirmDocs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-2">เอกสารที่คุณส่งมาแล้ว</h2>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {userConfirmDocs.map(att => {
                const isImage = /\.(jpe?g|png|gif|bmp)$/i.test(att.fileName);
                return (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="border rounded-lg p-2 bg-white flex flex-col items-center hover:bg-gray-50">
                    {isImage ? (
                      <img src={att.url} className="h-24 object-contain mb-2 cursor-pointer" onClick={e => { e.preventDefault(); openImageModal(att.url); }} />
                    ) : (
                      <div className="h-24 w-full flex items-center justify-center text-4xl">📄</div>
                    )}
                    <p className="text-xs text-gray-700 truncate w-full text-center">{att.fileName}</p>
                  </a>
                );
              })}
            </div>
          </section>
        )}
          {/* Manager Approval */}
          {defaults.status === "PENDING_MANAGER_REVIEW" &&
            session?.user.role === "MANAGER" && (
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={async () => {
                    await fetch(
                      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${viewClaimId}/manager`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${session!.user.accessToken}`,
                        },
                        body: JSON.stringify({ action: "approve" }),
                      }
                    );
                    router.replace("/dashboard");
                  }}
                  className="flex items-center bg-green-500 hover:bg-green-600 text-white font-medium px-5 py-3 rounded-xl shadow-lg transition"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  อนุมัติ
                </button>
                <button
                  onClick={async () => {
                    const result = await Swal.fire({
                      title: "คุณแน่ใจหรือไม่ว่าจะปฏิเสธ?",
                      input: "textarea",
                      inputLabel: "ระบุเหตุผล (ถ้ามี)",
                      showCancelButton: true,
                      confirmButtonText: "ยืนยันปฏิเสธ",
                      cancelButtonText: "× ไม่ปฏิเสธ",
                      reverseButtons: true,
                      preConfirm: (note) => {
                        if (note === "") {
                          return Swal.showValidationMessage(
                            "โปรดระบุเหตุผลหรือกด × เพื่อยกเลิก"
                          );
                        }
                        return note;
                      },
                    });
                    if (!result.isConfirmed) return;

                    // Reject Action
                    await fetch(
                      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${viewClaimId}/manager`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${session!.user.accessToken}`,
                        },
                        body: JSON.stringify({
                          action: "reject",
                          comment: `Manager–${result.value}`,
                        }),
                      }
                    );
                    router.replace("/dashboard");
                  }}
                  className="flex items-center bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  ปฏิเสธ
                </button>
              </div>
            )}
        </div>
        
        {/* User File Upload Section */}
        <div className="mt-6 space-y-4">
          {defaults.status === "PENDING_USER_CONFIRM" && session?.user.role === "USER" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Signature / เอกสารยืนยันกลับบริษัท
          </label>
          <input
            name="confirmationFiles"
            type="file"
            multiple
            onChange={handleUserFiles}
            className="block w-full text-sm text-gray-600
             file:mr-4 file:py-2 file:px-4
             file:rounded file:border-0
             file:text-sm file:font-semibold
             file:bg-blue-50 file:text-blue-700
             hover:file:bg-blue-100"
          />
           

          {/* File Preview */}
          {userFiles.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              {userFiles.map((file, index) => {
                const url = URL.createObjectURL(file);
                const isImage = file.type.startsWith("image/");
                return (
                  <div
                    key={index}
                    className="border rounded-lg p-2 bg-white flex flex-col items-center"
                  >
                    {isImage ? (
                      <img
                        src={url}
                        className="h-24 object-contain mb-2 cursor-pointer"
                        onClick={() => openImageModal(url)} // Open image in modal
                      />
                    ) : (
                      <div className="h-24 w-full flex items-center justify-center text-4xl">
                        📄
                      </div>
                    )}
                    <p className="text-xs text-gray-700 truncate w-full text-center">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="mt-1 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          

          {/* Submit buttons */}
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={async () => {
                if (userFiles.length === 0) {
                  await Swal.fire({
                    icon: "warning",
                    title: "กรุณาแนบไฟล์ก่อนยืนยัน",
                    confirmButtonText: "ตกลง",
                  });
                  return;
                }

                const fd = new FormData();
                fd.append("action", "confirm");
                userFiles.forEach((f) => fd.append("confirmationFiles", f));

                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${viewClaimId}/userconfirm`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${session!.user.accessToken}`,
                    },
                    body: fd,
                  }
                );
                if (!res.ok) throw new Error(await res.text());
                router.replace("/dashboard");
              }}
              className="flex items-center bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg"
            >
              ยืนยัน
            </button>

            <button
              onClick={async () => {
                const { value: note } = await Swal.fire({
                  input: "textarea",
                  inputLabel: "หมายเหตุ (ถ้ามี)",
                  showCancelButton: true,
                  confirmButtonText: "ยืนยันปฏิเสธ",
                  cancelButtonText: "× ไม่ปฏิเสธ",
                  reverseButtons: true,
                  preConfirm: (n) => {
                    if (!n)
                      Swal.showValidationMessage(
                        "โปรดระบุเหตุผลหรือกด × เพื่อยกเลิก"
                      );
                    return n;
                  },
                });
                if (!note) return;

                const fd = new FormData();
                fd.append("action", "reject");
                fd.append("comment", `User–${note}`);
                userFiles.forEach((f) => fd.append("files", f));

                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${viewClaimId}/userconfirm`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${session!.user.accessToken}`,
                    },
                    body: fd,
                  }
                );
                if (!res.ok) throw new Error(await res.text());
                router.replace("/dashboard");
              }}
              className="flex items-center bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg"
            >
              ปฏิเสธ
            </button>
          </div>
          
        </div>
        
      )}
        
      {/* Image Modal for Inspection */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="relative bg-white p-4 rounded-lg max-w-lg">
            <button onClick={closeImageModal} className="absolute top-2 right-2 text-white text-xl">
              ✕
            </button>
            <img src={modalImage} className="w-full h-auto max-h-96 object-contain" />
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
