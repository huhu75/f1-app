import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "F1 2026 Friends",
  description: "Pronostics F1 entre amis pour la saison 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="light">
      <body className={`${inter.className} min-h-screen bg-white text-black`}>
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
          <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
            <div className="flex items-center gap-6 md:gap-10">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold inline-block text-xl tracking-tight">
                  F1 2026
                </span>
              </Link>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link href="/" className="transition-colors hover:text-black text-gray-500">Dashboard</Link>
                <Link href="/pronostics" className="transition-colors hover:text-black text-gray-500">Pronostics</Link>
              </nav>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                Saison 2026
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto max-w-screen-2xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
