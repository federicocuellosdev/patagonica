const express = require('express');
const router = express.Router();
const { agregarFilaASheet } = require('../services/googleSheetsService');

const SPREADSHEET_ID = '1YxziTp1qNQCTr39q6PQ4jhYbhCxMgWlU0XQT7Ckz7ro';

router.post('/ia', async (req, res) => {
    try {
        const { nombre: nombreRaw, email } = req.body;

        if (!nombreRaw || !email) {
            return res.status(400).json({ error: 'Nombre y email son requeridos' });
        }

        const nombre = nombreRaw.trim().toLowerCase().replace(/^\w/, c => c.toUpperCase());
        const fecha = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '';

        await agregarFilaASheet(
            SPREADSHEET_ID,
            'Hoja 1!A:D',
            [fecha, nombre, email, ip]
        );

        console.log(`- Federico IA - Solicitud: ${nombre} (${email}) [${ip}]`);

        res.json({ success: true, mensaje: 'Solicitud registrada' });
    } catch (error) {
        console.error('Error en /federico/ia:', error.message, error.stack);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
