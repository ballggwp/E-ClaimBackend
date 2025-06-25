// app/claims/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import CPMForm, { CPMFormValues, CPMSubmitHandler, User } from "@/components/CPMForm";
import Swal from "sweetalert2";
import Link from "next/link";

interface Attachment {
  id: string;
  fileName: string;
  url: string;
  type: "DAMAGE_IMAGE" | "ESTIMATE_DOC" | "OTHER_DOCUMENT";
  createdAt?: string;
}

interface CpmData {
  accidentDate: string;
  accidentTime: string;
  location: string;
  cause: string;
  repairShop: string;
  policeDate?: string;
  policeTime?: string;
  policeStation?: string;
  damageOwnType: "mitrphol" | "other";
  damageOtherOwn: string;
  damageDetail: string;
  damageAmount: string;
  victimDetail: string;
  partnerName: string;
  partnerPhone: string;
  partnerLocation: string;
  partnerDamageDetail: string;
  partnerDamageAmount: string;
  partnerVictimDetail: string;
}

interface ClaimPayload {
  id: string;
  docNum:string;
  status: string;
  approverId: string;
  createdByName: string;
  insurerComment?: string;
  cpmForm?: CpmData;
  attachments: Attachment[];
}

export default function ClaimDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [claim, setClaim] = useState<ClaimPayload | null>(null);
  const [values, setValues] = useState<CPMFormValues>({
    accidentDate: "",
    accidentTime: "",
    location: "",
    cause: "",
    repairShop: "",
    policeDate: "",
    policeTime: "",
    policeStation: "",
    damageOwnType: "mitrphol",
    damageOtherOwn: "",
    damageDetail: "",
    damageAmount: "",
    victimDetail: "",
    partnerName: "",
    partnerPhone: "",
    partnerLocation: "",
    partnerDamageDetail: "",
    partnerDamageAmount: "",
    partnerVictimDetail: "",
  });
  const [files, setFiles] = useState({
    damageFiles: [] as File[],
    estimateFiles: [] as File[],
    otherFiles: [] as File[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInsurer = session?.user.role === "INSURANCE";
  const editableStatuses = ["DRAFT", "AWAITING_EVIDENCE"];

  // Fetch claim details
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${id}`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    })
      .then((res) => res.json())
      .then((data: { claim: ClaimPayload }) => {
        const c = data.claim;
        if (!c.cpmForm) {
          setError("No CPM form data available");
          return;
        }
        setClaim(c);
        setValues({
          accidentDate: c.cpmForm.accidentDate?.slice(0, 10) ?? "",
          accidentTime: c.cpmForm.accidentTime ?? "",
          location: c.cpmForm.location ?? "",
          cause: c.cpmForm.cause ?? "",
          repairShop:c.cpmForm.repairShop ??"",
          policeDate: c.cpmForm.policeDate?.slice(0, 10) ?? "",
          policeTime: c.cpmForm.policeTime ?? "",
          policeStation: c.cpmForm.policeStation ?? "",
          damageOwnType: c.cpmForm.damageOwnType,
          damageOtherOwn: c.cpmForm.damageOtherOwn ?? "",
          damageDetail: c.cpmForm.damageDetail ?? "",
          damageAmount: String(c.cpmForm.damageAmount ?? ""),
          victimDetail: c.cpmForm.victimDetail ?? "",
          partnerName: c.cpmForm.partnerName ?? "",
          partnerPhone: c.cpmForm.partnerPhone ?? "",
          partnerLocation: c.cpmForm.partnerLocation ?? "",
          partnerDamageDetail: c.cpmForm.partnerDamageDetail ?? "",
          partnerDamageAmount: String(c.cpmForm.partnerDamageAmount ?? ""),
          partnerVictimDetail: c.cpmForm.partnerVictimDetail ?? "",
        });
      })
      .catch((err) => setError(err.message));
  }, [status, id, session]);

  // Approvers list
  const [approvers, setApprovers] = useState<User[]>([]);
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setApprovers(data.users))
      .catch(console.error);
  }, [status, session]);

  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!claim) return <p className="p-6">Loading…</p>;

  const canEdit =
    session!.user.role !== "INSURANCE" &&
    editableStatuses.includes(claim.status);
  const readOnly = !canEdit;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof files
  ) => {
    if (!e.target.files) return;
    setFiles((prev) => ({
      ...prev,
      [field]: [...prev[field], ...Array.from(e.target.files!)],
    }));
  };
  const handleFileRemove = (
    field: 'damageFiles' | 'estimateFiles' | 'otherFiles',
    idx: number
  ) => {
    setFiles(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx)
    }))
  }

  const handleSubmit = async (
    vals: CPMFormValues,
    f: typeof files,
    saveAsDraft: boolean
  ) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("saveAsDraft", saveAsDraft.toString());
      Object.entries(vals).forEach(
        ([k, v]) => k !== "approverId" && fd.set(k, v as string)
      );
      f.damageFiles.forEach((file) => fd.append("damageFiles", file));
      f.estimateFiles.forEach((file) => fd.append("estimateFiles", file));
      f.otherFiles.forEach((file) => fd.append("otherFiles", file));
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${id}/cpm`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${session!.user.accessToken}` },
          body: fd,
        }
      );
      if (!res.ok) throw new Error(await res.text());
      router.push("/claims");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (
    action: "approve" | "reject" | "request_evidence"
  ) => {
    let comment: string | undefined;
    if (action === "reject" || action === "request_evidence") {
      const { value: text } = await Swal.fire({
        input: "textarea",
        title: action === "reject" ? "ระบุเหตุผล" : "ขอเอกสารเพิ่มเติม",
        showCancelButton: true,
      });
      if (!text) return;
      comment = text;
    }
    setActionLoading(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${id}/action`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session!.user.accessToken}`,
          },
          body: JSON.stringify({ action, comment }),
        }
      );
      const detail = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${id}`,
        { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
      );
      const { claim: fresh } = await detail.json();
      setClaim(fresh);
      router.push("/dashboard");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };
  const header = {
  categoryMain: "Physical Assets" ,
  categorySub:  "CPM",
  approverId:   claim.approverId,
};
const wrappedOnSubmit: CPMSubmitHandler = (_, vals, files, saveAsDraft) => {
  // ignore the header arg ("_") because in readOnly mode your header is fixed
  return handleSubmit(vals, files, saveAsDraft);
};
const noop = () => { /* no-op in read-only */ };
  console.log("CPMForm values:", values);
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      {claim.insurerComment && (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <h4 className="font-semibold">Comment:</h4>
          <p>{claim.insurerComment}</p>
        </div>
      )}
      <div className="text-gray-700">
        <span className="font-semibold">ผู้กรอก:</span> {claim.createdByName}
      </div>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Claim {claim.docNum}</h1>
        <p>
          Status: <span className="font-semibold">{claim.status}</span>
        </p>
      </div>
      <CPMForm
      header={header}
  onHeaderChange={noop}
  values={values}
  files={files}
  onChange={(e) => setValues(v => ({ ...v, [e.target.name]: e.target.value }))}
  onFileChange={handleFileChange}
  onFileRemove={handleFileRemove}
  onSubmit={wrappedOnSubmit}
  approverList={approvers}
  submitting={submitting}
  readOnly={readOnly}
  isEvidenceFlow={claim.status === "AWAITING_EVIDENCE"}
  error={null}
      />
      <section className="pt-6 border-t space-y-10">
        <h2 className="text-2xl font-bold">ไฟล์แนบ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {["DAMAGE_IMAGE", "ESTIMATE_DOC", "OTHER_DOCUMENT"].map((type) => (
            <div key={type}>
              <h3 className="text-lg font-semibold mb-4">
                {type === "DAMAGE_IMAGE"
                  ? "รูปภาพ"
                  : type === "ESTIMATE_DOC"
                  ? "เอกสารสำรวจ"
                  : "อื่น ๆ"}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {claim.attachments
  .filter(a => a.type === type)
  .map(att => (
    <a
      key={att.id}
      href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${att.url}`}
      target="_blank"
      rel="noopener"
      className="block rounded shadow hover:shadow-lg transition"
    >
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        {/\.(jpe?g|png)$/i.test(att.fileName) ? (
          <img
            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${att.url}`}
            alt={att.fileName}
            className="object-cover h-full w-full"
          />
        ) : (
          <span className="text-6xl text-gray-400">📄</span>
        )}
      </div>
      <p className="mt-2 px-2 py-1 text-sm text-gray-700 truncate bg-white border-t">
        {att.fileName}
      </p>
    </a>
  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      {isInsurer && claim.status === "PENDING_INSURER_REVIEW" && (
        <div className="flex space-x-4">
          <button
            onClick={() => handleAction("approve")}
            disabled={actionLoading}
            className="flex-1 bg-green-600 py-2 rounded text-white hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction("reject")}
            disabled={actionLoading}
            className="flex-1 bg-red-600 py-2 rounded text-white hover:bg-red-700"
          >
            Reject
          </button>
          <button
            onClick={() => handleAction("request_evidence")}
            disabled={actionLoading}
            className="flex-1 bg-yellow-500 py-2 rounded text-white hover:bg-yellow-600"
          >
            Request Evidence
          </button>
        </div>
      )}
      {readOnly && (
        <p className="text-gray-600 italic pt-6 text-sm">View-only mode</p>
      )}
    </div>
  );
}
