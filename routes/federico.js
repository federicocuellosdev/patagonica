const express = require('express');
const router = express.Router();
const { agregarFilaASheet } = require('../services/googleSheetsService');

const SPREADSHEET_ID = '1YxziTp1qNQCTr39q6PQ4jhYbhCxMgWlU0XQT7Ckz7ro';
const MAILERLITE_GROUP_ID = '184328273296098823';

const agregarSuscriptorMailerLite = async (nombre, email) => {
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MAILER_TOKEN}`
        },
        body: JSON.stringify({
            email,
            fields: { name: nombre },
            groups: [MAILERLITE_GROUP_ID]
        })
    });
    const data = await res.json();
    console.log(`- MailerLite - Suscriptor agregado: ${email}`, res.status);
    return res.ok;
};

router.post('/ia', async (req, res) => {
    try {
        const { nombre: nombreRaw, email, whatsapp = '' } = req.body;

        if (!nombreRaw || !email) {
            return res.status(400).json({ error: 'Nombre y email son requeridos' });
        }

        const nombre = nombreRaw.trim().toLowerCase().replace(/^\w/, c => c.toUpperCase());
        const fecha = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '';

        let lat = '', lon = '', pais = '', ciudad = '';
        try {
            const geo = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon,country,city`);
            const geoData = await geo.json();
            if (geoData.status !== 'fail') { lat = geoData.lat; lon = geoData.lon; pais = geoData.country; ciudad = geoData.city; }
        } catch {}

        const mailerOk = await agregarSuscriptorMailerLite(nombre, email);
        await agregarFilaASheet(SPREADSHEET_ID, 'A:K', [fecha, nombre, email, ip, lat, lon, pais, ciudad, mailerOk, whatsapp, 'v2']);

        console.log(`- Federico IA - Solicitud: ${nombre} (${email}) [${ip}]`);

        res.json({ success: true, mensaje: 'Solicitud registrada' });
    } catch (error) {
        console.error('Error en /federico/ia:', error.message, error.stack);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
