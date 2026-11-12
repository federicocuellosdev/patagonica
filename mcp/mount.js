// Monta el MCP en Express bajo /mcp con Streamable HTTP transport (modo stateless).
// Patrón stateless: cada request crea una instancia nueva de McpServer + Transport,
// procesa el request, cierra. Sin manejo de sesiones.
const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

const kommoTools = require('./tools/kommo');
const metaTools = require('./tools/meta');
const tokkoTools = require('./tools/tokko');
const ga4Tools = require('./tools/ga4');

const SERVER_INFO = {
  name: 'patagonica-mcp',
  version: '1.0.0'
};

const INSTRUCTIONS = `MCP de Patagónica Propiedades. Fuentes conectadas: Meta Ads, Google Analytics 4,
Kommo CRM y Tokko Broker. Objetivo: analizar rendimiento de campañas y creatividades
para orientar decisiones de marketing y proceso creativo.

CÓMO OPERAR
- Para evaluar campañas: empezar por meta_list_campaigns (filtrar ACTIVE) y luego
  meta_get_insights a nivel ad con date_preset last_30d. Ordenar por CTR, spend o
  cost_per_action_type.
- Para análisis de piezas visuales: meta_get_ad_creative devuelve thumbnail_url y
  video_id. Para la URL descargable del MP4, meta_get_video (ya usa page token).
  meta_list_ad_videos trae el inventario completo del ad account.
- Para medir conversión real: cruzar con kommo_list_leads filtrando pipeline/status.
  Patagónica usa el pipeline "Venta" (13448423) y el embudo "Agente AI" (14708923).
- Para tráfico del sitio: ga4_run_report con dimensión sessionCampaignName cruza con
  las campañas Meta.
- Las URLs de fotos Tokko y videos Meta son fetcheables directamente por el cliente.

LÍMITES
- Meta Marketing API: tier Standard, 9000 pts/hora, 100 QPS mutaciones, 4 cambios
  de presupuesto por hora.
- Kommo: 7 req/seg. Paginar siempre con limit + page.
- GA4 Data API: 10 QPS por propiedad.
- Tokko: sin límite documentado, mantener caudal razonable.

NO HACER
- No sugerir cambios de presupuesto o pausa de campañas sin advertir el riesgo:
  la cuenta publicitaria de Patagónica ya tuvo bloqueos previos.
- No violar la política de Housing / Special Ad Category: Patagónica anuncia
  inmuebles y cae en esa categoría. Antes de proponer targeting por edad, género,
  código postal o intereses demográficos, advertir que puede disparar sanciones.
- No proponer scraping masivo ni loops sin paginación.
- No borrar leads o contactos de Kommo (no está expuesto en tools, pero no sugerirlo
  como workaround).

CONTEXTO DE NEGOCIO
- Patagónica Propiedades: inmobiliaria en Villa La Angostura (Patagonia, Argentina).
- Moneda publicitaria: USD. Mercado local: AR.
- Producto: propiedades únicas + emprendimientos (desarrollos en pozo).
- El sitio público es l.patagonicapropiedades.com.ar.
`;

function buildServer() {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS });
  kommoTools.register(server);
  metaTools.register(server);
  tokkoTools.register(server);
  ga4Tools.register(server);
  return server;
}

function bearerAuth(req, res, next) {
  const expected = process.env.MCP_API_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: 'MCP_API_TOKEN no configurado en el servidor' });
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function mountMcp(app) {
  const router = express.Router();

  // Endpoint info/health del MCP (público, sin auth)
  router.get('/info', (req, res) => {
    res.json({
      ...SERVER_INFO,
      tools_count: 'runtime',
      transport: 'streamable-http',
      auth: 'Bearer MCP_API_TOKEN'
    });
  });

  // Endpoint MCP: todos los métodos pasan por aquí.
  // El SDK maneja POST (RPC), GET (SSE stream), DELETE (close).
  const mcpHandler = async (req, res) => {
    try {
      const server = buildServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined // stateless
      });
      res.on('close', () => {
        transport.close().catch(() => {});
        server.close().catch(() => {});
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      console.error('[mcp] handler error:', e.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'MCP internal error', detail: e.message });
      }
    }
  };

  router.post('/', bearerAuth, mcpHandler);
  router.get('/', bearerAuth, mcpHandler);
  router.delete('/', bearerAuth, mcpHandler);

  app.use('/mcp', router);
}

module.exports = { mountMcp };
