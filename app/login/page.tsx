'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl: '/dashboard',
    })

    if (res?.error) {
      setError(res.error)
    } else if (res?.url) {
      router.push(res.url)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <form onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">เข้าสู่ระบบ</h1>

        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="you@example.com"
        />

        <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="••••••••"
        />

        {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition duration-200"
        >
          เข้าสู่ระบบ
        </button>

        <p className="text-xs text-center text-gray-400 mt-4">
          ยังไม่มีบัญชี? <a href="#" className="text-blue-500 hover:underline">สมัครสมาชิก</a>
        </p>
      </form>
    </div>
  )
}
