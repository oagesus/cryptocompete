import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { AuthGuardian } from "@/components/auth-guardian";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CryptoPriceProvider>
            <CryptoPriceSubscriber />
            <AuthGuardian />
            <Navbar />
            <div className="flex flex-1 flex-col px-6 py-12">
              <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col">
                {children}
              </div>
            </div>
            <ThemedToaster />
          </CryptoPriceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}