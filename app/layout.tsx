import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "GCTU HostelHub - MoMo 0206834470",
  description: "Find and book hostels near GCTU - Ghana - MoMo 0206834470",
  manifest: "/manifest.json",
  themeColor: "#1a237e",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a237e" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        {children}
        <InstallPrompt />
        <script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('/sw.js'); }); }`}} />
      </body>
    </html>
  );
}