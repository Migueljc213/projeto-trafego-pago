import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://funnelguard.ai"),
  title: {
    default: "FunnelGuard AI — Stop Burning Ad Spend. Diagnose Your Full Funnel.",
    template: "%s | FunnelGuard AI",
  },
  description:
    "Our AI diagnoses your funnel, not just your ads. Instantly identify leaks in your Landing Page, Cart, and Competitor pricing. Get White Glove CAPI & Pixel Setup.",
  keywords: [
    "funnel optimization",
    "AI marketing",
    "ad spend optimization",
    "ROAS improvement",
    "CAPI setup",
    "Meta Pixel",
    "landing page analysis",
    "conversion rate optimization",
    "paid traffic",
    "funnel diagnosis",
  ],
  authors: [{ name: "FunnelGuard AI" }],
  creator: "FunnelGuard AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://funnelguard.ai",
    title: "FunnelGuard AI — Stop Burning Ad Spend",
    description:
      "Our AI diagnoses your funnel, not just your ads. Identify leaks in your Landing Page, Cart, and Competitor pricing instantly.",
    siteName: "FunnelGuard AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FunnelGuard AI — Complete Funnel Diagnosis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FunnelGuard AI — Stop Burning Ad Spend",
    description:
      "Our AI diagnoses your funnel, not just your ads. Identify leaks in your Landing Page, Cart, and Competitor pricing instantly.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark-base text-gray-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
