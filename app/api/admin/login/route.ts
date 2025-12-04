import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
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
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
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
    signIn: '/admin/login', // Use your custom login page
  },
});

export { handler as GET, handler as POST };
