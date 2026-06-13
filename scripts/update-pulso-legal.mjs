import { writeFile } from 'node:fs/promises';

const DOF_DATE_URL = 'https://diariooficial.gob.mx/index.php';
const OUTPUT_PATH = new URL('../data/pulso-legal.json', import.meta.url);
const MAX_ITEMS = 24;
const FEED_DAYS = 21;
const SHOULD_WRITE_OUTPUT = process.env.PULSO_LEGAL_DRY_RUN !== '1';
const SHOULD_PRINT_ITEMS = process.env.PULSO_LEGAL_PRINT_ITEMS === '1';

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
      { rx: /\bmigracion\b|\bmigratorio\b|\bvisa(s)?\b|\bcondicion(es)? de estancia\b|\bresidencia\b|\bresidencia temporal\b|\bresidencia permanente\b|\bresidente\b|\brefugiado\b|\basilo\b|\bnaturalizacion\b|\bpermiso(s)? de trabajo\b/, weight: 3 }
    ]
  },
  {
    category: 'Aduanas',
    patterns: [
      { rx: /\bagencia nacional de aduanas\b|\banam\b|\brgce\b|\breglas generales de comercio exterior\b/, weight: 5 },
      { rx: /\baduana(s)?\b|\baduanero\b|\baduanera\b|\bdespacho aduanero\b|\bpedimento(s)?\b|\brecinto(s)? fiscalizado(s)?\b|\bprevalidacion\b|\boea\b|\boperador economico autorizado\b|\bpama\b|\bvalor en aduana\b|\bpadron de importadores\b|\bpadron de exportadores\b|\bcertificacion(es)? aduanera(s)?\b|\bfacilitacion comercial\b|\bagente aduanal\b|\bagencia aduanal\b/, weight: 4 }
    ]
  },
  {
    category: 'Comercio Exterior',
    patterns: [
      { rx: /\bcomercio exterior\b|\bimportacion(es)?\b|\bexportacion(es)?\b|\btigie\b|\bregla octava\b|\barancel(es|aria|arias)?\b|\bcuota(s)? compensatoria(s)?\b|\bantidumping\b|\bimmex\b|\bprosec\b|\bprogramas de fomento\b|\brrna\b|\bregulaciones y restricciones no arancelarias\b|\brestricciones no arancelarias\b|\bpermisos previos\b|\bavisos automaticos\b|\bcupos\b|\bfraccion(es)? arancelaria(s)?\b/, weight: 3 }
    ]
  }
];

const legalChangePatterns = [
  /\breforma\b|\bmodifica\b|\badiciona\b|\bderoga\b|\bexpide\b|\bemite\b|\bestablece\b|\bactualiza\b|\bda a conocer\b|\bpublica\b|\bresuelve\b|\bdeclara\b/,
  /\binicio del procedimiento\b|\binicia el procedimiento\b|\bexamen de vigencia\b|\bcuota compensatoria\b|\bcriterio\b|\bjurisprudencia\b|\btesis\b/,
  /\breglas generales\b|\brequisito(s)?\b|\btramite(s)?\b|\bautorizacion(es)?\b|\brestriccion(es)?\b|\bobligacion(es)?\b|\bderecho(s)?\b|\bprocedimiento(s)?\b/
];

const administrativeOnlyPatterns = [
  /\bconvenio(s)?\b.*\b(fasp|fofisp|fondo de aportaciones para la seguridad publica|fondo para el fortalecimiento de las instituciones de seguridad publica)\b/,
  /\breglamento interior\b/,
  /\bmanual(es)? de organizacion\b/,
  /\bnombramiento(s)?\b|\bdesignacion(es)?\b/,
  /\bconsul(es)? honorario(s)?\b|\bviceconsul(es)? honorario(s)?\b|\bautorizacion definitiva\b/,
  /\bsimplificacion y mejora administrativa\b/,
  /\bsuspension de plazos y terminos\b/,
  /\bprograma(s)? interno(s)?\b/,
  /\bpresupuesto\b|\bcuenta publica\b/,
  /\blicitacion(es)?\b|\badquisiciones\b|\bobras publicas\b|\bobra publica\b/,
  /\bseguridad publica\b|\bsistema nacional de seguridad publica\b/
];

