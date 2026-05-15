const axios = require('axios');
const fs = require('fs');
const path = require('path');

const META_API_VERSION = 'v22.0';
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;
const KOMMO_BASE = `https://${process.env.KOMMO_SUBDOMINIO}.kommo.com/api/v4`;

const STAGE_DERIVADO = 103741151;
const TAG_DERIVADO = 'Derivado';

const cacheDir = path.join(__dirname, '..', 'data', 'cache');
fs.mkdirSync(cacheDir, { recursive: true });

const META_FILE = path.join(cacheDir, 'meta-daily.json');
const ADSETS_FILE = path.join(cacheDir, 'meta-adsets-daily.json');
const ADS_FILE = path.join(cacheDir, 'meta-ads-daily.json');
const ADS_META_FILE = path.join(cacheDir, 'meta-ads-meta.json');
const KOMMO_FILE = path.join(cacheDir, 'kommo-leads.json');

const DEFAULT_SYNC_START = process.env.REPORTES_SYNC_START || '2024-01-01';

// ---------- IO ----------
function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------- Date helpers ----------
function pad(n) { return String(n).padStart(2, '0'); }
function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}
function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}

// ---------- Meta sync ----------
function actionValue(actions, type) {
  if (!Array.isArray(actions)) return 0;
  const a = actions.find((x) => x.action_type === type);
  return a ? Number(a.value) || 0 : 0;
}
function sumActions(actions, types) {
  if (!Array.isArray(actions)) return 0;
  return actions
    .filter((a) => types.includes(a.action_type))
    .reduce((sum, a) => sum + (Number(a.value) || 0), 0);
}
function thruplayValue(field) {
  if (!Array.isArray(field) || field.length === 0) return 0;
  return field.reduce((sum, x) => sum + (Number(x.value) || 0), 0);
}

async function fetchMetaDailyRange({ since, until }) {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) throw new Error('Meta credentials missing');

  const fields = [
    'date_start',
    'date_stop',
    'campaign_id',
    'campaign_name',
    'objective',
    'spend',
    'reach',
    'impressions',
    'frequency',
    'clicks',
    'ctr',
    'cpm',
    'actions',
    'video_thruplay_watched_actions',
  ].join(',');

  const out = [];
  let url = `${META_BASE}/act_${accountId}/insights`;
  let params = {
    level: 'campaign',
    fields,
    time_increment: 1,
    time_range: JSON.stringify({ since, until }),
    limit: 500,
    access_token: token,
  };

  while (url) {
    const resp = await axios.get(url, { params });
    const rows = resp.data?.data || [];
    for (const r of rows) {
      const spend = Number(r.spend) || 0;
      // Solo `lead` — el resto (onsite_conversion.lead_grouped,
      // offsite_complete_registration_add_meta_leads, etc.) son distintas
      // atribuciones del MISMO evento. Sumar dobla el conteo.
      const leads = actionValue(r.actions, 'lead');
      out.push({
        date: r.date_start,
        campaign_id: r.campaign_id,
        campaign_name: r.campaign_name,
        objective: r.objective,
        spend,
        reach: Number(r.reach) || 0,
        impressions: Number(r.impressions) || 0,
        frequency: Number(r.frequency) || 0,
        clicks: Number(r.clicks) || 0,
        ctr: Number(r.ctr) || 0,
        cpm: Number(r.cpm) || 0,
        leads,
        landing_page_views: actionValue(r.actions, 'landing_page_view'),
        link_clicks: actionValue(r.actions, 'link_click'),
        thruplays: thruplayValue(r.video_thruplay_watched_actions),
      });
    }
    const next = resp.data?.paging?.next;
    if (next) {
      url = next;
      params = undefined; // Meta embeds params in next URL
    } else {
      url = null;
    }
  }

  return out;
}

