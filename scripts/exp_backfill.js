require('dotenv').config();
const { google } = require('googleapis');

const SPREADSHEET_ID = '1YxziTp1qNQCTr39q6PQ4jhYbhCxMgWlU0XQT7Ckz7ro';

const getAuthClient = () => {
    const creds = process.env.GOOGLE_CREDENTIALS;
    const raw = creds.replace(/\n/g, '\\n');
    return new google.auth.GoogleAuth({
        credentials: JSON.parse(raw),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
};

const run = async () => {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'A:K' });
    const rows = data.values || [];

    console.log(`Total filas: ${rows.length}`);

    const updates = [];

    for (let i = 0; i < rows.length; i++) {
        if (i === 0) {
            updates.push({ range: `J1`, values: [['whatsapp']] });
            updates.push({ range: `K1`, values: [['exp']] });
            continue;
        }
        // Solo actualizar filas que no tengan exp (columna K)
        if (!rows[i][10]) {
            updates.push({ range: `K${i + 1}`, values: [['v1']] });
        }
    }

    if (updates.length === 0) {
        console.log('Nada para actualizar.');
        return;
    }

    await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { valueInputOption: 'USER_ENTERED', data: updates }
    });

    console.log(`Listo. ${updates.length} celdas actualizadas.`);
};

run().catch(console.error);
