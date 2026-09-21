import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SahYog — Societal Innovation Collaboration Platform',
  description: 'SahYog connects citizens who report real societal problems with government departments, universities, industries, NGOs and other problem solvers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
