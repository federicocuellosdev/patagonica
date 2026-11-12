const { z } = require('zod');
const meta = require('../providers/meta');
const { asText, safe } = require('../common');

function register(server) {
  server.registerTool('meta_list_campaigns',
    {
      title: 'Meta Ads: listar campañas',
      description: 'Campañas de la cuenta publicitaria de Patagónica. Incluye estado, objetivo, presupuestos.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().default(25),
        status: z.array(z.string()).optional().describe('Filtrar por effective_status (ej. ACTIVE, PAUSED)')
      }
    },
    safe(async (args) => asText(await meta.listCampaigns(args)))
  );

  server.registerTool('meta_list_adsets',
    {
      title: 'Meta Ads: listar ad sets',
      description: 'Ad sets de la cuenta o de una campaña específica.',
      inputSchema: {
        campaign_id: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(25)
      }
    },
    safe(async (args) => asText(await meta.listAdsets(args)))
  );

  server.registerTool('meta_list_ads',
    {
      title: 'Meta Ads: listar anuncios (ads)',
      description: 'Ads de la cuenta, ad set o campaña. Devuelve creative embebido con image/video/body/title.',
      inputSchema: {
        adset_id: z.string().optional(),
        campaign_id: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(25)
      }
    },
    safe(async (args) => asText(await meta.listAds(args)))
  );

  server.registerTool('meta_get_insights',
    {
      title: 'Meta Ads: insights (rendimiento)',
      description: 'Métricas de rendimiento: impressions, reach, clicks, CTR, CPM, CPC, spend, actions. Nivel: account/campaign/adset/ad.',
      inputSchema: {
        level: z.enum(['account', 'campaign', 'adset', 'ad']).optional().default('campaign'),
        date_preset: z.string().optional().default('last_30d').describe('Ej: last_7d, last_30d, this_month, last_month, maximum'),
        since: z.string().optional().describe('YYYY-MM-DD'),
        until: z.string().optional().describe('YYYY-MM-DD'),
        breakdowns: z.array(z.string()).optional().describe('Ej: age, gender, placement, platform_position, country, region'),
        entity_id: z.string().optional().describe('Si se especifica, trae insights de esa campaña/adset/ad en lugar de la cuenta'),
        fields: z.string().optional().describe('CSV de campos custom; vacío usa default')
      }
    },
    safe(async (args) => asText(await meta.getInsights(args)))
  );

  server.registerTool('meta_get_ad_creative',
    {
      title: 'Meta Ads: creative de un anuncio',
      description: 'Devuelve el creative de un ad con URLs de imagen/video, body, title y call to action. Clave para análisis de piezas.',
      inputSchema: {
        ad_id: z.string().optional(),
        creative_id: z.string().optional()
      }
    },
    safe(async (args) => asText(await meta.getAdCreative(args)))
  );

  server.registerTool('meta_get_video',
    {
      title: 'Meta Ads: detalle de video',
      description: 'URL fuente del video, thumbnails y metadata. Usar video_id obtenido de meta_get_ad_creative.',
      inputSchema: { video_id: z.string() }
    },
    safe(async (args) => asText(await meta.getVideo(args)))
  );

  server.registerTool('meta_list_forms',
    {
      title: 'Meta Ads: formularios Lead Ads',
      description: 'Lista forms de leads de la página, con preguntas y leads_count.',
      inputSchema: {
        page_id: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(25)
      }
    },
    safe(async (args) => asText(await meta.listForms(args)))
  );
}

module.exports = { register };
