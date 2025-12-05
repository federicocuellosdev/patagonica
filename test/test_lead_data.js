require('dotenv').config();
const axios = require('axios');

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_API_VERSION = 'v20.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// IDs de ambos formularios
const FORM_IDS = [
  { id: '2204681366609205', name: 'FORM - General - v2' },
  { id: '1349310240322714', name: 'FORM - General' }
];

async function getLeadsFromForm(formId, formName) {
  try {
    // Fecha desde: 1 de noviembre de 2025 (epoch timestamp)
    const since = Math.floor(new Date('2025-11-01T00:00:00Z').getTime() / 1000);

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log(`║ Formulario: ${formName}`);
    console.log(`║ ID: ${formId}`);
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');

    let allLeads = [];
    let url = `${META_BASE_URL}/${formId}/leads?access_token=${META_ACCESS_TOKEN}&limit=100&since=${since}`;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(url);
      const leads = response.data.data;
      allLeads = allLeads.concat(leads);

      console.log(`Página obtenida: ${leads.length} leads`);

      // Verificar si hay más páginas
      if (response.data.paging && response.data.paging.next) {
        url = response.data.paging.next;
      } else {
        hasMore = false;
      }
    }

    console.log('');
    console.log(`TOTAL DE LEADS EN ESTE FORMULARIO: ${allLeads.length}`);
    console.log('');

    if (allLeads.length > 0) {
      for (const lead of allLeads) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('LEAD ID:', lead.id);
        console.log('Created Time:', lead.created_time);
        console.log('');

        // Obtener datos completos del lead
        const leadDataResponse = await axios.get(
          `${META_BASE_URL}/${lead.id}?access_token=${META_ACCESS_TOKEN}`
        );

        const leadData = leadDataResponse.data;

        console.log('--- Campos del formulario ---');
        if (leadData.field_data) {
          leadData.field_data.forEach(field => {
            console.log(`${field.name}: ${field.values[0]}`);
          });
        }

        console.log('');
        console.log('--- Datos completos (JSON) ---');
        console.log(JSON.stringify(leadData, null, 2));
        console.log('');
      }
    } else {
      console.log('No se encontraron leads en el formulario.');
    }

    return allLeads;

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    return [];
  }
}

async function getAllLeadsFromAllForms() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('OBTENIENDO LEADS DE TODOS LOS FORMULARIOS');
  console.log('Desde: 1 de noviembre de 2025');
  console.log('═══════════════════════════════════════════════════════');

  let totalLeads = 0;

  for (const form of FORM_IDS) {
    const leads = await getLeadsFromForm(form.id, form.name);
    totalLeads += leads.length;
  }

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log(`║ TOTAL GENERAL DE LEADS: ${totalLeads}`);
  console.log('╚═══════════════════════════════════════════════════════╝\n');
}

getAllLeadsFromAllForms();
