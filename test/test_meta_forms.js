require('dotenv').config();
const axios = require('axios');

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_API_VERSION = 'v20.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

async function getPages() {
  try {
    console.log('Obteniendo páginas...\n');
    const response = await axios.get(
      `${META_BASE_URL}/me/accounts?access_token=${META_ACCESS_TOKEN}&fields=id,name,access_token`
    );
    console.log('Páginas encontradas:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo páginas:', error.response ? error.response.data : error.message);
    return [];
  }
}

async function getForms(pageId, pageAccessToken) {
  try {
    console.log(`\nObteniendo formularios de la página ${pageId}...\n`);
    const response = await axios.get(
      `${META_BASE_URL}/${pageId}/leadgen_forms?access_token=${pageAccessToken}&fields=id,name,status,locale,questions`
    );
    console.log('Formularios encontrados:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo formularios:', error.response ? error.response.data : error.message);
    return [];
  }
}

async function main() {
  const pages = await getPages();

  if (pages.length > 0) {
    for (const page of pages) {
      await getForms(page.id, page.access_token);
    }
  } else {
    console.log('\nNo se encontraron páginas. Probando con el access token directo...\n');

    console.log('Probando obtener info del usuario:\n');
    try {
      const response = await axios.get(
        `${META_BASE_URL}/me?access_token=${META_ACCESS_TOKEN}&fields=id,name`
      );
      console.log('Info del usuario:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  }
}

main();
