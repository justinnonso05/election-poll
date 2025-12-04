import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { SessionStrategy } from 'next-auth';

// Define custom user type for your app
type AuthUser = {
  id: string;
  email: string;
  role: string;
  associationId: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        if (!credentials?.email || !credentials?.password) return null;

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        });

        if (!admin) return null;

        const valid = await bcrypt.compare(credentials.password, admin.passwordHash);
        if (!valid) return null;

        return {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          associationId: admin.associationId,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 60 * 60 * 24,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'id' in user && 'role' in user && 'associationId' in user) {
        token.id = user.id;
        token.role = user.role;
        token.associationId = user.associationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.associationId = token.associationId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
