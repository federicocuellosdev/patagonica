// Etiquetas adicionales aplicadas según el adset_id del lead de Meta
// Se concatenan a las tags del FormConfig en routes/meta.js

const NQ_RN_ADSETS = new Set([
  '120244752929040238', // FORM - Cota 1000 - NQ & RN
  '120244752928730238', // FORM - Casas - NQ & RN
  '120244752928720238', // FORM - Emprendimiento - NQ & RN
  '120244752928670238', // FORM - Depto - NQ & RN
  '120244752928660238', // FORM - Lotes - NQ & RN
]);

function getAdsetTags(adsetId) {
  const tags = [];
  if (NQ_RN_ADSETS.has(String(adsetId))) tags.push('NQ & RN');
  return tags;
}

module.exports = { NQ_RN_ADSETS, getAdsetTags };
