// app/claims/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchJson } from "@/app/lib/fetchJson";

type Attachment = {
  id: string;
  type: "DAMAGE_IMAGE" | "ESTIMATE_DOC" | "OTHER_DOCUMENT";
  fileName: string;
  url: string;
};

type CPMForm = {
  accidentDate: string;
  accidentTime: string;
  location: string;
  cause: string;
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
};

type Fppa04Base = {
  id: string;
  mainType: string;
  subType: string;
  cpmVariant?: {
    eventType: string;
    claimRefNumber: string;
    eventDescription: string;
    productionYear: number;
    accidentDate: string;
    reportedDate: string;
    receivedDocDate: string;
    company: string;
    factory: string;
    policyNumber: string;
    surveyorRefNumber: string;
    netAmount: number;
    signatureFiles: string[];
    items: { id: string; category: string; description: string; total: number; exception: number }[];
    adjustments: { id: string; type: string; description: string; amount: number }[];
  };
};

type ClaimDetail = {
  id: string;
  docNum:string
  status: string;
  categoryMain?: string;
  categorySub?: string;
  createdByName: string;
  approverName: string;
  submittedAt?: string;
  insurerComment?: string;
  attachments: Attachment[];
  cpmForm?: CPMForm;
  fppa04Base?: Fppa04Base;
};

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const data = await fetchJson(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${id}`,
          { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
        );
        setClaim(data.claim);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session, id]);

  if (loading) return <p className="p-6">Loading…</p>;
  if (error)   return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!claim) return <p className="p-6">Claim not found</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Claim Detail: {claim.docNum}</h1>
        <p><strong>Status:</strong> {claim.status}</p>
        {claim.categoryMain && claim.categorySub && (
          <p><strong>Category:</strong> {claim.categoryMain} / {claim.categorySub}</p>
        )}
        <p><strong>Created By:</strong> {claim.createdByName}</p>
        <p><strong>Approver:</strong> {claim.approverName}</p>
        <p><strong>Submitted:</strong> {claim.submittedAt ?? "—"}</p>
        {claim.insurerComment && (
          <p><strong>Comment:</strong> {claim.insurerComment}</p>
        )}
      </header>

      {/* Attachments */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Attachments</h2>
        {claim.attachments.length === 0 ? (
          <p className="text-gray-500">No attachments uploaded.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {claim.attachments.map(att => (
              <li key={att.id}>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {att.fileName} ({att.type})
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* CPM Form Detail */}
      {claim.cpmForm && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">CPM Form</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p><strong>Accident Date:</strong> {new Date(claim.cpmForm.accidentDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {claim.cpmForm.accidentTime}</p>
              <p><strong>Location:</strong> {claim.cpmForm.location}</p>
              <p><strong>Cause:</strong> {claim.cpmForm.cause}</p>
            </div>
            <div className="space-y-2">
              <p><strong>Damage Type:</strong> {claim.cpmForm.damageOwnType}</p>
              {claim.cpmForm.damageOtherOwn && (
                <p><strong>Other Asset:</strong> {claim.cpmForm.damageOtherOwn}</p>
              )}
              {claim.cpmForm.damageDetail   && <p><strong>Detail:</strong> {claim.cpmForm.damageDetail}</p>}
              {claim.cpmForm.damageAmount != null && <p><strong>Amount:</strong> {claim.cpmForm.damageAmount}</p>}
              {claim.cpmForm.victimDetail   && <p><strong>Victim:</strong> {claim.cpmForm.victimDetail}</p>}
            </div>
          </div>
          {(claim.cpmForm.partnerName ||
            claim.cpmForm.partnerLocation) && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Counterparty</h3>
              <p><strong>Name:</strong> {claim.cpmForm.partnerName}</p>
              <p><strong>Phone:</strong> {claim.cpmForm.partnerPhone}</p>
              <p><strong>Location:</strong> {claim.cpmForm.partnerLocation}</p>
              <p><strong>Damage:</strong> {claim.cpmForm.partnerDamageDetail}</p>
              <p><strong>Amount:</strong> {claim.cpmForm.partnerDamageAmount}</p>
              <p><strong>Victim:</strong> {claim.cpmForm.partnerVictimDetail}</p>
            </div>
          )}
        </section>
      )}

      {/* FPPA-04 Form Detail */}
      {claim.fppa04Base?.cpmVariant && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">FPPA-04 (CPM Variant)</h2>
          <div className="space-y-2">
            <p><strong>Event Type:</strong> {claim.fppa04Base.cpmVariant.eventType}</p>
            <p><strong>Reference #:</strong> {claim.fppa04Base.cpmVariant.claimRefNumber}</p>
            <p><strong>Description:</strong> {claim.fppa04Base.cpmVariant.eventDescription}</p>
            <p><strong>Production Year:</strong> {claim.fppa04Base.cpmVariant.productionYear}</p>
            <p><strong>Accident Date:</strong> {new Date(claim.fppa04Base.cpmVariant.accidentDate).toLocaleDateString()}</p>
            <p><strong>Reported:</strong> {new Date(claim.fppa04Base.cpmVariant.reportedDate).toLocaleDateString()}</p>
            <p><strong>Company:</strong> {claim.fppa04Base.cpmVariant.company} / {claim.fppa04Base.cpmVariant.factory}</p>
            <p><strong>Policy #:</strong> {claim.fppa04Base.cpmVariant.policyNumber}</p>
            <p><strong>Surveyor #:</strong> {claim.fppa04Base.cpmVariant.surveyorRefNumber}</p>
            <p><strong>Net Amount:</strong> {claim.fppa04Base.cpmVariant.netAmount}</p>
          </div>

          {/* items */}
          {claim.fppa04Base.cpmVariant.items.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Items</h3>
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1">Category</th>
                    <th className="px-2 py-1">Description</th>
                    <th className="px-2 py-1">Total</th>
                    <th className="px-2 py-1">Exception</th>
                  </tr>
                </thead>
                <tbody>
                  {claim.fppa04Base.cpmVariant.items.map(it => (
                    <tr key={it.id} className="border-t">
                      <td className="px-2 py-1">{it.category}</td>
                      <td className="px-2 py-1">{it.description}</td>
                      <td className="px-2 py-1">{it.total}</td>
                      <td className="px-2 py-1">{it.exception}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* adjustments */}
          {claim.fppa04Base.cpmVariant.adjustments.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Adjustments</h3>
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1">Type</th>
                    <th className="px-2 py-1">Description</th>
                    <th className="px-2 py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {claim.fppa04Base.cpmVariant.adjustments.map(adj => (
                    <tr key={adj.id} className="border-t">
                      <td className="px-2 py-1">{adj.type}</td>
                      <td className="px-2 py-1">{adj.description}</td>
                      <td className="px-2 py-1">{adj.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* nothing submitted yet */}
      {!claim.cpmForm && !claim.fppa04Base?.cpmVariant && (
        <p className="text-gray-500">No form submitted for this claim yet.</p>
      )}
    </div>
  );
}
