const axios = require('axios');

const BASE_URL = 'https://api.tiendanube.com/v1';

function client() {
  const storeId = process.env.TN_STORE_ID;
  const token   = process.env.TN_ACCESS_TOKEN;

  if (!storeId || !token) {
    throw new Error('Faltan TN_STORE_ID o TN_ACCESS_TOKEN en las variables de entorno.');
  }

  return axios.create({
    baseURL: `${BASE_URL}/${storeId}`,
    headers: {
      Authentication:  `bearer ${token}`,
      'User-Agent':    `VLA-API/1.0 (${process.env.TN_APP_ID})`,
      'Content-Type':  'application/json',
    },
  });
}

async function getOrders({ page = 1, perPage = 50, since, status } = {}) {
  const params = { page, per_page: perPage };
  if (since)  params.created_at_min = since;
  if (status) params.payment_status = status;

  const { data } = await client().get('/orders', { params });
  return data;
}

async function getOrder(orderId) {
  const { data } = await client().get(`/orders/${orderId}`);
  return data;
}

async function getProducts({ page = 1, perPage = 50 } = {}) {
  const { data } = await client().get('/products', {
    params: { page, per_page: perPage },
  });
  return data;
}

async function getProduct(productId) {
  const { data } = await client().get(`/products/${productId}`);
  return data;
}

async function getCustomers({ page = 1, perPage = 50 } = {}) {
  const { data } = await client().get('/customers', {
    params: { page, per_page: perPage },
  });
  return data;
}

async function getStoreInfo() {
  const { data } = await client().get('/');
  return data;
}

// products: [{ variant_id, quantity }]
async function createOrder({ products, contact = {} } = {}) {
  const payload = { products };
  if (contact.email) payload.contact_email = contact.email;
  if (contact.name)  payload.contact_name  = contact.name;
  if (contact.phone) payload.contact_phone = contact.phone;

  const { data } = await client().post('/orders', payload);
  return data;
}

module.exports = { getOrders, getOrder, getProducts, getProduct, getCustomers, getStoreInfo, createOrder };
