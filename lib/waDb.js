const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'whatsapp.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS wa_messages (
    id TEXT PRIMARY KEY,
    waba_id TEXT,
    phone_number_id TEXT,
    direction TEXT NOT NULL,
    from_number TEXT,
    to_number TEXT,
    type TEXT,
    text TEXT,
    media_id TEXT,
    mime_type TEXT,
    caption TEXT,
    context_message_id TEXT,
    wa_timestamp INTEGER,
    received_at INTEGER DEFAULT (strftime('%s','now')),
    raw_json TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_wa_messages_from ON wa_messages (from_number, wa_timestamp);
  CREATE INDEX IF NOT EXISTS idx_wa_messages_to ON wa_messages (to_number, wa_timestamp);

  CREATE TABLE IF NOT EXISTS wa_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    status TEXT NOT NULL,
    wa_timestamp INTEGER,
    recipient_id TEXT,
    conversation_id TEXT,
    error_code INTEGER,
    error_title TEXT,
    received_at INTEGER DEFAULT (strftime('%s','now')),
    raw_json TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_wa_statuses_msg ON wa_statuses (message_id);

  CREATE TABLE IF NOT EXISTS wa_contacts (
    wa_id TEXT PRIMARY KEY,
    name TEXT,
    first_seen INTEGER DEFAULT (strftime('%s','now')),
    last_seen INTEGER DEFAULT (strftime('%s','now'))
  );
`);

const existingCols = db.prepare("PRAGMA table_info(wa_messages)").all().map(c => c.name);
if (!existingCols.includes('media_path')) {
  db.exec("ALTER TABLE wa_messages ADD COLUMN media_path TEXT");
}

const insertMessage = db.prepare(`
  INSERT OR REPLACE INTO wa_messages
    (id, waba_id, phone_number_id, direction, from_number, to_number,
     type, text, media_id, mime_type, caption, context_message_id,
     wa_timestamp, raw_json)
  VALUES (@id, @waba_id, @phone_number_id, @direction, @from_number, @to_number,
     @type, @text, @media_id, @mime_type, @caption, @context_message_id,
     @wa_timestamp, @raw_json)
`);

const updateMediaPath = db.prepare('UPDATE wa_messages SET media_path = ? WHERE id = ?');

const insertStatus = db.prepare(`
  INSERT INTO wa_statuses
    (message_id, status, wa_timestamp, recipient_id, conversation_id,
     error_code, error_title, raw_json)
  VALUES (@message_id, @status, @wa_timestamp, @recipient_id, @conversation_id,
     @error_code, @error_title, @raw_json)
`);

const upsertContact = db.prepare(`
  INSERT INTO wa_contacts (wa_id, name) VALUES (?, ?)
  ON CONFLICT(wa_id) DO UPDATE SET
    name = COALESCE(excluded.name, wa_contacts.name),
    last_seen = strftime('%s','now')
`);

function saveIncomingMessage({ wabaId, phoneNumberId, businessPhone, message, contact }) {
  const body = message.text?.body
    ?? message.button?.text
    ?? message.interactive?.button_reply?.title
    ?? message.interactive?.list_reply?.title
    ?? null;

  const mediaObj = message[message.type] && typeof message[message.type] === 'object' ? message[message.type] : null;

  insertMessage.run({
    id: message.id,
    waba_id: wabaId || null,
    phone_number_id: phoneNumberId || null,
    direction: 'inbound',
    from_number: message.from || null,
    to_number: businessPhone || null,
    type: message.type || null,
    text: body,
    media_id: mediaObj?.id || null,
    mime_type: mediaObj?.mime_type || null,
    caption: mediaObj?.caption || null,
    context_message_id: message.context?.id || null,
    wa_timestamp: message.timestamp ? Number(message.timestamp) : null,
    raw_json: JSON.stringify(message),
  });

  if (contact?.wa_id) {
    upsertContact.run(contact.wa_id, contact.profile?.name || null);
  }
}

function saveStatus({ status }) {
  insertStatus.run({
    message_id: status.id,
    status: status.status,
    wa_timestamp: status.timestamp ? Number(status.timestamp) : null,
    recipient_id: status.recipient_id || null,
    conversation_id: status.conversation?.id || null,
    error_code: status.errors?.[0]?.code || null,
    error_title: status.errors?.[0]?.title || null,
    raw_json: JSON.stringify(status),
  });
}

function saveOutgoingMessage({ wabaId, phoneNumberId, businessPhone, toNumber, messageId, type, text, raw }) {
  insertMessage.run({
    id: messageId,
    waba_id: wabaId || null,
    phone_number_id: phoneNumberId || null,
    direction: 'outbound',
    from_number: businessPhone || null,
    to_number: toNumber || null,
    type: type || null,
    text: text || null,
    media_id: null,
    mime_type: null,
    caption: null,
    context_message_id: null,
    wa_timestamp: Math.floor(Date.now() / 1000),
    raw_json: raw ? JSON.stringify(raw) : null,
  });
}

module.exports = {
  db,
  saveIncomingMessage,
  saveStatus,
  saveOutgoingMessage,
  updateMediaPath,
};
