import { readFile, writeFile } from 'node:fs/promises';

const FEED_URL = 'https://diariooficial.gob.mx/sumario.xml';
const OUTPUT_PATH = new URL('../data/pulso-legal.json', import.meta.url);
const MAX_ITEMS = 24;

const AUTHORIZED_AGENCIES = [
  'SECRETARIA DE HACIENDA Y CREDITO PUBLICO',
  'AGENCIA NACIONAL DE ADUANAS DE MEXICO',
  'SECRETARIA DE ECONOMIA',
  'SECRETARIA DE GOBERNACION',
  'INSTITUTO NACIONAL DE MIGRACION'
];
const AUTHORIZED_CATEGORIES = [
  'Migratorio',
  'Comercio Exterior',
  'Aduanas'
];

const categoryRules = [
  {
    category: 'Migratorio',
    patterns: [
      { rx: /\binstituto nacional de migracion\b|\binm\b/, weight: 4 },
      { rx: /\bmigracion\b|\bmigratorio\b|\bvisa(s)?\b|\bcondicion(es)? de estancia\b|\bresidencia\b|\bresidente\b|\brefugiado\b|\basilo\b|\bnaturalizacion\b|\bpermiso(s)? de trabajo\b/, weight: 3 }
    ]
  },
  {
    category: 'Aduanas',
    patterns: [
      { rx: /\bagencia nacional de aduanas\b|\banam\b|\breglas generales de comercio exterior\b/, weight: 5 },
      { rx: /\baduana(s)?\b|\baduanero\b|\baduanera\b|\bdespacho aduanero\b|\bpedimento(s)?\b|\brecinto(s)? fiscalizado(s)?\b|\bprevalidacion\b|\boea\b|\boperador economico autorizado\b|\bpadron de importadores\b|\bpadron de exportadores\b|\bagente aduanal\b|\bagencia aduanal\b/, weight: 4 }
    ]
  },
  {
    category: 'Comercio Exterior',
    patterns: [
      { rx: /\bcomercio exterior\b|\bimportacion(es)?\b|\bexportacion(es)?\b|\barancel(es|aria|arias)?\b|\bcuota compensatoria\b|\bantidumping\b|\bimmex\b|\bprosec\b|\bprogramas de fomento\b|\bregulaciones y restricciones no arancelarias\b|\bpermisos previos\b|\bavisos automaticos\b|\bcupos\b|\bfraccion(es)? arancelaria(s)?\b/, weight: 3 }
    ]
  },
  {
    category: 'Contratos',
    patterns: [
      { rx: /\bcodigo civil\b|\bcontrato(s)? civil(es)?\b|\bcontrato(s)? mercantil(es)?\b|\bobligacion(es)? contractual(es)?\b|\bobligaciones civiles\b|\barrendamiento(s)?\b|\bcompraventa(s)?\b|\bcontrato(s)? de prestacion de servicios\b|\bmandato(s)?\b|\bpoder(es)?\b|\bprotocolizacion\b|\bformalizacion de actos\b|\brelaciones entre particulares\b/, weight: 3 }
    ]
  },
  {
    category: 'Divorcios',
    patterns: [
      { rx: /\bdivorcio(s)?\b|\bmatrimonio\b|\bconyuge(s)?\b|\bregimen patrimonial\b|\bpension alimenticia\b|\bguarda y custodia\b/, weight: 4 }
    ]
  },
  {
    category: 'Sucesiones',
    patterns: [
      { rx: /\bsucesion(es)?\b|\bherencia\b|\btestamento(s)?\b|\bintestado\b|\balbacea\b|\blegado(s)?\b/, weight: 4 }
    ]
  }
];

const legalChangePatterns = [
  /\breforma\b|\bmodifica\b|\badiciona\b|\bderoga\b|\bexpide\b|\bemite\b|\bestablece\b|\bactualiza\b|\bda a conocer\b|\bpublica\b|\bresuelve\b|\bdeclara\b/,
  /\binicio del procedimiento\b|\binicia el procedimiento\b|\bexamen de vigencia\b|\bcuota compensatoria\b|\bcriterio\b|\bjurisprudencia\b|\btesis\b/,
  /\breglas generales\b|\brequisito(s)?\b|\btramite(s)?\b|\bautorizacion(es)?\b|\brestriccion(es)?\b|\bobligacion(es)?\b|\bderecho(s)?\b|\bprocedimiento(s)?\b/
];

