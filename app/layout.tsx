import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const assetPrefix = process.env.GITHUB_ACTIONS === "true" ? "/jaime-conde-portfolio" : "";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Engineering portfolio of Jaime Conde—computational research, lightweight structures, additive manufacturing, and STEM outreach.",
  icons: {
    icon: `${assetPrefix}/favicon.svg`,
    shortcut: `${assetPrefix}/favicon.svg`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
