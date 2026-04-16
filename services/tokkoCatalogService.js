const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKKO_API_KEY = process.env.TOKKO_API_KEY;
const BASE_URL = 'https://www.tokkobroker.com/api/v1';
const XML_PATH = path.join(__dirname, '../public/meta-catalog.xml');

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

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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

function buildPropertyXml(prop) {
  const operation = prop.operations?.[0];
  const priceData = operation?.prices?.[0];
  if (!priceData?.price) return null;

  // Foto de portada
  const coverPhoto = prop.photos?.find(p => p.is_front_cover) || prop.photos?.[0];
  if (!coverPhoto) return null;

  // Fotos adicionales (excluye la portada, máx 10)
  const extraPhotos = (prop.photos || [])
    .filter(p => !p.is_front_cover)
    .slice(0, 10);

  const location = prop.location || {};
  // full_location: "Argentina | Neuquen | Villa La Angostura | Puerto"
  const locationParts = location.full_location?.split(' | ') || [];
  const country = locationParts[0] || 'Argentina';
  const region = locationParts[1] || '';
  const city = locationParts[2] || '';
  const neighborhood = locationParts[3] || '';

  const availability = operation?.operation_type === 'Alquiler' ? 'for_rent' : 'for_sale';
  const propertyType = PROPERTY_TYPE_MAP[prop.type?.name] || 'other';

  const additionalImages = extraPhotos
    .map(p => `      <g:additional_image_link>${escapeXml(p.image)}</g:additional_image_link>`)
    .join('\n');

  return `    <item>
      <g:home_listing_id>${escapeXml(String(prop.id))}</g:home_listing_id>
      <g:name>${escapeXml(prop.publication_title || prop.address)}</g:name>
      <g:description>${escapeXml(prop.description)}</g:description>
      <g:price>${priceData.price} ${priceData.currency}</g:price>
      <g:listing_type>ad_listing</g:listing_type>
      <g:property_type>${propertyType}</g:property_type>
      <g:availability>${availability}</g:availability>
      <g:url>${escapeXml(prop.public_url || `https://patagonicapropiedades.com/propiedades/${prop.id}`)}</g:url>
      <g:image_link>${escapeXml(coverPhoto.image)}</g:image_link>
${additionalImages ? additionalImages + '\n' : ''}      <g:street_address>${escapeXml(prop.address)}</g:street_address>
      <g:city>${escapeXml(city)}</g:city>
      <g:region>${escapeXml(region)}</g:region>
      <g:postal_code>${escapeXml(location.zip_code || '')}</g:postal_code>
      <g:country>${escapeXml(country)}</g:country>
      <g:latitude>${prop.geo_lat || ''}</g:latitude>
      <g:longitude>${prop.geo_long || ''}</g:longitude>
      <g:neighborhood>${escapeXml(neighborhood)}</g:neighborhood>
      <g:num_beds>${prop.room_amount || 0}</g:num_beds>
      <g:num_baths>${prop.bathroom_amount || 0}</g:num_baths>
      <g:num_units>1</g:num_units>
      <g:year_built>${prop.age ? new Date().getFullYear() - prop.age : ''}</g:year_built>
      <g:area_size>${prop.roofed_surface || prop.total_surface || ''}</g:area_size>
      <g:area_size_unit>square_meters</g:area_size_unit>
    </item>`;
}

async function generateCatalogXml() {
  console.log('[meta-catalog] Iniciando generación de XML...');
  const properties = await fetchAllProperties();

  // Solo propiedades activas (status 2 = activa en Tokko)
  const active = properties.filter(p => p.status === 2);
  console.log(`[meta-catalog] ${active.length} propiedades activas de ${properties.length} totales`);

  const items = active.map(buildPropertyXml).filter(Boolean).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Patagónica Propiedades - Catálogo</title>
    <link>https://patagonicapropiedades.com</link>
    <description>Listado de propiedades para Meta Ads</description>
${items}
  </channel>
</rss>`;

  fs.writeFileSync(XML_PATH, xml, 'utf8');
  console.log(`[meta-catalog] XML generado: ${XML_PATH} (${active.length} propiedades)`);
  return { count: active.length, path: XML_PATH };
}

module.exports = { generateCatalogXml };
