import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kore - Journal de Trading Professionnel",
    template: "%s | Kore",
  },
  description: "Améliorez votre trading avec Kore. Suivi des trades, analytics avancées, psychologie du trading et gestion multi-comptes.",
  keywords: ["trading", "journal", "forex", "crypto", "analytics", "pnl", "portfolio"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
