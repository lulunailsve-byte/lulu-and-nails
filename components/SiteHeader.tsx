"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/press-on", label: "Press-On" },
  { href: "/about", label: "Sobre mí" },
];

// Header sencillo, fijo arriba: marca a la izquierda + burger a la derecha.
// Transparente sobre el hero; se vuelve blanco al hacer scroll. El menú
// despliega los links indexados (Inicio / Press-On / Sobre mí).
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar el menú al navegar.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // No mostrar el header en el panel admin.
  if (pathname?.startsWith("/btw")) return null;

  const solid = scrolled || open;

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300 " +
        (solid ? "bg-white/90 shadow-[0_2px_14px_rgba(31,18,53,.07)] backdrop-blur" : "")
      }
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
        <Link
          href="/"
          className={"font-script text-2xl leading-none transition-colors " + (solid ? "text-violet-700" : "text-white")}
          style={solid ? undefined : { textShadow: "0 1px 6px rgba(0,0,0,.4)" }}
        >
          Lulu &amp; Nails
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className={
            "grid h-9 w-9 place-items-center rounded-full transition " +
            (solid ? "bg-violet-50 text-violet-700" : "bg-black/20 text-white backdrop-blur")
          }
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="mx-auto max-w-md px-4 pb-3">
          <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg">
            {LINKS.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    "block px-4 py-3 text-sm font-semibold transition " +
                    (active ? "bg-violet-500 text-white" : "text-ink-700 hover:bg-violet-50")
                  }
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
