const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKKO_API_KEY = process.env.TOKKO_API_KEY;
const BASE_URL = 'https://www.tokkobroker.com/api/v1';
const CSV_PATH = path.join(__dirname, '../public/meta-catalog.csv');

const PROPERTY_TYPE_MAP = {
  'Casa': 'house',
  'Departamento': 'apartment',
  'PH': 'townhouse',
  'Terreno': 'land',
  'Campo': 'land',
  'Local': 'other',
  'Hotel': 'other',
  'Oficina': 'other',
  'Galpón': 'other',
  'Cochera': 'other'
};

async function fetchAllProperties() {
  const limit = 100;
  let offset = 0;
  let allProperties = [];
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(`${BASE_URL}/property/`, {
      params: { format: 'json', key: TOKKO_API_KEY, lang: 'es_ar', limit, offset }
    });
    const { objects, meta } = response.data;
    allProperties = allProperties.concat(objects);
    offset += limit;
    hasMore = offset < meta.total_count;
  }

  return allProperties;
}

// Escapa un valor para CSV según RFC 4180:
// Si contiene coma, comillas o salto de linea, se encierra en comillas
// y las comillas internas se duplican.
function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(arr) {
  return arr.map(csvCell).join(',');
}

const HEADERS = [
  'id',
  'home_listing_id',
  'title',
  'name',
  'description',
  'availability',
  'listing_type',
  'property_type',
  'price',
  'url',
  'image[0].url',
  'image[1].url',
  'image[2].url',
  'image[3].url',
  'image[4].url',
  'image[5].url',
  'image[6].url',
  'image[7].url',
  'image[8].url',
  'image[9].url',
  'address.addr1',
  'address.city',
  'address.region',
  'address.postal_code',
  'address.country',
  'neighborhood[0]',
  'latitude',
  'longitude',
  'num_beds',
  'num_baths',
  'num_units',
  'year_built',
  'area_size',
  'area_size_unit',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3'
];

function priceRange(price) {
  if (price < 100000)  return 'Hasta USD 100.000';
  if (price < 200000)  return 'USD 100.000 - 200.000';
  if (price < 400000)  return 'USD 200.000 - 400.000';
  return 'Mas de USD 400.000';
}

function buildPropertyRow(prop) {
  const operation = prop.operations?.[0];
  const priceData = operation?.prices?.[0];
  if (!priceData?.price) return null;

  // Portada: usar la segunda foto segun el orden de Tokko (la primera suele ser
  // la marcada is_front_cover pero el cliente la quiere descartar como cover).
  const sortedPhotos = [...(prop.photos || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  if (sortedPhotos.length === 0) return null;
  const coverPhoto = sortedPhotos[1] || sortedPhotos[0];

  // Resto de imagenes: todas menos la nueva portada, en orden (max 9)
  const extraPhotos = sortedPhotos.filter(p => p !== coverPhoto).slice(0, 9);

  // Llenar slots de imagen hasta 10 posiciones (portada + 9 extras)
  const imageSlots = new Array(10).fill('');
  imageSlots[0] = coverPhoto.image || '';
  extraPhotos.forEach((p, i) => { imageSlots[i + 1] = p.image || ''; });

  const location = prop.location || {};
  const locationParts = location.full_location?.split(' | ') || [];
  const country = locationParts[0] || 'Argentina';
  const region = locationParts[1] || '';
  const city = locationParts[2] || '';
  const neighborhood = locationParts[3] || '';

  const isRent = operation?.operation_type === 'Alquiler';
  const availability = isRent ? 'for_rent' : 'for_sale';
  const listingType = isRent ? 'for_rent_by_agent' : 'for_sale_by_agent';
  const propertyType = PROPERTY_TYPE_MAP[prop.type?.name] || 'other';

  // Normalizar saltos de linea en textos para evitar problemas de parsing
  const flatten = s => (s || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

  const title = flatten(prop.publication_title || prop.address);

  const customLabel0 = prop.type?.name || 'Otro';
  const customLabel1 = neighborhood || city || '';
  const customLabel2 = isRent ? 'Alquiler' : 'Venta';
  const customLabel3 = priceRange(priceData.price);

  return [
    prop.id,
    prop.id,
    title,
    title,
    flatten(prop.description),
    availability,
    listingType,
    propertyType,
    `${priceData.price} ${priceData.currency}`,
    `https://patagonicapropiedades.com.ar/p/${prop.id}-prop`,
    ...imageSlots,
    prop.address || '',
    city,
    region,
    location.zip_code || '',
    country,
    neighborhood,
    prop.geo_lat || '',
    prop.geo_long || '',
    prop.room_amount || 0,
    prop.bathroom_amount || 0,
    1,
    prop.age ? new Date().getFullYear() - prop.age : '',
    prop.roofed_surface || prop.total_surface || '',
    'square_meters',
    customLabel0,
    customLabel1,
    customLabel2,
    customLabel3
  ];
}

async function generateCatalog() {
  console.log('[meta-catalog] Iniciando generación de CSV...');
  const properties = await fetchAllProperties();

  // Solo propiedades activas (status 2 = activa en Tokko)
  const active = properties.filter(p => p.status === 2);
  console.log(`[meta-catalog] ${active.length} propiedades activas de ${properties.length} totales`);

  const rows = active.map(buildPropertyRow).filter(Boolean);

  const lines = [csvRow(HEADERS), ...rows.map(csvRow)];
  const csv = lines.join('\r\n') + '\r\n';

  fs.writeFileSync(CSV_PATH, csv, 'utf8');
  console.log(`[meta-catalog] CSV generado: ${CSV_PATH} (${rows.length} propiedades)`);
  return { count: rows.length, path: CSV_PATH };
}

module.exports = { generateCatalog };
