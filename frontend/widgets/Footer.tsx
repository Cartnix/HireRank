import Link from "next/link";

export const Footer = () => (
  <footer className="py-10 px-6 border-t border-white/10">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-foreground/50">
      <span>HireRank © 2026</span>
      <div className="flex gap-6">
        <Link href="/privacy" className="hover:text-foreground/80 transition-colors">
          Политика
        </Link>
        <Link href="/terms" className="hover:text-foreground/80 transition-colors">
          Условия
        </Link>
        <a
          href="mailto:noreply@localhost"
          className="hover:text-foreground/80 transition-colors"
        >
          Contact
        </a>
      </div>
    </div>
  </footer>
);