async function syncMetaDaily({ force = false } = {}) {
  const store = readJson(META_FILE, { last_synced_at: null, earliest: null, latest: null, days: [] });
  const target = yesterdayISO();

  let since;
  if (force || !store.latest) {
    since = DEFAULT_SYNC_START;
    store.days = [];
    store.earliest = null;
    store.latest = null;
  } else {
    since = addDays(store.latest, 1);
    if (since > target) {
      return { ...store, fetched: 0, range: null };
    }
  }

  const rows = await fetchMetaDailyRange({ since, until: target });

  if (rows.length > 0) {
    if (force) {
      store.days = rows;
    } else {
      const seen = new Set(store.days.map((d) => `${d.date}__${d.campaign_id}`));
      for (const r of rows) {
        const key = `${r.date}__${r.campaign_id}`;
        if (!seen.has(key)) store.days.push(r);
      }
    }
    store.days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    store.earliest = store.days[0]?.date || null;
    store.latest = store.days[store.days.length - 1]?.date || null;
  }
  store.last_synced_at = new Date().toISOString();

  writeJson(META_FILE, store);
  return { ...store, fetched: rows.length, range: { since, until: target } };
}

// ---------- Meta Adsets sync (level=adset) ----------
async function fetchMetaAdsetDailyRange({ since, until }) {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) throw new Error('Meta credentials missing');

  const fields = [
    'date_start',
    'date_stop',
    'campaign_id',
    'campaign_name',
    'adset_id',
    'adset_name',
    'objective',
    'spend',
    'reach',
    'impressions',
    'frequency',
    'clicks',
    'ctr',
    'cpm',
    'actions',
  ].join(',');

  const out = [];
  let url = `${META_BASE}/act_${accountId}/insights`;
  let params = {
    level: 'adset',
    fields,
    time_increment: 1,
    time_range: JSON.stringify({ since, until }),
    limit: 500,
    access_token: token,
  };

  while (url) {
    const resp = await axios.get(url, { params });
    const rows = resp.data?.data || [];
    for (const r of rows) {
      const spend = Number(r.spend) || 0;
      const leads = actionValue(r.actions, 'lead');
      out.push({
        date: r.date_start,
        campaign_id: r.campaign_id,
        campaign_name: r.campaign_name,
        adset_id: r.adset_id,
        adset_name: r.adset_name,
        objective: r.objective,
        spend,
        reach: Number(r.reach) || 0,
        impressions: Number(r.impressions) || 0,
        clicks: Number(r.clicks) || 0,
        ctr: Number(r.ctr) || 0,
        cpm: Number(r.cpm) || 0,
        leads,
        landing_page_views: actionValue(r.actions, 'landing_page_view'),
        link_clicks: actionValue(r.actions, 'link_click'),
      });
    }
    const next = resp.data?.paging?.next;
    if (next) { url = next; params = undefined; } else { url = null; }
  }

  return out;
}

async function syncMetaAdsetDaily({ force = false } = {}) {
  const store = readJson(ADSETS_FILE, { last_synced_at: null, earliest: null, latest: null, days: [] });
  const target = yesterdayISO();

  let since;
  if (force || !store.latest) {
    since = DEFAULT_SYNC_START;
    store.days = [];
    store.earliest = null;
    store.latest = null;
  } else {
    since = addDays(store.latest, 1);
    if (since > target) return { ...store, fetched: 0, range: null };
  }

  const rows = await fetchMetaAdsetDailyRange({ since, until: target });

  if (rows.length > 0) {
    if (force) {
      store.days = rows;
    } else {
      const seen = new Set(store.days.map((d) => `${d.date}__${d.adset_id}`));
      for (const r of rows) {
        const key = `${r.date}__${r.adset_id}`;
        if (!seen.has(key)) store.days.push(r);
      }
    }
    store.days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    store.earliest = store.days[0]?.date || null;
    store.latest = store.days[store.days.length - 1]?.date || null;
  }
  store.last_synced_at = new Date().toISOString();

  writeJson(ADSETS_FILE, store);
  return { ...store, fetched: rows.length, range: { since, until: target } };
}

