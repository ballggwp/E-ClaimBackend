export const runtime = "nodejs";

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

//
// ฟังก์ชันช่วยเหลือ
//

// ขอ Azure AD token (client_credentials)
async function fetchAzureToken(): Promise<string> {
  const res = await axios.post(
    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: process.env.AZURE_CLIENT_ID!,
      client_secret: process.env.AZURE_CLIENT_SECRET!,
      scope: process.env.AZURE_SCOPE!,
      grant_type: "client_credentials",
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  if (!res.data.access_token) {
    throw new Error("Missing Azure AD access_token");
  }
  return res.data.access_token;
}

// เช็คตัวตนกับ UserInfo API และดึงโปรไฟล์กลับมา
async function fetchUserInfoProfile(
  email: string,
  password: string,
  azureToken: string
) {
  // 1) Authen
  await axios.post(
    `https://${process.env.SERVICE_HOST}/userinfo/api/v2/authen`,
    { email, password },
    {
      headers: {
        Authorization: `Bearer ${azureToken}`,
        "Ocp-Apim-Subscription-Key": process.env.AZURE_SUBSCRIPTION_KEY!,
        "Content-Type": "application/json",
      },
    }
  );

  // 2) ดึง profile
  const profileRes = await axios.post(
    `https://${process.env.SERVICE_HOST}/userinfo/api/v2/profile`,
    { email },
    {
      headers: {
        Authorization: `Bearer ${azureToken}`,
        "Ocp-Apim-Subscription-Key": process.env.AZURE_SUBSCRIPTION_KEY!,
        "Content-Type": "application/json",
      },
    }
  );
  const result = profileRes.data.result?.[0];
  if (!result) {
    throw new Error("UserInfo profile returned no results");
  }
  return result;
}

// ตรวจสอบว่า user มีอยู่ใน database หรือยัง
async function isUserInDatabase(email: string): Promise<boolean> {
  try {
    await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/check-user`,
      { params: { email } }
    );
    return true;
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return false;
    }
    throw err;
  }
}

// สมัคร user เข้าฐานข้อมูล
async function registerToDatabase(
  name: string,
  email: string,
  plainPassword: string,
  position: string,
  role: string
) {
  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`,
      { name, email, password: plainPassword, position, role }
    );
  } catch (err: any) {
    const msg = (err.response?.data?.message || "").toLowerCase();
    if (msg.includes("email already in use")) {
      return; // ข้ามถ้าเคย register แล้ว
    }
    throw new Error("Registration failed: " + msg);
  }
}

// ล็อกอินกับ database (เพื่อดึง token)
async function loginWithDatabase(email: string, password: string) {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
    { email, password }
  );
  return { user: res.data.user, token: res.data.token };
}

//
// NextAuth configuration
//
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "UserInfo",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials!;

        // 🔐 เช็คพาสเวิร์ดผ่าน API เสมอ
        const azureToken = await fetchAzureToken();
        const profile = await fetchUserInfoProfile(email, password, azureToken);

        // เตรียมข้อมูลสำหรับ register/role
        const deptEn = profile.department?.name?.en;
        const posEn = profile.position?.name?.en;
        const deptTh = profile.department?.name?.th;
        const posTh = profile.position?.name?.th;
        if (!deptEn || !posEn || !deptTh || !posTh) {
          throw new Error("Incomplete profile data");
        }

        // กำหนด role
        let role: "USER" | "MANAGER" | "INSURANCE" = "USER";
        if (/Insurance Officer/i.test(posEn) && /Insurance/i.test(deptEn)) {
          role = "INSURANCE";
        } else if (/Manager/i.test(posEn) && /Insurance/i.test(deptEn)) {
          role = "MANAGER";
        }
        const name = profile.username;

        // ตรวจสอบใน DB ถ้ายังไม่มีค่อย register
        const inDb = await isUserInDatabase(email);
        if (!inDb) {
          await registerToDatabase(name, email, password, posTh, role);
        }

        // สุดท้าย login กับ DB เพื่อดึง token มาใช้
        const { user, token } = await loginWithDatabase(email, password);
        return { ...user, accessToken: token };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.position = (user as any).position;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        accessToken: token.accessToken as string,
        role: token.role as string,
        position: token.position as string,
      };
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export const GET = handler;
export const POST = handler;
