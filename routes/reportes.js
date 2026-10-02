const express = require('express');
const axios = require('axios');
const requireAuth = require('../lib/requireAuth');
const {
  ensureSynced,
  buildReport,
  clearCache,
} = require('../services/reportesService');

const router = express.Router();

const FORM_CAMPAIGN_ID = '120236026777090238';
const META_API_VERSION = 'v23.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;
const FORM_OPEN_ACTIONS = ['onsite_conversion.lead_form_open', 'onsite_conversion.flow_start'];
const FORM_LEAD_ACTIONS = ['onsite_conversion.lead_grouped', 'offsite_conversion.fb_lead', 'lead'];

let formFunnelCache = null;
const FORM_FUNNEL_TTL_MS = 10 * 60 * 1000;

function sumAction(actions, types) {
  if (!actions) return 0;
  let s = 0;
  for (const a of actions) if (types.includes(a.action_type)) s = Math.max(s, parseFloat(a.value || 0));
  return s;
}

async function fetchFormInsights(level) {
  const out = [];
  let url = `${META_BASE_URL}/${FORM_CAMPAIGN_ID}/insights`;
  let params = {
    access_token: process.env.META_ACCESS_TOKEN,
    level,
    date_preset: 'maximum',
    fields: 'adset_id,adset_name,ad_id,ad_name,impressions,reach,spend,cpm,inline_link_clicks,actions',
    limit: 500,
  };
  while (url) {
    const r = await axios.get(url, { params });
    out.push(...(r.data.data || []));
    url = r.data.paging?.next || null;
    params = null;
  }
  return out;
}

function enrichRow(r, nameKey) {
  const imp = parseInt(r.impressions || 0, 10);
  const reach = parseInt(r.reach || 0, 10);
  const spend = parseFloat(r.spend || 0);
  const cpm = parseFloat(r.cpm || 0);
  const opens = sumAction(r.actions, FORM_OPEN_ACTIONS) || parseInt(r.inline_link_clicks || 0, 10);
  const subs = sumAction(r.actions, FORM_LEAD_ACTIONS);
  return {
    name: r[nameKey],
    imp, reach, spend, cpm, opens, subs,
    cpl: subs ? spend / subs : null,
    openRate: reach ? opens / reach : null,
    subRate: reach ? subs / reach : null,
    completionRate: opens ? subs / opens : null,
  };
}

function isValidDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// GET /api/reportes/dashboard?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&sync=auto|force|skip
// - sync=auto (default): sincroniza solo días faltantes hasta ayer
// - sync=force: re-syncea todo desde el inicio
// - sync=skip: solo agrega lo que ya está cacheado, no toca APIs
router.get('/dashboard', requireAuth, async (req, res) => {
  const { desde, hasta, sync = 'auto' } = req.query;

  if (!isValidDate(desde) || !isValidDate(hasta)) {
    return res.status(400).json({ error: 'desde y hasta son requeridos en formato YYYY-MM-DD' });
  }
  if (desde > hasta) {
    return res.status(400).json({ error: 'desde no puede ser mayor a hasta' });
  }

  let syncResult = null;
  try {
    if (sync === 'force') {
      syncResult = await ensureSynced({ force: true });
    } else if (sync !== 'skip') {
      syncResult = await ensureSynced({ force: false });
    }
  } catch (err) {
    console.error('[reportes] sync error:', err.response?.data || err.message);
    return res.status(500).json({
      error: 'Error sincronizando datos',
      detail: err.message,
    });
  }

  const report = buildReport({ desde, hasta });
  res.json({ ...report, sync: syncResult });
});

// DELETE /api/reportes/cache → vacía el store completo
router.delete('/cache', requireAuth, (req, res) => {
  clearCache();
  res.json({ ok: true });
});

// GET /api/reportes/meta-form-funnel?refresh=1
// Funnel de la campaña FORM (histórico): adsets + ads con metricas de lead form
router.get('/meta-form-funnel', requireAuth, async (req, res) => {
  const now = Date.now();
  const refresh = req.query.refresh === '1';
  if (!refresh && formFunnelCache && (now - formFunnelCache.at) < FORM_FUNNEL_TTL_MS) {
    return res.json({ ...formFunnelCache.data, cached: true, cached_age_s: Math.round((now - formFunnelCache.at) / 1000) });
  }
  try {
    const [adsetsRaw, adsRaw] = await Promise.all([
      fetchFormInsights('adset'),
      fetchFormInsights('ad'),
    ]);
    const adsets = adsetsRaw.map(r => enrichRow(r, 'adset_name')).sort((a, b) => b.subs - a.subs);
    const ads = adsRaw.map(r => enrichRow(r, 'ad_name')).sort((a, b) => b.subs - a.subs);
    const totals = adsets.reduce((s, r) => ({
      imp: s.imp + r.imp,
      reach: s.reach + r.reach,
      spend: s.spend + r.spend,
      opens: s.opens + r.opens,
      subs: s.subs + r.subs,
    }), { imp: 0, reach: 0, spend: 0, opens: 0, subs: 0 });
    totals.cpl = totals.subs ? totals.spend / totals.subs : null;
    totals.cpm = totals.imp ? totals.spend / totals.imp * 1000 : null;
    totals.openRate = totals.reach ? totals.opens / totals.reach : null;
    totals.subRate = totals.reach ? totals.subs / totals.reach : null;
    totals.completionRate = totals.opens ? totals.subs / totals.opens : null;

    const data = {
      campaign_id: FORM_CAMPAIGN_ID,
      campaign_name: 'FORM - Generar oportunidades',
      date_preset: 'maximum',
      generated_at: new Date().toISOString(),
      totals,
      adsets,
      ads,
    };
    formFunnelCache = { at: now, data };
    res.json({ ...data, cached: false });
  } catch (err) {
    console.error('[reportes] meta-form-funnel error:', err.response?.data?.error || err.message);
    res.status(500).json({ error: 'Error consultando Meta', detail: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;
