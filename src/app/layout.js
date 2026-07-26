import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
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
    <html lang="en" translate="no" className={roboto.variable}>
      <body className={roboto.className}>{children}</body>
    </html>
  );
}
