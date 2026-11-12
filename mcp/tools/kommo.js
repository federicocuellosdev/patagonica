const { z } = require('zod');
const kommo = require('../providers/kommo');
const { asText, safe } = require('../common');

function register(server) {
  server.registerTool('kommo_list_pipelines',
    {
      title: 'Kommo: listar embudos',
      description: 'Lista los pipelines (embudos) de Kommo con sus etapas (statuses). Útil para entender la estructura del CRM.',
      inputSchema: {}
    },
    safe(async () => asText(await kommo.listPipelines()))
  );

  server.registerTool('kommo_list_leads',
    {
      title: 'Kommo: listar leads',
      description: 'Lista leads filtrados por pipeline/status. Útil para medir volumen y estado del embudo.',
      inputSchema: {
        pipeline_id: z.number().int().optional().describe('ID del pipeline (embudo)'),
        status_id: z.number().int().optional().describe('ID del status (etapa)'),
        query: z.string().optional().describe('Búsqueda libre por texto'),
        limit: z.number().int().min(1).max(250).optional().default(50),
        page: z.number().int().min(1).optional().default(1)
      }
    },
    safe(async (args) => asText(await kommo.listLeads(args)))
  );

  server.registerTool('kommo_get_lead',
    {
      title: 'Kommo: detalle de lead',
      description: 'Trae un lead con contactos vinculados y notas. Para análisis cualitativo.',
      inputSchema: { lead_id: z.number().int().describe('ID del lead') }
    },
    safe(async ({ lead_id }) => asText(await kommo.getLead(lead_id)))
  );

  server.registerTool('kommo_list_contacts',
    {
      title: 'Kommo: listar contactos',
      description: 'Lista contactos con leads asociados, teléfono y email.',
      inputSchema: {
        query: z.string().optional(),
        limit: z.number().int().min(1).max(250).optional().default(50),
        page: z.number().int().min(1).optional().default(1)
      }
    },
    safe(async (args) => asText(await kommo.listContacts(args)))
  );

  server.registerTool('kommo_list_notes',
    {
      title: 'Kommo: listar notas',
      description: 'Notas de un lead o de la cuenta. Las notas contienen respuestas de forms y conversaciones del bot.',
      inputSchema: {
        lead_id: z.number().int().optional(),
        limit: z.number().int().min(1).max(250).optional().default(50),
        page: z.number().int().min(1).optional().default(1)
      }
    },
    safe(async (args) => asText(await kommo.listNotes(args)))
  );
}

module.exports = { register };
