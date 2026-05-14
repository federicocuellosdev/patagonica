const LANDINGS = {
  62849: {
    name: 'El Mirador Residences',
    tags: ['WEB - Mirador'],
    kommoLeadPrefix: 'WEB - Mirador'
  },
  'loma-guacha': {
    name: 'Loma Guacha',
    tags: ['WEB - Loma Guacha'],
    kommoLeadPrefix: 'WEB - Loma Guacha'
  },
  'cota-1000': {
    name: 'Cota Mil',
    tags: ['WEB - Cota 1000'],
    kommoLeadPrefix: 'WEB - Cota 1000'
  }
};

function getLandingConfig(publicationId) {
  return LANDINGS[publicationId] || null;
}

module.exports = {
  LANDINGS,
  getLandingConfig
};
