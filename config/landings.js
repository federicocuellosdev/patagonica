const LANDINGS = {
  62849: {
    name: 'El Mirador Residences',
    tags: ['WEB - Mirador']
  },
  'loma-guacha': {
    name: 'Loma Guacha',
    tags: ['WEB - Loma Guacha']
  },
  'cota-1000': {
    name: 'Cota Mil',
    tags: ['WEB - Cota Mil']
  }
};

function getLandingConfig(publicationId) {
  return LANDINGS[publicationId] || null;
}

module.exports = {
  LANDINGS,
  getLandingConfig
};
