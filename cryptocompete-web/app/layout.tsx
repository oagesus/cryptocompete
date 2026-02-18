import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthGuardian } from "@/components/auth-guardian";
import { SubscriptionGuardian } from "@/components/subscription-guardian";
import { TimezoneGuardian } from "@/components/timezone-guardian";
import { ThemedToaster } from "@/components/themed-toaster";
import { CryptoPriceProvider } from "@/providers/crypto-price-provider";
import { CryptoPriceSubscriber } from "@/providers/crypto-price-subscriber";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CryptoCompete",
  description: "Cryptocurrency portfolio competition",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CryptoPriceProvider>
              <CryptoPriceSubscriber />
              <AuthGuardian />
              <SubscriptionGuardian />
              <TimezoneGuardian />
              <Navbar />
              <div className="flex flex-1 flex-col px-6 pt-12 pb-20">
                <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col">
                  {children}
                </div>
              </div>
              <Footer />
              <ThemedToaster />
            </CryptoPriceProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}