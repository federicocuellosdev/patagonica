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
      name: 'Juan Pérez (Test)',
      email: '',
      phone: '+5491150131723',
      cellphone: '1150131723',
      text: `Respuestas del formulario:

¿qué tipo de inversión te interesa?: proyecto_en_pozo
¿cuál es tu presupuesto en usd?: hasta_$100_mil_usd
¿cuál es tu número teléfono?: 1150131723

Información de la campaña:
Campaña: FORM - Generar oportunidades
Campaign ID: 120236026777090238
Ad Set: FORM - General - Invertí en VLA
Ad Set ID: 120236026777100238
Anuncio: FORM - Cuanto sale invertir hoy en día
Ad ID: 120236026777080238
Form ID: 2204681366609205
Plataforma: ig`,
      tags: ['FORM - General', 'Meta Ads']
    },
    {
      name: 'María González (Test)',
      email: '',
      phone: '+542995500661',
      cellphone: '2995500661',
      text: `Respuestas del formulario:

¿qué tipo de inversión te interesa?: lote
¿cuál es tu presupuesto en usd?: más_de_$150_mil_usd
¿cuál es tu número teléfono?: 2995500661

Información de la campaña:
Campaña: FORM - Generar oportunidades
Campaign ID: 120236026777090238
Ad Set: FORM - General - Invertí en VLA
Ad Set ID: 120236026777100238
Anuncio: FORM - Inversión en lotes
Ad ID: 120236026777080239
Form ID: 1349310240322714
Plataforma: fb`,
      tags: ['FORM - General', 'Meta Ads']
    },
    {
      name: 'Carlos Rodríguez (Test)',
      email: 'carlos.rodriguez@test.com',
      phone: '+5493415825460',
      cellphone: '3415825460',
      text: `Respuestas del formulario:

¿qué tipo de inversión te interesa?: inmueble_para_renta
¿cuál es tu presupuesto en usd?: entre_$100_y_$150_mil_usd
¿cuál es tu número teléfono?: 3415825460
email: carlos.rodriguez@test.com

Información de la campaña:
Campaña: FORM - Generar oportunidades
Campaign ID: 120236026777090238
Ad Set: FORM - General - Invertí en VLA
Ad Set ID: 120236026777100238
Anuncio: FORM - Inmuebles para renta
Ad ID: 120236026777080240
Form ID: 2204681366609205
Plataforma: ig`,
      tags: ['FORM - General', 'Meta Ads']
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
