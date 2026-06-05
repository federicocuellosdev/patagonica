// Definiciones canonicas. Cada landing puede tener varias keys (slug, id numerico de Tokko)
// y todas resuelven a la misma config. `label` es el nombre corto usado en el titulo del lead.
const LANDING_DEFS = [
  {
    keys: [62849, 'mirador'],
    tokkoDevelopmentId: 62849,
    label: 'Mirador',
    name: 'El Mirador Residences',
    tag: 'WEB - Mirador'
  },
  {
    keys: [59789, 'loma-guacha'],
    tokkoDevelopmentId: 59789,
    label: 'Loma Guacha',
    name: 'Loma Guacha',
    tag: 'WEB - Loma Guacha'
  },
  {
    keys: [58284, 'cota-1000'],
    tokkoDevelopmentId: 58284,
    label: 'Cota 1000',
    name: 'Loteo COTA 1000',
    tag: 'WEB - Cota 1000'
  }
];

const LANDINGS = {};
for (const def of LANDING_DEFS) {
  for (const k of def.keys) {
    LANDINGS[k] = {
      name: def.name,
      label: def.label,
      tags: [def.tag],
      kommoLeadPrefix: def.tag,
      tokkoDevelopmentId: def.tokkoDevelopmentId
    };
  }
}

function getLandingConfig(publicationId) {
  return LANDINGS[publicationId] || null;
}

module.exports = {
  LANDINGS,
  getLandingConfig
};
