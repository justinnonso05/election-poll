import { prisma } from '@/lib/prisma'; // Import your Prisma client
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  // Fetch association info safely (try/catch prevents build crashes if DB connection drops)
  let association = null;
  try {
    association = await prisma.association.findFirst({
      select: { name: true, logoUrl: true },
    });
  } catch (error) {
    console.warn("Could not fetch association for metadata. Using defaults.");
  }

  return {
    title: association?.name ? `${association.name} Poll` : 'Election Management System',
    description: 'Election Management System',
    icons: {
      icon: association?.logoUrl || '/favicon.ico',
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
