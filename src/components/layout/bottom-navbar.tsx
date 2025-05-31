
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, Store } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/lib/get-dictionary';

interface BottomNavbarProps {
  lang: Locale;
  dictionary: Dictionary['bottomNavbar'];
}

export default function BottomNavbar({ lang, dictionary }: BottomNavbarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }
  
  const bottomNavItems = [
    { href: `/${lang}`, label: dictionary.offers, icon: Home, key: 'offers' },
    { href: `/${lang}/analyze`, label: dictionary.analyze, icon: Camera, key: 'analyze' },
    { href: `/${lang}/stores`, label: dictionary.stores, icon: Store, key: 'stores' }, // Consolidated /stores/register and /stores/products
  ];


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-foreground/95 backdrop-blur supports-[backdrop-filter]:bg-foreground/60 md:hidden">
      <div className="mx-auto flex h-full max-w-md items-center justify-around px-2">
        {bottomNavItems.map((item) => {
          // Check if the current path starts with the item's base path (e.g. /pt/stores for /pt/stores/register)
          // For the root path, it needs an exact match or if it's the root path with locale.
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
      </div>
    </nav>
  );
}