const substantiveCategoryPatterns = {
  Migratorio: [
    /\binstituto nacional de migracion\b|\binm\b/,
    /\bmigracion\b|\bmigratorio\b|\bvisa(s)?\b|\bcondicion(es)? de estancia\b|\bresidencia\b|\bresidente\b|\brefugiado\b|\basilo\b|\bnaturalizacion\b|\bpermiso(s)? de trabajo\b|\bextranjero(s)?\b|\bestancia\b/
  ],
  'Comercio Exterior': [
    /\bcomercio exterior\b|\bimportacion(es)?\b|\bexportacion(es)?\b|\barancel(es|aria|arias)?\b|\bfraccion(es)? arancelaria(s)?\b/,
    /\bcuota compensatoria\b|\bantidumping\b|\bimmex\b|\bprosec\b|\bprogramas de fomento\b|\bregulaciones y restricciones no arancelarias\b|\bpermisos previos\b|\bavisos automaticos\b|\bcupos\b|\bmercancia(s)?\b/
  ],
  Aduanas: [
    /\bagencia nacional de aduanas\b|\banam\b|\breglas generales de comercio exterior\b/,
    /\baduana(s)?\b|\baduanero\b|\baduanera\b|\bdespacho aduanero\b|\bpedimento(s)?\b|\brecinto(s)? fiscalizado(s)?\b|\bprevalidacion\b|\boea\b|\boperador economico autorizado\b|\bpadron de importadores\b|\bpadron de exportadores\b|\bagente aduanal\b|\bagencia aduanal\b/
  ],
  Contratos: [
    /\bcodigo civil\b|\bcontrato(s)? civil(es)?\b|\bcontrato(s)? mercantil(es)?\b|\bobligacion(es)? contractual(es)?\b|\bobligaciones civiles\b|\barrendamiento(s)?\b|\bcompraventa(s)?\b|\bcontrato(s)? de prestacion de servicios\b|\bmandato(s)?\b|\bpoder(es)?\b|\bprotocolizacion\b|\bformalizacion de actos\b|\brelaciones entre particulares\b/
  ],
  Divorcios: [
    /\bdivorcio(s)?\b|\bmatrimonio\b|\bconyuge(s)?\b|\bregimen patrimonial\b|\bpension alimenticia\b|\bguarda y custodia\b|\bconvivencia familiar\b/
  ],
  Sucesiones: [
    /\bsucesion(es)?\b|\bsucesorio(s)?\b|\btestamento(s)?\b|\bherencia(s)?\b|\bintestado\b|\badjudicacion hereditaria\b|\balbacea\b|\bpatrimonio familiar\b/
  ]
};

const strictDirectPracticeHookPatterns = [
  /\bcomercio exterior\b|\bimportacion(es)?\b|\bexportacion(es)?\b|\barancel(es|aria|arias)?\b|\bfraccion(es)? arancelaria(s)?\b|\bcuota(s)? compensatoria(s)?\b|\bantidumping\b|\bimmex\b|\bprosec\b|\bprogramas de fomento\b|\bregulaciones y restricciones no arancelarias\b|\bpermisos previos\b|\bavisos automaticos\b|\bcupos\b|\bmercancia(s)?\b/,
  /\bagencia nacional de aduanas\b|\banam\b|\baduana(s)?\b|\baduanero\b|\baduanera\b|\bdespacho aduanero\b|\bpedimento(s)?\b|\brecinto(s)? fiscalizado(s)?\b|\bprevalidacion\b|\boea\b|\boperador economico autorizado\b|\bpadron(es)? de importadores\b|\bpadron(es)? de exportadores\b|\bagente aduanal\b|\bagencia aduanal\b/,
  /\binstituto nacional de migracion\b|\binm\b|\bmigracion\b|\bmigratorio\b|\bvisa(s)?\b|\bcondicion(es)? de estancia\b|\bresidencia\b|\bresidente\b|\brefugiado\b|\basilo\b|\bnaturalizacion\b|\bpermiso(s)? de trabajo\b|\bextranjero(s)?\b|\bestancia\b/,
  /\bcodigo civil\b|\bcodigo de comercio\b|\bcontrato(s)? civil(es)?\b|\bcontrato(s)? mercantil(es)?\b|\bobligacion(es)? contractual(es)?\b|\bobligaciones civiles\b|\barrendamiento(s)?\b|\bcompraventa(s)?\b|\bmandato(s)?\b|\bpoder(es)?\b|\bprotocolizacion\b|\bformalizacion de actos\b|\brelaciones entre particulares\b/,
  /\bdivorcio(s)?\b|\bmatrimonio\b|\bconyuge(s)?\b|\bregimen patrimonial\b|\bpension alimenticia\b|\bguarda y custodia\b|\bconvivencia familiar\b/,
  /\bsucesion(es)?\b|\bsucesorio(s)?\b|\btestamento(s)?\b|\bherencia(s)?\b|\bintestado\b|\badjudicacion hereditaria\b|\balbacea\b|\bpatrimonio familiar\b/
];

