const LANDINGS = {
  62849: {
    name: 'El Mirador Residences',
    tags: ['WEB - Mirador']
  },
  'loma-guacha': {
    name: 'Loma Guacha',
    tags: ['WEB - Loma Guacha']
  }
};

function getLandingConfig(publicationId) {
  return LANDINGS[publicationId] || null;
}

module.exports = {
  LANDINGS,
  getLandingConfig
};
