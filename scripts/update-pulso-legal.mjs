import { readFile, writeFile } from 'node:fs/promises';

const DOF_DATE_URL = 'https://diariooficial.gob.mx/index.php';
const SNICE_ACTUALIDAD_URL = 'https://www.snice.gob.mx/cs/avi/snice/historicos.actualidad.html';
const TFJA_ACUERDOS_URL = 'https://www.tfja.gob.mx/acuerdos/acuerdos_2026/';
const OUTPUT_PATH = new URL('../data/pulso-legal.json', import.meta.url);
const MAX_ITEMS = 24;
const MEXICO_TIME_ZONE = 'America/Mexico_City';
const SHOULD_WRITE_OUTPUT = process.env.PULSO_LEGAL_DRY_RUN !== '1';
const SHOULD_PRINT_ITEMS = process.env.PULSO_LEGAL_PRINT_ITEMS === '1';
const SHOULD_PRINT_AUDIT = process.env.PULSO_LEGAL_AUDIT !== '0';

const customsOfficeNames = [
  'acapulco',
  'agua prieta',
  'aeropuerto internacional de la ciudad de mexico',
  'aeropuerto internacional felipe angeles',
  'aguascalientes',
  'altamira',
  'cancun',
  'chihuahua',
  'ciudad acuña',
  'ciudad acuna',
  'ciudad camargo',
  'ciudad del carmen',
  'ciudad hidalgo',
  'ciudad juarez',
  'ciudad miguel aleman',
  'ciudad reynosa',
  'coatzacoalcos',
  'colombia',
  'dos bocas',
  'ensenada',
  'guadalajara',
  'guanajuato',
  'guaymas',
  'la paz',
  'lazaro cardenas',
  'manzanillo',
  'matamoros',
  'mazatlan',
  'mexicali',
  'monterrey',
  'naco',
  'nogales',
  'nuevo laredo',
  'ojinaga',
  'piedras negras',
  'progreso',
  'puebla',
  'puerto palomas',
  'queretaro',
  'salina cruz',
  'san luis rio colorado',
  'sonoyta',
  'subteniente lopez',
  'tampico',
  'tecate',
  'tijuana',
  'toluca',
  'torreon',
  'tuxpan',
  'tuxpam',
  'veracruz'
];

const customsOfficesAlternation = customsOfficeNames.join('|');
const customsOfficePattern = new RegExp(`\\baduana(?:s)?\\s+(?:de|del|en|ubicadas?\\s+en(?:\\s+los)?(?:\\s+puertos?\\s+de)?)\\s+(?:mexico|${customsOfficesAlternation})\\b|\\bpuertos?\\s+de\\s+(?:${customsOfficesAlternation})\\b`, 'i');

const AUTHORIZED_CATEGORIES = [
  'Migratorio',
  'Comercio Exterior',
  'Aduanas',
  'Defensa Fiscal'
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
      { rx: /\bley aduanera\b|\breglamento de la ley aduanera\b|\btransito aduanero\b|\btransito internacional\b|\btransito interno\b|\bmercancia(s)? en transito\b|\bdeposito fiscal\b|\bgarantia en cuenta aduanera\b|\bcuenta aduanera\b|\bcorredor interoceanico\b|\bistmo de tehuantepec\b/, weight: 5 },
      { rx: customsOfficePattern, weight: 4 },
      { rx: /\baduana(s)?\b|\baduanero\b|\baduanera\b|\bdespacho aduanero\b|\bpedimento(s)?\b|\brecinto(s)? fiscalizado(s)?\b|\bprevalidacion\b|\boea\b|\boperador economico autorizado\b|\bpama\b|\bvalor en aduana\b|\bpadron de importadores\b|\bpadron de exportadores\b|\bcertificacion(es)? aduanera(s)?\b|\bfacilitacion comercial\b|\bagente aduanal\b|\bagencia aduanal\b/, weight: 4 }
    ]
  },
  {
    category: 'Comercio Exterior',
    patterns: [
      { rx: /\bley de los impuestos generales de importacion y de exportacion\b|\bligie\b|\btigie\b|\btarifa de la ley de los impuestos generales de importacion y de exportacion\b|\bley de comercio exterior\b|\breglamento de la ley de comercio exterior\b/, weight: 5 },
      { rx: /\bcomercio exterior\b|\bimportacion(es)?\b|\bexportacion(es)?\b|\bregla octava\b|\barancel(es|aria|arias)?\b|\bcuota(s)? compensatoria(s)?\b|\bantidumping\b|\bimmex\b|\bprosec\b|\bdrawback\b|\bprogramas de fomento\b|\brrna\b|\bregulaciones y restricciones no arancelarias\b|\brestricciones no arancelarias\b|\bpermisos previos\b|\bavisos automaticos\b|\bcupos\b|\bfraccion(es)? arancelaria(s)?\b/, weight: 3 }
    ]
  }
];

