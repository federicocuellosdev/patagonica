const express = require('express');
const router = express.Router();
const tokkoService = require('../services/tokkoService');
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

    // Construir texto con mensaje + tracking
    let text = message || '';
    if (tracking && Object.keys(tracking).length > 0) {
      text += '\n\nTracking:';
      for (const [key, val] of Object.entries(tracking)) {
        text += `\n${key}: ${val}`;
      }
    }

    const contactData = {
      name,
      email,
      phone: phone || '',
      cellphone: phone || '',
      text,
      tags: landing.tags
    };

    // Solo incluir publication_id si existe y es numérico (ID de Tokko)
    if (publication_id && !isNaN(publication_id)) {
      contactData.publication_id = Number(publication_id);
    }

    const result = await tokkoService.createContact(contactData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
