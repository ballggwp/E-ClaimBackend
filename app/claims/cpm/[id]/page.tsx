// app/claims/[id]/page.tsx
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import CPMForm, { CPMFormValues, CPMSubmitHandler, User } from "@/components/CPMForm";
import Swal from "sweetalert2";

interface Attachment {
  id: string;
  fileName: string;
  url: string;
  type: "DAMAGE_IMAGE" | "ESTIMATE_DOC" | "OTHER_DOCUMENT";
}
interface CpmData {
  accidentDate: string;
  accidentTime: string;
  location: string;
  cause: string;
  repairShop: string;
  repairShopLocation: string;
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
  approverName: string;
  approverEmail: string;
  id: string;
  docNum: string;
  status: string;
  categoryMain: string;
  categorySub: string;
  approverId: string;
  approverPosition:string;
  createdByEmail: string;
  createdByName: string;
  insurerComment?: string;
  cpmForm?: CpmData;
  attachments: Attachment[];
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function ClaimDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [claim, setClaim] = useState<ClaimPayload | null>(null);
  const [loadingClaim, setLoadingClaim] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [approvers, setApprovers] = useState<User[]>([]);
  const [header, setHeader] = useState({
    approverEmail: "",
    categoryMain: "",
    categorySub:  "",
    approverId:   "",
    approverPosition:"",
    approverName: "",
  });

  const [values, setValues] = useState<CPMFormValues>({
    accidentDate:       "",
    accidentTime:       "",
    location:           "",
    cause:              "",
    repairShop:         "",
    repairShopLocation: "",
    policeDate:         "",
    policeTime:         "",
    policeStation:      "",
    damageOwnType:      "mitrphol",
    damageOtherOwn:     "",
    damageDetail:       "",
    damageAmount:       "",
    victimDetail:       "",
    partnerName:        "",
    partnerPhone:       "",
    partnerLocation:    "",
    partnerDamageDetail:"",
    partnerDamageAmount:"",
    partnerVictimDetail:""
  });

