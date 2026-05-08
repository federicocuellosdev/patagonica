const express = require('express');
const requireAuth = require('../lib/requireAuth');
const { buildDashboardReport } = require('../services/reportesService');

const router = express.Router();

const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function isValidDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

router.get('/dashboard', requireAuth, async (req, res) => {
  const { desde, hasta } = req.query;

  if (!isValidDate(desde) || !isValidDate(hasta)) {
    return res.status(400).json({ error: 'desde y hasta son requeridos en formato YYYY-MM-DD' });
  }
  if (desde > hasta) {
    return res.status(400).json({ error: 'desde no puede ser mayor a hasta' });
  }

  const cacheKey = `${desde}__${hasta}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.t < CACHE_TTL_MS) {
    return res.json({ ...cached.data, cached: true });
  }

  try {
    const data = await buildDashboardReport({ desde, hasta });
    cache.set(cacheKey, { t: Date.now(), data });
    res.json(data);
  } catch (err) {
    console.error('[reportes/dashboard]', err.response?.data || err.message);
    res.status(500).json({ error: err.message, detail: err.response?.data?.error || null });
  }
});

module.exports = router;
