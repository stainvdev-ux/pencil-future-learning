import type { Metadata } from "next";
import { Zilla_Slab, Instrument_Sans } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

// Free stand-ins for the brochure's American Typewriter: a slab serif with a
// typewriter cut for display, a plain grotesk for reading.
const display = Zilla_Slab({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pencil Future Learning City · Calicut",
  description:
    "A new destination for industry-connected education, emerging technologies and practical learning in Calicut, Kerala.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
