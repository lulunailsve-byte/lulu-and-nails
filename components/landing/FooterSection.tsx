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
      <div className="font-script text-4xl text-violet-200">{BRAND.name}</div>
      <div className="mt-1 font-display text-xs uppercase tracking-[.25em] text-violet-300">
        · {BRAND.tagline} ·
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
