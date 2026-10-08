import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GCTU HostelHub",
  description: "Ghana Hostel Management - Find and manage hostels",
  manifest: "/manifest.json",
  themeColor: "#1a237e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HostelHub",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#1a237e" />
      </head>
      <body>{children}</body>
    </html>
  );
}