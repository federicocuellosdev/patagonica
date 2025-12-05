require('dotenv').config();
const metaService = require('../services/metaService');

async function testLeadProcessing() {
  try {
    console.log('Obteniendo un lead reciente para enviar a Tokko...\n');

    // Obtener un lead reciente
    const leadData = await metaService.getLeadData('1575854360215029');

    console.log('Lead obtenido:', leadData.id);
    console.log('');

    // Procesar y enviar a Tokko
    const result = await metaService.processLead(leadData);

    console.log('\n✓ Lead procesado exitosamente');
    console.log('Resultado:', result);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
}

testLeadProcessing();
