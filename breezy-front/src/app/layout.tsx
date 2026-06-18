import type { Metadata } from "next";
import "./globals.css";

import AppShell from "./AppShell";
import { BreezyAppProvider } from "./BreezyAppProvider";
import { LanguageProvider } from "../translations/LanguageProvider";

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
        <LanguageProvider>
          <BreezyAppProvider>
            <AppShell>{children}</AppShell>
          </BreezyAppProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
