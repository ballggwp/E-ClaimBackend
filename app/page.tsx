// app/page.tsx  (Server Component, ไม่มี 'use client')
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