const substantiveCategoryPatterns = {
  Migratorio: [
    /\binstituto nacional de migracion\b|\binm\b/,
    /\bmigracion\b|\bmigratorio\b|\bvisa(s)?\b|\bcondicion(es)? de estancia\b|\bresidencia\b|\bresidencia temporal\b|\bresidencia permanente\b|\bresidente\b|\brefugiado\b|\basilo\b|\bnaturalizacion\b|\bpermiso(s)? de trabajo\b|\bextranjero(s)?\b|\bestancia\b/
  ],
  'Comercio Exterior': [
    /\bcomercio exterior\b|\bimportacion(es)?\b|\bexportacion(es)?\b|\btigie\b|\bregla octava\b|\barancel(es|aria|arias)?\b|\bfraccion(es)? arancelaria(s)?\b/,
    /\bcuota(s)? compensatoria(s)?\b|\bantidumping\b|\bimmex\b|\bprosec\b|\bprogramas de fomento\b|\brrna\b|\bregulaciones y restricciones no arancelarias\b|\brestricciones no arancelarias\b|\bpermisos previos\b|\bavisos automaticos\b|\bcupos\b|\bmercancia(s)?\b/
  ],
  Aduanas: [
    /\bagencia nacional de aduanas\b|\banam\b|\brgce\b|\breglas generales de comercio exterior\b/,
    /\baduana(s)?\b|\baduanero\b|\baduanera\b|\bdespacho aduanero\b|\bpedimento(s)?\b|\brecinto(s)? fiscalizado(s)?\b|\bprevalidacion\b|\boea\b|\boperador economico autorizado\b|\bpama\b|\bvalor en aduana\b|\bpadron de importadores\b|\bpadron de exportadores\b|\bcertificacion(es)? aduanera(s)?\b|\bfacilitacion comercial\b|\bagente aduanal\b|\bagencia aduanal\b/
  ]
};

