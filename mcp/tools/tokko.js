const { z } = require('zod');
const tokko = require('../providers/tokko');
const { asText, safe } = require('../common');

function register(server) {
  server.registerTool('tokko_list_properties',
    {
      title: 'Tokko: listar propiedades',
      description: 'Propiedades en el inventario de Tokko (Patagónica). Incluye fotos y videos.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().default(25),
        offset: z.number().int().min(0).optional().default(0),
        status: z.number().int().optional().describe('1=Disponible, 2=Reservado, 3=Vendido, 4=Alquilado'),
        operation_type: z.union([z.number().int(), z.array(z.number().int())]).optional().describe('1=Venta, 2=Alquiler, 3=Alquiler Temporario'),
        type: z.union([z.number().int(), z.array(z.number().int())]).optional().describe('IDs de tipo de propiedad')
      }
    },
    safe(async (args) => asText(await tokko.listProperties(args)))
  );

  server.registerTool('tokko_get_property',
    {
      title: 'Tokko: detalle de propiedad',
      description: 'Ficha completa de una propiedad con fotos, videos, operaciones, ubicación y descripción.',
      inputSchema: { id: z.number().int() }
    },
    safe(async ({ id }) => asText(await tokko.getProperty(id)))
  );

  server.registerTool('tokko_list_developments',
    {
      title: 'Tokko: listar emprendimientos',
      description: 'Emprendimientos (developments) con fotos, videos y estado de obra.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().default(25),
        offset: z.number().int().min(0).optional().default(0)
      }
    },
    safe(async (args) => asText(await tokko.listDevelopments(args)))
  );

  server.registerTool('tokko_get_development',
    {
      title: 'Tokko: detalle de emprendimiento',
      description: 'Ficha completa de un emprendimiento con todas sus unidades y multimedia.',
      inputSchema: { id: z.number().int() }
    },
    safe(async ({ id }) => asText(await tokko.getDevelopment(id)))
  );

  server.registerTool('tokko_search_properties',
    {
      title: 'Tokko: búsqueda libre de propiedades',
      description: 'Búsqueda por texto en título de publicación.',
      inputSchema: {
        q: z.string(),
        limit: z.number().int().min(1).max(100).optional().default(25)
      }
    },
    safe(async (args) => asText(await tokko.searchProperties(args)))
  );
}

module.exports = { register };
