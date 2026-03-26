const express = require('express');
const router = express.Router();
const axios = require('axios');

const APP_ID       = process.env.TN_APP_ID;
const CLIENT_SECRET = process.env.TN_APP_CLIENT_SECRET;
const REDIRECT_URI  = process.env.TN_REDIRECT_URI;

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

module.exports = router;
