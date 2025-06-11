"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function NavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "เคลม", href: "/claims" },
  ];
  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">
          E-Claim
        </Link>
        <div className="flex space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? "bg-blue-100 text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  : "text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div>
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-3 py-2 text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 text-gray-700 hover:text-gray-900"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
