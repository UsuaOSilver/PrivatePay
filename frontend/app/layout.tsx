import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from 'sonner';
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ["latin"],
  variable: '--font-press-start'
});

export const metadata: Metadata = {
  title: "Coinflip - Insert Coin to Pay",
  description: "Payment links for Base. Gas-free USDC payments with social tipping and group splits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={pressStart2P.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}