function aggregateMetaAdsets({ desde, hasta }) {
  const store = readJson(ADSETS_FILE, { days: [] });
  const filtered = store.days.filter((d) => d.date >= desde && d.date <= hasta);

  const byAdset = new Map();
  const dailyByAdset = new Map();
  for (const d of filtered) {
    const key = d.adset_id;
    if (!byAdset.has(key)) {
      byAdset.set(key, {
        adset_id: d.adset_id,
        adset_name: d.adset_name,
        campaign_id: d.campaign_id,
        campaign_name: d.campaign_name,
        objective: d.objective,
        spend: 0, reach: 0, impressions: 0, clicks: 0, leads: 0,
        landing_page_views: 0, link_clicks: 0,
      });
      dailyByAdset.set(key, new Map());
    }
    const a = byAdset.get(key);
    a.spend += d.spend;
    a.impressions += d.impressions;
    a.clicks += d.clicks;
    a.leads += d.leads;
    a.landing_page_views += d.landing_page_views;
    a.link_clicks += d.link_clicks;
    a.reach += d.reach;

    const da = dailyByAdset.get(key);
    if (!da.has(d.date)) da.set(d.date, { date: d.date, spend: 0, leads: 0, landing_page_views: 0 });
    const aDay = da.get(d.date);
    aDay.spend += d.spend;
    aDay.leads += d.leads;
    aDay.landing_page_views += d.landing_page_views;
  }

  return Array.from(byAdset.values()).map((a) => ({
    ...a,
    daily: Array.from(dailyByAdset.get(a.adset_id).values()).sort((x, y) => (x.date < y.date ? -1 : 1)),
    ctr: a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0,
    cpm: a.impressions > 0 ? (a.spend / a.impressions) * 1000 : 0,
    frequency: a.reach > 0 ? a.impressions / a.reach : 0,
    cost_per_lead: a.leads > 0 ? a.spend / a.leads : null,
    cost_per_landing_page_view: a.landing_page_views > 0 ? a.spend / a.landing_page_views : null,
  }));
}

// ---------- Meta Ads sync (level=ad) ----------
async function fetchMetaAdDailyRange({ since, until }) {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) throw new Error('Meta credentials missing');

  const fields = [
    'date_start','date_stop',
    'campaign_id','campaign_name',
    'adset_id','adset_name',
    'ad_id','ad_name',
    'spend','impressions','clicks','actions',
  ].join(',');

  const out = [];
  let url = `${META_BASE}/act_${accountId}/insights`;
  let params = {
    level: 'ad', fields, time_increment: 1,
    time_range: JSON.stringify({ since, until }),
    limit: 500, access_token: token,
  };
  while (url) {
    const resp = await axios.get(url, { params });
    const rows = resp.data?.data || [];
    for (const r of rows) {
      out.push({
        date: r.date_start,
        campaign_id: r.campaign_id, campaign_name: r.campaign_name,
        adset_id: r.adset_id, adset_name: r.adset_name,
        ad_id: r.ad_id, ad_name: r.ad_name,
        spend: Number(r.spend) || 0,
        impressions: Number(r.impressions) || 0,
        clicks: Number(r.clicks) || 0,
        leads: actionValue(r.actions, 'lead'),
        landing_page_views: actionValue(r.actions, 'landing_page_view'),
      });
    }
    const next = resp.data?.paging?.next;
    if (next) { url = next; params = undefined; } else { url = null; }
  }
  return out;
}

async function syncMetaAdDaily({ force = false } = {}) {
  const store = readJson(ADS_FILE, { last_synced_at: null, earliest: null, latest: null, days: [] });
  const target = yesterdayISO();
  let since;
  if (force || !store.latest) {
    since = DEFAULT_SYNC_START;
    store.days = []; store.earliest = null; store.latest = null;
  } else {
    since = addDays(store.latest, 1);
    if (since > target) return { ...store, fetched: 0, range: null };
  }
  const rows = await fetchMetaAdDailyRange({ since, until: target });
  if (rows.length > 0) {
    if (force) {
      store.days = rows;
    } else {
      const seen = new Set(store.days.map((d) => `${d.date}__${d.ad_id}`));
      for (const r of rows) {
        const key = `${r.date}__${r.ad_id}`;
        if (!seen.has(key)) store.days.push(r);
      }
    }
    store.days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    store.earliest = store.days[0]?.date || null;
    store.latest = store.days[store.days.length - 1]?.date || null;
  }
  store.last_synced_at = new Date().toISOString();
  writeJson(ADS_FILE, store);
  return { ...store, fetched: rows.length, range: { since, until: target } };
}

