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
const { generateCatalogXml } = require('./services/tokkoCatalogService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Meta requiere content-type application/rss+xml para feeds RSS
app.get('/public/meta-catalog.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.sendFile(path.join(__dirname, 'public/meta-catalog.xml'));
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

app.get('/', (req, res) => {
  res.json({ mensaje: 'pong' });
});

// Cron: regenerar catálogo XML cada 24 horas (3am hora Argentina, UTC-3)
cron.schedule('0 6 * * *', async () => {
  try {
    await generateCatalogXml();
  } catch (err) {
    console.error('[meta-catalog] Error en cron:', err.message);
  }
});

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  // Generar catálogo al arrancar si no existe
  const fs = require('fs');
  const xmlPath = path.join(__dirname, 'public/meta-catalog.xml');
  if (!fs.existsSync(xmlPath)) {
    try {
      await generateCatalogXml();
    } catch (err) {
      console.error('[meta-catalog] Error generando XML inicial:', err.message);
    }
  }
});
