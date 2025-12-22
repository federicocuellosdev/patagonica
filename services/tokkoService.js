const axios = require('axios');

const TOKKO_API_KEY = process.env.TOKKO_API_KEY;
const BASE_URL = 'https://www.tokkobroker.com/api/v1';

async function createContact(contactData) {
  const data = {
    name: contactData.name,
    email: contactData.email || contactData.mail,
    phone: contactData.phone || '',
    cellphone: contactData.cellphone || ''
  };

  if (contactData.text || contactData.comment || contactData.message) {
    data.text = contactData.text || contactData.comment || contactData.message;
  }

  if (contactData.tags) {
    data.tags = contactData.tags;
  }

  // Agregar publication_id si existe
  if (contactData.publication_id) {
    data.publication_id = contactData.publication_id;
  }

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
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    throw new Error(`Error creando contacto: ${error.message}`);
  }
}

module.exports = {
  createContact
};
