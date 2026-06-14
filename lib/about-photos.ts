import { readdirSync } from "node:fs";
import path from "node:path";

// Lee y clasifica las fotos de public/about-us en build:
//   foto#          → trabajo (uñas / ocasiones especiales)
//   fotoclase#     → clases que da Luizandra
//   fotocurso#     → cursos / masterclass que ha tomado
//   ss#            → screenshots (testimonios)
//   fotohistoria#  → trayectoria, con pie de foto embebido en el nombre
//                    (el número es opcional; ej. "fotohistoria Todos mis...").
// Si existe una versión "<base> updated.<ext>", se usa esa en lugar de "<base>".

const DIR = "about-us";

// Orden cronológico de la historia. El -1 representa la foto sin número
// ("Todos mis implementos... cuando comencé a domicilio"), que va justo después
// de la primera de domicilio (38).
const HISTORIA_ORDER = [38, -1, 20, 18, 19, 17, 16, 15, 13, 12, 14, 35, 31, 30, 52];

export type StoryPhoto = { src: string; caption: string; num: number };

export type AboutPhotos = {
  trabajo: string[];
  clases: string[];
  cursos: string[];
  screenshots: string[];
  historia: StoryPhoto[];
};

const url = (file: string) => `/${DIR}/${encodeURIComponent(file)}`;
const numOf = (f: string) => {
  const m = f.match(/(\d+)/);
  return m ? parseInt(m[1]!, 10) : 0;
};
const isUpdated = (f: string) => /\bupdated\s*$/i.test(f.replace(/\.[^.]+$/, ""));
const baseKey = (f: string) =>
  f.replace(/\.[^.]+$/, "").replace(/\s*updated\s*$/i, "").trim().toLowerCase();

export function loadAboutPhotos(): AboutPhotos {
  let files: string[] = [];
  try {
    files = readdirSync(path.join(process.cwd(), "public", DIR)).filter((f) =>
      /\.(jpe?g|png|webp)$/i.test(f),
    );
  } catch {
    return { trabajo: [], clases: [], cursos: [], screenshots: [], historia: [] };
  }

  // Dedup: por cada base, preferir la versión "updated" si existe.
  const preferred = new Map<string, string>();
  for (const f of files) {
    const key = baseKey(f);
    const cur = preferred.get(key);
    if (!cur || (isUpdated(f) && !isUpdated(cur))) preferred.set(key, f);
  }
  const chosen = [...preferred.values()];

  const trabajo: string[] = [];
  const clases: string[] = [];
  const cursos: string[] = [];
  const screenshots: string[] = [];
  const historiaRaw: StoryPhoto[] = [];

  for (const f of chosen) {
    const lower = f.toLowerCase();
    if (lower.startsWith("fotohistoria")) {
      const base = f.replace(/\.[^.]+$/, "");
      const numMatch = base.match(/^fotohistoria\s*(\d+)/i);
      const num = numMatch ? parseInt(numMatch[1]!, 10) : -1;
      let caption = base
        .replace(/^fotohistoria\s*\d*\s*/i, "")
        .replace(/\s*updated\s*$/i, "")
        .trim();
      caption = caption.replace(/\(emoji con ojos de coraz[oó]n\)/gi, "😍");
      historiaRaw.push({ src: url(f), caption, num });
    } else if (lower.startsWith("fotoclase")) {
      clases.push(f);
    } else if (lower.startsWith("fotocurso")) {
      cursos.push(f);
    } else if (lower.startsWith("foto")) {
      trabajo.push(f);
    } else if (lower.startsWith("ss")) {
      screenshots.push(f);
    }
  }

  const byNum = (a: string, b: string) => numOf(a) - numOf(b);
  trabajo.sort(byNum);
  clases.sort(byNum);
  cursos.sort(byNum);
  screenshots.sort(byNum);

  const orderIndex = (n: number) => {
    const i = HISTORIA_ORDER.indexOf(n);
    return i === -1 ? 1000 + n : i;
  };
  historiaRaw.sort((a, b) => orderIndex(a.num) - orderIndex(b.num));

  return {
    trabajo: trabajo.map(url),
    clases: clases.map(url),
    cursos: cursos.map(url),
    screenshots: screenshots.map(url),
    historia: historiaRaw,
  };
}
