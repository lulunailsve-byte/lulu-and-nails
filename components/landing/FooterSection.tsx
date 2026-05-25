import Image from "next/image";
import { BRAND, waLink } from "@/lib/brand";

export function FooterSection() {
  const links = [
    { href: `https://www.instagram.com/${BRAND.instagram}`, label: "📸 Instagram" },
    { href: `https://www.tiktok.com/@${BRAND.tiktok}`, label: "🎵 TikTok" },
    { href: waLink(), label: "💬 WhatsApp" },
    { href: `tel:+${BRAND.waNumber}`, label: `📞 ${BRAND.waDisplay}` },
  ];

  return (
    <footer className="bg-ink-900 px-5 pb-7 pt-14 text-center text-white/70">
      {/* Logo horizontal invertido a blanco (el SVG/PNG original es negro).
          brightness(0) fuerza todo a negro absoluto, invert(1) lo flippea a
          blanco puro — método estándar para teñir logos monocromáticos. */}
      <div className="mx-auto w-44 sm:w-48">
        <Image
          src="/logo-horizontal.png"
          alt={BRAND.name}
          width={4052}
          height={1323}
          className="h-auto w-full"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>
      <div className="mt-0 font-script text-2xl text-violet-300">
        {BRAND.tagline}
      </div>
      <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target={l.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="transition-colors hover:text-violet-200"
          >
            {l.label}
          </a>
        ))}
      </div>
      <div className="mt-6 border-t border-white/10 pt-5 text-[11px] text-white/40">
        © {new Date().getFullYear()} {BRAND.name} · {BRAND.owner} · {BRAND.location}
      </div>
    </footer>
  );
}
