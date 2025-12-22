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


// Campos estándar de Meta (auto-completados)
const STANDARD_FIELDS = {
  NAME: ['full_name', 'nombre_completo', 'first_name', 'last_name'],
  EMAIL: ['email'],
  PHONE: ['phone', 'phone_number']
};

// Función para buscar un campo estándar (búsqueda exacta)
function findStandardField(fieldData, standardKeys) {
  for (const key of standardKeys) {
    if (fieldData[key]) {
      return fieldData[key];
    }
  }
  return '';
}

// Función para buscar un campo personalizado por palabras clave (búsqueda parcial)
function findCustomField(fieldData, keywords) {
  for (const [key, value] of Object.entries(fieldData)) {
    const keyLower = key.toLowerCase();
    for (const keyword of keywords) {
      if (keyLower.includes(keyword)) {
        return value;
      }
    }
  }
  return '';
}

async function processLead(leadData, customTags = ['FORM - General', 'Meta Ads'], publicationId = null) {
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

      // Solo agregar preguntas personalizadas (excluir campos estándar)
      const isStandardField =
        STANDARD_FIELDS.NAME.includes(field.name) ||
        STANDARD_FIELDS.EMAIL.includes(field.name) ||
        STANDARD_FIELDS.PHONE.includes(field.name);

      if (!isStandardField) {
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

  // Buscar campos estándar
  const name = findStandardField(fieldData, STANDARD_FIELDS.NAME);
  const email = findStandardField(fieldData, STANDARD_FIELDS.EMAIL);
  const phone = findStandardField(fieldData, STANDARD_FIELDS.PHONE);

  // Buscar celular en preguntas personalizadas (busca por palabras clave)
  const cellphone = findCustomField(fieldData, [
    'teléfono',
    'telefono',
    'número',
    'numero',
    'celular',
    'contacto'
  ]) || phone; // fallback al phone estándar

  // Mapear datos para Tokko
  const contactData = {
    name: name || 'Sin nombre',
    email: email,
    phone: phone,
    cellphone: cellphone,
    text: textContent,
    tags: customTags
  };

  // Agregar publication_id si existe
  if (publicationId) {
    contactData.publication_id = publicationId;
  }

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
