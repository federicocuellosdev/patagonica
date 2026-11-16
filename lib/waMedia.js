const fs = require('fs');
const path = require('path');
const axios = require('axios');

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const MEDIA_DIR = path.join(__dirname, '..', 'data', 'wa_media');

fs.mkdirSync(MEDIA_DIR, { recursive: true });

const EXT_BY_MIME = {
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/amr': 'amr',
  'audio/aac': 'aac',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/3gpp': '3gp',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
};

function extFor(mime) {
  if (!mime) return 'bin';
  const base = mime.split(';')[0].trim().toLowerCase();
  if (EXT_BY_MIME[base]) return EXT_BY_MIME[base];
  const sub = base.split('/')[1];
  return (sub || 'bin').replace(/[^a-z0-9]+/g, '');
}

function filePathFor(mediaId, mime) {
  return path.join(MEDIA_DIR, `${mediaId}.${extFor(mime)}`);
}

async function downloadMedia({ mediaId, mimeType }) {
  if (!mediaId) return null;
  const token = process.env.META_WA_SYSTEM_TOKEN;
  if (!token) throw new Error('META_WA_SYSTEM_TOKEN no configurado');

  const meta = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const url = meta.data?.url;
  const mime = mimeType || meta.data?.mime_type;
  if (!url) throw new Error(`sin url en respuesta de media ${mediaId}`);

  const bin = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'arraybuffer',
  });

  const dest = filePathFor(mediaId, mime);
  fs.writeFileSync(dest, bin.data);
  return { path: dest, mime, bytes: bin.data.length };
}

module.exports = { downloadMedia, filePathFor, MEDIA_DIR };
