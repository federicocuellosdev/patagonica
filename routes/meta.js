const express = require('express');
const router = express.Router();
const axios = require('axios');
const metaService = require('../services/metaService');
const kommoService = require('../services/kommoService');
const { getFormConfig } = require('../config/forms');
const { getAdsetTags } = require('../config/adsets');

const CAPI_PIXEL_ID = '1129079111925410';


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

              // Tags adicionales según adset (ej. NQ & RN)
              const adsetTags = getAdsetTags(leadData.adset_id);
              const tags = [...(formConfig.tags || []), ...adsetTags];

              // Enviar a Kommo
              const kommoResult = await kommoService.processLead(
                leadData,
                formConfig.name || 'FORM - General',
                tags
              );

              console.log(`- Kommo - Lead ID: ${kommoResult.lead?.id}\n`);
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

// POST /api/meta/capi-lead — dispara evento Lead via Conversions API
router.post('/capi-lead', async (req, res) => {
  try {
    const { event_id, url, fbc, fbp } = req.body;

    const payload = {
      data: [{
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: event_id || undefined,
        event_source_url: url || undefined,
        action_source: 'website',
        user_data: {
          fbc: fbc || undefined,
          fbp: fbp || undefined
        }
      }]
    };

    await axios.post(
      `https://graph.facebook.com/v21.0/${CAPI_PIXEL_ID}/events`,
      payload,
      { params: { access_token: process.env.META_ACCESS_TOKEN } }
    );

    console.log(`[CAPI] Lead enviado — event_id: ${event_id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[CAPI Lead]', err.response?.data || err.message);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
