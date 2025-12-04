const express = require('express');
const router = express.Router();
const metaService = require('../services/metaService');

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
    console.log('Webhook recibido:', JSON.stringify(body, null, 2));

    if (body.object === 'page') {
      body.entry.forEach(async (entry) => {
        console.log('Entry recibido:', JSON.stringify(entry, null, 2));

        const leadgenId = entry.changes[0].value.leadgen_id;
        const formId = entry.changes[0].value.form_id;

        console.log('Lead ID:', leadgenId, 'Form ID:', formId);

        const leadData = await metaService.getLeadData(leadgenId);
        console.log('Lead Data:', JSON.stringify(leadData, null, 2));

        await metaService.processLead(leadData);
        console.log('Lead procesado correctamente');
      });

      res.status(200).send('EVENT_RECEIVED');
    } else {
      console.log('Objeto no es page:', body.object);
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/leads', async (req, res) => {
  try {
    const leads = await metaService.getLeads();
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test', async (req, res) => {
  try {
    const result = await metaService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
