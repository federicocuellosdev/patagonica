const axios = require('axios');

const TOKKO_API_KEY = process.env.TOKKO_API_KEY;
const BASE_URL = 'https://www.tokkobroker.com/api/v1';
const ALTERNATIVE_BASE_URL = 'https://tokkobroker.com/portals/simple_portal/api/v1';

// test
async function testConnection() {
  const urls = [
    `${BASE_URL}/property/?key=${TOKKO_API_KEY}&format=json&limit=1`,
    `${ALTERNATIVE_BASE_URL}/property/?key=${TOKKO_API_KEY}&format=json&limit=1`
  ];

  const results = [];

  for (const url of urls) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      results.push({
        url,
        status: 'success',
        statusCode: response.status,
        data: response.data
      });
    } catch (error) {
      results.push({
        url,
        status: 'error',
        error: error.response ? error.response.data : error.message
      });
    }
  }

  return results;
}

// test
async function getProperties() {
  try {
    const response = await axios.get(
      `${BASE_URL}/property/?key=${TOKKO_API_KEY}&format=json&limit=10`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Error obteniendo propiedades: ${error.message}`);
  }
}

async function createContact(contactData) {
  const messageText = contactData.text || contactData.comment || contactData.message;

  const data = {
    name: contactData.name,
    email: contactData.email || contactData.mail,
    phone: contactData.phone || '',
    cellphone: contactData.cellphone || ''
  };

  if (messageText) {
    data.message = messageText;
    data.comment = messageText;
    data.text = messageText;
  }

  if (contactData.tags) {
    data.tags = contactData.tags;
  }

  console.log('Creando contacto en Tokko...');
  console.log('URL:', `${BASE_URL}/webcontact/?key=${TOKKO_API_KEY}`);
  console.log('Data:', JSON.stringify(data, null, 2));

  try {
    const response = await axios.post(
      `${BASE_URL}/webcontact/?key=${TOKKO_API_KEY}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Status Code:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Respuesta de Tokko:', JSON.stringify(response.data, null, 2));
    console.log('Respuesta vacía?', response.data === '' || Object.keys(response.data).length === 0);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.error('Error de Tokko:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    console.error('Status:', error.response ? error.response.status : 'N/A');
    throw new Error(`Error creando contacto: ${error.message}`);
  }
}

// test
async function createTestContacts() {
  const testContacts = [
    {
      publication_id: '',
      name: 'Federico Cuellos (Test)',
      email: 'fedecuellos@gmail.com',
      phone: '541150131723',
      cellphone: '541150131723',
      text: 'Esto es un test para inyectar a tokko.',
      tags: ['Federico_Cuellos']
    }
  ];

  const results = [];

  for (const contact of testContacts) {
    try {
      const result = await createContact(contact);
      results.push({
        status: 'success',
        contact: contact.name,
        result
      });
    } catch (error) {
      results.push({
        status: 'error',
        contact: contact.name,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  testConnection,
  getProperties,
  createContact,
  createTestContacts
};
