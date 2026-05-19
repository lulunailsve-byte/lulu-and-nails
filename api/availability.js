// ═══════════════════════════════════════════════════════════
// LULU & NAILS — Consulta de disponibilidad
// Endpoint: GET /api/availability?date=YYYY-MM-DD
// ═══════════════════════════════════════════════════════════
const { google } = require('googleapis');

// Convierte un ISO datetime a minutos desde medianoche en Caracas (UTC-4)
function toMinutosCaracas(iso) {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Caracas',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = fmt.formatToParts(d);
  const h = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
  return h * 60 + m;
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ error: 'Falta el parametro date (YYYY-MM-DD)' });
    }

    // Autenticar con refresh token (cuenta de Luizandra)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Rango horario del dia en Caracas (UTC-4)
    const timeMin = `${date}T00:00:00-04:00`;
    const timeMax = `${date}T23:59:59-04:00`;

    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: 'America/Caracas',
        items: [{ id: process.env.CALENDAR_ID }]
      }
    });

    const busy = (fb.data.calendars[process.env.CALENDAR_ID] || {}).busy || [];

    const ocupados = busy.map(b => ({
      inicio: toMinutosCaracas(b.start),
      fin:    toMinutosCaracas(b.end)
    }));

    return res.status(200).json({ ocupados, fecha: date });
  } catch (err) {
    console.error('Error en availability:', err);
    return res.status(500).json({ error: err.message });
  }
};