// Metadata de ads (nombre, fecha de creacion, estado). Refresh max cada 6h.
async function syncMetaAdsMetadata({ force = false } = {}) {
  const store = readJson(ADS_META_FILE, { last_synced_at: null, ads: [] });
  if (!force && store.last_synced_at) {
    const age = Date.now() - new Date(store.last_synced_at).getTime();
    if (age < 6 * 60 * 60 * 1000) return { ...store, fetched: 0, skipped: true };
  }
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  const url = `${META_BASE}/act_${accountId}/ads`;
  let params = {
    fields: 'id,name,created_time,effective_status,status',
    limit: 500, access_token: token,
  };
  let next = url;
  const ads = [];
  while (next) {
    const r = await axios.get(next, { params });
    ads.push(...(r.data?.data || []));
    next = r.data?.paging?.next || null;
    params = undefined;
  }
  store.ads = ads;
  store.last_synced_at = new Date().toISOString();
  writeJson(ADS_META_FILE, store);
  return { ...store, fetched: ads.length };
}

function aggregateMetaAds({ desde, hasta }) {
  const store = readJson(ADS_FILE, { days: [] });
  const metaStore = readJson(ADS_META_FILE, { ads: [] });
  const metaById = new Map(metaStore.ads.map((m) => [m.id, m]));

  const filtered = store.days.filter((d) => d.date >= desde && d.date <= hasta);
  const byAd = new Map();
  const dailyByAd = new Map();
  for (const d of filtered) {
    const key = d.ad_id;
    if (!byAd.has(key)) {
      byAd.set(key, {
        ad_id: d.ad_id, ad_name: d.ad_name,
        adset_id: d.adset_id, adset_name: d.adset_name,
        campaign_id: d.campaign_id, campaign_name: d.campaign_name,
        spend: 0, impressions: 0, clicks: 0, leads: 0, landing_page_views: 0,
      });
      dailyByAd.set(key, new Map());
    }
    const a = byAd.get(key);
    a.spend += d.spend;
    a.impressions += d.impressions;
    a.clicks += d.clicks;
    a.leads += d.leads;
    a.landing_page_views += d.landing_page_views;

    const dm = dailyByAd.get(key);
    if (!dm.has(d.date)) dm.set(d.date, { date: d.date, spend: 0, leads: 0 });
    const dx = dm.get(d.date);
    dx.spend += d.spend;
    dx.leads += d.leads;
  }
  return Array.from(byAd.values()).map((a) => {
    const m = metaById.get(a.ad_id) || {};
    return {
      ...a,
      created_time: m.created_time || null,
      effective_status: m.effective_status || null,
      status: m.status || null,
      ctr: a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0,
      cost_per_lead: a.leads > 0 ? a.spend / a.leads : null,
      daily: Array.from(dailyByAd.get(a.ad_id).values()).sort((x, y) => (x.date < y.date ? -1 : 1)),
    };
  });
}

// ---------- Kommo sync ----------
function kommoHeaders() {
  return { Authorization: `Bearer ${process.env.KOMMO_TOKEN}` };
}

async function fetchKommoLeadsRange({ fromUnix, toUnix }) {
  const out = [];
  let page = 1;
  const limit = 250;
  while (true) {
    const params = {
      'filter[created_at][from]': fromUnix,
      'filter[created_at][to]': toUnix,
      with: 'contacts',
      limit,
      page,
    };
    let resp;
    try {
      resp = await axios.get(`${KOMMO_BASE}/leads`, { headers: kommoHeaders(), params });
    } catch (err) {
      if (err.response && err.response.status === 204) break;
      throw err;
    }
    const leads = resp.data?._embedded?.leads || [];
    if (leads.length === 0) break;
    for (const lead of leads) {
      const tags = lead._embedded?.tags?.map((t) => t.name) || [];
      out.push({
        id: lead.id,
        name: lead.name,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        status_id: lead.status_id,
        pipeline_id: lead.pipeline_id,
        tags,
      });
    }
    if (leads.length < limit) break;
    page += 1;
    if (page > 200) break;
  }
  return out;
}

