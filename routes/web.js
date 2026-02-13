const express = require('express');
const router = express.Router();
const tokkoService = require('../services/tokkoService');
const { getLandingConfig } = require('../config/landings');

router.post('/contact', async (req, res) => {
  try {
    const { name, phone, email, message, publication_id, tracking } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son obligatorios' });
    }

    if (!publication_id) {
      return res.status(400).json({ error: 'publication_id es obligatorio' });
    }

    const landing = getLandingConfig(publication_id);
    if (!landing) {
      return res.status(400).json({ error: 'publication_id no válido' });
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
      tags: landing.tags,
      publication_id
    };

    const result = await tokkoService.createContact(contactData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
