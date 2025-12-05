const axios = require('axios');
const tokkoService = require('./tokkoService');

const META_API_VERSION = 'v20.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

async function testConnection() {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    return { error: 'META_ACCESS_TOKEN no configurado' };
  }

  try {
    const response = await axios.get(
      `${META_BASE_URL}/me?access_token=${accessToken}`
    );
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.response ? error.response.data : error.message
    };
  }
}

async function getLeads() {
  const formId = process.env.META_FORM_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!formId || !accessToken) {
    throw new Error('META_FORM_ID o META_ACCESS_TOKEN no configurados');
  }

  try {
    const response = await axios.get(
      `${META_BASE_URL}/${formId}/leads?access_token=${accessToken}&limit=500`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Error obteniendo leads: ${error.response ? error.response.data.error.message : error.message}`);
  }
}

async function getLeadData(leadgenId) {
  const accessToken = process.env.META_ACCESS_TOKEN;

  try {
    const response = await axios.get(
      `${META_BASE_URL}/${leadgenId}?access_token=${accessToken}&fields=id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,is_organic,platform,field_data`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Error obteniendo datos del lead: ${error.message}`);
  }
}

async function processLead(leadData) {
  console.log('\n=== PROCESANDO LEAD ===');
  console.log('Lead ID:', leadData.id);
  console.log('Created Time:', leadData.created_time);
  console.log('Campaña:', leadData.campaign_name);
  console.log('Anuncio:', leadData.ad_name);
  console.log('Plataforma:', leadData.platform);

  const fieldData = {};

  if (leadData.field_data) {
    console.log('\n--- Todos los campos del formulario ---');
    leadData.field_data.forEach(field => {
      const value = field.values[0];
      fieldData[field.name] = value;
      console.log(`${field.name}: ${value}`);
    });
  }

  // Construir el texto con las preguntas y respuestas formateadas
  let textContent = 'Respuestas del formulario:\n\n';

  if (leadData.field_data) {
    leadData.field_data.forEach(field => {
      // Formatear el nombre del campo: reemplazar _ por espacios y capitalizar
      const questionFormatted = field.name.replace(/_/g, ' ');
      const answer = field.values[0];

      // Solo agregar si no es full_name o phone (ya van en otros campos)
      if (field.name !== 'full_name' && field.name !== 'phone') {
        textContent += `${questionFormatted}: ${answer}\n`;
      }
    });
  }

  // Agregar información de la campaña
  textContent += `\nInformación de la campaña:\n`;
  textContent += `Campaña: ${leadData.campaign_name || 'N/A'}\n`;
  textContent += `Campaign ID: ${leadData.campaign_id || 'N/A'}\n`;
  textContent += `Ad Set: ${leadData.adset_name || 'N/A'}\n`;
  textContent += `Ad Set ID: ${leadData.adset_id || 'N/A'}\n`;
  textContent += `Anuncio: ${leadData.ad_name || 'N/A'}\n`;
  textContent += `Ad ID: ${leadData.ad_id || 'N/A'}\n`;
  textContent += `Form ID: ${leadData.form_id || 'N/A'}\n`;
  textContent += `Plataforma: ${leadData.platform || 'N/A'}`;

  // Mapear datos para Tokko
  const contactData = {
    name: fieldData.full_name || fieldData.nombre_completo || '',
    email: fieldData.email || '',
    phone: fieldData.phone || fieldData.phone_number || '',
    cellphone: fieldData['¿cuál_es_tu_número_teléfono?'] || fieldData.phone || fieldData.phone_number || '',
    text: textContent,
    tags: ['FORM - General', 'Meta Ads']
  };

  console.log('\n--- Datos que se enviarán a Tokko ---');
  console.log(JSON.stringify(contactData, null, 2));

  try {
    const result = await tokkoService.createContact(contactData);
    console.log('\n--- Respuesta de Tokko ---');
    console.log('Lead procesado y enviado a Tokko:', result);
    console.log('=== FIN PROCESAMIENTO ===\n');
    return result;
  } catch (error) {
    console.error('\n--- Error en Tokko ---');
    console.error('Error procesando lead:', error);
    console.log('=== FIN PROCESAMIENTO CON ERROR ===\n');
    throw error;
  }
}

module.exports = {
  testConnection,
  getLeads,
  getLeadData,
  processLead
};
