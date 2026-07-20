import type { Metadata } from "next";
import type { ReactNode } from "react";

import { RelayProvider } from "../src/relay";

export const metadata: Metadata = {
  title: "PJM-1564 Relay Activity GC reproduction",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: "3rem auto",
          maxWidth: 720,
          padding: "0 1rem",
        }}
      >
        <RelayProvider>{children}</RelayProvider>
      </body>
    </html>
  );
}
