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
      `${META_BASE_URL}/${leadgenId}?access_token=${accessToken}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Error obteniendo datos del lead: ${error.message}`);
  }
}

async function processLead(leadData) {
  const fieldData = {};

  if (leadData.field_data) {
    leadData.field_data.forEach(field => {
      fieldData[field.name] = field.values[0];
    });
  }

  const contactData = {
    publication_id: process.env.DEFAULT_PUBLICATION_ID || '',
    name: fieldData.full_name || fieldData.name || '',
    mail: fieldData.email || '',
    phone: fieldData.phone_number || '',
    cellphone: fieldData.phone_number || '',
    comment: `Lead de Facebook - ID: ${leadData.id}`
  };

  try {
    const result = await tokkoService.createContact(contactData);
    console.log('Lead procesado y enviado a Tokko:', result);
    return result;
  } catch (error) {
    console.error('Error procesando lead:', error);
    throw error;
  }
}

module.exports = {
  testConnection,
  getLeads,
  getLeadData,
  processLead
};
