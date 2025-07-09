"use client";
import { User } from "@/components/CPMForm";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { ChangeEvent, useEffect, useState } from "react";
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
    approverDepartment:"",
    approverPosition:"",
    approverKeyword:  "",  
    signerKeyword:   "",
    signerEmail:     "",
    signerId:        "",
    signerName:      "",
    signerPosition:  "",
  });
  const [values, setValues] = useState<CPMFormValues>({
    accidentDate: "", accidentTime: "", location: "", cause: "",phoneNum:"",
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
  const [signerSuggestions, setSignerSuggestions] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string|null>(null);

  // 👤 When user types an email, look up their profile
    const handleHeaderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const kw = e.target.value;
    setHeader(h => ({
      ...h,
      approverKeyword:  kw,
      approverEmail:    "",
      approverId:       "",
      approverName:     "",
      approverPosition: "",
      approverDepartment:"",
    }));

    // if they typed exactly one of the suggestions, finalize the pick immediately
    const hit = suggestions.find(u =>
    u.email === kw ||
    u.employeeName.th === kw ||
    u.employeeName.en === kw
  );
  if (hit) {
    setHeader(h => ({
      ...h,
      // force the input to show the email instead of the name:
      approverKeyword:  hit.email,
      approverEmail:    hit.email,
      approverId:       hit.id,
      approverName:     hit.employeeName.th || hit.employeeName.en!,
      approverPosition: hit.position,
      approverDepartment: hit.department || "",

    }));
    setSuggestions([]);  // close the dropdown
  }
};

  // 2) re-fetch on every keyword change (>=3 chars)
  useEffect(() => {
    const kw = header.approverKeyword.trim();
    //if (kw.length < 3) {
      //setSuggestions([]);
      //return;
    //}

    let cancelled = false;
    (async () => {
      try {
        const raw = await fetchJson(
          `${API}/api/userinfo?keyword=${encodeURIComponent(kw)}`,
          { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
        );
        // raw → Array<{ id, email, name, position }>
        const users: User[] = (raw as any[]).map(p => ({
          id:           p.id,
          email:        p.email,
          role:         "USER",
          position:     p.position,
          department:   p.department.name.th,
          employeeName: { th: p.name, en: p.name },
        }));
        if (!cancelled) setSuggestions(users);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    })();
    return () => { cancelled = true };
  }, [header.approverKeyword, session]);




const handleSignerChange = (e: ChangeEvent<HTMLInputElement>) => {
  const kw = e.target.value;
  setHeader(h => ({
    ...h,
    signerKeyword:  kw,
    signerEmail:    "",
    signerId:       "",
    signerName:     "",
    signerPosition: "",
  }));

  // exact‐match pick:
  const hit = signerSuggestions.find(u =>
    u.email === kw ||
    u.employeeName.th === kw ||
    u.employeeName.en === kw
  );
  if (hit) {
    setHeader(h => ({
      ...h,
      signerKeyword:  hit.email,
      signerEmail:    hit.email,
      signerId:       hit.id,
      signerName:     hit.employeeName.th || hit.employeeName.en!,
      signerPosition: hit.position,
    }));
    setSignerSuggestions([]);  // close dropdown
  }
};

// 3) fetch on every signerKeyword change (>=3 chars)
useEffect(() => {
  const kw = header.signerKeyword;
  //if (kw.length < 3) {
   //setSignerSuggestions([]);
   //return;
 // }

  let cancelled = false;
  (async () => {
    try {
      const raw = await fetchJson(
        `${API}/api/userinfo?keyword=${encodeURIComponent(kw)}`,
        { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
      );
      const users: User[] = (raw as any[]).map(p => ({
        id:           p.id,
        email:        p.email,
        role:         "USER",
        position:     p.position,
        department:   p.department.name.th,
        employeeName: { th: p.name, en: p.name },
      }));
      if (!cancelled) setSignerSuggestions(users);
    } catch {
      if (!cancelled) setSignerSuggestions([]);
    }
  })();
  return () => { cancelled = true };
}, [header.signerKeyword, session]);


console.log( header.signerName,header.signerEmail,header.signerId,header.signerPosition);
  console.log( header.approverName,header.approverEmail,header.approverId,header.approverPosition,header.approverDepartment);

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
          approverDepartment: header.approverDepartment,
          saveAsDraft:   saveAsDraft.toString(),
          approverKeyword:  header.approverKeyword,
          signerEmail:    header.signerEmail,
  signerId:       header.signerId,
  signerName:     header.signerName,
  signerPosition: header.signerPosition,
  signerKeyword:  header.signerKeyword,
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
        approverDepartment:header.approverDepartment,
        approverKeyword: header.approverKeyword,
        signerEmail:    header.signerEmail,
  signerId:       header.signerId,
  signerName:     header.signerName,
  signerPosition: header.signerPosition,
  signerKeyword:  header.signerKeyword,
      }}
      onHeaderChange={handleHeaderChange}
      values={values}
      approverList={suggestions} 
      onChange={handleChange}
      signerList={signerSuggestions}
      onSignerChange={handleSignerChange}
      onFileChange={handleFileChange}
      onFileRemove={handleFileRemove}
      onSubmit={onSubmit}    // no dropdown any more
      submitting={submitting}
      error={error}
      files={files}
    />
  );
}
