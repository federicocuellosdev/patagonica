const express = require('express');
const router = express.Router();
const axios = require('axios');
const tokkoService = require('../services/tokkoService');

const STAGE_PARA_DERIVAR = 103741151;
const KOMMO_BASE_URL = `https://${process.env.KOMMO_SUBDOMINIO}.kommo.com/api/v4`;

function getKommoHeaders() {
  return { Authorization: `Bearer ${process.env.KOMMO_TOKEN}` };
}

async function getLeadWithContact(leadId) {
  const res = await axios.get(
    `${KOMMO_BASE_URL}/leads/${leadId}?with=contacts`,
    { headers: getKommoHeaders() }
  );
  return res.data;
}

async function getContact(contactId) {
  const res = await axios.get(
    `${KOMMO_BASE_URL}/contacts/${contactId}`,
    { headers: getKommoHeaders() }
  );
  return res.data;
}

function extractPhone(contact) {
  const phones = contact.custom_fields_values?.find(f => f.field_code === 'PHONE');
  return phones?.values?.[0]?.value || '';
}

function extractEmail(contact) {
  const emails = contact.custom_fields_values?.find(f => f.field_code === 'EMAIL');
  return emails?.values?.[0]?.value || '';
}

// POST /api/kommo/webhook
router.post('/webhook', async (req, res) => {
  // Kommo envía form-encoded
  res.sendStatus(200);

  try {
    const leads = req.body?.leads?.status;
    if (!leads || !leads.length) return;

    for (const lead of leads) {
      const statusId = parseInt(lead.status_id);
      if (statusId !== STAGE_PARA_DERIVAR) continue;

      const leadId = lead.id;
      console.log(`- Kommo Webhook - Lead ${leadId} movido a PARA DERIVAR`);

      // Obtener lead completo con contacto
      const fullLead = await getLeadWithContact(leadId);
      const contactRef = fullLead._embedded?.contacts?.[0];
      if (!contactRef) {
        console.error(`- Kommo Webhook - Lead ${leadId} sin contacto`);
        continue;
      }

      const contact = await getContact(contactRef.id);
      const phone = extractPhone(contact);

      // Reconstruir nota desde el lead
      const notes = await axios.get(
        `${KOMMO_BASE_URL}/leads/${leadId}/notes?note_type=common&limit=1`,
        { headers: getKommoHeaders() }
      );
      const note = notes.data._embedded?.notes?.[0]?.params?.text || '';

      // Enviar a Tokko
      const tags = fullLead._embedded?.tags?.map(t => t.name) || [];
      await tokkoService.createContact({
        name: contact.name,
        email: extractEmail(contact),
        phone,
        cellphone: phone,
        text: note,
        tags
      });

      console.log(`- Tokko - Contacto enviado desde Kommo (Lead ${leadId})\n`);
    }
  } catch (err) {
    console.error('- Kommo Webhook - Error:', err.response?.data || err.message);
  }
});

module.exports = router;
