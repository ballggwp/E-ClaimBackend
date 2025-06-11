"use client";
import "./globals.css";
import NavBar from "../components/NavBar";
import Providers from "../components/Providers";



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <Providers>
          <NavBar />
          <main className="min-h-screen">{children}</main>
        </Providers>
        <footer className="text-center py-4 text-sm text-gray-500">
          © 2025 Your Company
        </footer>
      </body>
    </html>
  );
}
