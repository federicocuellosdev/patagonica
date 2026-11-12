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

function buildServer() {
  const server = new McpServer(SERVER_INFO);
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
