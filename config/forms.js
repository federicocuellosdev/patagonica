// Configuración de formularios de Meta
const FORMS = {
  '2204681366609205': {
    name: 'FORM - General - v2',
    tags: ['FORM - General', 'Meta Ads'],
    publication_id: null // Sin emprendimiento asignado
  },
  '1349310240322714': {
    name: 'FORM - General',
    tags: ['FORM - General', 'Meta Ads'],
    publication_id: null // Sin emprendimiento asignado
  },
  '10084737954984809': {
    name: 'FORM - Domo',
    tags: ['FORM - Domo II', 'Meta Ads'],
    publication_id: 53088 // Domo II
  },
  '840873388549182': {
    name: 'FORM - Cota',
    tags: ['FORM - Cota 1000', 'Meta Ads'],
    publication_id: 58284 // Loteo COTA 1000
  },
  '2358187311325644': {
    name: 'FORM - Retama',
    tags: ['FORM - Paseo Retamas', 'Meta Ads'],
    publication_id: 61408 // Paseo Retamas
  },
  '920882440271048': {
    name: 'FORM - Mode',
    tags: ['FORM - MODE', 'Meta Ads'],
    publication_id: 64409 // MODE
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
