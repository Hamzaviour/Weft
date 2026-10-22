import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./logo";

export function SiteNav({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-bone/[0.06] bg-loom/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="focus-ring rounded-lg" aria-label="Weft home">
          <Logo size={26} />
        </Link>
        <nav className="flex items-center gap-1 text-sm">{children}</nav>
      </div>
    </header>
  );
}

export function NavLink({ href, children, active }: { href: string; children: ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`focus-ring rounded-full px-3.5 py-2 transition-colors ${active ? "bg-bone/10 text-bone" : "text-ash hover:text-bone"}`}
    >
      {children}
    </Link>
  );
}
