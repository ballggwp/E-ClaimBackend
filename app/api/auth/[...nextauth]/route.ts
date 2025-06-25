// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios"

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "MyBackend",
      credentials: {
        email:    { label: "Email",    type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
          { email: credentials!.email, password: credentials!.password },
          { validateStatus: () => true }
        )
        if (res.status !== 200) {
          const msg = res.data?.message || "Invalid credentials"
          throw new Error(msg)
        }
        const { user, token } = res.data
        return { ...user, accessToken: token }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) return { ...token, ...user }
      return token
    },
    async session({ session, token }) {
      session.user = token as any
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error:  "/auth/signin",
  },
}

// create a single handler…
const handler = NextAuth(authOptions)

// …and hook it up to both GET and POST
export { handler as GET, handler as POST }
