
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/lib/get-dictionary';

interface FooterProps {
  lang: Locale; // lang might be used for specific links in the future
  dictionary: Dictionary['footer'];
}
export default function Footer({ dictionary }: FooterProps) {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-6 text-center text-sm text-muted-foreground">
        <p>{dictionary.copy.replace('{year}', new Date().getFullYear().toString())}</p>
        <p className="mt-1">{dictionary.tagline}</p>
      </div>
    </footer>
  );
}
