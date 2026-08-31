import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bloom & Bliss — Fresh Flowers, Cakes & Personalised Gifts",
  description:
    "Send joy in minutes! Same-day & midnight delivery of fresh flowers, delicious cakes, personalised gifts and curated combos across 400+ cities.",
  keywords: [
    "flowers delivery",
    "cake delivery",
    "gifts",
    "same day delivery",
    "midnight delivery",
    "birthday gifts",
    "anniversary",
  ],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Bloom & Bliss — Gifts that make hearts bloom",
    description: "Fresh flowers, cakes & personalised gifts with same-day delivery.",
    siteName: "Bloom & Bliss",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
  width: "device-width",
  initialScale: 1,
};

/** Runs before paint: reads the persisted zustand store and applies the dark class (no FOUC). */
const themeInitScript = `(function(){try{var raw=localStorage.getItem("bloom-bliss-shop");var t=raw?(JSON.parse(raw).state||{}).theme:null;if(t==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${jakarta.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
