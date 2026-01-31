const { google } = require('googleapis');

// Crear cliente de autenticación
const getAuthClient = () => {
    return new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
};

// Obtener el nombre de una hoja por su ID (sheetId/gid)
const obtenerNombreHojaPorId = async (spreadsheetId, sheetId) => {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets(properties(sheetId,title))'
    });

    const hoja = response.data.sheets.find(
        sheet => sheet.properties.sheetId === parseInt(sheetId)
    );

    if (!hoja) {
        throw new Error(`No se encontró la hoja con ID: ${sheetId}`);
    }

    return hoja.properties.title;
};

// Función para agregar fila a Google Sheets usando ID de hoja
const agregarFilaASheetPorId = async (spreadsheetId, sheetId, columnas, valores) => {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Obtener el nombre de la hoja por su ID
    const nombreHoja = await obtenerNombreHojaPorId(spreadsheetId, sheetId);
    const range = `${nombreHoja}!${columnas}`;

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [valores]
        }
    });

    console.log(`- Google Sheets - Fila agregada a "${nombreHoja}"`);
};

// Función para agregar fila a Google Sheets (legacy - usa nombre de hoja)
const agregarFilaASheet = async (spreadsheetId, range, valores) => {
    const auth = getAuthClient();
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

module.exports = { agregarFilaASheet, agregarFilaASheetPorId, obtenerNombreHojaPorId };
