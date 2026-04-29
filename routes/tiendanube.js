const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const tn      = require('../services/tiendanubeService');

const APP_ID        = process.env.TN_APP_ID;
const CLIENT_SECRET = process.env.TN_APP_CLIENT_SECRET;
const REDIRECT_URI  = process.env.TN_REDIRECT_URI;

// ─── OAuth ──────────────────────────────────────────────────────────────────

// GET /api/tiendanube/auth
// Redirige al panel de autorización de Tienda Nube
router.get('/auth', (req, res) => {
  const url = `https://www.tiendanube.com/apps/${APP_ID}/authorize`;
  res.redirect(url);
});

// GET /api/tiendanube/callback
// Recibe el code, lo intercambia por access_token y devuelve store_id + token
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Falta el parámetro code' });
  }

  try {
    const response = await axios.post(
      'https://www.tiendanube.com/apps/authorize/token',
      {
        client_id:     APP_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
      }
    );

    const { access_token, token_type, scope, user_id } = response.data;

    console.log(`[TiendaNube] Autorizado — store_id: ${user_id}`);

    res.json({
      ok: true,
      store_id:     user_id,
      access_token,
      token_type,
      scope,
      nota: 'Guardá TN_STORE_ID y TN_ACCESS_TOKEN en las variables de entorno del servidor.',
    });
  } catch (err) {
    const msg = err.response?.data || err.message;
    console.error('[TiendaNube] Error en callback:', msg);
    res.status(500).json({ error: msg });
  }
});

// ─── Datos de la tienda ──────────────────────────────────────────────────────

// GET /api/tiendanube/store
router.get('/store', async (req, res) => {
  try {
    const data = await tn.getStoreInfo();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tiendanube/orders?page=1&per_page=50&since=2026-01-01&status=paid
router.get('/orders', async (req, res) => {
  try {
    const { page, per_page, since, status } = req.query;
    const data = await tn.getOrders({ page, perPage: per_page, since, status });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tiendanube/orders
// Body: { variant_id, quantity, contact? }
// Crea la orden en TN y devuelve checkout_url para redirigir al cliente
router.post('/orders', async (req, res) => {
  const { variant_id, quantity = 1, contact } = req.body;

  if (!variant_id) {
    return res.status(400).json({ error: 'Falta variant_id' });
  }

  try {
    const order = await tn.createOrder({
      products: [{ variant_id: Number(variant_id), quantity: Number(quantity) }],
      contact,
    });

    const checkoutUrl = `https://chavelaba.com.ar/checkout/v3/start/${order.token}`;

    res.json({ ok: true, order_id: order.id, checkout_url: checkoutUrl });
  } catch (err) {
    const msg = err.response?.data || err.message;
    res.status(500).json({ error: msg });
  }
});

// GET /api/tiendanube/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const data = await tn.getOrder(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tiendanube/products?page=1&per_page=50
router.get('/products', async (req, res) => {
  try {
    const { page, per_page } = req.query;
    const data = await tn.getProducts({ page, perPage: per_page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tiendanube/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const data = await tn.getProduct(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tiendanube/customers?page=1&per_page=50
router.get('/customers', async (req, res) => {
  try {
    const { page, per_page } = req.query;
    const data = await tn.getCustomers({ page, perPage: per_page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tiendanube/shipping/quote
// Body: { zipcode, product_id, variant_id, quantity }
router.post('/shipping/quote', async (req, res) => {
  const { zipcode, product_id, variant_id, quantity = 1 } = req.body;
  if (!zipcode || !variant_id) {
    return res.status(400).json({ error: 'Faltan zipcode o variant_id' });
  }

  const storeId = process.env.TN_STORE_ID;
  const token   = process.env.TN_TOKEN || process.env.TN_ACCESS_TOKEN;

  try {
    const { data } = await axios.post(
      `https://api.tiendanube.com/v1/${storeId}/shipping_carriers/quote`,
      { zipcode: String(zipcode), products: [{ product_id, variant_id, quantity }] },
      { headers: { Authentication: `bearer ${token}`, 'User-Agent': 'VLA-API/1.0', 'Content-Type': 'application/json' } }
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

module.exports = router;
