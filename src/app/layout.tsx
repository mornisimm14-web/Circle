/**
 * Root layout for the CIRCLE application. Sets up fonts (Newsreader for
 * headings, Inter for body/UI), the global warm off-white/blue theme
 * (globals.css), and the next-intl provider so any client component can
 * resolve translated strings.
 */
import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "CIRCLE",
  description: "Human support infrastructure — the same people, every time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