async function syncKommoLeads({ force = false } = {}) {
  const store = readJson(KOMMO_FILE, { last_synced_at: null, earliest: null, latest: null, leads: [] });

  const todayUnix = Math.floor(Date.now() / 1000);
  let fromUnix;

  if (force || !store.latest) {
    const startSec = Math.floor(new Date(DEFAULT_SYNC_START + 'T00:00:00-03:00').getTime() / 1000);
    fromUnix = startSec;
    store.leads = [];
    store.earliest = null;
    store.latest = null;
  } else {
    fromUnix = store.latest + 1;
    if (fromUnix >= todayUnix) {
      return { ...store, fetched: 0, range: null };
    }
  }

  const fetched = await fetchKommoLeadsRange({ fromUnix, toUnix: todayUnix });

  if (fetched.length > 0) {
    if (force) {
      store.leads = fetched;
    } else {
      const seen = new Set(store.leads.map((l) => l.id));
      for (const l of fetched) {
        if (!seen.has(l.id)) store.leads.push(l);
      }
    }
    store.leads.sort((a, b) => a.created_at - b.created_at);
    store.earliest = store.leads[0]?.created_at || null;
    store.latest = store.leads[store.leads.length - 1]?.created_at || null;
  }
  store.last_synced_at = new Date().toISOString();

  writeJson(KOMMO_FILE, store);
  return { ...store, fetched: fetched.length, range: { fromUnix, toUnix: todayUnix } };
}

// ---------- Aggregation from local store ----------
function aggregateMeta({ desde, hasta }) {
  const store = readJson(META_FILE, { days: [] });
  const filtered = store.days.filter((d) => d.date >= desde && d.date <= hasta);

  const byCampaign = new Map();
  const byDate = new Map();
  const dailyByCampaign = new Map(); // campaign_id -> Map(date -> row)
  for (const d of filtered) {
    const key = d.campaign_id;
    if (!byCampaign.has(key)) {
      byCampaign.set(key, {
        campaign_id: d.campaign_id,
        campaign_name: d.campaign_name,
        objective: d.objective,
        spend: 0, reach: 0, impressions: 0, clicks: 0, leads: 0,
        landing_page_views: 0, link_clicks: 0, thruplays: 0,
      });
      dailyByCampaign.set(key, new Map());
    }
    const c = byCampaign.get(key);
    c.spend += d.spend;
    c.impressions += d.impressions;
    c.clicks += d.clicks;
    c.leads += d.leads;
    c.landing_page_views += d.landing_page_views;
    c.link_clicks += d.link_clicks;
    c.thruplays += d.thruplays;
    // reach no es perfectamente aditivo entre días (puede haber overlap de usuarios),
    // pero la suma diaria es la convención típica en dashboards y comparativa entre períodos.
    c.reach += d.reach;

    // Daily per campaign (para popup con chart por entidad)
    const dc = dailyByCampaign.get(key);
    if (!dc.has(d.date)) dc.set(d.date, { date: d.date, spend: 0, leads: 0, landing_page_views: 0, thruplays: 0 });
    const cDay = dc.get(d.date);
    cDay.spend += d.spend;
    cDay.leads += d.leads;
    cDay.landing_page_views += d.landing_page_views;
    cDay.thruplays += d.thruplays;

    // Daily totals
    if (!byDate.has(d.date)) {
      byDate.set(d.date, { date: d.date, spend: 0, leads: 0, landing_page_views: 0, thruplays: 0, reach: 0, impressions: 0 });
    }
    const dayRow = byDate.get(d.date);
    dayRow.spend += d.spend;
    dayRow.leads += d.leads;
    dayRow.landing_page_views += d.landing_page_views;
    dayRow.thruplays += d.thruplays;
    dayRow.reach += d.reach;
    dayRow.impressions += d.impressions;
  }

  const campaigns = Array.from(byCampaign.values()).map((c) => ({
    ...c,
    daily: Array.from(dailyByCampaign.get(c.campaign_id).values()).sort((a, b) => (a.date < b.date ? -1 : 1)),
    ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
    frequency: c.reach > 0 ? c.impressions / c.reach : 0,
    cost_per_lead: c.leads > 0 ? c.spend / c.leads : null,
    cost_per_landing_page_view: c.landing_page_views > 0 ? c.spend / c.landing_page_views : null,
    cost_per_thruplay: c.thruplays > 0 ? c.spend / c.thruplays : null,
  }));

  const totals = campaigns.reduce(
    (acc, c) => {
      acc.spend += c.spend;
      acc.reach += c.reach;
      acc.impressions += c.impressions;
      acc.clicks += c.clicks;
      acc.leads += c.leads;
      acc.landing_page_views += c.landing_page_views;
      acc.link_clicks += c.link_clicks;
      acc.thruplays += c.thruplays;
      return acc;
    },
    { spend: 0, reach: 0, impressions: 0, clicks: 0, leads: 0, landing_page_views: 0, link_clicks: 0, thruplays: 0 }
  );
  totals.cost_per_lead = totals.leads > 0 ? totals.spend / totals.leads : null;
  totals.cost_per_landing_page_view = totals.landing_page_views > 0 ? totals.spend / totals.landing_page_views : null;
  totals.cost_per_thruplay = totals.thruplays > 0 ? totals.spend / totals.thruplays : null;

  const daily = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    campaigns,
    totals,
    daily,
    store_meta: {
      earliest: store.earliest,
      latest: store.latest,
      last_synced_at: store.last_synced_at,
      total_days_stored: store.days.length,
    },
  };
}

