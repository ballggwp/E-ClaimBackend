import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'CompanyAPI',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(
            `${process.env.NEXTAUTH_URL}/api/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: credentials!.username,
                password: credentials!.password,
              }),
            }
          )

          // ถ้าไม่ ok ให้อ่าน text และโยนเป็น Error
          if (!res.ok) {
            const errorText = await res.text()
            throw new Error(errorText)
          }

          const data = await res.json() // ตอนนี้แน่ใจว่าคือ JSON
          return { ...data.user, accessToken: data.token }
        } catch (err: any) {
          console.error('Authorize failed:', err)
          // NextAuth จะส่ง err.message กลับไปให้ signIn
          throw new Error(err.message || 'Cannot authenticate')
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.accessToken = (user as any).accessToken
      return token
    },
    async session({ session, token }) {
      session.user = { ...(session.user as any), ...token }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
