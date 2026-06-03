// Genera la imagen OG (1200x630) para compartir en redes.
// Collage de diseños press-on a la derecha + texto de marca a la izquierda.
// Correr con `node scripts/gen-og.mjs` desde la raíz del repo.
import sharp from "sharp";
import path from "node:path";

const W = 1200;
const H = 630;
const OUT = path.resolve("./public/og-image.jpg");
const G = (n) => path.resolve(`./public/press-on-gallery/${n}.jpeg`);

// Fondo: gradiente violet-50 -> pink-50
const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F7F2FF"/>
      <stop offset="1" stop-color="#FFF1F7"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>`;

// Texto (overlay transparente)
const textSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .label{font-family:'Segoe UI',Arial,sans-serif;font-weight:700;letter-spacing:4px;fill:#7B5CFF;}
    .h{font-family:Georgia,'Times New Roman',serif;font-style:italic;fill:#1F1235;}
    .hv{fill:#7B5CFF;}
    .svc{font-family:'Segoe UI',Arial,sans-serif;fill:#6B5B85;}
    .hl{font-family:'Segoe UI',Arial,sans-serif;font-weight:800;fill:#D14785;}
    .sub{font-family:'Segoe UI',Arial,sans-serif;fill:#6B5B85;}
    .cta{font-family:'Segoe UI',Arial,sans-serif;font-weight:700;fill:#FFFFFF;}
  </style>
  <text x="70" y="92" class="label" font-size="22">ESTUDIO DE UÑAS · VENEZUELA</text>
  <text x="68" y="212" class="h" font-size="86">Renace tu <tspan class="hv">look.</tspan></text>
  <text x="70" y="288" class="svc" font-size="23">Semipermanente · Polygel · Esculpido · Pedicura</text>
  <text x="70" y="362" class="hl" font-size="30">+ Kits Press-On personalizados</text>
  <text x="70" y="396" class="sub" font-size="21">A tu medida · listas para usar · envío a toda Venezuela</text>
  <rect x="70" y="442" width="476" height="64" rx="32" fill="#1F1235"/>
  <text x="308" y="483" class="cta" font-size="23" text-anchor="middle">Reserva en luluandnails.com</text>
</svg>`;

// Collage 2x2 a la derecha (x: 720..1200, cada foto 240x315)
const PHOTOS = [2, 1, 3, 5]; // variedad de color
const positions = [
  { left: 720, top: 0 },
  { left: 960, top: 0 },
  { left: 720, top: 315 },
  { left: 960, top: 315 },
];

const cells = await Promise.all(
  PHOTOS.map(async (n) => {
    const buf = await sharp(G(n))
      .resize(240, 315, { fit: "cover", position: "centre" })
      .toBuffer();
    return buf;
  }),
);

const composites = [
  ...cells.map((input, i) => ({ input, left: positions[i].left, top: positions[i].top })),
  { input: Buffer.from(textSvg), left: 0, top: 0 },
];

await sharp(Buffer.from(bgSvg))
  .composite(composites)
  .jpeg({ quality: 84 })
  .toFile(OUT);

console.log(`✓ OG image generada: ${OUT}`);
