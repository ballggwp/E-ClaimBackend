// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "UserInfo",
      credentials: {
        email:    { label: "Email",    type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials!;

        let access_token: string;
        try {
          // 1️⃣ Get Azure AD token
          const tokenRes = await axios.post(
            `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
            new URLSearchParams({
              client_id:     process.env.AZURE_CLIENT_ID!,
              client_secret: process.env.AZURE_CLIENT_SECRET!,
              scope:         process.env.AZURE_SCOPE!,
              grant_type:    "client_credentials",
            }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
          );

          access_token = tokenRes.data?.access_token;
          if (!access_token) {
            throw new Error("Azure AD token response missing access_token");
          }

          // 2️⃣ Authenticate user
          await axios.post(
            `https://${process.env.SERVICE_HOST}/userinfo/api/v2/authen`,
            { email, password },
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
                "Ocp-Apim-Subscription-Key": process.env.AZURE_SUBSCRIPTION_KEY!,
                "Content-Type": "application/json",
              },
            }
          );

          // 3️⃣ Fetch profile
          const profileRes = await axios.post(
            `https://${process.env.SERVICE_HOST}/userinfo/api/v2/profile`,
            { email },
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
                "Ocp-Apim-Subscription-Key": process.env.AZURE_SUBSCRIPTION_KEY!,
                "Content-Type": "application/json",
              },
            }
          );

          const results = profileRes.data?.result;
          if (!Array.isArray(results) || results.length === 0) {
            throw new Error("UserInfo profile returned no results");
          }

          const info = results[0];
          const deptEn = info.department?.name?.en;
          const posEn  = info.position?.name?.en;
          const deptTh = info.department?.name?.th;
          const posTh  = info.position?.name?.th;

          if (!deptEn || !posEn || !deptTh || !posTh) {
            throw new Error("Profile data missing department or position");
          }

          // 4️⃣ Derive role
          let role: "USER"|"MANAGER"|"INSURANCE" = "USER";
          if (/Insurance Officer/i.test(posEn) && /Insurance/i.test(deptEn)) {
            role = "INSURANCE";
          } else if (/Manager/i.test(posEn) && /Insurance/i.test(deptEn)) {
            role = "MANAGER";
          }

          // 5️⃣ Return the NextAuth user object
          return {
            id:          info.id,
            name:        info.employeeName.th,
            email:       info.email,
            position:    posTh,
            role,
            accessToken: access_token,
          };

        } catch (err: any) {
          // If this was an HTTP error from axios, surface its payload:
          if (axios.isAxiosError(err) && err.response?.data) {
            throw new Error(`UserInfo auth failed: ${JSON.stringify(err.response.data)}`);
          }
          // Otherwise re-throw our own errors (including our new guard-errors)
          throw err;
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role        = (user as any).role;
        token.position    = (user as any).position;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        accessToken: token.accessToken as string,
        role:        token.role as string,
        position:    token.position as string,
      };
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export const GET  = handler;
export const POST = handler;
