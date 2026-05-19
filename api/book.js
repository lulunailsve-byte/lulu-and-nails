// ═══════════════════════════════════════════════════════════
// LULU & NAILS — Crear reserva en Google Calendar
// Endpoint: POST /api/book
// Body JSON: { date, tiempo, duracion, nombre, apellido, servicio, telefono, correo }
// ═══════════════════════════════════════════════════════════
const { google } = require('googleapis');

const pad = n => String(n).padStart(2, '0');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Solo POST' });
  }

  try {
    // Vercel parsea JSON automaticamente cuando Content-Type es application/json
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);

    const {
      date,
      tiempo,
      duracion,
      nombre   = '',
      apellido = '',
      servicio = '',
      telefono = '',
      correo   = ''
    } = body || {};

    if (!date || tiempo === undefined || !duracion) {
      return res.status(400).json({ ok: false, error: 'Faltan datos de la cita' });
    }

    // Autenticacion con refresh token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Construir hora inicio y fin en formato Caracas
    const tiempoNum   = parseInt(tiempo, 10);
    const duracionNum = parseInt(duracion, 10);

    const hIni = Math.floor(tiempoNum / 60);
    const mIni = tiempoNum % 60;
    const total = tiempoNum + duracionNum;
    const hFin = Math.floor(total / 60);
    const mFin = total % 60;

    const startISO = `${date}T${pad(hIni)}:${pad(mIni)}:00`;
    const endISO   = `${date}T${pad(hFin)}:${pad(mFin)}:00`;

    // Armar el evento
    const event = {
      summary: `${nombre} ${apellido} - ${servicio}`,
      description:
        `Servicio: ${servicio}\n` +
        `Telefono: ${telefono}\n` +
        `Correo: ${correo}`,
      start: { dateTime: startISO, timeZone: 'America/Caracas' },
      end:   { dateTime: endISO,   timeZone: 'America/Caracas' },
      attendees: correo ? [{
        email: correo,
        displayName: `${nombre} ${apellido}`.trim()
      }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 240 }  // recordatorio email 4 horas antes
        ]
      }
    };

    await calendar.events.insert({
      calendarId: process.env.CALENDAR_ID,
      requestBody: event,
      sendUpdates: 'all'   // envia invitacion por email a la clienta
    });

    return res.status(200).json({ ok: true, mensaje: 'Cita creada con exito' });
  } catch (err) {
    console.error('Error en book:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
