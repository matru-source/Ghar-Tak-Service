import type { Metadata } from "next";
import "./globals.css";

const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  title: "Ghar Tak Services (GTS) — Professional Electrical Solutions",
  description: "Pan-India Electrical Services, 1000V High-Voltage Safety Standards, and Instant Verified Doorstep Service",
  icons: {
    icon: [
      { url: "/logo-gts-mark.png", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/logo-gts-mark.png",
    apple: "/logo-gts-mark.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