function getFormGroupName(tags) {
  // Tag explicito 'FORM - *' tiene prioridad
  const formTag = tags.find((t) => t.startsWith('FORM - '));
  if (formTag) return formTag;
  // Forms sin prefijo
  if (tags.includes('Remarketing') && tags.includes('Emprendimientos')) return 'Remarketing - Emprendimientos';
  if (tags.includes('Emprendimientos')) return 'Emprendimientos';
  return null;
}

function aggregateKommo({ desde, hasta }) {
  const store = readJson(KOMMO_FILE, { leads: [] });
  const fromUnix = Math.floor(new Date(desde + 'T00:00:00-03:00').getTime() / 1000);
  const toUnix = Math.floor(new Date(hasta + 'T23:59:59-03:00').getTime() / 1000);

  const filtered = store.leads.filter((l) => l.created_at >= fromUnix && l.created_at <= toUnix);
  const created = filtered.length;
  const derived = filtered.filter((l) => l.tags.includes(TAG_DERIVADO) || l.status_id === STAGE_DERIVADO).length;

  const byDate = new Map();
  // Breakdown por grupo de anuncios (FORM tag) — solo leads de Meta Ads
  const formGroups = new Map();
  const formsDailyMap = new Map(); // form_name -> Map(date -> {date, leads, derived})
  let withNqRn = 0;
  let withoutNqRn = 0;

  for (const l of filtered) {
    const isDerived = l.tags.includes(TAG_DERIVADO) || l.status_id === STAGE_DERIVADO;
    const date = new Date(l.created_at * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    if (!byDate.has(date)) byDate.set(date, { date, created: 0, derived: 0 });
    const row = byDate.get(date);
    row.created += 1;
    if (isDerived) row.derived += 1;

    // Form breakdown
    if (!l.tags.includes('Meta Ads')) continue;
    const formName = getFormGroupName(l.tags);
    if (!formName) continue;
    const hasNqRn = l.tags.includes('NQ & RN');
    if (hasNqRn) withNqRn += 1; else withoutNqRn += 1;

    if (!formGroups.has(formName)) {
      formGroups.set(formName, { form_name: formName, leads: 0, with_nq_rn: 0, without_nq_rn: 0, derived: 0 });
      formsDailyMap.set(formName, new Map());
    }
    const f = formGroups.get(formName);
    f.leads += 1;
    if (hasNqRn) f.with_nq_rn += 1; else f.without_nq_rn += 1;
    if (isDerived) f.derived += 1;

    const fdaily = formsDailyMap.get(formName);
    if (!fdaily.has(date)) fdaily.set(date, { date, leads: 0, derived: 0 });
    const fday = fdaily.get(date);
    fday.leads += 1;
    if (isDerived) fday.derived += 1;
  }

  const daily = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
  const forms_breakdown = Array.from(formGroups.values())
    .map((f) => ({
      ...f,
      daily: Array.from((formsDailyMap.get(f.form_name) || new Map()).values()).sort((a, b) => (a.date < b.date ? -1 : 1)),
    }))
    .sort((a, b) => b.leads - a.leads);

  return {
    created,
    derived,
    daily,
    forms_breakdown,
    forms_totals: { with_nq_rn: withNqRn, without_nq_rn: withoutNqRn, total: withNqRn + withoutNqRn },
    store_meta: {
      total_leads_stored: store.leads.length,
      last_synced_at: store.last_synced_at,
      earliest_unix: store.earliest,
      latest_unix: store.latest,
    },
  };
}

// ---------- Top-level ----------
async function ensureSynced({ force = false }) {
  const [meta, adsets, ads, adsMeta, kommo] = await Promise.all([
    syncMetaDaily({ force }),
    syncMetaAdsetDaily({ force }).catch((e) => ({ error: e.message })),
    syncMetaAdDaily({ force }).catch((e) => ({ error: e.message })),
    syncMetaAdsMetadata({ force }).catch((e) => ({ error: e.message })),
    syncKommoLeads({ force }).catch((e) => ({ error: e.message })),
  ]);
  return { meta_sync: meta, adsets_sync: adsets, ads_sync: ads, ads_meta_sync: adsMeta, kommo_sync: kommo };
}

function buildReport({ desde, hasta }) {
  const meta = aggregateMeta({ desde, hasta });
  meta.adsets = aggregateMetaAdsets({ desde, hasta });
  meta.ads = aggregateMetaAds({ desde, hasta });
  const kommo = aggregateKommo({ desde, hasta });

  const cost_per_kommo_lead = kommo.created > 0 ? meta.totals.spend / kommo.created : null;
  const cost_per_derived = kommo.derived > 0 ? meta.totals.spend / kommo.derived : null;

  // Previous period (mismo largo, inmediatamente anterior)
  const startMs = new Date(desde + 'T12:00:00Z').getTime();
  const endMs = new Date(hasta + 'T12:00:00Z').getTime();
  const dayMs = 86400000;
  const lengthDays = Math.round((endMs - startMs) / dayMs) + 1;
  const prevHasta = isoDate(new Date(startMs - dayMs));
  const prevDesde = isoDate(new Date(startMs - dayMs * lengthDays));

  const prevMeta = aggregateMeta({ desde: prevDesde, hasta: prevHasta });
  const prevKommo = aggregateKommo({ desde: prevDesde, hasta: prevHasta });
  const prevCostPerKommo = prevKommo.created > 0 ? prevMeta.totals.spend / prevKommo.created : null;
  const prevCostPerDerived = prevKommo.derived > 0 ? prevMeta.totals.spend / prevKommo.derived : null;

  return {
    desde,
    hasta,
    meta,
    kommo,
    derived: { cost_per_kommo_lead, cost_per_derived },
    previous: {
      desde: prevDesde,
      hasta: prevHasta,
      meta: { totals: prevMeta.totals },
      kommo: { created: prevKommo.created, derived: prevKommo.derived },
      derived: { cost_per_kommo_lead: prevCostPerKommo, cost_per_derived: prevCostPerDerived },
    },
  };
}

function clearCache() {
  if (fs.existsSync(META_FILE)) fs.unlinkSync(META_FILE);
  if (fs.existsSync(ADSETS_FILE)) fs.unlinkSync(ADSETS_FILE);
  if (fs.existsSync(ADS_FILE)) fs.unlinkSync(ADS_FILE);
  if (fs.existsSync(ADS_META_FILE)) fs.unlinkSync(ADS_META_FILE);
  if (fs.existsSync(KOMMO_FILE)) fs.unlinkSync(KOMMO_FILE);
}

module.exports = {
  ensureSynced,
  buildReport,
  clearCache,
  syncMetaDaily,
  syncMetaAdsetDaily,
  syncKommoLeads,
};
