"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession }          from "next-auth/react";
import { useEffect, useState } from "react";
import { Image, FileText, CheckCircle, Eye, Download } from "lucide-react";

interface AttachmentItem {
  id: string;
  fileName: string;
  url: string;
  uploadedAt: string;
  type: string;
}

export default function DownloadClaimDetailPage() {
  const { claimId } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  // Friendly labels & icons per type
  const typeLabels: Record<string,string> = {
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

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);

    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claims/${claimId}/attachments`,
      { headers: { Authorization: `Bearer ${session!.user.accessToken}` } }
    )
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(json => {
        setAttachments(Array.isArray(json)
          ? json
          : Array.isArray((json as any).attachments)
            ? (json as any).attachments
            : []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [claimId, session, status]);

  if (status === "loading" || loading) {
    return <p className="p-6 text-center text-gray-500">กำลังโหลดไฟล์…</p>;
  }

  // group attachments by type
  const byType = attachments.reduce((acc, att) => {
    (acc[att.type] = acc[att.type] || []).push(att);
    return acc;
  }, {} as Record<string, AttachmentItem[]>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-600 mb-6 hover:underline"
      >
        ← กลับ
      </button>

      <h1 className="text-3xl font-bold mb-8">ไฟล์ของ Claim {claimId}</h1>
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

              {/* Grid of cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {items.map(att => (
                  <div
                    key={att.id}
                    className="bg-white shadow-md rounded-lg p-4 flex flex-col"
                  >
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline truncate"
                      title={att.fileName}
                    >
                      {att.fileName}
                    </a>
                    <p className="text-sm text-gray-500 mt-2">
                      อัปโหลด:{" "}
                      {new Date(att.uploadedAt).toLocaleString("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <div className="mt-auto flex space-x-4 pt-4 border-t border-gray-100">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                      >
                        <Eye className="w-5 h-5" />
                        <span className="text-sm">ดู</span>
                      </a>
                      <a
                        href={att.url}
                        download={att.fileName}
                        className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                      >
                        <Download className="w-5 h-5" />
                        <span className="text-sm">ดาวน์โหลด</span>
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
