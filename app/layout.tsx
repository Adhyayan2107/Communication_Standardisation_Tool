import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { CONSTITUTION } from "@/lib/constitution";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-space-grotesk",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Consuma · Communication Standardisation Tool",
  description:
    "Generates on-brand content from the Brand Constitution and validates every draft with deterministic checks.",
};

const NAV = [
  { href: "/tool", label: "Workbench" },
  { href: "/checks", label: "Checks" },
  { href: "/constitution", label: "Constitution" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${plexMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <header className="border-b border-line bg-panel">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-baseline gap-x-6 gap-y-1 px-5 py-3.5 lg:px-7">
            <Link href="/" className="font-display text-[15px] font-bold tracking-[0.01em]">
              Consuma <span className="font-normal text-muted">· Standards</span>
            </Link>
            <nav aria-label="Main" className="flex gap-4 text-[13px]">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="text-ink/80 hover:text-viridian">
                  {n.label}
                </Link>
              ))}
            </nav>
            <span className="ml-auto font-mono text-[11px] text-muted">
              Constitution v{CONSTITUTION.meta.version} · {CONSTITUTION.meta.date}
            </span>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="bg-viridian-deep text-white/80">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-baseline gap-x-6 gap-y-2 px-5 py-6 text-[12.5px] lg:px-7">
            <p className="max-w-[62ch]">
              Every piece of public communication is generated from the Brand Constitution and
              validated against it. The model never decides the standard; it executes it.
            </p>
            <span className="ml-auto font-mono text-[11px] text-white/60">
              brand_constitution.json · v{CONSTITUTION.meta.version}
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