  const [files, setFiles] = useState({
    damageFiles:   [] as File[],
    estimateFiles: [] as File[],
    otherFiles:    [] as File[],
  });
  const [submitting,     setSubmitting]    = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoadingClaim(true);
    fetch(`${API}/api/claims/${id}`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load claim (${res.status})`);
        return res.json();
      })
      .then((data: { claim: ClaimPayload }) => {
        const c = data.claim;
        if (!c.cpmForm) throw new Error("CPM form is missing on this claim");
        setClaim(c);
        setHeader({
          categoryMain:  c.categoryMain,
          categorySub:   c.categorySub,
          approverId:    c.approverId,
          approverEmail: c.approverEmail,
          approverName:  c.approverName,
          approverPosition:c.approverPosition,
        });
        setValues({
          accidentDate:       c.cpmForm.accidentDate.slice(0,10),
          accidentTime:       c.cpmForm.accidentTime,
          location:           c.cpmForm.location,
          cause:              c.cpmForm.cause,
          repairShop:         c.cpmForm.repairShop,
          repairShopLocation: c.cpmForm.repairShopLocation,
          policeDate:         c.cpmForm.policeDate?.slice(0,10)   || "",
          policeTime:         c.cpmForm.policeTime               || "",
          policeStation:      c.cpmForm.policeStation            || "",
          damageOwnType:      c.cpmForm.damageOwnType,
          damageOtherOwn:     c.cpmForm.damageOtherOwn           || "",
          damageDetail:       c.cpmForm.damageDetail             || "",
          damageAmount:       String(c.cpmForm.damageAmount      || ""),
          victimDetail:       c.cpmForm.victimDetail             || "",
          partnerName:        c.cpmForm.partnerName              || "",
          partnerPhone:       c.cpmForm.partnerPhone             || "",
          partnerLocation:    c.cpmForm.partnerLocation          || "",
          partnerDamageDetail:c.cpmForm.partnerDamageDetail      || "",
          partnerDamageAmount:String(c.cpmForm.partnerDamageAmount|| ""),
          partnerVictimDetail:c.cpmForm.partnerVictimDetail      || "",
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingClaim(false));
  }, [status, id, session]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const { users } = await res.json();
        setApprovers(users);
      } catch (err) {
        console.error("Failed to load approvers:", err);
      }
    })();
  }, [status, session]);

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (error)                    return <p className="p-6 text-red-600">{error}</p>;
  if (loadingClaim)             return <p className="p-6">Loading claim…</p>;
  if (!claim)                   return <p className="p-6">Claim not found</p>;

  const canEdit =
    session!.user.name === claim.createdByName &&
    ["DRAFT","AWAITING_EVIDENCE"].includes(claim.status);
  const readOnly = !canEdit;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (!e.target.files) return;
    setFiles(f => ({ ...f, [field]: [...f[field], ...Array.from(e.target.files!)] }));
  };
  const handleFileRemove = (field: keyof typeof files, idx: number) => {
    setFiles(f => ({ ...f, [field]: f[field].filter((_,i) => i!==idx) }));
  };

  const handleAction = async (action: "approve"|"reject"|"request_evidence") => {
    let comment: string|undefined;
    if (action !== "approve") {
      const { value: text } = await Swal.fire({
        input: "textarea",
        title: action==="reject" ? "ระบุเหตุผล" : "ขอเอกสารเพิ่มเติม",
        showCancelButton: true,
      });
      if (!text) return;
      comment = text;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/claims/${id}/action`, {
        method: "POST",
        headers: {
          "Content-Type":"application/json",
          Authorization: `Bearer ${session!.user.accessToken}`
        },
        body: JSON.stringify({ action, comment }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/dashboard");
    } catch (e: any) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setActionLoading(false);
    }
  };
  const handleApproverAction = async (action: "approve" | "reject") => {
  let comment: string | undefined;
  if (action === "reject") {
    const { value: text } = await Swal.fire({
      input: "textarea",
      title: "ระบุเหตุผล",
      showCancelButton: true,
    });
    if (!text) return;
    comment = text;
  }

  setActionLoading(true);
  try {
    const res = await fetch(
      `${API}/api/claims/${id}/approverAction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.user.accessToken}`,
        },
        body: JSON.stringify({ action, comment }),
      }
    );
    if (!res.ok) throw new Error(await res.text());
    router.push("/dashboard");
  } catch (e: any) {
    Swal.fire("Error", e.message, "error");
  } finally {
    setActionLoading(false);
  }
};

  const wrappedOnSubmit: CPMSubmitHandler = (_hdr, vals, f, saveAsDraft) => {
    setSubmitting(true);
    const fd = new FormData();
    fd.set("saveAsDraft", saveAsDraft.toString());
    Object.entries(vals).forEach(([k,v]) => fd.set(k, v as string));
    f.damageFiles.forEach(f=>fd.append("damageFiles", f));
    f.estimateFiles.forEach(f=>fd.append("estimateFiles", f));
    f.otherFiles.forEach(f=>fd.append("otherFiles", f));

    fetch(`${API}/api/claims/${id}/cpm`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
      body: fd,
    })
      .then(r => {
        if (!r.ok) throw new Error(r.statusText);
        router.push("/claims");
      })
      .catch(e => Swal.fire("Error", e.message, "error"))
      .finally(() => setSubmitting(false));
  };

  const userEmpNum = String(session!.user.employeeNumber);

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      {claim.insurerComment && (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <strong>Comment:</strong> {claim.insurerComment}
        </div>
      )}
      <h1 className="text-2xl font-bold">Claim {claim.docNum}</h1>
      <p>Status: <span className="font-semibold">{claim.status}</span></p>

      <CPMForm
        header={header}
        onHeaderChange={e => setHeader(h => ({ ...h, [e.target.name]: e.target.value }))}
        values={values}
        onChange={e => setValues(v => ({ ...v, [e.target.name]: e.target.value }))}
        onFileChange={handleFileChange}
        onFileRemove={handleFileRemove}
        onSubmit={wrappedOnSubmit}
        approverList={approvers}
        submitting={submitting}
        readOnly={readOnly}
        isEvidenceFlow={claim.status==="AWAITING_EVIDENCE"}
        error={null}
        files={files}
      />

      {userEmpNum === claim.approverId && claim.status === "PENDING_APPROVER_REVIEW" && (
  <div className="flex space-x-4">
    <button
      onClick={() => handleApproverAction("approve")}
      disabled={actionLoading}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Approve
    </button>
    <button
      onClick={() => handleApproverAction("reject")}
      disabled={actionLoading}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Reject
    </button>
  </div>
)}

      {session!.user.role === "INSURANCE" && claim.status === "PENDING_INSURER_REVIEW" && (
        <div className="flex space-x-4">
          <button
            onClick={() => handleAction("approve")}
            disabled={actionLoading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction("reject")}
            disabled={actionLoading}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Reject
          </button>
          <button
            onClick={() => handleAction("request_evidence")}
            disabled={actionLoading}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Request Evidence
          </button>
        </div>
      )}

      {readOnly && <p className="text-gray-600 italic">View-only mode</p>}
    </div>
  );
}
