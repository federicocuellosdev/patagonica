const express = require('express');
const router = express.Router();
const metaService = require('../services/metaService');
const { getFormConfig } = require('../config/forms');

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Verificación de webhook:', { mode, token, challenge });

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('Webhook verificado correctamente');
    res.status(200).send(challenge);
  } else {
    console.error('Verificación fallida');
    res.sendStatus(403);
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    console.log('\n🔔 WEBHOOK RECIBIDO');
    console.log('Body completo:', JSON.stringify(body, null, 2));

    if (body.object === 'page') {
      console.log('✓ Tipo de objeto: page');

      for (const entry of body.entry) {
        console.log('📦 Procesando entry:', entry.id);

        if (entry.changes) {
          console.log(`📝 Total de cambios: ${entry.changes.length}`);

          for (const change of entry.changes) {
            console.log('🔄 Tipo de cambio:', change.field);

            if (change.field === 'leadgen') {
              const leadgenId = change.value.leadgen_id;
              const formId = change.value.form_id;

              console.log(`\n🎯 LEAD DETECTADO`);
              console.log(`   Lead ID: ${leadgenId}`);
              console.log(`   Form ID: ${formId}`);

              // Detectar test events
              if (formId === '444444444444' || leadgenId === '444444444444') {
                console.log('⚠️  Test event de Meta detectado - Ignorando\n');
                continue;
              }

              // Obtener datos completos del lead
              console.log('📡 Obteniendo datos del lead desde Meta...');
              const leadData = await metaService.getLeadData(leadgenId);
              console.log('✓ Datos del lead obtenidos');

              // Obtener configuración del formulario
              const formConfig = getFormConfig(formId);

              // Log del lead recibido
              console.log(`- FORM - ${formConfig.name} - ID: ${leadgenId}`);

              // Procesar y enviar a Tokko (con tags del formulario)
              console.log('📤 Enviando a Tokko...');
              const tokkoResult = await metaService.processLead(leadData, formConfig.tags);

              // Log de la respuesta de Tokko
              console.log(`- TOKKO - Status: ${tokkoResult.status} - Success: ${tokkoResult.success}\n`);
            } else {
              console.log(`⚠️  Cambio ignorado (no es leadgen): ${change.field}`);
            }
          }
        } else {
          console.log('⚠️  Entry sin cambios');
        }
      }

      res.status(200).send('EVENT_RECEIVED');
    } else {
      console.log(`❌ Objeto no es page: ${body.object}`);
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('\n❌ ERROR EN WEBHOOK:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
