/** @format */

import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { FlagsmithProvider } from "@/components/providers/FlagsmithProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "Edeastorm - Collaborative Ideation Canvas",
  description:
    "Real-time collaborative whiteboarding for team brainstorming and ideation sessions.",
  keywords: [
    "ideation",
    "brainstorming",
    "whiteboard",
    "collaboration",
    "canvas",
    "sticky notes",
  ],
  authors: [{ name: "Edeastorm Team" }],
  openGraph: {
    title: "Edeastorm - Collaborative Ideation Canvas",
    description:
      "Real-time collaborative whiteboarding for team brainstorming and ideation sessions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} ${caveat.variable} bg-zinc-950 text-zinc-100 antialiased font-sans`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <FlagsmithProvider
            environmentID={process.env.FLAG_SMITH_SDK_KEY || ""}
          >
            {children}
          </FlagsmithProvider>
        </SessionProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#fafafa",
              border: "1px solid #3f3f46",
            },
            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#fafafa",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fafafa",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
