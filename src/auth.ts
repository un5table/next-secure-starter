import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; role: Role };
  }
}

// OAuth providers are only enabled when their credentials are present, so the
// starter builds and runs with zero OAuth setup. Add providers (Microsoft Entra,
// Discord, etc.) the same way. IMPORTANT: always pass clientId/clientSecret
// explicitly — the shorthand `Google()` reads AUTH_GOOGLE_ID, not GOOGLE_CLIENT_ID.
const oauthProviders: NextAuthConfig["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauthProviders.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Lets a user who first registered with email/password sign in with the
      // same email via OAuth. Required for a smooth multi-method login.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  oauthProviders.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

// Dev-only credentials provider — never active in production.
// First user to log in becomes ADMIN; subsequent users get USER.
const devProviders =
  process.env.NODE_ENV !== "production"
    ? [
        Credentials({
          id: "dev",
          name: "Dev login",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            const devPassword = process.env.DEV_PASSWORD;
            if (!devPassword) return null;
            if (!credentials?.email || credentials.password !== devPassword) return null;

            const email = credentials.email as string;
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
              const count = await prisma.user.count();
              user = await prisma.user.create({
                data: {
                  email,
                  name: email.split("@")[0],
                  emailVerified: new Date(),
                  role: count === 0 ? "ADMIN" : "USER",
                },
              });
            }
            return { id: user.id, email: user.email, name: user.name, role: user.role };
          },
        }),
      ]
    : [];

// Production local auth — email + argon2id password (set via invite/reset flow).
const localCredentials = Credentials({
  id: "local",
  name: "Email and password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials, request) {
    if (!credentials?.email || !credentials?.password) return null;

    // Rate-limit by IP and by email independently to block both distributed and
    // single-target brute-force attacks.
    const ip = getClientIp(request);
    const email = String(credentials.email);
    if (!(await checkRateLimit(ip, "credentials_signin")).allowed) return null;
    if (!(await checkRateLimit(email, "credentials_signin")).allowed) return null;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return null;
    const ok = await verifyPassword(user.passwordHash, String(credentials.password));
    if (!ok) return null;
    return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT strategy is required for the Credentials provider. OAuth flows still write
  // User + Account rows via the adapter; the Session table is unused.
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [...oauthProviders, localCredentials, ...devProviders],
  callbacks: {
    async jwt({ token, user }) {
      const tok = token as JWT & {
        id: string;
        role: Role;
        passwordChangedAt: number | null;
      };

      if (user) {
        // Initial sign-in: populate id, role, and the passwordChangedAt watermark.
        tok.id = user.id as string;
        tok.role = (user as { role: Role }).role;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { passwordChangedAt: true },
        });
        tok.passwordChangedAt = dbUser?.passwordChangedAt?.getTime() ?? null;
      } else if (tok.id) {
        // Token refresh: revoke the session if the password changed after this JWT
        // was issued (e.g. a reset from another device). One SELECT per refresh.
        const dbUser = await prisma.user.findUnique({
          where: { id: tok.id as string },
          select: { passwordChangedAt: true },
        });
        const dbTs = dbUser?.passwordChangedAt?.getTime() ?? null;
        if (dbTs !== null && dbTs !== tok.passwordChangedAt) {
          return null; // force re-authentication
        }
      }

      return token;
    },
    session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tok = token as any;
      return {
        ...session,
        user: {
          ...session.user,
          id: (tok.id ?? "") as string,
          role: (tok.role ?? "USER") as Role,
        },
      };
    },
  },
});
