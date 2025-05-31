
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import BottomNavbar from '@/components/layout/bottom-navbar';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'RealPrice Finder',
  description: 'Find the best local prices for products and services.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8 pb-20 md:pb-8">
            {children}
          </main>
          <Footer />
          <BottomNavbar />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
