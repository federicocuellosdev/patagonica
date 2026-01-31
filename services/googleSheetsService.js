const { google } = require('googleapis');

// Función para agregar fila a Google Sheets
const agregarFilaASheet = async (spreadsheetId, range, valores) => {
    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [valores]
        }
    });

    console.log('- Google Sheets - Fila agregada');
};

module.exports = { agregarFilaASheet };
