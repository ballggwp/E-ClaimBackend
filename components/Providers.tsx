"use client";
import { SessionProvider } from "next-auth/react";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchInterval={300}> {/* เช็คทุก 5 นาที */}
      {children}
    </SessionProvider>
}
