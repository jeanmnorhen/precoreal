
import './globals.css';
import type { Metadata } from 'next';

// Basic metadata, specific metadata will be in [lang]/layout.tsx
export const metadata: Metadata = {
  title: 'Preço Real', // Generic title
  description: 'Encontre os melhores preços locais para produtos e serviços.', // Generic description
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The lang attribute will be set in [lang]/layout.tsx
    <html suppressHydrationWarning>
      <head>
         {/* Font links moved to [lang]/layout.tsx to be within the html tag with lang attribute */}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
