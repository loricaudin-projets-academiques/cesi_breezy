import type { Metadata } from "next";
import "./globals.css";

import AppShell from "./AppShell";
import { BreezyAppProvider } from "./BreezyAppProvider";

export const metadata: Metadata = {
  title: "Breezy",
  description: "Mobile-first social feed built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <BreezyAppProvider>
          <AppShell>{children}</AppShell>
        </BreezyAppProvider>
      </body>
    </html>
  );
}
