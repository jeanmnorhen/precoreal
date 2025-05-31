
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, Store } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const bottomNavItems = [
  { href: '/', label: 'Ofertas', icon: Home },
  { href: '/analyze', label: 'Analisar', icon: Camera },
  { href: '/stores/register', label: 'Lojas', icon: Store },
];

export default function BottomNavbar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="mx-auto flex h-full max-w-md items-center justify-around px-2">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/stores/register' && pathname.startsWith('/stores'));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center p-1 rounded-md transition-colors duration-150 ease-in-out h-full',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-6 w-6 mb-0.5', isActive ? 'text-primary' : '')} />
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
