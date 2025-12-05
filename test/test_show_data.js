require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const metaService = require('../services/metaService');

// Lead de prueba con toda la información de Meta
const testLead = {
  id: '1575854360215029',
  created_time: '2025-12-05T01:12:08+0000',
  campaign_id: '120236026777090238',
  campaign_name: 'FORM - Generar oportunidades',
  adset_id: '120236026777100238',
  adset_name: 'FORM - General - Invertí en VLA',
  ad_id: '120236026777080238',
  ad_name: 'FORM - Cuanto sale invertir hoy en día',
  form_id: '2204681366609205',
  platform: 'ig',
  is_organic: false,
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
      values: ['Juan Pérez (Test)']
    },
    {
      name: 'phone',
      values: ['+5491150131723']
    }
  ]
};

async function showData() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('MOSTRANDO DATOS QUE SE ENVÍAN A TOKKO');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    await metaService.processLead(testLead);
    console.log('\n✓ Proceso completado exitosamente');
  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
  }
}

showData();
