import { readFile, writeFile } from 'node:fs/promises';

const FEED_URL = 'https://diariooficial.gob.mx/sumario.xml';
const OUTPUT_PATH = new URL('../data/pulso-legal.json', import.meta.url);
const MAX_ITEMS = 24;

const relevantAgencies = [
  'SECRETARIA DE ECONOMIA',
  'SECRETARIA DE HACIENDA',
  'SECRETARIA DE GOBERNACION',
  'SECRETARIA DE RELACIONES EXTERIORES',
  'SECRETARIA DE MEDIO AMBIENTE',
  'SECRETARIA DE AGRICULTURA',
  'SECRETARIA DE SALUD',
  'INSTITUTO MEXICANO DE LA PROPIEDAD INDUSTRIAL',
  'AGENCIA NACIONAL DE ADUANAS',
  'SERVICIO DE ADMINISTRACION TRIBUTARIA',
  'INSTITUTO NACIONAL DE MIGRACION',
  'COMISION FEDERAL PARA LA PROTECCION CONTRA RIESGOS SANITARIOS'
];

const relevantKeywords = [
  'aduana',
  'aduanero',
  'aduanera',
  'arancel',
  'arancelaria',
  'arancelarias',
  'certificacion',
  'comercio exterior',
  'compensatoria',
  'exportacion',
  'exportaciones',
  'extranjero',
  'importacion',
  'importaciones',
  'immex',
  'inm',
  'marca',
  'migracion',
  'migratorio',
  'nom',
  'oea',
  'padron',
  'patente',
  'permiso',
  'prevalidacion',
  'prosec',
  'propiedad industrial',
  'reglas generales',
  'regulaciones',
  'restricciones no arancelarias',
  'residencia',
  'sat',
  'trademark',
  'visa'
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

  if (/migracion|migratorio|inm|visa|residencia|extranjero|refugiado|asilo/.test(text)) {
    return 'Migración';
  }

  if (/impi|propiedad industrial|marca|patente/.test(text)) {
    return 'Propiedad industrial';
  }

  if (/aduana|aduanero|aduanera|comercio exterior|importacion|exportacion|arancel|compensatoria|immex|prosec|padron|nom|restricciones no arancelarias/.test(text)) {
    return 'Comercio exterior';
  }

  if (/sat|fiscal|contribuyente|impuesto|reglas generales|hacienda/.test(text)) {
    return 'Cumplimiento fiscal';
  }

  if (/semarnat|cofepris|agricultura|sanidad|inocuidad|permiso|regulacion/.test(text)) {
    return 'Cumplimiento regulatorio';
  }

  return 'Regulación';
}

function isRelevant(entry) {
  const normalized = normalizeText(`${entry.title} ${entry.description}`).toLowerCase();
  const agencyHit = relevantAgencies.some(agency => normalized.includes(normalizeText(agency).toLowerCase()));
  const keywordHit = relevantKeywords.some(keyword => normalized.includes(normalizeText(keyword).toLowerCase()));
  return agencyHit && keywordHit;
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

function editorialReading(category) {
  const readings = {
    'Comercio exterior': 'Posibles implicaciones para operaciones de comercio exterior, cumplimiento aduanero, autorizaciones, padrones o decisiones logísticas.',
    'Cumplimiento fiscal': 'Actualización con posible incidencia en obligaciones fiscales, criterios administrativos o procesos de cumplimiento.',
    'Cumplimiento regulatorio': 'Lectura relevante para operaciones reguladas, permisos, verificaciones, gestión documental o prevención de riesgos.',
    'Migración': 'Actualización con posible impacto en procesos migratorios, permanencia en México, obligaciones institucionales o gestión ante autoridad.',
    'Propiedad industrial': 'Referencia útil para seguimiento de propiedad industrial, marcas, registros o criterios administrativos ante autoridad.',
    'Regulación': 'Publicación oficial con posible relevancia para seguimiento institucional, cumplimiento y toma de decisiones.'
  };

  return readings[category] || readings.Regulación;
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
      return {
        fecha: parseDateFromUrl(item.link),
        dependencia,
        fuente: 'DOF',
        categoria,
        titulo: editorialTitle(item.description),
        lectura: editorialReading(categoria),
        url: item.link
      };
    });

  const existing = await readExisting();
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
