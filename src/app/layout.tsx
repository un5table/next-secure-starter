import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s — ${site.name}` },
  description: site.description,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nonce is set per-request by src/proxy.ts and threaded to ThemeProvider's
  // inline script. Keep this chain intact or the CSP will block theme hydration.
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers nonce={nonce}>
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <footer
            role="contentinfo"
            className="border-t border-border py-4 text-center text-xs text-muted-foreground"
          >
            <p>
              {site.name} &middot; built with the secure Next.js starter
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
