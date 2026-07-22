import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Life Wishlist — Everything I Want",
    template: "%s · Life Wishlist",
  },
  description:
    "The ultimate wishlist, inventory, collection and acquisition management platform. Track anything you want to own, buy, upgrade, collect or build.",
  keywords: ["wishlist", "inventory", "collection tracker", "budget", "acquisition"],
  openGraph: {
    title: "Life Wishlist",
    description: "Everything I want to own, buy, upgrade, collect or build — tracked beautifully.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <div className="app-bg" aria-hidden />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
