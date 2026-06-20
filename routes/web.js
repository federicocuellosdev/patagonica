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

// Form unificado de consulta (l.patagonicapropiedades.com.ar/form)
// Sirve tanto para fichas de propiedad (Brokian) como para landings (Mirador, Loma Guacha, Cota 1000).
router.post('/consulta-propiedad', async (req, res) => {
  try {
    const {
      propiedad_id,            // opcional: viene desde la ficha (Tokko property id)
      landing: landingKey,     // opcional: viene desde una landing (slug o id de Tokko)
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
    if (!propiedad_id && !landingKey) {
      return res.status(400).json({ error: 'Se requiere propiedad_id o landing' });
    }

    // Determinar fuente -> titulo del lead, tags, custom fields
    // - landing tiene prioridad si esta presente
    // - sino, ficha de propiedad
    let leadLabel;
    let leadTags;
    const customFields = {};

    if (landingKey) {
      const landing = getLandingConfig(landingKey);
      if (!landing) {
        return res.status(400).json({ error: 'Identificador de landing no válido' });
      }
      leadLabel = landing.label;
      leadTags = landing.tags;
      if (landing.tokkoDevelopmentId) {
        customFields.tokko_id_desarrollo = landing.tokkoDevelopmentId;
      }
    } else {
      leadLabel = 'Ficha';
      leadTags = ['WEB - FICHA PROP.'];
      customFields.tokko_id_propiedad = propiedad_id;
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

    const noteLines = [];
    if (propiedad_id) noteLines.push(`Propiedad: #${propiedad_id}`);
    if (landingKey) noteLines.push(`Landing: ${landingKey}`);
    if (conoce) noteLines.push(`¿Conoce Villa la Angostura?: ${conoceLabel[conoce] || conoce}`);
    if (viaje) noteLines.push(`¿Viaja en los proximos 6 meses?: ${viajeLabel[viaje] || viaje}`);
    let note = noteLines.join('\n');
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
      title: `WEB - ${leadLabel} - ${nombre}`,
      contactId: contact.id,
      note: note.trim(),
      tags: leadTags,
      customFields
    });

    res.json({ success: true, contactId: contact.id, leadId: lead.id });
  } catch (error) {
    console.error('[web/consulta-propiedad] Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Consulta desde la ficha de Brokian (modal WhatsApp).
// Flujo: crear contacto en Kommo -> crear Lead con titulo "WEB - Ficha - <Nombre>".
// La nota del lead lleva: codigo de propiedad (PHO<id>), nombre del asesor y URL de la ficha.
router.post('/contacto-whatsapp', async (req, res) => {
  try {
    const { nombre, telefono, propiedad_id, asesor, tracking } = req.body;

    if (!nombre || !telefono) {
      return res.status(400).json({ error: 'Nombre y telefono son obligatorios' });
    }
    if (!propiedad_id) {
      return res.status(400).json({ error: 'propiedad_id es obligatorio' });
    }

    const noteLines = [];
    noteLines.push(`Código de propiedad: PHO${propiedad_id}`);
    const asesorName = asesor && (asesor.name || asesor.nombre);
    if (asesorName) noteLines.push(`Asesor: ${asesorName}`);
    if (tracking && tracking.page_url) {
      noteLines.push(`URL de la ficha: ${tracking.page_url}`);
    }
    let note = noteLines.join('\n');
    if (tracking && tracking.referer) {
      note += `\n\nReferer: ${tracking.referer}`;
    }

    const contact = await kommoService.createContact({
      name: nombre,
      phone: telefono
    });

    const lead = await kommoService.createLead({
      title: `WEB - Ficha - ${nombre}`,
      contactId: contact.id,
      note: note.trim(),
      tags: ['WEB - Ficha'],
      customFields: { tokko_id_propiedad: propiedad_id }
    });

    res.json({ success: true, contactId: contact.id, leadId: lead.id });
  } catch (error) {
    console.error('[web/contacto-whatsapp] Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
