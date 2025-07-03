"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChangeEvent, useEffect, useState } from "react";
import Swal from "sweetalert2";
import FPPA04Form, { FPPA04CPMFormValues } from "@/components/FPPA04CPM";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface ViewDefaults {
  docNum: string;
  cause: string;
  approverName: string;
  status: string;
}

export default function ViewCPMPage() {
  const { viewClaimId } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [defaults, setDefaults] = useState<ViewDefaults | null>(null);
  const [initial, setInitial] = useState<FPPA04CPMFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userFiles, setUserFiles] = useState<File[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null); // For image inspection

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
    if (status !== "authenticated") return;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${viewClaimId}`,
          { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
        );
        if (!res.ok) throw new Error(await res.text());
        const { form, claim } = await res.json();
        setDefaults({
          docNum: claim.docNum,
          cause: claim.cpmForm.cause,
          approverName: claim.approverName,
          status: claim.status,
        });

        if (form) {
          setInitial({
            eventType: form.eventType,
            claimRefNumber: form.claimRefNumber,
            eventDescription: form.eventDescription,
            productionYear: form.productionYear.toString(),
            accidentDate: form.accidentDate.slice(0, 10),
            reportedDate: form.reportedDate.slice(0, 10),
            receivedDocDate: form.receivedDocDate.slice(0, 10),
            company: form.company,
            factory: form.factory,
            policyNumber: form.policyNumber,
            surveyorRefNumber: form.surveyorRefNumber,
            items: form.items.map((i: any) => ({
              category: i.category,
              description: i.description,
              total: i.total.toString(),
              exception: i.exception.toString(),
            })),
            adjustments: form.adjustments.map((a: any) => ({
              type: a.type,
              description: a.description,
              amount: a.amount.toString(),
            })),
            signatureFiles: [],
            signatureUrls: form.signatureFiles,
            insurancePayout: form.insurancePayout,
          });
        }
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [status, viewClaimId, session]);

  if (!defaults || !initial) {
    return <div className="p-6">{error ? `Error: ${error}` : "Loading…"}</div>;
  }

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
        <div>
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

      {/* Display files for other statuses */}
      {defaults.status !== "PENDING_USER_CONFIRM" && (
  <div>
    <label className="block text-sm font-medium text-gray-700">
      เอกสารที่แนบมา
    </label>
    {/* ตรวจสอบว่า signatureUrls มีค่าหรือไม่ และเป็นอาเรย์ที่มีขนาดมากกว่า 0 */}
    {Array.isArray(initial?.signatureUrls) && initial.signatureUrls.length > 0 ? (
      <div className="grid grid-cols-4 gap-4 mt-4">
        {initial.signatureUrls.map((url, index) => {
          const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(url); // ตรวจสอบว่าเป็นภาพหรือไม่
          return (
            <div key={index} className="border rounded-lg p-2 bg-white flex flex-col items-center">
              {isImage ? (
                // รูปภาพเมื่อคลิกแล้วเปิดในหน้าต่างใหม่
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    className="h-24 object-contain mb-2 cursor-pointer"
                    alt={`Document ${index + 1}`}
                  />
                </a>
              ) : (
                // ไฟล์อื่นๆ เช่น เอกสาร
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-24 w-full">
                  <div className="flex items-center justify-center text-4xl text-gray-600">
                    📄
                  </div>
                </a>
              )}
              <p className="text-xs text-gray-700 truncate w-full text-center">Document {index + 1}</p>
              <p className="text-[10px] text-gray-500">{(url.length / 1024).toFixed(1)} KB</p>
              {/* ไม่มีปุ่มลบ */}
            </div>
          );
        })}
      </div>
    ) : (
      <div className="text-center text-gray-500">ไม่มีเอกสารที่แนบมา</div>
    )}
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
    </div>
  );
}
