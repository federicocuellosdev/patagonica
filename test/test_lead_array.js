require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const tokkoService = require('../services/tokkoService');

// Array de leads de prueba con toda la información de Meta
const testLeads = [
  {
    // Información del lead
    id: '1575854360215029',
    created_time: '2025-12-05T01:12:08+0000',

    // Información de la campaña
    campaign_id: '120236026777090238',
    campaign_name: 'FORM - Generar oportunidades',
    adset_id: '120236026777100238',
    adset_name: 'FORM - General - Invertí en VLA',
    ad_id: '120236026777080238',
    ad_name: 'FORM - Cuanto sale invertir hoy en día',
    form_id: '2204681366609205',
    platform: 'ig',
    is_organic: false,

    // Datos del formulario
    field_data: [
      {
        name: '¿qué_tipo_de_inversión_te_interesa?',
        values: ['proyecto_en_pozo']
      },
      {
        name: '¿cuál_es_tu_presupuesto_en_usd?',
        values: ['hasta_$100_mil_usd']
      },
      {
        name: '¿cuál_es_tu_número_teléfono?',
        values: ['1150131723']
      },
      {
        name: 'full_name',
        values: ['Juan Pérez (Test Array)']
      },
      {
        name: 'phone',
        values: ['+5491150131723']
      }
    ]
  },
  {
    // Información del lead
    id: '1234567890123456',
    created_time: '2025-12-05T10:30:00+0000',

    // Información de la campaña
    campaign_id: '120236026777090238',
    campaign_name: 'FORM - Generar oportunidades',
    adset_id: '120236026777100238',
    adset_name: 'FORM - General - Invertí en VLA',
    ad_id: '120236026777080239',
    ad_name: 'FORM - Inversión en lotes',
    form_id: '1349310240322714',
    platform: 'fb',
    is_organic: false,

    // Datos del formulario
    field_data: [
      {
        name: '¿qué_tipo_de_inversión_te_interesa?',
        values: ['lote']
      },
      {
        name: '¿cuál_es_tu_presupuesto_en_usd?',
        values: ['más_de_$150_mil_usd']
      },
      {
        name: '¿cuál_es_tu_número_teléfono?',
        values: ['2995500661']
      },
      {
        name: 'full_name',
        values: ['María González (Test Array)']
      },
      {
        name: 'phone',
        values: ['+542995500661']
      }
    ]
  },
  {
    // Información del lead
    id: '9876543210987654',
    created_time: '2025-12-05T15:45:30+0000',

    // Información de la campaña
    campaign_id: '120236026777090238',
    campaign_name: 'FORM - Generar oportunidades',
    adset_id: '120236026777100238',
    adset_name: 'FORM - General - Invertí en VLA',
    ad_id: '120236026777080240',
    ad_name: 'FORM - Inmuebles para renta',
    form_id: '2204681366609205',
    platform: 'ig',
    is_organic: false,

    // Datos del formulario
    field_data: [
      {
        name: '¿qué_tipo_de_inversión_te_interesa?',
        values: ['inmueble_para_renta']
      },
      {
        name: '¿cuál_es_tu_presupuesto_en_usd?',
        values: ['entre_$100_y_$150_mil_usd']
      },
      {
        name: '¿cuál_es_tu_número_teléfono?',
        values: ['3415825460']
      },
      {
        name: 'full_name',
        values: ['Carlos Rodríguez (Test Array)']
      },
      {
        name: 'phone',
        values: ['+5493415825460']
      },
      {
        name: 'email',
        values: ['carlos.rodriguez@test.com']
      }
    ]
  }
];

async function processLeadsFromArray() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`PROCESANDO ${testLeads.length} LEADS DE PRUEBA`);
  console.log('═══════════════════════════════════════════════════════\n');

  const results = [];

  for (const leadData of testLeads) {
    try {
      console.log(`\n--- Procesando Lead: ${leadData.id} ---`);
      console.log(`Nombre: ${leadData.field_data.find(f => f.name === 'full_name')?.values[0]}`);
      console.log(`Campaña: ${leadData.campaign_name}`);
      console.log(`Plataforma: ${leadData.platform}`);

      // Procesar campos del formulario
      const fieldData = {};
      leadData.field_data.forEach(field => {
        fieldData[field.name] = field.values[0];
      });

      // Construir el texto con las preguntas y respuestas formateadas
      let textContent = 'Respuestas del formulario:\n\n';

      leadData.field_data.forEach(field => {
        // Formatear el nombre del campo: reemplazar _ por espacios
        const questionFormatted = field.name.replace(/_/g, ' ');
        const answer = field.values[0];

        // Solo agregar si no es full_name o phone
        if (field.name !== 'full_name' && field.name !== 'phone') {
          textContent += `${questionFormatted}: ${answer}\n`;
        }
      });

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
        tags: ['FORM - General', 'Meta Ads']
      };

      console.log('\nDatos a enviar:');
      console.log(`  - Nombre: ${contactData.name}`);
      console.log(`  - Phone: ${contactData.phone}`);
      console.log(`  - Cellphone: ${contactData.cellphone}`);
      console.log(`  - Email: ${contactData.email || 'N/A'}`);
      console.log(`  - Tags: ${contactData.tags.join(', ')}`);

      // Enviar a Tokko
      const result = await tokkoService.createContact(contactData);

      results.push({
        leadId: leadData.id,
        name: contactData.name,
        status: 'success',
        tokkoResponse: result
      });

      console.log('✓ Lead enviado exitosamente a Tokko\n');

    } catch (error) {
      console.error(`✗ Error procesando lead ${leadData.id}:`, error.message);
      results.push({
        leadId: leadData.id,
        status: 'error',
        error: error.message
      });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('RESUMEN DE PROCESAMIENTO');
  console.log('═══════════════════════════════════════════════════════\n');

  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;

  console.log(`Total procesados: ${results.length}`);
  console.log(`✓ Exitosos: ${successful}`);
  console.log(`✗ Fallidos: ${failed}\n`);

  results.forEach(result => {
    if (result.status === 'success') {
      console.log(`✓ ${result.leadId} - ${result.name} - Enviado a Tokko`);
    } else {
      console.log(`✗ ${result.leadId} - Error: ${result.error}`);
    }
  });

  console.log('');
}

// Ejecutar el test
processLeadsFromArray();
