import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: { default: "Weft — Your week, woven", template: "%s · Weft" },
  description:
    "Weft connects your calendar, Spotify, GitHub and health data, then tells you the story of your week: animated story cards, AI insights and a generative tapestry.",
  openGraph: {
    title: "Weft — Your week, woven",
    description: "Four threads. One story. Every Sunday.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#f7f2ea" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}>
      <body className="grain min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
