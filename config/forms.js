// Configuración de formularios de Meta
const FORMS = {
  '2204681366609205': {
    name: 'FORM - General - v2',
    tags: ['FORM - General', 'Meta Ads']
  },
  '1349310240322714': {
    name: 'FORM - General',
    tags: ['FORM - General', 'Meta Ads']
  }
  // Agregar más formularios aquí según sea necesario
  // 'FORM_ID_AQUI': {
  //   name: 'Nombre del formulario',
  //   tags: ['Tag1', 'Tag2']
  // }
};

function getFormConfig(formId) {
  return FORMS[formId] || {
    name: 'Unknown Form',
    tags: ['Meta Ads']
  };
}

module.exports = {
  FORMS,
  getFormConfig
};
