const axios = require('axios');

const BASE = 'https://www.tokkobroker.com/api/v1';
const KEY = () => process.env.TOKKO_API_KEY;

async function get(path, params = {}) {
  const r = await axios.get(`${BASE}${path}`, {
    params: { key: KEY(), ...params }
  });
  return r.data;
}

async function listProperties({ limit = 25, offset = 0, status, operation_type, type } = {}) {
  // Tokko paginación: limit/offset en segmentos del path
  const path = `/property/?limit=${limit}&offset=${offset}`;
  const params = {};
  const filters = {};
  if (status) filters.status = status;
  if (operation_type) filters.operation_types = Array.isArray(operation_type) ? operation_type : [operation_type];
  if (type) filters.property_types = Array.isArray(type) ? type : [type];
  if (Object.keys(filters).length) params.data = JSON.stringify(filters);
  const data = await get(path, params);
  return {
    meta: data.meta,
    properties: (data.objects || []).map((p) => ({
      id: p.id,
      publication_title: p.publication_title,
      address: p.address,
      location: p.location?.full_location,
      type: p.type?.name,
      status: p.status,
      operations: (p.operations || []).map((o) => ({
        type: o.operation_type,
        price: o.prices?.[0]?.price,
        currency: o.prices?.[0]?.currency
      })),
      photos: (p.photos || []).slice(0, 5).map((ph) => ({ id: ph.id, image: ph.image, thumb: ph.thumb })),
      videos: p.videos || [],
      reference_code: p.reference_code
    }))
  };
}

async function getProperty(id) {
  const data = await get(`/property/${id}/`);
  return data;
}

async function listDevelopments({ limit = 25, offset = 0 } = {}) {
  const path = `/development/?limit=${limit}&offset=${offset}`;
  const data = await get(path);
  return {
    meta: data.meta,
    developments: (data.objects || []).map((d) => ({
      id: d.id,
      name: d.name,
      address: d.address,
      location: d.location?.full_location,
      construction_status: d.construction_status,
      photos: (d.photos || []).slice(0, 5).map((ph) => ({ id: ph.id, image: ph.image, thumb: ph.thumb })),
      videos: d.videos || []
    }))
  };
}

async function getDevelopment(id) {
  const data = await get(`/development/${id}/`);
  return data;
}

async function searchProperties({ q, limit = 25 } = {}) {
  // Búsqueda libre: usa el endpoint search si existe; si no, filter por publication_title
  const data = await get(`/property/search/?limit=${limit}&offset=0`, {
    data: JSON.stringify({ filters: [['publication_title', 'contains', q]] })
  });
  return data;
}

module.exports = { listProperties, getProperty, listDevelopments, getDevelopment, searchProperties };
