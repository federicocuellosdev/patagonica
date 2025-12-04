const express = require('express');
const router = express.Router();
const metaService = require('../services/metaService');

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === process.env.META_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'page') {
      body.entry.forEach(async (entry) => {
        const leadgenId = entry.changes[0].value.leadgen_id;
        const formId = entry.changes[0].value.form_id;

        const leadData = await metaService.getLeadData(leadgenId);
        await metaService.processLead(leadData);
      });

      res.status(200).send('EVENT_RECEIVED');
    } else {
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