const strictDirectPracticeHookPatterns = [
  /\bcomercio exterior\b|\bimportacion(es)?\b|\bexportacion(es)?\b|\btigie\b|\bregla octava\b|\barancel(es|aria|arias)?\b|\bfraccion(es)? arancelaria(s)?\b|\bcuota(s)? compensatoria(s)?\b|\bantidumping\b|\bimmex\b|\bprosec\b|\bprogramas de fomento\b|\brrna\b|\bregulaciones y restricciones no arancelarias\b|\brestricciones no arancelarias\b|\bpermisos previos\b|\bavisos automaticos\b|\bcupos\b|\bmercancia(s)?\b/,
  /\bagencia nacional de aduanas\b|\banam\b|\brgce\b|\breglas generales de comercio exterior\b|\baduana(s)?\b|\baduanero\b|\baduanera\b|\bdespacho aduanero\b|\bpedimento(s)?\b|\brecinto(s)? fiscalizado(s)?\b|\bprevalidacion\b|\boea\b|\boperador economico autorizado\b|\bpama\b|\bvalor en aduana\b|\bpadron(es)? de importadores\b|\bpadron(es)? de exportadores\b|\bcertificacion(es)? aduanera(s)?\b|\bfacilitacion comercial\b|\bagente aduanal\b|\bagencia aduanal\b/,
  /\binstituto nacional de migracion\b|\binm\b|\bmigracion\b|\bmigratorio\b|\bvisa(s)?\b|\bcondicion(es)? de estancia\b|\bresidencia\b|\bresidencia temporal\b|\bresidencia permanente\b|\bresidente\b|\brefugiado\b|\basilo\b|\bnaturalizacion\b|\bpermiso(s)? de trabajo\b|\bextranjero(s)?\b|\bestancia\b/
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

function parseDateFromUrl(url, fallbackDate = new Date().toISOString().slice(0, 10)) {
  const match = url.match(/[?&]fecha=(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return fallbackDate;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function stripHtml(value = '') {
  return decodeEntities(value)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDofDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return {
    day,
    month,
    year: String(year),
    iso: `${year}-${month}-${day}`,
    dof: `${day}/${month}/${year}`
  };
}

function getRecentDofDates(days = FEED_DAYS) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    return formatDofDate(date);
  });
}

function dofUrlForDate(date) {
  const params = new URLSearchParams({
    year: date.year,
    month: date.month,
    day: date.day
  });
  return `${DOF_DATE_URL}?${params.toString()}`;
}

function cleanAgency(title) {
  return title
    .replace(/^PODER EJECUTIVO\s+/i, '')
    .replace(/^ORGANISMOS AUTONOMOS\s+/i, '')
    .replace(/^ORGANISMOS DESCENTRALIZADOS\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDailyDofItems(html, feedDate) {
  const items = [];
  let currentPower = '';
  let currentAgency = '';
  const rowPattern = /<tr\b[\s\S]*?<\/tr>/gi;
  const linkPattern = /href="\/?nota_detalle\.php\?codigo=(\d+)&amp;fecha=(\d{2}\/\d{2}\/\d{4})"[^>]*>([\s\S]*?)<\/a>/i;

  for (const rowMatch of html.matchAll(rowPattern)) {
    const row = rowMatch[0];

    if (/txt_blanco2/.test(row)) {
      currentPower = stripHtml(row);
      continue;
    }

    if (/subtitle_azul/.test(row)) {
      currentAgency = stripHtml(row);
      continue;
    }

    const linkMatch = row.match(linkPattern);
    if (!linkMatch) {
      continue;
    }

    const [, codigo, fecha, descriptionHtml] = linkMatch;
    const description = stripHtml(descriptionHtml);
    if (!description) {
      continue;
    }

    items.push({
      title: `${currentPower} ${currentAgency}`.trim(),
      link: `https://diariooficial.gob.mx/nota_detalle.php?codigo=${codigo}&fecha=${fecha}`,
      description,
      feedDate: feedDate.iso
    });
  }

  return items;
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

function isAdministrativeOnlyNotice(text) {
  return hasAnyPattern(text, administrativeOnlyPatterns);
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

  if (isAdministrativeOnlyNotice(text)) {
    return false;
  }

  if (isPublicHealthNoticeWithoutDirectPracticeHook(text)) {
    return false;
  }

  if (consultationNoticePattern.test(text) && ['Comercio Exterior', 'Aduanas'].includes(category)) {
    return hasCategorySubstance(text, 'Comercio Exterior') || hasCategorySubstance(text, 'Aduanas');
  }

  return true;
}
function isRelevant(entry) {
  const category = classify(entry);

  if (!AUTHORIZED_CATEGORIES.includes(category)) {
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

function sortByDateDesc(items) {
  return items.sort((a, b) => {
    const dateDiff = String(b.fecha || '').localeCompare(String(a.fecha || ''));
    if (dateDiff !== 0) return dateDiff;
    return String(a.titulo || '').localeCompare(String(b.titulo || ''));
  });
}

async function main() {
  const feedItems = [];

  for (const feedDate of getRecentDofDates()) {
    const response = await fetch(dofUrlForDate(feedDate), {
      headers: {
        'user-agent': 'Insight & Forward Pulso Legal / GitHub Pages updater'
      }
    });

    if (!response.ok) {
      throw new Error(`No se pudo consultar el DOF para ${feedDate.dof}: ${response.status}`);
    }

    const html = new TextDecoder('iso-8859-1').decode(await response.arrayBuffer());
    feedItems.push(...parseDailyDofItems(html, feedDate));
  }

  const relevantFeedItems = feedItems.filter(isRelevant);

  const newItems = relevantFeedItems
    .map(item => {
      const categoria = classify(item);
      const dependencia = cleanAgency(item.title);
      const lectura = editorialReading(item, categoria);
      if (!lectura || hasProhibitedLanguage(lectura)) return null;
      return {
        fecha: parseDateFromUrl(item.link, item.feedDate),
        dependencia,
        fuente: 'DOF',
        categoria,
        titulo: editorialTitle(item.description),
        lectura,
        url: item.link
      };
    })
    .filter(Boolean);

  const byUrl = new Map();

  newItems.forEach(item => {
    if (!item?.url) return;
    byUrl.set(item.url, item);
  });

  const merged = sortByDateDesc([...byUrl.values()]).slice(0, MAX_ITEMS);
  if (SHOULD_WRITE_OUTPUT) {
    await writeFile(OUTPUT_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  }
  console.log(`Pulso Legal: total recibido ${feedItems.length}, total conservado ${newItems.length}, total descartado ${feedItems.length - newItems.length}.`);
  console.log(`Pulso Legal actualizado: ${newItems.length} nuevas o vigentes, ${merged.length} totales.`);
  if (SHOULD_PRINT_ITEMS) {
    newItems.forEach(item => {
      console.log([item.fecha, item.dependencia, item.categoria, item.titulo].join(' | '));
    });
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
