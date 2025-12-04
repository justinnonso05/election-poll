import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    associationId: string;
  }
  interface Session {
    user?: {
      id: string;
      email: string;
      role: string;
      associationId: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: string;
    associationId: string;
  }
}
