const express = require('express');
const router = express.Router();
const axios = require('axios');
const waDb = require('../lib/waDb');
const waMedia = require('../lib/waMedia');
const fs = require('fs');

const MEDIA_TYPES = new Set(['audio', 'image', 'video', 'document', 'sticker', 'voice']);

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('[wa] webhook verificado');
    return res.status(200).send(challenge);
  }
  console.warn('[wa] verificación fallida', { mode, token });
  return res.sendStatus(403);
});

router.post('/webhook', (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      const wabaId = entry.id;
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        const value = change.value || {};
        const phoneNumberId = value.metadata?.phone_number_id;
        const businessPhone = value.metadata?.display_phone_number;
        const contact = (value.contacts || [])[0];

        for (const message of value.messages || []) {
          try {
            waDb.saveIncomingMessage({ wabaId, phoneNumberId, businessPhone, message, contact });
          } catch (e) {
            console.error('[wa] saveIncoming error', e.message, message.id);
          }

          if (MEDIA_TYPES.has(message.type)) {
            const mediaObj = message[message.type];
            const mediaId = mediaObj?.id;
            const mimeType = mediaObj?.mime_type;
            if (mediaId) {
              waMedia.downloadMedia({ mediaId, mimeType })
                .then((r) => {
                  if (r?.path) {
                    waDb.updateMediaPath.run(r.path, message.id);
                    console.log(`[wa] media ${message.type} guardada ${mediaId} (${r.bytes}b)`);
                  }
                })
                .catch((e) => console.error('[wa] download media error', mediaId, e.response?.data || e.message));
            }
          }
        }

        for (const status of value.statuses || []) {
          try {
            waDb.saveStatus({ status });
          } catch (e) {
            console.error('[wa] saveStatus error', e.message, status.id);
          }
        }
      }
    }
  } catch (e) {
    console.error('[wa] webhook handler error', e);
  }
});

router.post('/send', async (req, res) => {
  const { to, text, phone_number_id } = req.body || {};
  const phoneId = phone_number_id || process.env.WA_PHONE_NUMBER_ID;

  if (!to || !text) return res.status(400).json({ error: 'to y text requeridos' });
  if (!phoneId) return res.status(400).json({ error: 'WA_PHONE_NUMBER_ID no configurado' });

  try {
    const r = await axios.post(
      `${GRAPH_BASE}/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text },
      },
      { headers: { Authorization: `Bearer ${process.env.META_WA_SYSTEM_TOKEN}` } }
    );

    const messageId = r.data?.messages?.[0]?.id;
    if (messageId) {
      waDb.saveOutgoingMessage({
        phoneNumberId: phoneId,
        toNumber: to,
        messageId,
        type: 'text',
        text,
        raw: r.data,
      });
    }
    res.json(r.data);
  } catch (err) {
    const data = err.response?.data || { message: err.message };
    console.error('[wa] send error', data);
    res.status(err.response?.status || 500).json(data);
  }
});

router.get('/messages', (req, res) => {
  const { from, limit = 100, since } = req.query;
  const lim = Math.min(Number(limit) || 100, 1000);

  let sql = 'SELECT * FROM wa_messages';
  const where = [];
  const params = [];
  if (from) { where.push('(from_number = ? OR to_number = ?)'); params.push(from, from); }
  if (since) { where.push('wa_timestamp >= ?'); params.push(Number(since)); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY wa_timestamp DESC LIMIT ?';
  params.push(lim);

  const rows = waDb.db.prepare(sql).all(...params);
  res.json({ count: rows.length, messages: rows });
});

router.get('/contacts', (_req, res) => {
  const rows = waDb.db.prepare('SELECT * FROM wa_contacts ORDER BY last_seen DESC LIMIT 500').all();
  res.json({ count: rows.length, contacts: rows });
});

router.post('/media/backfill', async (req, res) => {
  const pending = waDb.db.prepare(
    "SELECT id, media_id, mime_type FROM wa_messages WHERE media_id IS NOT NULL AND media_path IS NULL"
  ).all();

  const results = { pending: pending.length, ok: 0, errors: [] };
  for (const row of pending) {
    try {
      const r = await waMedia.downloadMedia({ mediaId: row.media_id, mimeType: row.mime_type });
      if (r?.path) {
        waDb.updateMediaPath.run(r.path, row.id);
        results.ok += 1;
      }
    } catch (e) {
      results.errors.push({ id: row.id, error: e.response?.data || e.message });
    }
  }
  res.json(results);
});

router.get('/media/:id', (req, res) => {
  const row = waDb.db.prepare('SELECT media_path, mime_type FROM wa_messages WHERE id = ?').get(req.params.id);
  if (!row?.media_path || !fs.existsSync(row.media_path)) return res.sendStatus(404);
  if (row.mime_type) res.setHeader('Content-Type', row.mime_type);
  fs.createReadStream(row.media_path).pipe(res);
});

module.exports = router;
