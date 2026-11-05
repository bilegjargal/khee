import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khee Next.js check",
  description: "Renders Khee components from server components.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "var(--khee-color-background)",
          color: "var(--khee-color-text)",
          fontFamily: "var(--khee-font-family)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
