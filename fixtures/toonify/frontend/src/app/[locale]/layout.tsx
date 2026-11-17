import type { Metadata, Viewport } from "next";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/providers/AuthProvider";


const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Toonify - AI Webtoon Studio",
  description: "Create your own webtoon with AI Director",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Toonify - AI Webtoon Studio",
    description: "Create your own webtoon with AI Director",
    images: [
      {
        url: `${appUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Toonify - AI Webtoon Studio",
      },
    ],
  },
};

/* Mobile viewport configuration: disable pinch zoom */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleAnalytics } from '@next/third-parties/google';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html lang={locale} suppressHydrationWarning>
        <head>
          {/* Pretendard Variable Font - CDN */}
          <link
            rel="stylesheet"
            as="style"
            crossOrigin="anonymous"
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
          />
        </head>
        <body
          suppressHydrationWarning
          className="antialiased bg-background-light dark:bg-background-dark"
        >
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </NextIntlClientProvider>
        <GoogleAnalytics gaId="G-SH1FLE9YVC" />
        </body>
      </html>
    </ClerkProvider>
  );
}
