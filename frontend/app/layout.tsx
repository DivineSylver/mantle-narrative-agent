import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Web3Providers } from "@/lib/web3-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mantle Narrative Agent — On-chain Intelligence Terminal",
  description:
    "Autonomous AI analyst for the Mantle ecosystem. Narrative detection, smart-money tracking, and on-chain verified predictions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
        <Web3Providers>
          <div className="flex min-h-screen flex-col bg-[color:var(--color-bg)]">
            {children}
          </div>
        </Web3Providers>
      </body>
    </html>
  );
}
