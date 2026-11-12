const { google } = require('googleapis');

let credsCache = null;
let propertyIdCache = null;
let adminCache = null;
let dataCache = null;

function getCreds() {
  if (credsCache) return credsCache;
  const raw = process.env.GOOGLE_CREDENTIALS;
  if (!raw) throw new Error('GOOGLE_CREDENTIALS no configurado');
  credsCache = JSON.parse(raw);
  return credsCache;
}

function getAuth(scopes) {
  const creds = getCreds();
  return new google.auth.JWT(creds.client_email, null, creds.private_key, scopes);
}

function getAdmin() {
  if (adminCache) return adminCache;
  const auth = getAuth(['https://www.googleapis.com/auth/analytics.readonly']);
  adminCache = google.analyticsadmin({ version: 'v1beta', auth });
  return adminCache;
}

function getData() {
  if (dataCache) return dataCache;
  const auth = getAuth(['https://www.googleapis.com/auth/analytics.readonly']);
  dataCache = google.analyticsdata({ version: 'v1beta', auth });
  return dataCache;
}

async function listProperties() {
  const admin = getAdmin();
  const r = await admin.accountSummaries.list({ pageSize: 50 });
  const summaries = r.data.accountSummaries || [];
  const out = [];
  for (const acc of summaries) {
    for (const pr of acc.propertySummaries || []) {
      out.push({
        account_name: acc.displayName,
        account_id: acc.account,
        property_id: pr.property.replace('properties/', ''),
        property_name: pr.displayName,
        property_type: pr.propertyType
      });
    }
  }
  return out;
}

async function resolvePropertyId() {
  if (propertyIdCache) return propertyIdCache;
  if (process.env.GA4_PROPERTY_ID) {
    propertyIdCache = process.env.GA4_PROPERTY_ID;
    return propertyIdCache;
  }
  const props = await listProperties();
  // Matchea por nombre con "patagonica"
  const pat = props.find((p) =>
    (p.property_name || '').toLowerCase().includes('patagonica') ||
    (p.account_name || '').toLowerCase().includes('patagonica')
  );
  if (pat) {
    propertyIdCache = pat.property_id;
    return propertyIdCache;
  }
  if (props.length === 1) {
    propertyIdCache = props[0].property_id;
    return propertyIdCache;
  }
  throw new Error(
    `No se pudo resolver property GA4 de Patagónica automáticamente. ` +
    `Propiedades accesibles: ${JSON.stringify(props.map((p) => p.property_name))}. ` +
    `Configurá GA4_PROPERTY_ID en env.`
  );
}

async function runReport({ date_ranges, dimensions = [], metrics = [], limit = 100, order_by, filter_expression, property_id }) {
  const property = property_id || await resolvePropertyId();
  const data = getData();
  const body = {
    dateRanges: date_ranges || [{ startDate: '28daysAgo', endDate: 'today' }],
    dimensions: dimensions.map((n) => ({ name: n })),
    metrics: metrics.map((n) => ({ name: n })),
    limit
  };
  if (order_by) {
    body.orderBys = Array.isArray(order_by) ? order_by : [order_by];
  }
  if (filter_expression) body.dimensionFilter = filter_expression;
  const r = await data.properties.runReport({ property: `properties/${property}`, requestBody: body });
  return r.data;
}

async function runRealtime({ dimensions = [], metrics = [], limit = 100, property_id }) {
  const property = property_id || await resolvePropertyId();
  const data = getData();
  const r = await data.properties.runRealtimeReport({
    property: `properties/${property}`,
    requestBody: {
      dimensions: dimensions.map((n) => ({ name: n })),
      metrics: metrics.map((n) => ({ name: n })),
      limit
    }
  });
  return r.data;
}

async function topPages({ limit = 20, days = 28, property_id } = {}) {
  return runReport({
    property_id,
    date_ranges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: ['pagePath', 'pageTitle'],
    metrics: ['screenPageViews', 'activeUsers', 'averageSessionDuration', 'bounceRate'],
    limit,
    order_by: { metric: { metricName: 'screenPageViews' }, desc: true }
  });
}

async function trafficSources({ limit = 20, days = 28, property_id } = {}) {
  return runReport({
    property_id,
    date_ranges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: ['sessionSource', 'sessionMedium', 'sessionCampaignName'],
    metrics: ['sessions', 'activeUsers', 'conversions', 'engagementRate'],
    limit,
    order_by: { metric: { metricName: 'sessions' }, desc: true }
  });
}

module.exports = { listProperties, resolvePropertyId, runReport, runRealtime, topPages, trafficSources };
