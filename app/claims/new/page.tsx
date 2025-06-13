// app/claims/new/page.tsx
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ClaimForm, ClaimFormValues, User } from "@/components/ClaimForm";

const API = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function NewClaimPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [approvers, setApprovers]   = useState<User[]>([]);

  const [values, setValues] = useState<ClaimFormValues>({
    approverId: "",
    accidentDate: "",
    accidentTime: "",
    location: "",
    cause: "",
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
    damageFiles:    [] as File[],
    estimateFiles:  [] as File[],
    otherFiles:     [] as File[],
  });

  // Fetch list of approvers
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`${API}/api/users`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { users: User[] }) => setApprovers(data.users))
      .catch((e) => console.error(e));
  }, [status]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: keyof typeof files
  ) => {
    if (!e.target.files) return;
    setFiles((f) => ({
      ...f,
      [field]: [...f[field], ...Array.from(e.target.files!)],
    }));
  };

  const onSubmit = async (
    vals: ClaimFormValues,
    f: typeof files,
    saveAsDraft: boolean
  ) => {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("saveAsDraft", saveAsDraft.toString());
      formData.set("approverId", vals.approverId);
      Object.entries(vals).forEach(([k, v]) => {
        if (k !== "approverId") formData.set(k, v as string);
      });
      f.damageFiles.forEach((file)   => formData.append("damageFiles", file));
      f.estimateFiles.forEach((file) => formData.append("estimateFiles", file));
      f.otherFiles.forEach((file)    => formData.append("otherFiles", file));

      const res = await fetch(`${API}/api/claims`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session!.user.accessToken}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error(await res.text());

      router.push("/claims");
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <ClaimForm
      values={values}
      onChange={handleChange}
      onFileChange={handleFileChange}
      onSubmit={onSubmit}
      approverList={approvers}
      submitting={submitting}
      error={error}
      files={files}
    />
  );
}
