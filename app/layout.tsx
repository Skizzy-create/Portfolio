import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://kartikaslia.vercel.app"),
  title: "Kartik Aslia — RL Environments & Applied AI Engineer",
  description:
    "Kartik Aslia builds RL environments, agentic evaluation pipelines and production AI platforms — from reward-hacking defenses to systems scaled to 1000+ concurrent users.",
  openGraph: {
    title: "Kartik Aslia — RL Environments & Applied AI Engineer",
    description: "Environments where AI agents learn, and the systems that keep them honest.",
    images: ["/images/og.png"],
    type: "website",
  },
  twitter: { card: "summary_large_image", creator: "@iamKartikAslia", images: ["/images/og.png"] },
};

export const viewport: Viewport = { themeColor: "#04100c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${geist.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
