
'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { i18n } from '@/i18n-config';
import { Button } from '@/components/ui/button';
import type { Dictionary } from '@/lib/get-dictionary';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface LocaleSwitcherProps {
  dictionary: Dictionary['localeSwitcher'];
  currentLocale: Locale;
}

export default function LocaleSwitcher({ dictionary, currentLocale }: LocaleSwitcherProps) {
  const pathName = usePathname();
  const router = useRouter();

  const redirectedPathName = (locale: Locale) => {
    if (!pathName) return '/';
    const segments = pathName.split('/');
    segments[1] = locale;
    return segments.join('/');
  };

  const handleLocaleChange = (locale: Locale) => {
    const newPath = redirectedPathName(locale);
    router.push(newPath);
    router.refresh(); // Important to re-fetch server components with new locale
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
          <Globe className="h-4 w-4" />
          <span className="uppercase">{currentLocale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>
           <span className="text-xs text-muted-foreground">{dictionary.label}</span>
        </DropdownMenuItem>
        {i18n.locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            disabled={locale === currentLocale}
            className="cursor-pointer"
          >
            {dictionary[locale as keyof typeof dictionary] || locale.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
