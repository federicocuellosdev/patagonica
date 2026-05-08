const express = require('express');
const fs = require('fs');
const path = require('path');
const requireAuth = require('../lib/requireAuth');
const { buildDashboardReport } = require('../services/reportesService');

const router = express.Router();

const cacheDir = path.join(__dirname, '..', 'data', 'cache');
fs.mkdirSync(cacheDir, { recursive: true });

function isValidDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function cacheFileFor(desde, hasta) {
  return path.join(cacheDir, `dashboard__${desde}__${hasta}.json`);
}

router.get('/dashboard', requireAuth, async (req, res) => {
  const { desde, hasta, refresh } = req.query;

  if (!isValidDate(desde) || !isValidDate(hasta)) {
    return res.status(400).json({ error: 'desde y hasta son requeridos en formato YYYY-MM-DD' });
  }
  if (desde > hasta) {
    return res.status(400).json({ error: 'desde no puede ser mayor a hasta' });
  }

  const cacheFile = cacheFileFor(desde, hasta);
  const force = refresh === '1' || refresh === 'true';

  if (!force && fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return res.json({ ...cached, cached: true });
    } catch (e) {
      console.error('[reportes] cache corrupto, refetching:', e.message);
    }
  }

  try {
    const data = await buildDashboardReport({ desde, hasta });
    const payload = { ...data, fetched_at: new Date().toISOString() };
    fs.writeFileSync(cacheFile, JSON.stringify(payload, null, 2));
    res.json({ ...payload, cached: false });
  } catch (err) {
    console.error('[reportes/dashboard]', err.response?.data || err.message);
    res.status(500).json({ error: err.message, detail: err.response?.data?.error || null });
  }
});

router.delete('/dashboard/cache', requireAuth, (req, res) => {
  const files = fs.readdirSync(cacheDir).filter((f) => f.endsWith('.json'));
  files.forEach((f) => fs.unlinkSync(path.join(cacheDir, f)));
  res.json({ ok: true, deleted: files.length });
});

module.exports = router;
