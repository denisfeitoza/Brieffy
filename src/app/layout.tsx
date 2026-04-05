import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Brieffy | Smart Briefing AI",
  description: "Adaptive Intelligent Briefing System for diagnostics, marketing, and branding. Generate complete briefings in minutes with Brieffy.",
  openGraph: {
    title: "Brieffy | Smart Briefing AI",
    description: "Adaptive Intelligent Briefing System for diagnostics, marketing, and branding.",
    url: "https://brieffy.com",
    siteName: "Brieffy",
    locale: "en_US",
    alternateLocale: ["pt_BR", "es_ES"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brieffy | Smart Briefing AI",
    description: "Adaptive Intelligent Briefing System for diagnostics, marketing, and branding.",
  },
  appleWebApp: {
    title: "Brieffy",
    statusBarStyle: "default",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="font-sans min-h-full flex flex-col bg-background text-foreground overflow-x-hidden"
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: { 
                background: 'var(--bg)', 
                border: '1px solid var(--bd)', 
                color: 'var(--text)',
                fontFamily: "'DM Sans', sans-serif",
              }
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
