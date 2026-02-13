const LANDINGS = {
  62849: {
    name: 'El Mirador Residences',
    tags: ['WEB - Mirador']
  }
};

function getLandingConfig(publicationId) {
  return LANDINGS[publicationId] || null;
}

module.exports = {
  LANDINGS,
  getLandingConfig
};
