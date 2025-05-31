
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
  // Root layout should not render <html> and <body> when using [lang] layout for i18n.
  // It becomes a pass-through for children, and [lang]/layout.tsx handles the document structure.
  return <>{children}</>;
}
