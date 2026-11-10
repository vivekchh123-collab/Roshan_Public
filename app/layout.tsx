import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Roshan Tubes — Solar, Electrical & Hardware', template: '%s | Roshan Tubes' },
  description: 'Roshan Tubes, Maharajganj, Ghazipur — authorized vendor for PM Surya Ghar: Muft Bijli Yojana. Solar, electrical and hardware solutions.',
  icons: { icon: '/logo.png', shortcut: '/logo.png', apple: '/logo.png' },
  manifest: '/manifest.json',
};
export const viewport: Viewport = { themeColor: '#0b57c8', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <Providers>
            <Navbar />
            <main className="min-h-[70vh] pt-14">{children}</main>
            <Footer />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
