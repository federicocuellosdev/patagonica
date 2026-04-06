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

// Intenta extraer un teléfono del texto de las notas
function extractPhoneFromNotes(notes) {
  const phoneRegex = /(\+?[\d\s\-().]{8,20})/;
  for (const note of notes) {
    const text = note.params?.text || '';
    const match = text.match(/(?:teléfono|telefono|celular|cel|tel)[^\d+]*(\+?[\d\s\-().]{8,20})/i);
    if (match) return match[1].trim();
  }
  return '';
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

      // Etiquetas + campo Derivar
      const tags = fullLead._embedded?.tags?.map(t => t.name) || [];
      const derivar = extractDerivar(fullLead);
      if (derivar) tags.push(derivar);

      // Teléfonos del contacto, con fallback en las notas
      const phones = extractPhones(contact);
      let phone = phones[0] || '';
      let cellphone = phones[1] || phones[0] || '';
      if (!phone) {
        const phoneFromNotes = extractPhoneFromNotes(notes);
        phone = phoneFromNotes;
        cellphone = phoneFromNotes;
      }

      const email = extractEmail(contact);

      // Tokko requiere al menos un dato de contacto — fallback si no hay nada
      if (!phone && !cellphone && !email) {
        phone = 'sin-dato';
      }

      // Texto: encabezado + TODAS las notas
      let text = `Lead: ${fullLead.name || ''}\n`;
      if (derivar) text += `Derivar a: ${derivar}\n`;
      text += `\n`;

      if (notes.length) {
        text += notes
          .map((n, i) => (notes.length > 1 ? `--- Nota ${i + 1} ---\n` : '') + (n.params?.text || ''))
          .join('\n\n');
      }

      await tokkoService.createContact({
        name: contact.name,
        email,
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
