// app/claims/cpm/new/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, ChangeEvent } from "react";
import CPMForm, { CPMFormValues } from "@/components/CPMForm";
import { User } from "@/components/ClaimForm";
import { fetchJson } from "@/app/lib/fetchJson";

const API = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function NewCpmPage() {
    const params = useSearchParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Read main/sub from query string
    const categoryMain = params.get("categoryMain") || "";
    const categorySub  = params.get("categorySub")  || "";

    // Header: main/sub + approver
    const [header, setHeader] = useState({ categoryMain, categorySub, approverId: "" });

    // CPM form values
    const [values, setValues] = useState<CPMFormValues>({
        accidentDate: "",
        accidentTime: "",
        location:     "",
        cause:        "",
        repairShop: "",
        repairShopLocation: "",
        policeDate:   "",
        policeTime:   "",
        policeStation:"",
        damageOwnType:"mitrphol",
        damageOtherOwn:"",
        damageDetail:  "",
        damageAmount:  "",
        victimDetail:  "",
        partnerName:        "",
        partnerPhone:       "",
        partnerLocation:    "",
        partnerDamageDetail:"",
        partnerDamageAmount:"",
        partnerVictimDetail:""
    });

    // Files
    const [files, setFiles] = useState({
        damageFiles:   [] as File[],
        estimateFiles: [] as File[],
        otherFiles:    [] as File[],
    });

    // Load approvers list
    const [approvers, setApprovers] = useState<User[]>([]);
    useEffect(() => {
        if (status !== "authenticated") return;
        fetchJson(`${API}/api/users`, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` }
        })
            .then((d: { users: User[] }) => setApprovers(d.users))
            .catch(console.error);
    }, [status]);

    // Handlers
    const handleHeaderChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setHeader(h => ({ ...h, [name]: value }));
    };
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setValues(v => ({ ...v, [name]: value }));
    };
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
        if (!e.target.files) return;
        const fileList = e.target.files;
        setFiles(f => ({ ...f, [field]: [...f[field], ...Array.from(fileList)] }));
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


    // Submit
    const onSubmit: React.ComponentProps<typeof CPMForm>["onSubmit"] = async (_, vals, f, saveAsDraft) => {
        setSubmitting(true);
        try {
            // 1) create Claim header via JSON
            const { claim } = await fetchJson(`${API}/api/claims`, {
                method:  "POST",
                headers: {
                    "Content-Type":  "application/json",
                    Authorization:   `Bearer ${session!.user.accessToken}`,
                },
                body: JSON.stringify({
                    categoryMain: header.categoryMain,
                    categorySub:  header.categorySub,
                    approverId:   header.approverId,
                    saveAsDraft:  saveAsDraft.toString(),
                }),
            });

            // 2) create CPM form (this stays as FormData)
            const cpmFD = new FormData();
            Object.entries(vals).forEach(([k,v]) => cpmFD.set(k, v));
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
            header={header}
            onHeaderChange={handleHeaderChange}
            values={values}
            onChange={handleChange}
            onFileRemove={handleFileRemove}
            onFileChange={handleFileChange}
            onSubmit={onSubmit}
            approverList={approvers}
            submitting={submitting}
            error={error}
            files={files}
        />
    );
}

