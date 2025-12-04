const axios = require('axios');

const TOKKO_API_KEY = process.env.TOKKO_API_KEY;
const BASE_URL = process.env.TOKKO_BASE_URL;
const ALTERNATIVE_BASE_URL = 'http://www.tokkobroker.com/api/v1';

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
  const data = {
    api_key: TOKKO_API_KEY,
    publication_id: contactData.publication_id,
    name: contactData.name,
    mail: contactData.mail,
    comment: contactData.comment,
    phone: contactData.phone || '',
    cellphone: contactData.cellphone || '',
    company: contactData.company || ''
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/contact/`,
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Error creando contacto: ${error.message}`);
  }
}

async function createTestContacts() {
  const testContacts = [
    {
      publication_id: '',
      name: 'Federico Cuellos (Test)',
      mail: 'fedecuellos@gmail.com',
      phone: '541150131723',
      cellphone: '541150131723',
      comment: 'Esto es un test para inyectar a tokko.'
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
