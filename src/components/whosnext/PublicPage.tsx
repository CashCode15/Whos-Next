import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

interface PublicPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}

export function PublicPage({ eyebrow, title, intro, children }: PublicPageProps) {
  return (
    <main className="min-h-screen bg-hero px-5 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <header className="flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-border/70 pb-5">
          <Link to="/" className="font-display text-lg text-brand">
            WHO&apos;S NEXT?
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link to="/about" className="transition-colors hover:text-foreground">About</Link>
            <Link to="/how-it-works" className="transition-colors hover:text-foreground">How it works</Link>
            <Link to="/community-guidelines" className="transition-colors hover:text-foreground">Safety</Link>
          </nav>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-foreground"
          >
            Start chatting <ArrowRight className="size-4" />
          </Link>
        </header>

        <section className="flex-1 py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>
          <div className="mt-12 max-w-3xl">{children}</div>
        </section>

        <footer className="border-t border-border/70 py-6 text-sm text-muted-foreground">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-display font-bold text-foreground">Meet with intention.</p>
              <p className="mt-1 max-w-sm">18+ only. Be kind, protect your privacy, and report anything that crosses the line.</p>
            </div>
            <nav className="grid grid-cols-2 gap-x-6 gap-y-2 sm:text-right">
              <Link to="/contact" className="hover:text-foreground">Contact</Link>
              <Link to="/community-guidelines" className="hover:text-foreground">Community Guidelines</Link>
              <Link to="/legal/privacy" className="hover:text-foreground">Privacy Policy</Link>
              <Link to="/legal/terms" className="hover:text-foreground">Terms of Service</Link>
            </nav>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 text-xs">
            <ShieldCheck className="size-3.5 text-success" /> Reports can be filed during a conversation with the report button.
          </p>
        </footer>
      </div>
    </main>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border/70 py-7 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

export function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="rounded-2xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground shadow-panel">
          {item}
        </li>
      ))}
    </ul>
  );
}