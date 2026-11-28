const axios = require('axios');

const KOMMO_BASE_URL = `https://${process.env.KOMMO_SUBDOMINIO}.kommo.com/api/v4`;
const PIPELINE_ID = 13448423;   // Venta
const STAGE_ID = 103741147;     // NUEVO

function getHeaders() {
  return { Authorization: `Bearer ${process.env.KOMMO_TOKEN}` };
}

async function createContact({ name, firstName, lastName, email, phone, phoneForm }) {
  const body = {
    name: name || 'Sin nombre',
    custom_fields_values: []
  };
  if (firstName) body.first_name = firstName;
  if (lastName) body.last_name = lastName;

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

// Cache en memoria: { 'nombre o code de campo' -> field_id } para leads.
let leadFieldIdCache = null;

async function getLeadFieldIdByName(name) {
  if (leadFieldIdCache && leadFieldIdCache[name] !== undefined) return leadFieldIdCache[name];
  const res = await axios.get(
    `${KOMMO_BASE_URL}/leads/custom_fields?limit=250`,
    { headers: getHeaders() }
  );
  const fields = res.data._embedded?.custom_fields || [];
  leadFieldIdCache = {};
  for (const f of fields) {
    if (f.name) leadFieldIdCache[f.name] = f.id;
    if (f.code) leadFieldIdCache[f.code] = f.id;
  }
  return leadFieldIdCache[name] || null;
}

async function createLead({ title, contactId, note, tags = [], customFields = {}, stageId = null }) {
  const leadBody = {
    name: title,
    pipeline_id: PIPELINE_ID,
    status_id: stageId || STAGE_ID,
    _embedded: {
      contacts: [{ id: contactId }],
      tags: tags.map(t => ({ name: t }))
    }
  };

  // Resolver custom fields por nombre/code -> field_id
  const customFieldsValues = [];
  for (const [name, value] of Object.entries(customFields || {})) {
    if (value == null || value === '') continue;
    const fieldId = await getLeadFieldIdByName(name);
    if (fieldId) {
      customFieldsValues.push({ field_id: fieldId, values: [{ value: String(value) }] });
    } else {
      console.warn(`[kommoService] Custom field no encontrado en Kommo: "${name}"`);
    }
  }
  if (customFieldsValues.length) {
    leadBody.custom_fields_values = customFieldsValues;
  }

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

  const STANDARD = ['full_name', 'nombre_completo', 'first_name', 'last_name', 'nombre', 'apellido', 'email', 'correo_electrónico', 'phone', 'phone_number', 'número_de_teléfono'];
  const PHONE_KEYWORDS = ['teléfono', 'telefono', 'número', 'numero', 'celular', 'contacto'];

  const firstName = fieldData.first_name || fieldData.nombre || null;
  const lastName = fieldData.last_name || fieldData.apellido || null;
  const name = fieldData.full_name || fieldData.nombre_completo ||
    [firstName, lastName].filter(Boolean).join(' ') ||
    'Sin nombre';
  const email = fieldData.email || fieldData['correo_electrónico'] || fieldData.correo_electronico || '';
  // Teléfono nativo de Meta
  const phone = fieldData.phone || fieldData.phone_number || fieldData['número_de_teléfono'] || fieldData.numero_de_telefono || '';
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

  const contact = await createContact({ name, firstName, lastName, email, phone, phoneForm });
  const lead = await createLead({
    title: `${formLabel} - ${name}`,
    contactId: contact.id,
    note,
    tags
  });

  return { contact, lead };
}

module.exports = { processLead, createContact, createLead, getLeadFieldIdByName };
