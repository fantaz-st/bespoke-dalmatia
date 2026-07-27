import { Roboto } from "next/font/google";
import "./globals.css";

import SmoothScroll from "@/components/SmoothScroll/SmoothScroll";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400","500", "700", "900"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata = {
  title: "FNTZ - WebGL Sliced Transition Slideshow Hero",
  description:
    "WebGL sliced-transition slideshow hero, rebuilt on the Next.js App Router.",
};

export const viewport = {
  themeColor: "#ffcbcb",
};

export default function RootLayout({ children }) {
  return (
    // The extension-injected classes on <html> land before React hydrates,
    // so they read as a server/client mismatch. suppressHydrationWarning
    // covers this element's own attributes only — it does not cascade, so
    // real mismatches deeper in the tree are still reported.
    <html
      lang="en"
      translate="no"
      className={roboto.variable}
      suppressHydrationWarning
    >
      <body className={roboto.className}>
        {/* Renders nothing — it drives the page scroll and cleans up after
            itself, so it sits alongside the content rather than wrapping it. */}
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
