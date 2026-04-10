require('dotenv').config();
const { google } = require('googleapis');

const SPREADSHEET_ID = '1YxziTp1qNQCTr39q6PQ4jhYbhCxMgWlU0XQT7Ckz7ro';
const RANGE = 'A:F';

const getAuthClient = () => {
    const creds = process.env.GOOGLE_CREDENTIALS;
    const raw = creds.replace(/\n/g, '\\n');
    return new google.auth.GoogleAuth({
        credentials: JSON.parse(raw),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
};

const getGeo = async (ip) => {
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon,country,city`);
        const data = await res.json();
        return data.status !== 'fail' ? { lat: data.lat, lon: data.lon, country: data.country, city: data.city } : null;
    } catch {
        return null;
    }
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Leer datos actuales
    const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGE });
    const rows = data.values || [];

    console.log(`Total filas: ${rows.length}`);

    // Agregar headers en E1 y F1 si no están
    const updates = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const ip = row[3]; // columna D = IP

        if (i === 0) {
            // Header row
            updates.push({ range: `E${i + 1}:H${i + 1}`, values: [['lat', 'lon', 'pais', 'ciudad']] });
            continue;
        }

        if (!ip || row[4]) {
            // Sin IP o ya tiene lat
            console.log(`Fila ${i + 1}: sin IP o ya procesada, skip`);
            continue;
        }

        console.log(`Fila ${i + 1}: geolocalizando ${ip}...`);
        const geo = await getGeo(ip);

        if (geo) {
            console.log(`  → ${geo.city}, ${geo.country} (${geo.lat}, ${geo.lon})`);
            updates.push({ range: `E${i + 1}:H${i + 1}`, values: [[geo.lat, geo.lon, geo.country, geo.city]] });
        } else {
            console.log(`  → sin resultado`);
        }

        await sleep(200); // respetar rate limit de ip-api (45 req/min gratis)
    }

    if (updates.length === 0) {
        console.log('Nada para actualizar.');
        return;
    }

    await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { valueInputOption: 'USER_ENTERED', data: updates }
    });

    console.log(`\nListo. ${updates.length} filas actualizadas.`);
};

run().catch(console.error);
