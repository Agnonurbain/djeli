// src/app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Djeli - Prof Chibi",
  description:
    "Votre tuteur IA personnel pour accompagner les élèves ivoiriens du collège à l'université.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={geistSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
