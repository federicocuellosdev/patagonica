require('dotenv').config();
const { google } = require('googleapis');

const SPREADSHEET_ID = '1YxziTp1qNQCTr39q6PQ4jhYbhCxMgWlU0XQT7Ckz7ro';
const GROUP_ID = '184328273296098823';
const MAILER_TOKEN = process.env.MAILER_TOKEN;

const getAuthClient = () => {
    const creds = process.env.GOOGLE_CREDENTIALS;
    const raw = creds.replace(/\n/g, '\\n');
    return new google.auth.GoogleAuth({
        credentials: JSON.parse(raw),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
};

const getSubscribedEmails = async () => {
    const res = await fetch(`https://connect.mailerlite.com/api/groups/${GROUP_ID}/subscribers?limit=100`, {
        headers: { 'Authorization': `Bearer ${MAILER_TOKEN}` }
    });
    const data = await res.json();
    return new Set(data.data.map(s => s.email.toLowerCase()));
};

const run = async () => {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const subscribedEmails = await getSubscribedEmails();
    console.log(`Suscriptos en MailerLite: ${subscribedEmails.size}`);

    const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'A:I' });
    const rows = data.values || [];

    const updates = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        if (i === 0) {
            updates.push({ range: `I1`, values: [['mailer_suscripcion']] });
            continue;
        }

        const email = (row[2] || '').toLowerCase();
        if (!email) continue;

        const suscripto = subscribedEmails.has(email);
        console.log(`${email}: ${suscripto}`);
        updates.push({ range: `I${i + 1}`, values: [[suscripto]] });
    }

    await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { valueInputOption: 'USER_ENTERED', data: updates }
    });

    console.log(`\nListo. ${updates.length - 1} filas actualizadas.`);
};

run().catch(console.error);