const publicHealthNoticePatterns = [
  /\bsecretaria de salud\b|\bsistema nacional de salud\b|\bsalud publica\b|\bservicios de atencion medica\b/,
  /\bcolera\b|\benfermedades transmitidas por vectores\b|\bintoxicacion por artropodos\b|\bserpiente(s)?\b|\bvigilancia, prevencion, control\b|\btratamiento\b/,
  /\bprevencion, control, manejo y tratamiento\b|\bvigilancia epidemiologica\b|\bprestacion de servicios de atencion medica\b/
];

const publicSectorAdministrativePatterns = [
  /\bconvenio especifico de coordinacion\b/,
  /\bconvenio marco de coordinacion\b/,
  /\brecursos presupuestarios federales\b/,
  /\bdependencias y entidades de la administracion publica federal\b/,
  /\bentidades federativas\b/,
  /\bmunicipios\b/,
  /\bdemarcaciones territoriales\b/,
  /\babstenerse de aceptar propuestas\b/,
  /\bcelebrar contratos con la empresa\b/,
  /\blicitacion(es)?\b/,
  /\badquisiciones\b/,
  /\bobras publicas\b|\bobra publica\b/,
  /\bservicios relacionados con las mismas\b/,
  /\bcomision nacional del agua\b|\bconagua\b/,
  /\bcomision nacional bancaria y de valores\b/,
  /\bcuotas anual(es)? y mensual(es)?\b/,
  /\bservicios de inspeccion y vigilancia\b/
];

const consultationNoticePattern = /\bconsulta publica\b|\bproyecto de norma oficial mexicana\b|\bproy-nom\b/;

const prohibitedReadingLanguage = [
  /\bposible(s)? implicacion(es)?\b/i,
  /\bpodria\b/i,
  /\beventualmente\b/i,
  /\bindirectamente\b/i,
  /\btangencial\b/i,
  /\bhipotetic/i,
  /\bremot[ao]s?\b/i
];

