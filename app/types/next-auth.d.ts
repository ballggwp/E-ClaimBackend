// src/types/next-auth.d.ts

import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      /** comes from `jwt.accessToken` */
      accessToken?: string
      /** comes from `jwt.role` */
      role?: string
      position?:string
    } & DefaultSession["user"]
  }

  // optionally, if you ever call `session.user` directly:
  interface User extends DefaultUser {
    accessToken?: string
    role?: string
    position?:string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string
    role?: string
    position?: string;
  }
}
