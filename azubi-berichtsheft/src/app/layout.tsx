import './globals.css';
import type { ReactNode } from 'react';

/**
 * Root layout component.  This component wraps all pages in the application
 * and applies global styles.  Use it to inject providers (such as a theme
 * provider) or persistent layout elements like navigation bars.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}