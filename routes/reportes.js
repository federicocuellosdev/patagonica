const express = require('express');
const requireAuth = require('../lib/requireAuth');
const {
  ensureSynced,
  buildReport,
  clearCache,
} = require('../services/reportesService');

const router = express.Router();

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

module.exports = router;
