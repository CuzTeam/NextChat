import NextAuth from "next-auth";
import type { OIDCUserConfig } from "next-auth/providers";

function OIDCProvider(options: OIDCUserConfig<Record<string, unknown>>) {
  return {
    id: "oidc",
    name: "SSO",
    type: "oidc" as const,
    options,
  };
}

const isOidcConfigured = !!(
  process.env.OIDC_ISSUER &&
  process.env.OIDC_CLIENT_ID &&
  process.env.OIDC_CLIENT_SECRET
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(isOidcConfigured
      ? [
          OIDCProvider({
            issuer: process.env.OIDC_ISSUER!,
            clientId: process.env.OIDC_CLIENT_ID!,
            clientSecret: process.env.OIDC_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth",
  },
});
