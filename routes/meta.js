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

    if (body.object === 'page') {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'leadgen') {
              const leadgenId = change.value.leadgen_id;
              const formId = change.value.form_id;

              // Obtener datos completos del lead
              const leadData = await metaService.getLeadData(leadgenId);

              // Obtener configuración del formulario
              const formConfig = getFormConfig(formId);

              // Log del lead recibido
              console.log(`- FORM - ${formConfig.name} - ID: ${leadgenId}`);

              // Procesar y enviar a Tokko (con tags del formulario)
              const tokkoResult = await metaService.processLead(leadData, formConfig.tags);

              // Log de la respuesta de Tokko
              console.log(`- TOKKO - Status: ${tokkoResult.status} - Success: ${tokkoResult.success}\n`);
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
