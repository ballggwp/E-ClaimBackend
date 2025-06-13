// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'CompanyLogin',
      credentials: {
        email:    { label: 'Email',    type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null

        const res = await fetch(
          // ◀️ USE your Express URL, not NEXTAUTH_URL
          `${process.env.NEXT_PUBLIC_COMPANY_API_URL}/api/auth/login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email:    credentials.email,
              password: credentials.password,
            }),
          }
        )

        if (!res.ok) return null
        const { user, token } = await res.json()

        // return an object that includes the JWT
        return {
          id:          user.id,
          name:        user.name,
          email:       user.email,
          role:        user.role,
          accessToken: token,
          position: user.position,
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.position = (user as any).position;
        token.accessToken = (user as any).accessToken
        token.role        = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        accessToken: token.accessToken as string,
        role:        token.role as string,
        position: token.position as string,
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
