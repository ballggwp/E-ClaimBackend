// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  // Mock: ถ้า user1 / password123 ให้ผ่าน
  if (username === 'user1' && password === 'password123') {
    return NextResponse.json({
      user: { id: '001', name: 'ทดสอบ', email: 'test@company.com' },
      token: 'mock-jwt-token'
    })
  }

  // มิฉะนั้นส่ง 401 พร้อมข้อความ JSON
  return NextResponse.json(
    { message: 'Invalid credentials' },
    { status: 401 }
  )
}
