"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();
  //console.log("position",session?.user?.position);
  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">
          E-Claim
        </Link>

        <div className="flex space-x-4 items-center">
          <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
            Dashboard
          </Link>
          <Link href="/claims" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
            เคลม
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {status === "authenticated" && session.user ? (
            <>
              <span className="text-gray-700">
                
                Logged in as&nbsp;
                <strong>{session.user.name}</strong>
                {" ("}
                {session.user.role}
                {session.user.position ? `, ${session.user.position}` : "" }
                {")"}
              </span>
              <button
                onClick={() => signOut()}
                className="px-3 py-2 text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="px-3 py-2 text-gray-700 hover:text-gray-900">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
