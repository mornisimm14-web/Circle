/**
 * Auth.js setup: Credentials provider backed by our own User table
 * (bcrypt-hashed passwords), JWT sessions carrying { role, orgId } so
 * proxy.ts can gate routes without a DB round trip on every request.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: UserRole;
    orgId: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      orgId: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRole;
    orgId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.orgId = user.orgId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.role) session.user.role = token.role;
      if (token.orgId) session.user.orgId = token.orgId;
      session.user.id = token.sub ?? "";
      return session;
    },
  },
});
