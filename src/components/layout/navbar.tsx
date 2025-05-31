
'use client';

import Link from 'next/link';
import { Home, Camera, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import React from 'react';

const navItems = [
  { href: '/', label: 'Ofertas', icon: Home },
  { href: '/analyze', label: 'Analisar Imagem', icon: Camera },
  { href: '/stores/register', label: 'Para Lojas', icon: Store },
];

export default function Navbar() {
  const isMobile = useIsMobile();

  const desktopNavLinks = () => (
    <>
      {navItems.map((item) => (
        <Button
          key={item.label}
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
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="none" />
            <path d="M30 50 Q50 30 70 50" stroke="currentColor" strokeWidth="8" fill="none" />
            <path d="M30 50 Q50 70 70 50" stroke="currentColor" strokeWidth="8" fill="none" />
            <circle cx="50" cy="50" r="10" fill="currentColor" />
          </svg>
          <span className="font-headline text-xl font-bold">Preço Real</span>
        </Link>

        {!isMobile && (
          <nav className="flex items-center gap-2">
            {desktopNavLinks()}
          </nav>
        )}
      </div>
    </header>
  );
}
