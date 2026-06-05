const express = require('express');
const router = express.Router();
const kommoService = require('../services/kommoService');
const { getLandingConfig } = require('../config/landings');

router.post('/contact', async (req, res) => {
  try {
    const { name, phone, email, message, publication_id, landing: landingId, tracking } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son obligatorios' });
    }

    const configKey = publication_id || landingId;
    if (!configKey) {
      return res.status(400).json({ error: 'publication_id o landing es obligatorio' });
    }

    const landing = getLandingConfig(configKey);
    if (!landing) {
      return res.status(400).json({ error: 'Identificador de landing no válido' });
    }

    // Nota: mensaje + tracking
    let note = message || '';
    if (tracking && Object.keys(tracking).length > 0) {
      if (note) note += '\n\n';
      note += 'Tracking:';
      for (const [k, v] of Object.entries(tracking)) note += `\n${k}: ${v}`;
    }

    // 1) Crear contacto en Kommo
    const contact = await kommoService.createContact({ name, email, phone: phone || '' });

    // 2) Crear lead vinculando el contacto (Kommo linkea automaticamente con _embedded.contacts)
    const lead = await kommoService.createLead({
      title: `${landing.kommoLeadPrefix} - ${name}`.trim(),
      contactId: contact.id,
      note: note.trim() || null,
      tags: landing.tags
    });

    res.json({ success: true, contactId: contact.id, leadId: lead.id });
  } catch (error) {
    console.error('[web/contact] Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Form de consulta por propiedad (l.patagonicapropiedades.com.ar/form)
router.post('/consulta-propiedad', async (req, res) => {
  try {
    const {
      propiedad_id,
      conoce,
      viaje,
      nombre,
      email,
      telefono,
      mensaje,
      tracking
    } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y email son obligatorios' });
    }
    if (!propiedad_id) {
      return res.status(400).json({ error: 'propiedad_id es obligatorio' });
    }

    const conoceLabel = {
      inversiones: 'Conozco y tengo inversiones',
      ciudad: 'Conozco la ciudad',
      no_conozco: 'No conozco'
    };
    const viajeLabel = {
      si: 'Sí',
      no: 'No',
      no_se: 'No lo sé'
    };

    let note = `Propiedad: #${propiedad_id}`;
    if (conoce) note += `\n¿Conoce Villa la Angostura?: ${conoceLabel[conoce] || conoce}`;
    if (viaje) note += `\n¿Viaja en los proximos 6 meses?: ${viajeLabel[viaje] || viaje}`;
    if (mensaje) note += `\n\nMensaje:\n${mensaje}`;
    if (tracking && Object.keys(tracking).length > 0) {
      note += '\n\nTracking:';
      for (const [k, v] of Object.entries(tracking)) note += `\n${k}: ${v}`;
    }

    const contact = await kommoService.createContact({
      name: nombre,
      email,
      phone: telefono || ''
    });

    const lead = await kommoService.createLead({
      title: `WEB - Propiedad #${propiedad_id} - ${nombre}`,
      contactId: contact.id,
      note: note.trim(),
      tags: ['WEB - Propiedad', `Propiedad #${propiedad_id}`]
    });

    res.json({ success: true, contactId: contact.id, leadId: lead.id });
  } catch (error) {
    console.error('[web/consulta-propiedad] Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
