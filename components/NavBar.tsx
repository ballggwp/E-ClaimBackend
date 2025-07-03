"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/mitrphollogo.png"
              alt="Mitr Phol Logo"
              width={40}
              height={40}
              priority
            />
            <span className="text-xl font-bold text-blue-700 tracking-tight">E-Claim</span>
          </Link>
        </div>

        {/* Menu Links */}
        <div className="flex space-x-4 items-center">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/claims"
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
          >
            เคลม
          </Link>
          {status === "authenticated" && session?.user?.role === "INSURANCE" && (
            <Link
              href="/fppa04"
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
            >
              ฟปภ04
            </Link>
          )}
          {status === "authenticated" && (
            <Link
              href="/download"
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
            >
              download file
            </Link>
          )}
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {status === "authenticated" && session.user ? (
            <>
              <div className="text-sm text-gray-600">
                เข้าสู่ระบบโดย&nbsp;
                <span className="font-medium text-gray-800">{session.user.name}</span>
                <span className="text-gray-500">
                  {" "}
                  ({session.user.role}
                  {session.user.position ? `, ${session.user.position}` : ""}
                  )
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="px-4 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm font-medium transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
