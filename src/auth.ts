import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      name?: string | null;
      role: "BUYER" | "SELLER" | "AGENT" | "ADMIN";
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/accesso" },
  providers: [
    Credentials({
      id: "otp",
      name: "Codice SMS",
      credentials: {
        otpId: { label: "otpId", type: "text" },
        code: { label: "code", type: "text" },
        // Present when this same OTP also signs the Foglio di Visita for a
        // listing (screen 05 "Login acquirente" doubles as the unlock flow).
        listingId: { label: "listingId", type: "text" },
      },
      async authorize(credentials) {
        const otpId = credentials?.otpId as string | undefined;
        const code = credentials?.code as string | undefined;
        const listingId = credentials?.listingId as string | undefined;
        if (!otpId || !code) return null;

        const result = await verifyOtp(otpId, code);
        if (!result.ok) return null;

        const user = await prisma.user.upsert({
          where: { phone: result.phone },
          update: {},
          create: { phone: result.phone, role: "BUYER" },
        });

        if (listingId) {
          await prisma.foglioVisita.upsert({
            where: { otpVerificationId: otpId },
            update: {},
            create: { userId: user.id, listingId, otpVerificationId: otpId },
          });
        }

        return { id: user.id, phone: user.phone, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as { phone: string }).phone;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.phone = token.phone as string;
      session.user.role = token.role as "BUYER" | "SELLER" | "AGENT" | "ADMIN";
      return session;
    },
  },
});
