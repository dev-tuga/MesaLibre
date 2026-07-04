import bcrypt from "bcryptjs";
import type { StaffRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { env } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      restaurantId: string;
      role: StaffRole;
    } & DefaultSession["user"];
  }

  interface User {
    restaurantId: string;
    role: StaffRole;
  }
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const prisma = getPrisma();
        const admin = await prisma.adminUser.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!admin || !admin.isActive) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(parsed.data.password, admin.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          restaurantId: admin.restaurantId,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.restaurantId = user.restaurantId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.restaurantId = token.restaurantId as string;
      session.user.role = token.role as StaffRole;
      return session;
    },
  },
});

/**
 * Returns the authenticated admin session or null. Server actions and
 * dashboard pages must call this — never trust layout-level checks alone.
 */
export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return null;
  }
  return session;
}
