# Lulu & Nails

App de reservas del estudio de uñas de Luizandra Zerpa.

Stack: **Next.js 15** (App Router) · **React 19** · **Tailwind v4** · **TypeScript** · **Google Calendar API** · **Vercel**.

## Setup local

```bash
npm install
cp .env.example .env.local   # rellena con las credenciales reales
npm run dev
```

Abre http://localhost:3000.

## Variables de entorno

Ver `.env.example`. En Vercel deben estar configuradas en *Project Settings → Environment Variables*:

| Variable | Origen |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credenciales OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Idem |
| `GOOGLE_REFRESH_TOKEN` | Generado con OAuth Playground autorizando el calendario |
| `CALENDAR_ID` | ID del calendario de Google donde se crean las citas |

## Estructura

```
app/
├── layout.tsx               # Fuentes (Bricolage, Jakarta, Caveat) + metadata + PWA
├── page.tsx                 # Home — landing + Reserva Express embebida
├── globals.css              # Tailwind v4 + design tokens
├── manifest.ts              # Manifest PWA
└── api/
    ├── availability/route.ts  # GET — slots ocupados del día desde Google Calendar
    └── book/route.ts          # POST — crea evento en Calendar

components/
├── WhatsAppFloat.tsx
├── landing/                 # Hero, Services, Schedule, Footer
└── booking/BookingExpress.tsx

lib/
├── brand.ts                 # Datos de marca (WhatsApp, redes)
├── services.ts              # Catálogo de servicios (fuente de verdad)
├── schedule.ts              # Lógica de horarios y slots
└── google-calendar.ts       # Cliente de Google Calendar
```

## Reglas de horario

- Lun-Sáb. Domingos cerrado.
- Bloque mañana 9–12. Pausa 12–14. Tarde 14–21. Última cita debe terminar 21:00.
- Gap de 15 min entre citas.
- Slot solo es válido si el servicio (incluyendo pedicure si aplica) termina dentro de su bloque.

## Deploy

Push a `main` → Vercel hace deploy automático.
