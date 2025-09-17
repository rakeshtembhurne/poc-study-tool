import type { Metadata } from 'next';
import '../app/font.css';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
  title: 'Spaced Repetition',
  description: 'A powerful study tool for spaced repetition learning',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
