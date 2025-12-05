require('dotenv').config();
const axios = require('axios');

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_API_VERSION = 'v20.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

async function getExtendedLeadData() {
  try {
    // Obtener un lead reciente para probar
    const formId = '2204681366609205';
    const response = await axios.get(
      `${META_BASE_URL}/${formId}/leads?access_token=${META_ACCESS_TOKEN}&limit=1`
    );

    if (response.data.data.length === 0) {
      console.log('No hay leads disponibles');
      return;
    }

    const leadId = response.data.data[0].id;
    console.log('Lead ID:', leadId);
    console.log('');

    // Solicitar TODOS los campos disponibles
    const leadDataResponse = await axios.get(
      `${META_BASE_URL}/${leadId}?access_token=${META_ACCESS_TOKEN}&fields=id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,is_organic,platform,field_data`
    );

    console.log('═══════════════════════════════════════════════════════');
    console.log('DATOS EXTENDIDOS DEL LEAD');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log(JSON.stringify(leadDataResponse.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

getExtendedLeadData();
