const axios = require('axios');
const tokkoService = require('./tokkoService');

const META_API_VERSION = 'v20.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

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


async function processLead(leadData, customTags = ['FORM - General', 'Meta Ads']) {
  const fieldData = {};

  if (leadData.field_data) {
    leadData.field_data.forEach(field => {
      fieldData[field.name] = field.values[0];
    });
  }

  // Construir el texto con las preguntas y respuestas formateadas
  let textContent = 'Respuestas del formulario:\n\n';

  if (leadData.field_data) {
    leadData.field_data.forEach(field => {
      // Formatear el nombre del campo: reemplazar _ por espacios
      const questionFormatted = field.name.replace(/_/g, ' ');
      // Formatear la respuesta: reemplazar _ por espacios
      const answerFormatted = field.values[0].replace(/_/g, ' ');

      // Solo agregar si no es full_name o phone (ya van en otros campos)
      if (field.name !== 'full_name' && field.name !== 'phone') {
        textContent += `${questionFormatted}: ${answerFormatted}\n`;
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
    tags: customTags
  };

  try {
    const result = await tokkoService.createContact(contactData);
    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getLeadData,
  processLead
};
