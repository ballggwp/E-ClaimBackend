"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { ChangeEvent, useState } from "react";
import CPMForm, { CPMFormValues } from "@/components/CPMForm";
import { fetchJson } from "@/app/lib/fetchJson";

const API         = process.env.NEXT_PUBLIC_BACKEND_URL!;
export default function NewCpmPage() {
  const params  = useSearchParams();
  const router  = useRouter();
  const { data: session, status } = useSession();

  const [header, setHeader] = useState({
    categoryMain: params.get("categoryMain") || "",
    categorySub:  params.get("categorySub")  || "",
    approverEmail: "",
    approverId:    "",
    approverName:  "",
    approverPosition:"",
  });
  const [values, setValues] = useState<CPMFormValues>({
    accidentDate: "", accidentTime: "", location: "", cause: "",
    repairShop: "", repairShopLocation: "",
    policeDate: "", policeTime: "", policeStation: "",
    damageOwnType: "mitrphol", damageOtherOwn: "",
    damageDetail: "", damageAmount: "", victimDetail: "",
    partnerName: "", partnerPhone: "", partnerLocation: "",
    partnerDamageDetail: "", partnerDamageAmount: "", partnerVictimDetail: "",
  });
  const [files, setFiles] = useState({
    damageFiles:   [] as File[],
    estimateFiles: [] as File[],
    otherFiles:    [] as File[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string|null>(null);

  // 👤 When user types an email, look up their profile
  const handleHeaderChange = async (e: ChangeEvent<HTMLInputElement>) => {
  const email = e.target.value.trim();
  setHeader(h => ({ ...h, approverEmail: email }));
  if (!email.includes("@mitrphol.com")) {
    setHeader(h => ({ ...h, approverId: "", approverName: "",approverPosition:"" }));
    return;
  }
  try {
   const profile = await fetchJson(
        `${API}/api/userinfo?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${session!.user.accessToken}`
         }
        }
      );

    setHeader(h => ({
      ...h,
      approverId:   profile.id,
      approverName: profile.employeeName.th || profile.employeeName.en,
      approverPosition:profile.position.name.th
    }));
  } catch {
    setHeader(h => ({ ...h, approverId: "", approverName: "",approverPosition:"" }));
  }
};
  console.log( header.approverName,header.approverEmail,header.approverId,header.approverPosition);

  const handleChange = (e: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues(v => ({ ...v, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    const fileList = e.target.files;
    if (!fileList) return;
    setFiles(f => ({ ...f, [field]: [...f[field], ...Array.from(fileList)] }));
  };
  const handleFileRemove = (field: keyof typeof files, idx: number) => {
    setFiles(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  };

  // 🔥 When they click Submit / Save Draft…
  const onSubmit: React.ComponentProps<typeof CPMForm>["onSubmit"] = async (
    _hdr, vals, f, saveAsDraft
  ) => {
    setSubmitting(true);
    try {
      // 1) create the Claim header
      const { claim } = await fetchJson(`${API}/api/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.user.accessToken}`,
        },
        body: JSON.stringify({
          categoryMain:  header.categoryMain,
          categorySub:   header.categorySub,
          approverEmail: header.approverEmail,
          approverId:    header.approverId,
          approverName:  header.approverName,
          approverPosition:    header.approverPosition,
          saveAsDraft:   saveAsDraft.toString(),
        }),
      });

      // 2) upload the CPM form (FormData)
      const cpmFD = new FormData();
      Object.entries(vals).forEach(([k, v]) => cpmFD.set(k, v as string));
      f.damageFiles.forEach(file   => cpmFD.append("damageFiles",   file));
      f.estimateFiles.forEach(file => cpmFD.append("estimateFiles", file));
      f.otherFiles.forEach(file    => cpmFD.append("otherFiles",    file));

      await fetchJson(`${API}/api/claims/${claim.id}/cpm`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        body:    cpmFD,
      });

      router.push(`/claims/${claim.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (status === "loading") return <p className="p-6">Loading…</p>;

  return (
    <CPMForm
      header={{
        categoryMain: header.categoryMain,
        categorySub:  header.categorySub,
        // pass these through so the form’s “approver” input uses them:
        approverEmail: header.approverEmail,
        approverId:    header.approverId,
        approverName:  header.approverName,
        approverPosition:header.approverPosition,
      }}
      onHeaderChange={handleHeaderChange}
      values={values}
      onChange={handleChange}
      onFileChange={handleFileChange}
      onFileRemove={handleFileRemove}
      onSubmit={onSubmit}
      approverList={[]}    // no dropdown any more
      submitting={submitting}
      error={error}
      files={files}
    />
  );
}
