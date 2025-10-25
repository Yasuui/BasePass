import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BasePass - Onchain Event Passport",
  description: "Collect verifiable event stamps on Base network",
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'),
  openGraph: {
    title: "BasePass - Onchain Event Passport",
    description: "Collect verifiable event stamps on Base network",
    images: ['/icon.png'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:miniapp': 'vNext',
    'fc:frame:image': `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/icon.png`,
    'fc:frame:button:1': 'View Passport',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/passport`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
