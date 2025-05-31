'use client';

import Link from 'next/link';
import { Home, Camera, Store, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import React from 'react';

const navItems = [
  { href: '/', label: 'Offers', icon: Home },
  { href: '/analyze', label: 'Analyze Image', icon: Camera },
  { href: '/stores/register', label: 'For Stores', icon: Store },
];

export default function Navbar() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const commonNavLinks = (isMobileView = false) => (
    <>
      {navItems.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          asChild
          className={`justify-start ${isMobileView ? 'w-full text-lg py-3' : 'text-sm'}`}
          onClick={() => isMobileView && setMobileMenuOpen(false)}
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="none" />
            <path d="M30 50 Q50 30 70 50" stroke="currentColor" strokeWidth="8" fill="none" />
            <path d="M30 50 Q50 70 70 50" stroke="currentColor" strokeWidth="8" fill="none" />
            <circle cx="50" cy="50" r="10" fill="currentColor" />
          </svg>
          <span className="font-headline text-xl font-bold">RealPrice Finder</span>
        </Link>

        {isMobile ? (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs p-6">
              <nav className="flex flex-col gap-4">
                {commonNavLinks(true)}
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="flex items-center gap-2">
            {commonNavLinks()}
          </nav>
        )}
      </div>
    </header>
  );
}
