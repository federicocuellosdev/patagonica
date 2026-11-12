const axios = require('axios');

const BASE = () => `https://${process.env.KOMMO_SUBDOMINIO}.kommo.com/api/v4`;
const H = () => ({ Authorization: `Bearer ${process.env.KOMMO_TOKEN}` });

async function get(path, params = {}) {
  const r = await axios.get(`${BASE()}${path}`, { headers: H(), params });
  return r.data;
}

async function listPipelines() {
  const data = await get('/leads/pipelines');
  return (data._embedded?.pipelines || []).map((p) => ({
    id: p.id,
    name: p.name,
    is_main: p.is_main,
    is_archive: p.is_archive,
    sort: p.sort,
    statuses: (p._embedded?.statuses || []).map((s) => ({
      id: s.id, name: s.name, sort: s.sort, type: s.type, color: s.color
    }))
  }));
}

async function listLeads({ pipeline_id, status_id, query, limit = 50, page = 1 }) {
  const params = { limit: Math.min(limit, 250), page };
  if (pipeline_id) params['filter[pipeline_id]'] = pipeline_id;
  if (status_id) params['filter[statuses][0][status_id]'] = status_id;
  if (query) params.query = query;
  const data = await get('/leads', params);
  const leads = (data._embedded?.leads || []).map((l) => ({
    id: l.id,
    name: l.name,
    pipeline_id: l.pipeline_id,
    status_id: l.status_id,
    price: l.price,
    responsible_user_id: l.responsible_user_id,
    created_at: l.created_at,
    updated_at: l.updated_at,
    closed_at: l.closed_at
  }));
  return { leads, page, total: data._total_items, has_next: !!data._links?.next };
}

async function getLead(id) {
  const [lead, contacts, notes] = await Promise.all([
    get(`/leads/${id}?with=contacts,loss_reason,catalog_elements`),
    get(`/leads/${id}/links`).catch(() => ({ _embedded: { links: [] } })),
    get(`/leads/${id}/notes?limit=50&note_type=common`).catch(() => ({ _embedded: { notes: [] } }))
  ]);
  return {
    lead,
    contact_links: contacts._embedded?.links || [],
    notes: (notes._embedded?.notes || []).map((n) => ({
      id: n.id, created_at: n.created_at, text: n.params?.text
    }))
  };
}

async function listContacts({ query, limit = 50, page = 1 }) {
  const params = { limit: Math.min(limit, 250), page, with: 'leads' };
  if (query) params.query = query;
  const data = await get('/contacts', params);
  return (data._embedded?.contacts || []).map((c) => ({
    id: c.id,
    name: c.name,
    created_at: c.created_at,
    updated_at: c.updated_at,
    leads: (c._embedded?.leads || []).map((l) => l.id),
    phone: (c.custom_fields_values || []).find((f) => f.field_code === 'PHONE')?.values?.[0]?.value,
    email: (c.custom_fields_values || []).find((f) => f.field_code === 'EMAIL')?.values?.[0]?.value
  }));
}

async function listNotes({ lead_id, limit = 50, page = 1 }) {
  const path = lead_id ? `/leads/${lead_id}/notes` : '/leads/notes';
  const data = await get(path, { limit: Math.min(limit, 250), page });
  return (data._embedded?.notes || []).map((n) => ({
    id: n.id,
    entity_id: n.entity_id,
    created_at: n.created_at,
    note_type: n.note_type,
    text: n.params?.text
  }));
}

module.exports = { listPipelines, listLeads, getLead, listContacts, listNotes };
