import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://constra.mzubairhassan18.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Constra — Construction Site Management ERP for UAE Contractors",
    template: "%s · Constra",
  },
  description:
    "Constra is the construction ERP for UAE contractors: projects & stages, HR & payroll, supplier bills with 5% VAT, double-entry ledger, site operations, fleet, team chat, client portal and AI insights — in one mobile-ready app.",
  keywords: [
    "construction ERP",
    "construction management software UAE",
    "site management",
    "contractor software",
    "BOQ tracking",
    "UAE VAT construction",
    "payroll UAE labour",
    "client portal construction",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Constra",
    title: "Constra — Construction Site Management ERP",
    description:
      "Projects, HR, bills with UAE VAT, ledger, site ops, fleet, chat, portal and AI — one app for contractors.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Constra — Construction Site Management ERP",
    description:
      "Projects, HR, bills with UAE VAT, ledger, site ops, fleet, chat, portal and AI.",
  },
  robots: { index: true, follow: true },
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
