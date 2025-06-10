// app/layout.tsx
import './globals.css'
import { ReactNode } from 'react'
import NavBar from '../components/NavBar'
import Providers from '../components/Providers'

export const metadata = {
  title: 'E-Claim System'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>
        {/* ห่อทั้ง NavBar และเนื้อหาใน SessionProvider */}
        <Providers>
          <NavBar />

          <main className="min-h-screen">
            {children}
          </main>
        </Providers>

        <footer className="text-center py-4 text-sm text-gray-500">
          © 2025 Your Company
        </footer>
      </body>
    </html>
  )
}
