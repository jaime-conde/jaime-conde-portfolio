import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const assetPrefix = process.env.GITHUB_ACTIONS === "true" ? "/portfolio" : "";

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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-20NWYBJSH4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-20NWYBJSH4');
          `}
        </Script>
      </body>
    </html>
  );
}
