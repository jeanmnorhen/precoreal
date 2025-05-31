
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Import Inter font
import '../globals.css'; // Adjusted path
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import BottomNavbar from '@/components/layout/bottom-navbar';
import { Toaster } from '@/components/ui/toaster';
import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';
import QueryClientProvider from '@/components/providers/query-provider'; // Import QueryClientProvider

// If you have a preferred way to load fonts, you can use it here.
// For example, using next/font:
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export async function generateMetadata({ params: { lang } }: { params: { lang: Locale } }): Promise<Metadata> {
  const dictionary = await getDictionary(lang);
  return {
    title: dictionary.appTitle,
    description: dictionary.appDescription,
  };
}

export default async function LangLayout({
  children,
  params: { lang },
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Locale };
}>) {
  const dictionary = await getDictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <QueryClientProvider> {/* Wrap with QueryClientProvider */}
          <div className="flex min-h-screen flex-col">
            <Navbar lang={lang} dictionary={dictionary.navbar} localeSwitcherDictionary={dictionary.localeSwitcher} />
            <main className="flex-grow container mx-auto px-4 py-8 pb-20 md:pb-8">
              {children}
            </main>
            <Footer lang={lang} dictionary={dictionary.footer} />
            <BottomNavbar lang={lang} dictionary={dictionary.bottomNavbar} />
          </div>
          <Toaster />
        </QueryClientProvider>
      </body>
    </html>
  );
}
