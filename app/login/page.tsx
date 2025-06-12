'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })
    if (res?.error) {
      setError(res.error)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl mb-4">เข้าสู่ระบบ</h1>

      <label className="block mb-1">Email</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full border p-2 rounded mb-4"
      />

      <label className="block mb-1">Password</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="w-full border p-2 rounded mb-4"
      />

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        เข้าสู่ระบบ
      </button>
    </form>
  )
}
