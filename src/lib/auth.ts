import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { comparePasswords } from "@/lib/utils/password";
import { loginSchema } from "@/lib/validations/auth";
import type { UserRole } from "@/types/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
    newUser: "/onboarding",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    ...(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.AUTH_FACEBOOK_ID,
            clientSecret: process.env.AUTH_FACEBOOK_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            password: true,
            subscription: {
              select: { plan: true, status: true },
            },
          },
        });

        if (!user?.password) return null;

        const isValid = await comparePasswords(
          parsed.data.password,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as UserRole,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: UserRole }).role ?? "USER";
      }

      // Allow client-side session updates
      if (trigger === "update" && session) {
        token.name = session.name;
        token.image = session.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }

      // Attach subscription info
      if (session.user.id) {
        const sub = await db.subscription.findUnique({
          where: { userId: session.user.id },
          select: { plan: true, status: true },
        });
        session.user.plan = (sub?.plan ?? "FREE") as "FREE" | "PRO";
      }

      return session;
    },
  },

  events: {
    async createUser({ user }) {
      // Bootstrap a FREE subscription for every new user
      if (user.id) {
        await db.subscription.create({
          data: {
            userId: user.id,
            plan: "FREE",
            status: "ACTIVE",
            tripsLimit: 3,
            aiCallsLimit: 10,
          },
        });
      }
    },
  },
});
