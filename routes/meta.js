const express = require('express');
const router = express.Router();
const metaService = require('../services/metaService');
const kommoService = require('../services/kommoService');
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

    if (body.object === 'page') {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'leadgen') {
              const leadgenId = change.value.leadgen_id;
              const formId = change.value.form_id;

              // Detectar test events
              if (formId === '444444444444' || leadgenId === '444444444444') {
                console.log('- Meta - Test event ignorado');
                continue;
              }

              console.log(`- Meta - Lead ID: ${leadgenId}`);

              // Obtener datos completos del lead
              console.log('- Meta - Lead búsqueda de datos');
              const leadData = await metaService.getLeadData(leadgenId);

              // Obtener configuración del formulario
              const formConfig = getFormConfig(formId);

              // Enviar a Tokko y Kommo en paralelo
              const [tokkoResult, kommoResult] = await Promise.allSettled([
                metaService.processLead(leadData, formConfig.tags, formConfig.publication_id),
                kommoService.processLead(leadData, formConfig.name || 'FORM - General', formConfig.tags || [])
              ]);

              console.log(`- Tokko - Envío de datos (Status: ${tokkoResult.value?.status ?? tokkoResult.reason?.message})`);
              console.log(`- Kommo - Lead ID: ${kommoResult.value?.lead?.id ?? kommoResult.reason?.message}\n`);
            }
          }
        }
      }

      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('✗ ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
