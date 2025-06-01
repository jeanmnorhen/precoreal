
'use client';

import Link from 'next/link';
import { Home, Camera, Store, LogOut, UserPlus, LogIn, ShoppingBag, LineChart as LineChartIcon, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import React from 'react';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/lib/get-dictionary';
import LocaleSwitcher from '@/components/locale-switcher';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  lang: Locale;
  dictionary: Dictionary['navbar'];
  localeSwitcherDictionary: Dictionary['localeSwitcher'];
  authDictionary: Dictionary['auth'];
}

export default function Navbar({ lang, dictionary, localeSwitcherDictionary, authDictionary }: NavbarProps) {
  const isMobile = useIsMobile();
  const { user, signOutUser, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast({
        title: authDictionary.signOutSuccessTitle,
        description: authDictionary.signOutSuccessMessage,
      });
      router.push(`/${lang}/`);
    } catch (error: any) {
      toast({
        title: authDictionary.signOutErrorTitle,
        description: error.message,
        variant: 'destructive',
      });
      router.push(`/${lang}/`);
    }
  };

  const navItems = [
    { href: `/${lang}`, label: dictionary.offers, icon: Home, key: 'offers' },
    { href: `/${lang}/analyze`, label: dictionary.analyzeImage, icon: Camera, key: 'analyze' },
    { href: `/${lang}/monitoring`, label: dictionary.monitoring || "Monitoring", icon: LineChartIcon, key: 'monitoring' },
  ];

  const storeRelatedLink = user 
    ? { href: `/${lang}/stores/products`, label: authDictionary.myProductsLink || "My Products", icon: ShoppingBag, key: 'my-products' }
    : { href: `/${lang}/auth/signin`, label: dictionary.forStores, icon: Store, key: 'for-stores' };

  const allNavItems = [...navItems, storeRelatedLink];


  const desktopNavLinks = () => (
    <>
      {allNavItems.map((item) => (
        <Button
          key={item.key}
          variant="ghost"
          asChild
          className="text-sm"
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-5 w-5" />
            {item.label}
          </Link>
        </Button>
      ))}
      {loading ? null : user ? (
        <>
          <Button variant="ghost" asChild className="text-sm">
            <Link href={`/${lang}/profile`}>
              <UserCircle className="mr-2 h-5 w-5" />
              {dictionary.profileLink || "My Profile"}
            </Link>
          </Button>
          <Button variant="ghost" onClick={handleSignOut} className="text-sm">
            <LogOut className="mr-2 h-5 w-5" />
            {authDictionary.signOutLink}
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" asChild className="text-sm">
            <Link href={`/${lang}/auth/signin`}>
              <LogIn className="mr-2 h-5 w-5" />
              {authDictionary.signInLink}
            </Link>
          </Button>
          <Button variant="default" asChild className="text-sm bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href={`/${lang}/auth/signup`}>
              <UserPlus className="mr-2 h-5 w-5" />
              {authDictionary.signUpLink}
            </Link>
          </Button>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link href={`/${lang}`} className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="none" />
            <path d="M30 50 Q50 30 70 50" stroke="currentColor" strokeWidth="8" fill="none" />
            <path d="M30 50 Q50 70 70 50" stroke="currentColor" strokeWidth="8" fill="none" />
            <circle cx="50" cy="50" r="10" fill="currentColor" />
          </svg>
          <span className="font-headline text-xl font-bold">{dictionary.appName}</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isMobile && (
            <nav className="flex items-center gap-1">
              {desktopNavLinks()}
            </nav>
          )}
          <LocaleSwitcher dictionary={localeSwitcherDictionary} currentLocale={lang} />
        </div>
      </div>
    </header>
  );
}
