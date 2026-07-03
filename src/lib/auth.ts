import bcrypt from "bcryptjs";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      restaurantId: string;
    } & DefaultSession["user"];
  }

  interface User {
    restaurantId: string;
  }
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  // Trust the incoming Host header: in development this lets the app be
  // reached by LAN IP (mobile testing) and in production the host is
  // controlled by our own proxy. Auth URLs are derived per-request, so no
  // AUTH_URL needs to be configured.
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

        const admin = await prisma.adminUser.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!admin) {
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
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.restaurantId = user.restaurantId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.restaurantId = token.restaurantId as string;
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