const legalChangePatterns = [
  /\breforma\b|\bmodifica\b|\badiciona\b|\bderoga\b|\bexpide\b|\bemite\b|\bestablece\b|\bestablecen\b|\bactualiza\b|\bda a conocer\b|\bpublica\b|\bresuelve\b|\bdeclara\b|\botorga\b|\botorgan\b|\bexenta\b|\bexentan\b|\bsuspende\b|\bsuspenden\b/,
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
    /\bley de los impuestos generales de importacion y de exportacion\b|\bligie\b|\btigie\b|\btarifa de la ley de los impuestos generales de importacion y de exportacion\b|\bley de comercio exterior\b|\breglamento de la ley de comercio exterior\b/,
    /\bcomercio exterior\b|\bimportacion(es)?\b|\bexportacion(es)?\b|\bregla octava\b|\barancel(es|aria|arias)?\b|\bfraccion(es)? arancelaria(s)?\b/,
    /\bcuota(s)? compensatoria(s)?\b|\bantidumping\b|\bimmex\b|\bprosec\b|\bdrawback\b|\bprogramas de fomento\b|\brrna\b|\bregulaciones y restricciones no arancelarias\b|\brestricciones no arancelarias\b|\bpermisos previos\b|\bavisos automaticos\b|\bcupos\b|\bmercancia(s)?\b/
  ],
  Aduanas: [
    /\bagencia nacional de aduanas\b|\banam\b|\brgce\b|\breglas generales de comercio exterior\b/,
    /\bley aduanera\b|\breglamento de la ley aduanera\b|\btransito aduanero\b|\btransito internacional\b|\btransito interno\b|\bmercancia(s)? en transito\b|\bdeposito fiscal\b|\bgarantia en cuenta aduanera\b|\bcuenta aduanera\b|\bcorredor interoceanico\b|\bistmo de tehuantepec\b/,
    customsOfficePattern,
    /\baduana(s)?\b|\baduanero\b|\baduanera\b|\bdespacho aduanero\b|\bpedimento(s)?\b|\brecinto(s)? fiscalizado(s)?\b|\bprevalidacion\b|\boea\b|\boperador economico autorizado\b|\bpama\b|\bvalor en aduana\b|\bpadron de importadores\b|\bpadron de exportadores\b|\bcertificacion(es)? aduanera(s)?\b|\bfacilitacion comercial\b|\bagente aduanal\b|\bagencia aduanal\b/
  ],
  'Defensa Fiscal': [
    /\btribunal federal de justicia administrativa\b|\btfja\b|\bjuicio contencioso administrativo\b/,
    /\bplazo(s)?\b|\btermino(s)?\b|\bdia(s)? inhabil(es)?\b|\bsuspension de actividades jurisdiccionales\b|\bsala regional\b|\bexpediente(s)?\b|\bpromocion(es)?\b|\boficialia de partes\b/
  ]
};

