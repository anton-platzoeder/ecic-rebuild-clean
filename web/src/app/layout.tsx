import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/toast/ToastContainer';
import { AuthenticatedNav } from '@/components/layout/AuthenticatedNav';
import { BatchProvider } from '@/contexts/BatchContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'InvestInsight',
  description: 'Investment Compliance & Insights Platform',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          <BatchProvider>
            <div className="min-h-screen flex flex-col">
              <AuthenticatedNav />
              <main className="flex-1">{children}</main>
            </div>
          </BatchProvider>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
