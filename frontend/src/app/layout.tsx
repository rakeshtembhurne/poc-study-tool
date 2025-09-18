import type { Metadata } from 'next';
import '../app/font.css';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Super-Memo',
  description: 'Intelligent flashcard learning system',
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
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
