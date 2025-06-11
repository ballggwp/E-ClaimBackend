"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);
  if (status === "loading") return <p>Loading...</p>;
  return (
    <div className="p-8">
      <h1 className="text-2xl">Dashboard</h1>
    </div>
  );
}
