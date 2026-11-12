// Helpers compartidos para providers y tools.

function asText(obj) {
  const text = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  return { content: [{ type: 'text', text }] };
}

function asError(msg, extra = {}) {
  return { content: [{ type: 'text', text: `ERROR: ${msg}\n${JSON.stringify(extra, null, 2)}` }], isError: true };
}

// Wrap async handler para capturar errores y devolverlos como texto MCP (no como throw).
function safe(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      const detail = e.response?.data ? JSON.stringify(e.response.data) : e.message;
      return asError(e.message, { detail });
    }
  };
}

module.exports = { asText, asError, safe };
