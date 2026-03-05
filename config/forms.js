// Configuración de formularios de Meta
const FORMS = {
  // === FORMULARIOS GENERALES ===
  '2204681366609205': {
    name: 'FORM - General - v2',
    tags: ['FORM - General', 'Meta Ads'],
    publication_id: null
  },
  '1349310240322714': {
    name: 'FORM - General',
    tags: ['FORM - General', 'Meta Ads'],
    publication_id: null
  },
  '1456771896016645': {
    name: 'FORM - Casas',
    tags: ['FORM - Casas', 'Meta Ads'],
    publication_id: null
  },

  // === DOMO II ===
  '1495753971498609': {
    name: 'FORM - Domo - v2',
    tags: ['FORM - Domo II', 'Meta Ads'],
    publication_id: 53088
  },
  '10084737954984809': {
    name: 'FORM - Domo',
    tags: ['FORM - Domo II', 'Meta Ads'],
    publication_id: 53088
  },
  '1065057755786359': {
    name: 'FORM - Domo - v3',
    tags: ['FORM - Domo II', 'Meta Ads'],
    publication_id: 53088
  },

  // === COTA 1000 ===
  '1613841792966460': {
    name: 'FORM - Cota - v2',
    tags: ['FORM - Cota 1000', 'Meta Ads'],
    publication_id: 58284
  },
  '840873388549182': {
    name: 'FORM - Cota',
    tags: ['FORM - Cota 1000', 'Meta Ads'],
    publication_id: 58284
  },
  '33459394607008787': {
    name: 'FORM - Cota - v3',
    tags: ['FORM - Cota 1000', 'Meta Ads'],
    publication_id: 58284
  },

  // === PASEO RETAMAS ===
  '3420803411393792': {
    name: 'FORM - Retama - v2',
    tags: ['FORM - Paseo Retamas', 'Meta Ads'],
    publication_id: 61408
  },
  '2358187311325644': {
    name: 'FORM - Retama',
    tags: ['FORM - Paseo Retamas', 'Meta Ads'],
    publication_id: 61408
  },
  '2470766109986009': {
    name: 'FORM - Retamas - v3',
    tags: ['FORM - Paseo Retamas', 'Meta Ads'],
    publication_id: 61408
  },

  // === MODE ===
  '2040517946730591': {
    name: 'FORM - Mode - v2',
    tags: ['FORM - MODE', 'Meta Ads'],
    publication_id: 64409
  },
  '920882440271048': {
    name: 'FORM - Mode',
    tags: ['FORM - MODE', 'Meta Ads'],
    publication_id: 64409
  },
  '909134298136071': {
    name: 'FORM - Mode - v3',
    tags: ['FORM - MODE', 'Meta Ads'],
    publication_id: 64409
  },

  // === ALTO CORRENTOSO ===
  '1367537684435646': {
    name: 'FORM - Altos de Correntoso',
    tags: ['FORM - Alto Correntoso', 'Meta Ads'],
    publication_id: null
  },
  '1490228819403640': {
    name: 'FORM - Altos del Correntoso - v3',
    tags: ['FORM - Alto Correntoso', 'Meta Ads'],
    publication_id: null
  },

  // === HAIKU ===
  '1997806671078652': {
    name: 'FORM - Haiku - v3',
    tags: ['FORM - Haiku', 'Meta Ads'],
    publication_id: 68594
  },

  // === EMPRENDIMIENTOS ===
  '2117316602140778': {
    name: 'FORM - Emprendimientos - v3',
    tags: ['Emprendimientos', 'Meta Ads'],
    publication_id: null
  },

  // === REMARKETING ===
  '3086848588189470': {
    name: 'FORM - Emprendimientos - v3 - Remarketing',
    tags: ['Remarketing', 'Emprendimientos', 'Meta Ads'],
    publication_id: null
  },

  // === LOTES (GENERAL) ===
  '932915609665775': {
    name: 'FORM - Lotes - v1',
    tags: ['FORM - Lotes', 'Meta Ads'],
    publication_id: null
  },

  // === CAPTACIÓN ===
  '1451384923322014': {
    name: 'Captación - v1',
    tags: ['FORM - Captación', 'Meta Ads'],
    publication_id: null
  }
};

function getFormConfig(formId) {
  return FORMS[formId] || {
    name: 'Unknown Form',
    tags: ['Meta Ads'],
    publication_id: null
  };
}

module.exports = {
  FORMS,
  getFormConfig
};
