const axios = require('axios');

const VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const BASE = () => `https://graph.facebook.com/${VERSION}`;
const TOKEN = () => process.env.META_ACCESS_TOKEN;
const ACT_ID = () => {
  const raw = process.env.META_AD_ACCOUNT_ID || '';
  return raw.startsWith('act_') ? raw : `act_${raw}`;
};

async function graph(path, params = {}) {
  const r = await axios.get(`${BASE()}${path}`, {
    params: { access_token: TOKEN(), ...params }
  });
  return r.data;
}

async function listCampaigns({ limit = 25, status } = {}) {
  const params = {
    fields: 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time',
    limit
  };
  if (status) params.effective_status = JSON.stringify(Array.isArray(status) ? status : [status]);
  const data = await graph(`/${ACT_ID()}/campaigns`, params);
  return data.data || [];
}

async function listAdsets({ campaign_id, limit = 25 } = {}) {
  const base = campaign_id ? `/${campaign_id}/adsets` : `/${ACT_ID()}/adsets`;
  const data = await graph(base, {
    fields: 'id,name,status,effective_status,campaign_id,daily_budget,lifetime_budget,optimization_goal,billing_event,targeting,created_time',
    limit
  });
  return data.data || [];
}

async function listAds({ adset_id, campaign_id, limit = 25 } = {}) {
  let base;
  if (adset_id) base = `/${adset_id}/ads`;
  else if (campaign_id) base = `/${campaign_id}/ads`;
  else base = `/${ACT_ID()}/ads`;
  const data = await graph(base, {
    fields: 'id,name,status,effective_status,adset_id,campaign_id,creative{id,name,thumbnail_url,image_url,video_id,body,title,call_to_action_type,object_story_spec},created_time',
    limit
  });
  return data.data || [];
}

async function getInsights({ level = 'campaign', date_preset = 'last_30d', since, until, breakdowns, entity_id, fields } = {}) {
  const target = entity_id || ACT_ID();
  const params = {
    level,
    fields: fields || 'campaign_name,adset_name,ad_name,impressions,reach,clicks,ctr,cpm,cpc,spend,actions,action_values,cost_per_action_type'
  };
  if (since && until) params.time_range = JSON.stringify({ since, until });
  else params.date_preset = date_preset;
  if (breakdowns) params.breakdowns = Array.isArray(breakdowns) ? breakdowns.join(',') : breakdowns;
  const data = await graph(`/${target}/insights`, params);
  return data.data || [];
}

async function getAdCreative({ ad_id, creative_id } = {}) {
  if (creative_id) {
    return graph(`/${creative_id}`, {
      fields: 'id,name,thumbnail_url,image_url,image_hash,video_id,body,title,call_to_action_type,object_story_spec,asset_feed_spec'
    });
  }
  if (!ad_id) throw new Error('Se requiere ad_id o creative_id');
  const ad = await graph(`/${ad_id}`, { fields: 'creative{id,name,thumbnail_url,image_url,image_hash,video_id,body,title,call_to_action_type,object_story_spec,asset_feed_spec}' });
  return ad.creative || null;
}

// Cache del page access token (una vez por proceso; Meta no lo rota solo).
let pageTokenCache = null;
async function getPageAccessToken() {
  if (pageTokenCache) return pageTokenCache;
  const pid = process.env.META_PAGE_ID;
  if (!pid) throw new Error('META_PAGE_ID no configurado');
  const page = await graph(`/${pid}`, { fields: 'access_token' });
  if (!page.access_token) throw new Error('No se pudo obtener page access token');
  pageTokenCache = page.access_token;
  return pageTokenCache;
}

async function getVideo({ video_id }) {
  // El campo `source` (URL del MP4) solo lo devuelve Meta cuando el request va con
  // page access token, no con el user/system token. Hacemos el swap transparente.
  const pageToken = await getPageAccessToken();
  const r = await axios.get(`${BASE()}/${video_id}`, {
    params: {
      access_token: pageToken,
      fields: 'id,title,description,source,picture,permalink_url,length,created_time,embed_html,status,thumbnails{uri}'
    }
  });
  return r.data;
}

async function listAdVideos({ limit = 25 } = {}) {
  // /act_id/advideos devuelve videos subidos al ad account con sus URLs de descarga.
  // Útil para inventario visual rápido sin tener que pasar por cada ad.
  const data = await graph(`/${ACT_ID()}/advideos`, {
    fields: 'id,title,source,picture,permalink_url,length,created_time',
    limit
  });
  return data.data || [];
}

async function listForms({ page_id, limit = 25 } = {}) {
  const pid = page_id || process.env.META_PAGE_ID;
  if (!pid) throw new Error('Se requiere page_id o META_PAGE_ID en env');
  // Necesita page access token, no user token — se obtiene primero
  const page = await graph(`/${pid}`, { fields: 'access_token' });
  const r = await axios.get(`${BASE()}/${pid}/leadgen_forms`, {
    params: { access_token: page.access_token, fields: 'id,name,status,created_time,leads_count,questions', limit }
  });
  return r.data.data || [];
}

module.exports = { listCampaigns, listAdsets, listAds, getInsights, getAdCreative, getVideo, listAdVideos, listForms };
