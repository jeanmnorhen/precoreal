
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Camera, Store, UserCircle, LogOut, LineChart as LineChartIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/lib/get-dictionary';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';

interface BottomNavbarProps {
  lang: Locale;
  dictionary: Dictionary['bottomNavbar'];
  authDictionary: Dictionary['auth'];
}

export default function BottomNavbar({ lang, dictionary, authDictionary }: BottomNavbarProps) {
  const pathname = usePathname();
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


  if (!isMobile) {
    return null;
  }
  
  const commonNavItems = [
    { href: `/${lang}`, label: dictionary.offers, icon: Home, key: 'offers' },
    { href: `/${lang}/analyze`, label: dictionary.analyze, icon: Camera, key: 'analyze' },
    { href: `/${lang}/monitoring`, label: dictionary.monitoring || "Monitor", icon: LineChartIcon, key: 'monitoring' },
  ];

  let accountOrStoreItems = [];
  if (loading) {
    // Optionally show a loading indicator or just an empty space
  } else if (user) {
    accountOrStoreItems = [
      { href: `/${lang}/stores/products`, label: authDictionary.myProductsLinkShort || "Store", icon: Store, key: 'my-store-products' },
      { href: `/${lang}/profile`, label: dictionary.profile || "Profile", icon: UserCircle, key: 'profile' },
    ];
  } else {
     accountOrStoreItems = [
      { href: `/${lang}/auth/signin`, label: dictionary.stores, icon: Store, key: 'stores-auth' },
    ];
  }

  const bottomNavItems = [...commonNavItems, ...accountOrStoreItems];


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-foreground/95 backdrop-blur supports-[backdrop-filter]:bg-foreground/60 md:hidden">
      <div className="mx-auto flex h-full max-w-md items-center justify-around px-2">
        {bottomNavItems.map((item) => {
          const isActive = item.href === `/${lang}` ? pathname === `/${lang}` : pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center p-1 rounded-md transition-colors duration-150 ease-in-out h-full',
                isActive ? 'text-primary-foreground' : 'text-muted hover:text-primary-foreground/80'
              )}
            >
              <item.icon className={cn('h-6 w-6 mb-0.5', isActive ? 'text-primary-foreground' : 'text-muted')} />
              <span className={cn('text-xs', isActive ? 'font-medium' : 'font-normal')}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {user && !loading && (
           <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              'flex flex-1 flex-col items-center justify-center p-1 rounded-md transition-colors duration-150 ease-in-out h-full text-muted hover:text-primary-foreground/80'
            )}
          >
            <LogOut className={cn('h-6 w-6 mb-0.5 text-muted')} />
            <span className={cn('text-xs font-normal')}>
              {authDictionary.signOutLinkShort || "Sign Out"}
            </span>
          </Button>
        )}
      </div>
    </nav>
  );
}
