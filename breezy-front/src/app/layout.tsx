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
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC : applique le thème avant le premier rendu pour éviter le flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem('breezy:theme'));}catch(e){}var ok=['base','light','noir-violet','ocean','forest','sunset'];document.documentElement.dataset.theme=(ok.indexOf(t)>-1)?t:'base';})();`,
          }}
        />
      </head>
      <body>
        <BreezyAppProvider>
          <AppShell>{children}</AppShell>
        </BreezyAppProvider>
      </body>
    </html>
  );
}
