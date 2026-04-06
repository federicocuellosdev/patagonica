const axios = require('axios');

const KOMMO_BASE_URL = `https://${process.env.KOMMO_SUBDOMINIO}.kommo.com/api/v4`;
const PIPELINE_ID = 13448423;   // Venta
const STAGE_ID = 103741147;     // NUEVO

function getHeaders() {
  return { Authorization: `Bearer ${process.env.KOMMO_TOKEN}` };
}

async function createContact({ name, email, phone }) {
  const body = {
    name: name || 'Sin nombre',
    custom_fields_values: []
  };

  if (phone) {
    body.custom_fields_values.push({
      field_code: 'PHONE',
      values: [{ value: phone, enum_code: 'MOBILEPHONE' }]
    });
  }

  if (email) {
    body.custom_fields_values.push({
      field_code: 'EMAIL',
      values: [{ value: email, enum_code: 'WORK' }]
    });
  }

  const res = await axios.post(`${KOMMO_BASE_URL}/contacts`, [body], { headers: getHeaders() });
  return res.data._embedded.contacts[0];
}

async function createLead({ title, contactId, note, tags = [] }) {
  const leadBody = {
    name: title,
    pipeline_id: PIPELINE_ID,
    status_id: STAGE_ID,
    _embedded: {
      contacts: [{ id: contactId }],
      tags: tags.map(t => ({ name: t }))
    }
  };

  const res = await axios.post(`${KOMMO_BASE_URL}/leads`, [leadBody], { headers: getHeaders() });
  const lead = res.data._embedded.leads[0];

  if (note) {
    await axios.post(
      `${KOMMO_BASE_URL}/leads/${lead.id}/notes`,
      [{ note_type: 'common', params: { text: note } }],
      { headers: getHeaders() }
    );
  }

  return lead;
}

async function processLead(leadData, formLabel = 'General', tags = []) {
  const fieldData = {};
  if (leadData.field_data) {
    leadData.field_data.forEach(f => { fieldData[f.name] = f.values[0]; });
  }

  const STANDARD = ['full_name', 'nombre_completo', 'first_name', 'last_name', 'email', 'phone', 'phone_number'];

  const name = fieldData.full_name || fieldData.nombre_completo ||
    [fieldData.first_name, fieldData.last_name].filter(Boolean).join(' ') || 'Sin nombre';
  const email = fieldData.email || '';
  const phone = fieldData.phone || fieldData.phone_number || '';

  // Nota: respuestas del formulario
  let note = 'Respuestas del formulario\n--\n';
  if (leadData.field_data) {
    leadData.field_data
      .filter(f => !STANDARD.includes(f.name))
      .forEach(f => {
        const q = f.name.replace(/_/g, ' ');
        const a = f.values[0].replace(/_/g, ' ');
        note += `• ${q}: ${a}\n`;
      });
  }

  note += '\n---\nDatos de seguimiento\n--\n';
  note += `• Plataforma: ${leadData.platform || 'N/A'}\n`;
  note += `• Campaña: ${leadData.campaign_name || 'N/A'}\n`;
  note += `• Ad Set: ${leadData.adset_name || 'N/A'}\n`;
  note += `• Ad: ${leadData.ad_name || 'N/A'}`;

  const contact = await createContact({ name, email, phone });
  const lead = await createLead({
    title: `${formLabel} - ${name}`,
    contactId: contact.id,
    note,
    tags
  });

  return { contact, lead };
}

module.exports = { processLead };
