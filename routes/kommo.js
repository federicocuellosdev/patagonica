const express = require('express');
const router = express.Router();
const axios = require('axios');
const tokkoService = require('../services/tokkoService');

const STAGE_PARA_DERIVAR = 103741151;
const FIELD_DERIVAR_ID = 1275244;
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

async function getAllNotes(leadId) {
  const res = await axios.get(
    `${KOMMO_BASE_URL}/leads/${leadId}/notes?note_type=common&limit=50`,
    { headers: getKommoHeaders() }
  );
  return res.data._embedded?.notes || [];
}

function extractPhones(contact) {
  const field = contact.custom_fields_values?.find(f => f.field_code === 'PHONE');
  return field?.values?.map(v => v.value) || [];
}

function extractEmail(contact) {
  const field = contact.custom_fields_values?.find(f => f.field_code === 'EMAIL');
  return field?.values?.[0]?.value || '';
}

function extractDerivar(lead) {
  const field = lead.custom_fields_values?.find(f => f.field_id === FIELD_DERIVAR_ID);
  return field?.values?.[0]?.value || null;
}

// POST /api/kommo/webhook
router.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const leads = req.body?.leads?.status;
    if (!leads || !leads.length) return;

    for (const lead of leads) {
      const statusId = parseInt(lead.status_id);
      if (statusId !== STAGE_PARA_DERIVAR) continue;

      const leadId = lead.id;
      console.log(`- Kommo Webhook - Lead ${leadId} movido a PARA DERIVAR`);

      // Obtener lead completo, contacto y notas en paralelo
      const fullLead = await getLeadWithContact(leadId);
      const contactRef = fullLead._embedded?.contacts?.[0];
      if (!contactRef) {
        console.error(`- Kommo Webhook - Lead ${leadId} sin contacto`);
        continue;
      }

      const [contact, notes] = await Promise.all([
        getContact(contactRef.id),
        getAllNotes(leadId)
      ]);

      // Etiquetas del lead + campo Derivar como etiqueta extra
      const tags = fullLead._embedded?.tags?.map(t => t.name) || [];
      const derivar = extractDerivar(fullLead);
      if (derivar) tags.push(derivar);

      // Teléfonos (puede haber dos: nativo Meta + form)
      const phones = extractPhones(contact);
      const phone = phones[0] || '';
      const cellphone = phones[1] || phones[0] || '';

      // Texto completo: datos del lead + contacto + todas las notas
      let text = `Lead: ${fullLead.name || ''}\n`;
      if (derivar) text += `Derivar a: ${derivar}\n`;
      text += `Pipeline: Venta | Etapa: PARA DERIVAR\n`;
      text += `\n`;

      if (notes.length) {
        // La primera nota tiene las respuestas del formulario
        text += notes[0].params?.text || '';
      }

      // Enviar a Tokko
      await tokkoService.createContact({
        name: contact.name,
        email: extractEmail(contact),
        phone,
        cellphone,
        text,
        tags
      });

      console.log(`- Tokko - Contacto derivado a ${derivar || 'sin asignar'} (Lead ${leadId})\n`);
    }
  } catch (err) {
    console.error('- Kommo Webhook - Error:', err.response?.data || err.message);
  }
});

module.exports = router;
