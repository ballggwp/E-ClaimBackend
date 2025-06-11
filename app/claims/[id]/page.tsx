"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
export default function ClaimDetailPage() {
  const { id } = useParams(),
    [c, setC] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/claims/${id}`)
      .then((r) => r.json())
      .then((j) => setC(j.claim));
  }, [id]);
  if (!c)
    return (
      <>
        <p>Loading...</p>
      </>
    );
  return (
    <div className="p-6">
      <h1>CLAIM {c.id}</h1>
      <p>{c.cause}</p>
    </div>
  );
}
