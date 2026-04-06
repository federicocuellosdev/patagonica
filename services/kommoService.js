const axios = require('axios');

const KOMMO_BASE_URL = `https://${process.env.KOMMO_SUBDOMINIO}.kommo.com/api/v4`;
const PIPELINE_ID = 13448423;   // Venta
const STAGE_ID = 103741147;     // NUEVO

function getHeaders() {
  return { Authorization: `Bearer ${process.env.KOMMO_TOKEN}` };
}

async function createContact({ name, email, phone, phoneForm }) {
  const body = {
    name: name || 'Sin nombre',
    custom_fields_values: []
  };

  // Armar valores de teléfono: nativo Meta + respuesta del form (si son distintos)
  const phoneValues = [];
  if (phone) phoneValues.push({ value: phone, enum_id: 844844 });  // MOB
  if (phoneForm && phoneForm !== phone) phoneValues.push({ value: phoneForm, enum_id: 844840 });  // WORK

  if (phoneValues.length) {
    body.custom_fields_values.push({ field_code: 'PHONE', values: phoneValues });
  }

  if (email) {
    body.custom_fields_values.push({
      field_code: 'EMAIL',
      values: [{ value: email, enum_id: 844852 }]  // WORK
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
  const PHONE_KEYWORDS = ['teléfono', 'telefono', 'número', 'numero', 'celular', 'contacto'];

  const name = fieldData.full_name || fieldData.nombre_completo ||
    [fieldData.first_name, fieldData.last_name].filter(Boolean).join(' ') || 'Sin nombre';
  const email = fieldData.email || '';
  // Teléfono nativo de Meta
  const phone = fieldData.phone || fieldData.phone_number || '';
  // Teléfono respondido en el formulario (pregunta personalizada)
  const phoneFormEntry = leadData.field_data?.find(f =>
    !STANDARD.includes(f.name) && PHONE_KEYWORDS.some(k => f.name.toLowerCase().includes(k))
  );
  const phoneForm = phoneFormEntry?.values?.[0] || '';

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

  const contact = await createContact({ name, email, phone, phoneForm });
  const lead = await createLead({
    title: `${formLabel} - ${name}`,
    contactId: contact.id,
    note,
    tags
  });

  return { contact, lead };
}

module.exports = { processLead };
