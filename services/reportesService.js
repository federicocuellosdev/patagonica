const axios = require('axios');

const META_API_VERSION = 'v22.0';
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

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

async function fetchMetaInsights({ desde, hasta }) {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) throw new Error('Meta credentials missing');

  const fields = [
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

  const url = `${META_BASE}/act_${accountId}/insights`;
  const params = {
    level: 'campaign',
    fields,
    time_range: JSON.stringify({ since: desde, until: hasta }),
    limit: 500,
    access_token: token,
  };

  const { data } = await axios.get(url, { params });
  const rows = data.data || [];

  const campaigns = rows.map((r) => {
    const spend = Number(r.spend) || 0;
    const reach = Number(r.reach) || 0;
    const impressions = Number(r.impressions) || 0;
    const clicks = Number(r.clicks) || 0;
    const leads = sumActions(r.actions, ['lead', 'onsite_conversion.lead_grouped']);
    const landingPageViews = actionValue(r.actions, 'landing_page_view');
    const linkClicks = actionValue(r.actions, 'link_click');
    const thruplays = thruplayValue(r.video_thruplay_watched_actions);

    return {
      campaign_id: r.campaign_id,
      campaign_name: r.campaign_name,
      objective: r.objective,
      spend,
      reach,
      impressions,
      clicks,
      ctr: Number(r.ctr) || 0,
      cpm: Number(r.cpm) || 0,
      frequency: Number(r.frequency) || 0,
      leads,
      cost_per_lead: leads > 0 ? spend / leads : null,
      landing_page_views: landingPageViews,
      link_clicks: linkClicks,
      cost_per_landing_page_view: landingPageViews > 0 ? spend / landingPageViews : null,
      thruplays,
      cost_per_thruplay: thruplays > 0 ? spend / thruplays : null,
    };
  });

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

  return { campaigns, totals };
}

const KOMMO_BASE = `https://${process.env.KOMMO_SUBDOMINIO}.kommo.com/api/v4`;
const STAGE_DERIVADO = 103741151;
const TAG_DERIVADO = 'Derivado';

function kommoHeaders() {
  return { Authorization: `Bearer ${process.env.KOMMO_TOKEN}` };
}

function toUnixSeconds(dateStr, endOfDay = false) {
  const d = new Date(dateStr + (endOfDay ? 'T23:59:59-03:00' : 'T00:00:00-03:00'));
  return Math.floor(d.getTime() / 1000);
}

async function fetchKommoLeads({ desde, hasta }) {
  if (!process.env.KOMMO_TOKEN || !process.env.KOMMO_SUBDOMINIO) {
    throw new Error('Kommo credentials missing');
  }

  const from = toUnixSeconds(desde);
  const to = toUnixSeconds(hasta, true);

  let totalCreated = 0;
  let totalDerived = 0;
  let page = 1;
  const limit = 250;

  while (true) {
    const params = {
      'filter[created_at][from]': from,
      'filter[created_at][to]': to,
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

    totalCreated += leads.length;

    for (const lead of leads) {
      const tags = lead._embedded?.tags?.map((t) => t.name) || [];
      const isDerived = tags.includes(TAG_DERIVADO) || lead.status_id === STAGE_DERIVADO;
      if (isDerived) totalDerived += 1;
    }

    if (leads.length < limit) break;
    page += 1;
    if (page > 40) break;
  }

  return { created: totalCreated, derived: totalDerived };
}

async function buildDashboardReport({ desde, hasta }) {
  const [meta, kommo] = await Promise.all([
    fetchMetaInsights({ desde, hasta }),
    fetchKommoLeads({ desde, hasta }).catch((err) => ({ error: err.message, created: null, derived: null })),
  ]);

  const cost_per_kommo_lead =
    kommo.created && kommo.created > 0 ? meta.totals.spend / kommo.created : null;
  const cost_per_derived =
    kommo.derived && kommo.derived > 0 ? meta.totals.spend / kommo.derived : null;

  return {
    desde,
    hasta,
    meta,
    kommo,
    derived: {
      cost_per_kommo_lead,
      cost_per_derived,
    },
  };
}

module.exports = { buildDashboardReport, fetchMetaInsights, fetchKommoLeads };
