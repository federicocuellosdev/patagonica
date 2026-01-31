const express = require('express');
const router = express.Router();
const { agregarFilaASheet } = require('../services/googleSheetsService');

// ID del Google Sheet para Juanita
const SPREADSHEET_ID = process.env.JUANITA_SPREADSHEET_ID;

// POST /api/juanita/confirmar - Recibe confirmación de asistencia
router.post('/confirmar', async (req, res) => {
    try {
        const { nombre, telefono, email, restriccion, mensaje } = req.body;

        // Validar campos requeridos
        if (!nombre || !telefono) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y teléfono son requeridos'
            });
        }

        const fecha = new Date().toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires'
        });

        console.log('=== CONFIRMACIÓN JUANITA ===');
        console.log('Fecha:', fecha);
        console.log('Nombre:', nombre);
        console.log('Teléfono:', telefono);
        console.log('Email:', email || '-');
        console.log('Restricción:', restriccion || '-');
        console.log('Mensaje:', mensaje || '-');
        console.log('============================\n');

        // Guardar en Google Sheets
        await agregarFilaASheet(SPREADSHEET_ID, 'Hoja 1!A:F', [
            fecha,
            nombre,
            telefono,
            email || '',
            restriccion || '',
            mensaje || ''
        ]);

        res.status(200).json({
            success: true,
            message: 'Confirmación registrada'
        });

    } catch (error) {
        console.error('- Juanita - Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la confirmación'
        });
    }
});

// GET /api/juanita/ping - Health check
router.get('/ping', (req, res) => {
    res.json({ status: 'ok', service: 'juanita' });
});

module.exports = router;
