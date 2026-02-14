// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";

// IMPORTANT: load Providers only on the client, so server build never evaluates it
const Providers = dynamic(() => import("./providers"), { ssr: false });

export const metadata: Metadata = {
  title: "CNH Wallet",
  description: "CNH Wallet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
