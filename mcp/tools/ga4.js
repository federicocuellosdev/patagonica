const { z } = require('zod');
const ga4 = require('../providers/ga4');
const { asText, safe } = require('../common');

function register(server) {
  server.registerTool('ga4_list_properties',
    {
      title: 'GA4: listar propiedades accesibles',
      description: 'Lista todas las propiedades GA4 accesibles por la service account. Útil para elegir property_id.',
      inputSchema: {}
    },
    safe(async () => asText(await ga4.listProperties()))
  );

  server.registerTool('ga4_run_report',
    {
      title: 'GA4: correr reporte',
      description: 'Reporte flexible de GA4 Data API. Pedir dimensiones y métricas por nombre. Ej dims: pagePath, sessionSource, deviceCategory. Ej métricas: sessions, activeUsers, conversions, screenPageViews, engagementRate.',
      inputSchema: {
        property_id: z.string().optional().describe('Si vacío, autodetecta la de Patagónica'),
        date_ranges: z.array(z.object({ startDate: z.string(), endDate: z.string() })).optional().describe('Default: [{startDate: "28daysAgo", endDate: "today"}]'),
        dimensions: z.array(z.string()).optional().default([]),
        metrics: z.array(z.string()).default([]),
        limit: z.number().int().min(1).max(10000).optional().default(100)
      }
    },
    safe(async (args) => asText(await ga4.runReport(args)))
  );

  server.registerTool('ga4_run_realtime',
    {
      title: 'GA4: tiempo real',
      description: 'Reporte en tiempo real (últimos 30 min). Útil para medir impacto inmediato de campañas.',
      inputSchema: {
        property_id: z.string().optional(),
        dimensions: z.array(z.string()).optional().default([]),
        metrics: z.array(z.string()).default([]),
        limit: z.number().int().min(1).max(10000).optional().default(100)
      }
    },
    safe(async (args) => asText(await ga4.runRealtime(args)))
  );

  server.registerTool('ga4_top_pages',
    {
      title: 'GA4: top páginas',
      description: 'Páginas más vistas en el período con pageviews, usuarios, duración y bounce rate.',
      inputSchema: {
        property_id: z.string().optional(),
        days: z.number().int().min(1).max(365).optional().default(28),
        limit: z.number().int().min(1).max(500).optional().default(20)
      }
    },
    safe(async (args) => asText(await ga4.topPages(args)))
  );

  server.registerTool('ga4_traffic_sources',
    {
      title: 'GA4: fuentes de tráfico',
      description: 'Sessions, users, conversions y engagement rate por source/medium/campaign.',
      inputSchema: {
        property_id: z.string().optional(),
        days: z.number().int().min(1).max(365).optional().default(28),
        limit: z.number().int().min(1).max(500).optional().default(20)
      }
    },
    safe(async (args) => asText(await ga4.trafficSources(args)))
  );
}

module.exports = { register };