function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(value = '') {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
    Aacute: 'Á',
    Eacute: 'É',
    Iacute: 'Í',
    Oacute: 'Ó',
    Uacute: 'Ú',
    aacute: 'á',
    eacute: 'é',
    iacute: 'í',
    oacute: 'ó',
    uacute: 'ú',
    Ntilde: 'Ñ',
    ntilde: 'ñ',
    Uuml: 'Ü',
    uuml: 'ü'
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const code = entity[1]?.toLowerCase() === 'x'
        ? parseInt(entity.slice(2), 16)
        : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }

    return named[entity] || match;
  });
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${tag}>`, 'i'));
  return decodeEntities(match?.[1] || '').replace(/\s+/g, ' ').trim();
}

function parseDateFromUrl(url) {
  const match = url.match(/[?&]fecha=(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return new Date().toISOString().slice(0, 10);
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function cleanAgency(title) {
  return title
    .replace(/^PODER EJECUTIVO\s+/i, '')
    .replace(/^ORGANISMOS AUTONOMOS\s+/i, '')
    .replace(/^ORGANISMOS DESCENTRALIZADOS\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function classify(entry) {
  const text = normalizeText(`${entry.title} ${entry.description}`).toLowerCase();
  const scores = categoryRules
    .map(rule => ({
      category: rule.category,
      score: rule.patterns.reduce((total, pattern) => total + (pattern.rx.test(text) ? pattern.weight : 0), 0)
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scores.length) {
    return '';
  }

  const [first, second] = scores;

  if (second && first.score === second.score) {
    const tied = [first.category, second.category].sort().join('|');
    if (tied === 'Aduanas|Comercio Exterior') {
      return first.category === 'Aduanas' ? 'Aduanas' : second.category;
    }
    return '';
  }

  return first.category;
}

function isDirectLegalChange(entry) {
  const text = normalizeText(`${entry.title} ${entry.description}`).toLowerCase();
  return legalChangePatterns.some(pattern => pattern.test(text));
}

function hasProhibitedLanguage(value = '') {
  return prohibitedReadingLanguage.some(pattern => pattern.test(normalizeText(value)));
}

function isGenericReading(value = '') {
  const text = normalizeText(value).toLowerCase();
  return (
    /la modificacion altera reglas aplicables a la formacion, cumplimiento o efectos de relaciones contractuales/.test(text) ||
    /la publicacion incide en reglas especificas sobre obligaciones o actos juridicos privados/.test(text)
  );
}

function isStoredItemValid(item) {
  const sourceText = normalizeText(`${item?.dependencia || ''} ${item?.titulo || ''}`).toLowerCase();

  return Boolean(
    item?.url &&
    item?.titulo &&
    AUTHORIZED_CATEGORIES.includes(item.categoria) &&
    item.lectura &&
    !hasProhibitedLanguage(item.lectura) &&
    !isGenericReading(item.lectura) &&
    hasStrictDirectPracticeHook(sourceText) &&
    hasCategorySubstance(sourceText, item.categoria) &&
    !isPublicHealthNoticeWithoutDirectPracticeHook(sourceText) &&
    !(item.categoria === 'Contratos' && isPublicSectorAdministrativeNotice(sourceText))
  );
}

function hasAnyPattern(text, patterns = []) {
  return patterns.some(pattern => pattern.test(text));
}

function hasStrictDirectPracticeHook(text) {
  return hasAnyPattern(text, strictDirectPracticeHookPatterns);
}

function hasCategorySubstance(text, category) {
  return hasAnyPattern(text, substantiveCategoryPatterns[category] || []);
}

function isPublicHealthNoticeWithoutDirectPracticeHook(text) {
  const looksHealthOnly = hasAnyPattern(text, publicHealthNoticePatterns);
  if (!looksHealthOnly) {
    return false;
  }

  return !hasStrictDirectPracticeHook(text);
}

function isPublicSectorAdministrativeNotice(text) {
  return hasAnyPattern(text, publicSectorAdministrativePatterns);
}

function isPublicHealthNoticeWithoutTradeHook(text, category) {
  if (!['Comercio Exterior', 'Aduanas'].includes(category)) {
    return false;
  }

  const looksHealthOnly = hasAnyPattern(text, publicHealthNoticePatterns);
  const hasTradeOrCustomsHook =
    hasCategorySubstance(text, 'Comercio Exterior') ||
    hasCategorySubstance(text, 'Aduanas');

  return looksHealthOnly && !hasTradeOrCustomsHook;
}

function isIntrinsicToCategory(entry, category) {
  const text = normalizeText(`${entry.title} ${entry.description}`).toLowerCase();

  if (!hasStrictDirectPracticeHook(text)) {
    return false;
  }

  if (!hasCategorySubstance(text, category)) {
    return false;
  }

  if (isPublicHealthNoticeWithoutDirectPracticeHook(text)) {
    return false;
  }

  if (category === 'Contratos' && isPublicSectorAdministrativeNotice(text)) {
    return false;
  }

  if (consultationNoticePattern.test(text) && ['Comercio Exterior', 'Aduanas'].includes(category)) {
    return hasCategorySubstance(text, 'Comercio Exterior') || hasCategorySubstance(text, 'Aduanas');
  }

  return true;
}

function isRelevant(entry) {
  const category = classify(entry);
  
const agency = (entry.dependencia || '').toUpperCase();

if (
  !AUTHORIZED_AGENCIES.includes(agency)
) {
  return false;
}
  
  return Boolean(category && isDirectLegalChange(entry) && isIntrinsicToCategory(entry, category));
}

function editorialTitle(description) {
  const firstSentence = description
    .split(/(?<=\.)\s+/)
    .find(Boolean) || description;

  return firstSentence
    .replace(/^Acuerdo por el que se\s+/i, '')
    .replace(/^Resolución por la que se\s+/i, '')
    .replace(/^declara\s+/i, 'Declaratoria de ')
    .replace(/^Declaratoria de el\s+/i, 'Declaratoria del ')
    .replace(/^Decreto por el que se\s+/i, '')
    .replace(/^Aviso por el que se\s+/i, '')
    .replace(/^Circular por la que se\s+/i, '')
    .replace(/\.$/, '')
    .trim();
}

function editorialReading(entry, category) {
  const text = normalizeText(`${entry.title} ${entry.description}`).toLowerCase();

  if (category === 'Comercio Exterior' && /cuota compensatoria|examen de vigencia|antidumping/.test(text)) {
    return 'El examen de vigencia abre la revisión de una cuota compensatoria aplicable a importaciones específicas; quienes operen la mercancía señalada deben revisar origen, fracción arancelaria y exposición comercial antes de cerrar operaciones.';
  }

  if (category === 'Comercio Exterior') {
    return 'La publicación modifica condiciones aplicables a operaciones de importación o exportación; quienes operen mercancías alcanzadas deben revisar requisitos, fracciones arancelarias y documentación antes de ejecutar la operación.';
  }

  if (category === 'Aduanas' && /reglas generales de comercio exterior|rgce/.test(text)) {
    return 'La actualización exige revisar procedimientos internos de despacho, padrones, certificaciones o autorizaciones aduaneras vinculadas con la regla modificada.';
  }

  if (category === 'Aduanas' && /oea|operador economico autorizado|certificacion/.test(text)) {
    return 'La actualización incide en condiciones de certificación o seguridad en la cadena logística; las empresas certificadas deben revisar controles, expedientes y obligaciones operativas asociadas.';
  }

  if (category === 'Aduanas') {
    return 'La publicación modifica reglas o procedimientos aduaneros; las operaciones vinculadas deben revisar despacho, documentación, autorizaciones y controles antes de ejecutar movimientos.';
  }

  if (category === 'Migratorio') {
    return 'La disposición incide en la forma de acreditar o tramitar la permanencia en México; conviene revisar requisitos y documentación antes de presentar o renovar solicitudes.';
  }

  if (category === 'Contratos') {
    return 'La publicación incide en reglas específicas sobre obligaciones o actos jurídicos privados; antes de firmar o ejecutar documentos vinculados conviene revisar alcance, formalidades y efectos exigibles.';
  }

  if (category === 'Divorcios') {
    return 'La modificación incide en derechos u obligaciones derivados de la disolución matrimonial; conviene revisar estrategia, documentación y efectos patrimoniales o familiares antes de promover actuaciones.';
  }

  if (category === 'Sucesiones') {
    return 'La modificación incide en la transmisión o administración del patrimonio familiar; conviene revisar testamentos, documentación y ruta procesal antes de iniciar gestiones sucesorias.';
  }

  return '';
}

async function readExisting() {
  try {
    const raw = await readFile(OUTPUT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sortByDateDesc(items) {
  return items.sort((a, b) => {
    const dateDiff = String(b.fecha || '').localeCompare(String(a.fecha || ''));
    if (dateDiff !== 0) return dateDiff;
    return String(a.titulo || '').localeCompare(String(b.titulo || ''));
  });
}

async function main() {
  const response = await fetch(FEED_URL, {
    headers: {
      'user-agent': 'Insight & Forward Pulso Legal / GitHub Pages updater'
    }
  });

  if (!response.ok) {
    throw new Error(`No se pudo consultar el DOF: ${response.status}`);
  }

  const xml = new TextDecoder('iso-8859-1').decode(await response.arrayBuffer());
  const feedItems = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)]
    .map(match => match[0])
    .map(block => ({
      title: getTag(block, 'title'),
      link: getTag(block, 'link'),
      description: getTag(block, 'description')
    }))
    .filter(item => item.link && item.description)
    .filter(isRelevant)
    .map(item => {
      const categoria = classify(item);
      const dependencia = cleanAgency(item.title);
      const lectura = editorialReading(item, categoria);
      if (!lectura || hasProhibitedLanguage(lectura)) return null;
      return {
        fecha: parseDateFromUrl(item.link),
        dependencia,
        fuente: 'DOF',
        categoria,
        titulo: editorialTitle(item.description),
        lectura,
        url: item.link
      };
    })
    .filter(Boolean);

  const existing = (await readExisting()).filter(isStoredItemValid);
  const byUrl = new Map();

  [...existing, ...feedItems].forEach(item => {
    if (!item?.url) return;
    byUrl.set(item.url, item);
  });

  const merged = sortByDateDesc([...byUrl.values()]).slice(0, MAX_ITEMS);
  await writeFile(OUTPUT_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`Pulso Legal actualizado: ${feedItems.length} nuevas o vigentes, ${merged.length} totales.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
