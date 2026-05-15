console.clear()

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const tokkoRoutes = require('./routes/tokko');
const metaRoutes = require('./routes/meta');
const kommoRoutes = require('./routes/kommo');
const juanitaRoutes = require('./routes/juanita');
const webRoutes = require('./routes/web');
const federicoRoutes = require('./routes/federico');
const tiendanubeRoutes = require('./routes/tiendanube');
const authRoutes = require('./routes/auth');
const reportesRoutes = require('./routes/reportes');
const { generateCatalog } = require('./services/tokkoCatalogService');

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
  'https://tienda.chavelaba.com.ar',
  'https://chavelaba.com.ar',
  'https://www.chavelaba.com.ar',
  'https://federicocuellos.ar',
  'https://www.federicocuellos.ar',
  'https://l.patagonicapropiedades.com.ar',
  'https://patagonicapropiedades.com.ar',
  'https://www.patagonicapropiedades.com.ar',
];
const ALLOWED_ORIGIN_REGEX = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /\.github\.io$/,
  /\.mitiendanube\.com$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Sin Origin (curl, server-to-server) o file:// (browser manda "null") → permitir
    if (!origin || origin === 'null') return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (ALLOWED_ORIGIN_REGEX.some((r) => r.test(origin))) return callback(null, true);
    return callback(new Error('CORS bloqueado para origin: ' + origin), false);
  },
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Meta requiere content-type text/csv para feeds CSV
app.get('/public/meta-catalog.csv', (req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.sendFile(path.join(__dirname, 'public/meta-catalog.csv'));
});

// Servir archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/api/tokko', tokkoRoutes);
app.use('/api/kommo', kommoRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/juanita', juanitaRoutes);
app.use('/api/web', webRoutes);
app.use('/api/federico', federicoRoutes);
app.use('/api/tiendanube', tiendanubeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reportes', reportesRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'pong' });
});

app.post('/admin/regenerar-catalogo', async (req, res) => {
  try {
    const result = await generateCatalog();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Cron: regenerar catálogo CSV cada 24 horas (3am hora Argentina, UTC-3)
cron.schedule('0 6 * * *', async () => {
  try {
    await generateCatalog();
  } catch (err) {
    console.error('[meta-catalog] Error en cron:', err.message);
  }
});

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  // Generar catálogo al arrancar si no existe
  const fs = require('fs');
  const csvPath = path.join(__dirname, 'public/meta-catalog.csv');
  if (!fs.existsSync(csvPath)) {
    try {
      await generateCatalog();
    } catch (err) {
      console.error('[meta-catalog] Error generando CSV inicial:', err.message);
    }
  }
});