const strictDirectPracticeHookPatterns = [
  /\bley de los impuestos generales de importacion y de exportacion\b|\bligie\b|\btigie\b|\btarifa de la ley de los impuestos generales de importacion y de exportacion\b|\bley de comercio exterior\b|\breglamento de la ley de comercio exterior\b|\bcomercio exterior\b|\bimportacion(es)?\b|\bexportacion(es)?\b|\bregla octava\b|\barancel(es|aria|arias)?\b|\bfraccion(es)? arancelaria(s)?\b|\bcuota(s)? compensatoria(s)?\b|\bantidumping\b|\bimmex\b|\bprosec\b|\bdrawback\b|\bprogramas de fomento\b|\brrna\b|\bregulaciones y restricciones no arancelarias\b|\brestricciones no arancelarias\b|\bpermisos previos\b|\bavisos automaticos\b|\bcupos\b|\bmercancia(s)?\b/,
  /\bley aduanera\b|\breglamento de la ley aduanera\b|\btransito aduanero\b|\btransito internacional\b|\btransito interno\b|\bmercancia(s)? en transito\b|\bdeposito fiscal\b|\bgarantia en cuenta aduanera\b|\bcuenta aduanera\b|\bcorredor interoceanico\b|\bistmo de tehuantepec\b/,
  customsOfficePattern,
  /\bagencia nacional de aduanas\b|\banam\b|\brgce\b|\breglas generales de comercio exterior\b|\baduana(s)?\b|\baduanero\b|\baduanera\b|\bdespacho aduanero\b|\bpedimento(s)?\b|\brecinto(s)? fiscalizado(s)?\b|\bprevalidacion\b|\boea\b|\boperador economico autorizado\b|\bpama\b|\bvalor en aduana\b|\bpadron(es)? de importadores\b|\bpadron(es)? de exportadores\b|\bcertificacion(es)? aduanera(s)?\b|\bfacilitacion comercial\b|\bagente aduanal\b|\bagencia aduanal\b/,
  /\binstituto nacional de migracion\b|\binm\b|\bmigracion\b|\bmigratorio\b|\bvisa(s)?\b|\bcondicion(es)? de estancia\b|\bresidencia\b|\bresidencia temporal\b|\bresidencia permanente\b|\bresidente\b|\brefugiado\b|\basilo\b|\bnaturalizacion\b|\bpermiso(s)? de trabajo\b|\bextranjero(s)?\b|\bestancia\b/,
  /\btribunal federal de justicia administrativa\b|\btfja\b|\bjuicio contencioso administrativo\b|\bsala regional\b|\bsuspension de actividades jurisdiccionales\b|\bplazo(s)?\b|\btermino(s)?\b|\bdia(s)? inhabil(es)?\b|\boficialia de partes\b/
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

function parseDottedDate(value = '') {
  const match = value.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function datePartsFromIso(value = '') {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return {
    day,
    month,
    year,
    iso: value,
    dof: `${day}/${month}/${year}`
  };
}

function getMexicoToday() {
  if (process.env.PULSO_LEGAL_DATE) {
    const override = datePartsFromIso(process.env.PULSO_LEGAL_DATE);
    if (override) return override;
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date()).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    day: parts.day,
    month: parts.month,
    year: parts.year,
    iso: `${parts.year}-${parts.month}-${parts.day}`,
    dof: `${parts.day}/${parts.month}/${parts.year}`
  };
}

function isTodayMexicoIsoDate(value = '') {
  return value === getMexicoToday().iso;
}

function stripHtml(value = '') {
  return decodeEntities(value)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(url = '', base) {
  try {
    return new URL(decodeEntities(url), base).toString();
  } catch {
    return '';
  }
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

function getDofDatesForCurrentRun() {
  return [getMexicoToday()];
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

function parseSniceItems(html) {
  const items = [];
  const rowPattern = /<tr\b[\s\S]*?<\/tr>/gi;

  for (const rowMatch of html.matchAll(rowPattern)) {
    const row = rowMatch[0];
    const cells = [...row.matchAll(/<td\b[\s\S]*?<\/td>/gi)].map(cell => cell[0]);
    if (cells.length < 3) continue;

    const date = parseDottedDate(stripHtml(cells[0]));
    if (!isTodayMexicoIsoDate(date)) continue;

    const linkMatch = cells[0].match(/href=["']([^"']+)["']/i);
    const description = cleanSniceTitle(stripHtml(cells[1]));
    const area = stripHtml(cells[2]);
    const url = absoluteUrl(linkMatch?.[1] || SNICE_ACTUALIDAD_URL, SNICE_ACTUALIDAD_URL);

    if (!description || !url) continue;

    items.push({
      fecha: date,
      dependencia: area ? `SNICE · ${area}` : 'SNICE',
      fuente: 'SNICE',
      categoria: /permiso|aviso automatico|rrna|regulacion|restriccion/i.test(normalizeText(description))
        ? 'Aduanas'
        : 'Comercio Exterior',
      titulo: description.replace(/\.$/, '').trim(),
      lectura: sniceReading(description),
      url
    });
  }

  return items.filter(isRelevantSniceItem);
}

function cleanSniceTitle(value = '') {
  return value
    .replace(/\s+\d{2}\.\d{2}\.\d{3,4}\.?$/g, '')
    .replace(/\bCanad$/i, 'Canadá')
    .replace(/\bmercancís\b/gi, 'mercancías')
    .replace(/\s+/g, ' ')
    .trim();
}

function sniceReading(description = '') {
  const text = normalizeText(description).toLowerCase();

  if (/cupo|tpl|licitacion|lpn/.test(text)) {
    return 'El aviso abre o documenta un procedimiento de cupos o asignaciones comerciales; las empresas interesadas deben revisar bases, elegibilidad, documentación y calendario antes de participar.';
  }

  if (/permiso previo|aviso automatico|rrna|regulacion|restriccion/.test(text)) {
    return 'La publicación incide en permisos o requisitos operativos para importar o exportar mercancías; conviene revisar vigencia, documentación y operaciones pendientes antes del despacho.';
  }

  return 'El aviso tiene impacto operativo en comercio exterior; quienes importen o exporten mercancías relacionadas deben revisar requisitos, fechas y documentación aplicable.';
}

function isRelevantSniceItem(item) {
  const text = normalizeText(`${item.dependencia} ${item.titulo}`).toLowerCase();
  return /\bcupo(s)?\b|\bpermiso(s)? previo(s)?\b|\baviso(s)? automatico(s)?\b|\blicitacion\b|\blpn\b|\btpl\b|\bimportacion(es)?\b|\bexportacion(es)?\b|\bregla(s)?\b|\btramite(s)?\b|\brrna\b|\bregulacion(es)?\b|\brestriccion(es)?\b|\barancel(es)?\b|\bcertificado(s)?\b/.test(text);
}

function parseSpanishLongDate(value = '') {
  const months = {
    enero: '01',
    febrero: '02',
    marzo: '03',
    abril: '04',
    mayo: '05',
    junio: '06',
    julio: '07',
    agosto: '08',
    septiembre: '09',
    setiembre: '09',
    octubre: '10',
    noviembre: '11',
    diciembre: '12'
  };
  const text = normalizeText(value).toLowerCase();
  const match = text.match(/\b(\d{1,2}) de ([a-z]+) de (\d{4})\b/);
  if (!match) return '';
  const [, day, monthName, year] = match;
  const month = months[monthName];
  return month ? `${year}-${month}-${String(day).padStart(2, '0')}` : '';
}

function parseTfjaItems(html) {
  const items = [];
  const blockPattern = /<p>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>\s*<ul>([\s\S]*?)<\/ul>/gi;

  for (const blockMatch of html.matchAll(blockPattern)) {
    const fecha = parseSpanishLongDate(stripHtml(blockMatch[1]));
    if (!isTodayMexicoIsoDate(fecha)) continue;

    const listHtml = blockMatch[2];
    for (const itemMatch of listHtml.matchAll(/<li\b[\s\S]*?<\/li>/gi)) {
      const itemHtml = itemMatch[0];
      const linkMatch = itemHtml.match(/href=["']([^"']+)["'][\s\S]*?>([\s\S]*?)<\/a>/i);
      const code = stripHtml(linkMatch?.[2] || '');
      const description = stripHtml(itemHtml)
        .replace(new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '')
        .trim();
      const url = absoluteUrl(linkMatch?.[1] || '', TFJA_ACUERDOS_URL);

      if (!description || !url) continue;

      const item = {
        fecha,
        dependencia: 'Tribunal Federal de Justicia Administrativa',
        fuente: 'TFJA',
        categoria: 'Defensa Fiscal',
        titulo: code ? `${code}: ${description.replace(/\.$/, '').trim()}` : description.replace(/\.$/, '').trim(),
        lectura: 'La suspensión incide en el cómputo de plazos ante el TFJA; conviene revisar expedientes fiscales, aduaneros o de comercio exterior radicados en la sala correspondiente antes de presentar promociones o recursos.',
        url
      };

      if (isRelevantTfjaItem(item)) {
        items.push(item);
      }
    }
  }

  return items;
}

function isRelevantTfjaItem(item) {
  const text = normalizeText(`${item.titulo} ${item.lectura}`).toLowerCase();
  return /suspension de actividades jurisdiccionales|suspension de plazos|no corrieron terminos|dia inhabil|oficialia de partes|sala regional/.test(text);
}

async function fetchText(url, encoding = 'utf8') {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Insight & Forward Pulso Legal / GitHub Pages updater'
    }
  });

  if (!response.ok) {
    throw new Error(`No se pudo consultar ${url}: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  return new TextDecoder(encoding).decode(buffer);
}

async function collectSniceItems() {
  try {
    const html = await fetchText(SNICE_ACTUALIDAD_URL, 'utf8');
    return parseSniceItems(html);
  } catch (error) {
    console.warn(`Pulso Legal: SNICE no se pudo consultar (${error.message}).`);
    return [];
  }
}

async function collectTfjaItems() {
  try {
    const html = await fetchText(TFJA_ACUERDOS_URL, 'utf8');
    return parseTfjaItems(html);
  } catch (error) {
    console.warn(`Pulso Legal: TFJA no se pudo consultar (${error.message}).`);
    return [];
  }
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

function rejectionReasons(entry) {
  const category = classify(entry);
  const text = normalizeText(`${entry.title} ${entry.description}`).toLowerCase();
  const reasons = [];

  if (!category) {
    reasons.push('sin categoría sustantiva');
  } else if (!AUTHORIZED_CATEGORIES.includes(category)) {
    reasons.push(`categoría no autorizada: ${category}`);
  }

  if (!isDirectLegalChange(entry)) {
    reasons.push('sin verbo normativo relevante');
  }

  if (category && !hasStrictDirectPracticeHook(text)) {
    reasons.push('sin vínculo operativo directo');
  }

  if (category && !hasCategorySubstance(text, category)) {
    reasons.push(`sin sustancia suficiente para ${category}`);
  }

  if (isAdministrativeOnlyNotice(text)) {
    reasons.push('administrativo interno');
  }

  if (isPublicHealthNoticeWithoutDirectPracticeHook(text)) {
    reasons.push('salud pública sin vínculo directo');
  }

  return reasons.length ? reasons.join('; ') : 'no relevante por regla compuesta';
}

function printDofAudit(feedItems, dofItems) {
  if (!SHOULD_PRINT_AUDIT) return;

  const keptUrls = new Set(dofItems.map(item => item.url));
  console.log('Pulso Legal auditoría DOF conservados:');
  dofItems.forEach(item => {
    console.log(`CONSERVADO | ${item.fecha} | ${item.dependencia} | ${item.categoria} | ${item.titulo}`);
  });

  console.log('Pulso Legal auditoría DOF descartados:');
  feedItems
    .filter(item => !keptUrls.has(item.link))
    .forEach(item => {
      console.log(`DESCARTADO | ${item.feedDate} | ${cleanAgency(item.title)} | ${editorialTitle(item.description)} | razón: ${rejectionReasons(item)}`);
    });
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

  if (category === 'Aduanas' && /transito aduanero|transito internacional|mercancias en transito|corredor interoceanico/.test(text)) {
    return 'La publicación incide en operaciones de tránsito aduanero o internacional; quienes muevan mercancías bajo esta figura deben revisar ruta autorizada, condiciones de traslado, garantías y consecuencias por incumplimiento.';
  }

  if (category === 'Comercio Exterior' && /cuota compensatoria|examen de vigencia/.test(text)) {
    return 'El examen de vigencia abre la revisión de una cuota compensatoria aplicable a importaciones específicas; quienes operen la mercancía señalada deben revisar origen, fracción arancelaria y exposición comercial antes de cerrar operaciones.';
  }

  if (category === 'Comercio Exterior' && /ligie|tigie|tarifa de la ley de los impuestos generales de importacion y de exportacion|impuesto general de importacion|arancel/.test(text)) {
    return 'La publicación modifica tratamiento arancelario o condiciones de clasificación aplicables a mercancías específicas; las empresas alcanzadas deben revisar fracción arancelaria, requisitos y alcance operativo antes de importar.';
  }

  if (category === 'Comercio Exterior' && /antidumping/.test(text)) {
    return 'El procedimiento antidumping puede modificar cargas o condiciones aplicables a importaciones específicas; quienes operen la mercancía señalada deben revisar origen, fracción arancelaria y exposición comercial.';
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

async function readStoredItems() {
  try {
    const raw = await readFile(OUTPUT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredItemValid) : [];
  } catch {
    return [];
  }
}

async function main() {
  const feedItems = [];
  const runDate = getMexicoToday();
  console.log(`Pulso Legal: fecha de revisión México ${runDate.iso}.`);

  for (const feedDate of getDofDatesForCurrentRun()) {
    const html = await fetchText(dofUrlForDate(feedDate), 'iso-8859-1');
    feedItems.push(...parseDailyDofItems(html, feedDate));
  }

  const relevantFeedItems = feedItems.filter(isRelevant);

  const dofItems = relevantFeedItems
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

  const sniceItems = await collectSniceItems();
  const tfjaItems = await collectTfjaItems();
  const newItems = [
    ...dofItems,
    ...sniceItems,
    ...tfjaItems
  ];

  const storedItems = await readStoredItems();
  const byUrl = new Map();

  storedItems.forEach(item => {
    if (!item?.url) return;
    byUrl.set(item.url, item);
  });

  newItems.forEach(item => {
    if (!item?.url) return;
    byUrl.set(item.url, item);
  });

  const merged = sortByDateDesc([...byUrl.values()]).slice(0, MAX_ITEMS);
  if (SHOULD_WRITE_OUTPUT) {
    await writeFile(OUTPUT_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  }
  console.log(`Pulso Legal: DOF recibido ${feedItems.length}, DOF conservado ${dofItems.length}, DOF descartado ${feedItems.length - dofItems.length}.`);
  console.log(`Pulso Legal: SNICE conservado ${sniceItems.length}, TFJA conservado ${tfjaItems.length}.`);
  console.log(`Pulso Legal actualizado: ${newItems.length} nuevas o vigentes, ${merged.length} totales.`);
  printDofAudit(feedItems, dofItems);
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
