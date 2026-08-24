document.addEventListener('click', event => {
  const trigger = event.target.closest('.has-dropdown > a');
  const compactNav = window.matchMedia('(max-width: 900px)').matches;

  if (!trigger || !compactNav) {
    if (!event.target.closest('.has-dropdown')) {
      document.querySelectorAll('.has-dropdown.open').forEach(item => item.classList.remove('open'));
    }
    return;
  }

  const item = trigger.parentElement;
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.has-dropdown.open').forEach(openItem => {
    if (openItem !== item) openItem.classList.remove('open');
  });

  if (!wasOpen) {
    event.preventDefault();
    item.classList.add('open');
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    document.querySelectorAll('.has-dropdown.open').forEach(item => item.classList.remove('open'));
    document.querySelectorAll('nav.mobile-menu-open').forEach(nav => {
      nav.classList.remove('mobile-menu-open');
      const toggle = nav.querySelector('.mobile-menu-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
    document.body.classList.remove('mobile-menu-lock');
  }
});

const siteNav = document.querySelector('nav');

if (siteNav) {
  const navLinksList = siteNav.querySelector('.nav-links');
  const blogLink = siteNav.querySelector('.nav-extra > a');

  if (navLinksList && blogLink && !navLinksList.querySelector('.mobile-blog-item')) {
    const blogItem = document.createElement('li');
    blogItem.className = 'mobile-blog-item';
    blogItem.appendChild(blogLink.cloneNode(true));
    navLinksList.appendChild(blogItem);
  }

  if (!siteNav.querySelector('.mobile-menu-toggle')) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mobile-menu-toggle';
    toggle.setAttribute('aria-label', 'Abrir menú');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';

    const languageSwitch = siteNav.querySelector('.nav-lang');
    if (languageSwitch) {
      siteNav.insertBefore(toggle, languageSwitch);
    } else {
      siteNav.appendChild(toggle);
    }
  }
}

document.addEventListener('click', event => {
  const toggle = event.target.closest('.mobile-menu-toggle');
  const compactNav = window.matchMedia('(max-width: 900px)').matches;
  const nav = toggle?.closest('nav') || event.target.closest('nav.mobile-menu-open');

  if (toggle) {
    event.preventDefault();
    const isOpen = nav.classList.toggle('mobile-menu-open');
    document.body.classList.toggle('mobile-menu-lock', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    if (!isOpen) {
      nav.querySelectorAll('.has-dropdown.open').forEach(item => item.classList.remove('open'));
    }
    return;
  }

  if (!compactNav || !siteNav?.classList.contains('mobile-menu-open')) return;

  if (!event.target.closest('nav')) {
    siteNav.classList.remove('mobile-menu-open');
    document.body.classList.remove('mobile-menu-lock');
    siteNav.querySelector('.mobile-menu-toggle')?.setAttribute('aria-expanded', 'false');
    siteNav.querySelectorAll('.has-dropdown.open').forEach(item => item.classList.remove('open'));
    return;
  }

  const clickedLink = event.target.closest('a[href]');
  const isDropdownTrigger = clickedLink?.parentElement?.classList.contains('has-dropdown');
  if (clickedLink && !isDropdownTrigger) {
    siteNav.classList.remove('mobile-menu-open');
    document.body.classList.remove('mobile-menu-lock');
    siteNav.querySelector('.mobile-menu-toggle')?.setAttribute('aria-expanded', 'false');
    siteNav.querySelectorAll('.has-dropdown.open').forEach(item => item.classList.remove('open'));
  }
});

function updateLocalizedPlaceholders(language) {
  document.querySelectorAll('[data-placeholder-es]').forEach(field => {
    const value = field.getAttribute(`data-placeholder-${language}`);
    if (value) field.setAttribute('placeholder', value);
  });
}

function normalizeLanguage(language) {
  return language === 'en' ? 'en' : 'es';
}

const SITE_ORIGIN = 'https://www.insightandforward.com';
const LANGUAGE_STORAGE_KEY = 'ifls-language';
const SEO_BY_PATH = {
  '/': {
    es: ['Insight & Forward Legal Solutions | Abogados en México', 'Firma legal boutique en México: consultoría, representación, trámites y capacitación en comercio exterior, migración, contratos, sucesiones y familia.'],
    en: ['Insight & Forward Legal Solutions | Lawyers in Mexico', 'Boutique law firm in Mexico providing consulting, representation, legal procedures and training in foreign trade, immigration, contracts, estates and family law.']
  },
  '/blog.html': {
    es: ['Blog | Insight & Forward Legal Solutions', 'Análisis, criterio y seguimiento regulatorio de Insight & Forward Legal Solutions. Pulso Legal y publicaciones especializadas.'],
    en: ['Blog | Insight & Forward Legal Solutions', 'Analysis, professional insight and regulatory monitoring from Insight & Forward Legal Solutions, including Legal Pulse and specialized publications.']
  },
  '/capacitacion.html': {
    es: ['Capacitación Empresarial y Regulatoria | Insight & Forward', 'Programas de capacitación empresarial y regulatoria en México para fortalecer cumplimiento, productividad, comercio exterior y gestión de riesgos.'],
    en: ['Business and Regulatory Training in Mexico | Insight & Forward', 'Business and regulatory training programs in Mexico designed to strengthen compliance, productivity, foreign trade operations and risk management.']
  },
  '/civil.html': {
    es: ['Contratos, Sucesiones y Familia | Insight & Forward', 'Asesoría en contratos, sucesiones, patrimonio familiar, divorcios, pensión alimenticia y asuntos civiles o familiares con enfoque estratégico y discreto.'],
    en: ['Contracts, Estates and Family Law in Mexico | Insight & Forward', 'Legal counsel in Mexico for contracts, estates, family assets, divorce, child support and civil or family matters, with a strategic and discreet approach.']
  },
  '/comercio-exterior.html': {
    es: ['Comercio Exterior, Aduanas y Cumplimiento | Insight & Forward', 'Asesoría en comercio exterior, aduanas y cumplimiento regulatorio en México: importaciones, clasificación arancelaria, OEA, permisos y auditorías.'],
    en: ['Foreign Trade, Customs and Compliance in Mexico | Insight & Forward', 'Advice on foreign trade, customs and regulatory compliance in Mexico, including imports, tariff classification, AEO, permits and audits.']
  },
  '/consultoria.html': {
    es: ['Consultoría Legal Estratégica | Insight & Forward', 'Consultoría legal preventiva y estratégica para proteger intereses, evaluar riesgos y tomar decisiones informadas en México.'],
    en: ['Strategic Legal Consulting in Mexico | Insight & Forward', 'Preventive and strategic legal consulting to protect interests, assess risk and support informed decision-making in Mexico.']
  },
  '/migratorio.html': {
    es: ['Asesoría Migratoria en México | Insight & Forward', 'Asesoría migratoria en México para personas, familias y empresas: visas, residencia temporal o permanente, permisos de trabajo y regularización.'],
    en: ['Immigration Legal Services in Mexico | Insight & Forward', 'Immigration counsel in Mexico for individuals, families and companies, including visas, temporary or permanent residence, work permits and regularization.']
  },
  '/publicaciones.html': {
    es: ['Publicaciones legales y de comercio exterior | Insight & Forward', 'Revista editorial de Insight & Forward con artículos, análisis y criterio profesional sobre regulación, comercio exterior, aduanas, migración y estrategia legal.'],
    en: ['Legal and Foreign Trade Publications | Insight & Forward', 'Insight & Forward editorial journal featuring professional analysis of regulation, foreign trade, customs, immigration and legal strategy in Mexico.']
  },
  '/pulso-legal.html': {
    es: ['Pulso Legal: seguimiento regulatorio en México | Insight & Forward', 'Pulso Legal de Insight & Forward: seguimiento editorial de actualizaciones oficiales relevantes para comercio exterior, cumplimiento y operación empresarial.'],
    en: ['Legal Pulse: Regulatory Monitoring in Mexico | Insight & Forward', 'Insight & Forward Legal Pulse: editorial monitoring of official updates relevant to foreign trade, compliance and business operations in Mexico.']
  },
  '/representacion-legal.html': {
    es: ['Representación Legal | Insight & Forward', 'Representación legal judicial y administrativa para defender intereses ante autoridades y procedimientos en México.'],
    en: ['Legal Representation in Mexico | Insight & Forward', 'Judicial and administrative legal representation to protect clients’ interests before authorities and in proceedings in Mexico.']
  },
  '/tramites.html': {
    es: ['Gestión de Trámites Legales | Insight & Forward', 'Gestión clara y segura de trámites ante autoridades mediante poder notarial o carta poder, según la naturaleza del caso.'],
    en: ['Legal Procedures and Filings in Mexico | Insight & Forward', 'Clear and reliable management of procedures before Mexican authorities under a notarized power of attorney or authorization letter, as appropriate.']
  },
  '/alejandra-ornelas.html': {
    es: ['Alejandra Ornelas | Comercio Exterior, Aduanas y Cumplimiento Normativo | Insight & Forward', 'Conoce la trayectoria profesional de Alejandra Ornelas, especialista en comercio exterior, aduanas, auditoría, cumplimiento normativo y procedimientos administrativos en Insight & Forward.'],
    en: ['Alejandra Ornelas | Foreign Trade, Customs and Compliance | Insight & Forward', 'Learn about Alejandra Ornelas, a specialist in foreign trade, customs, audits, regulatory compliance and administrative proceedings at Insight & Forward.']
  },
  '/hector-garza.html': {
    es: ['Héctor Garza | Compliance, Gestión de Riesgos y Comercio Exterior | Insight & Forward', 'Conoce la trayectoria profesional de Héctor Garza, especialista en comercio exterior, administración aduanera, cumplimiento normativo, auditorías, gestión de riesgos y fortalecimiento institucional.'],
    en: ['Héctor Garza | Compliance, Risk Management and Foreign Trade | Insight & Forward', 'Learn about Héctor Garza, a specialist in foreign trade, customs administration, compliance, audits, risk management and institutional strengthening.']
  },
  '/marcela-herrera.html': {
    es: ['Marcela Herrera | Comercio Exterior, Cumplimiento y Controles Internos | Insight & Forward', 'Conoce la trayectoria profesional de Marcela Herrera, especialista en comercio exterior, cumplimiento normativo, controles internos, fiscalización y mejora de procesos.'],
    en: ['Marcela Herrera | Foreign Trade, Compliance and Internal Controls | Insight & Forward', 'Learn about Marcela Herrera, a specialist in foreign trade, regulatory compliance, internal controls, audits and process improvement.']
  },
  '/roberto-corrales.html': {
    es: ['Roberto Corrales | Comercio Exterior, Aduanas y Migración | Insight & Forward', 'Conoce la trayectoria profesional de Roberto Corrales, especialista en comercio exterior, aduanas, migración y cooperación internacional en Insight & Forward.'],
    en: ['Roberto Corrales | Foreign Trade, Customs and Immigration | Insight & Forward', 'Learn about Roberto Corrales, a specialist in foreign trade, customs, immigration and international cooperation at Insight & Forward.']
  }
};

function getRoutePath() {
  return window.location.pathname === '/index.html' ? '/' : window.location.pathname;
}

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
  } catch (error) {
    const match = document.cookie.match(/(?:^|;\s*)ifls-language=(es|en)(?:;|$)/);
    if (match) return match[1];
  }
  return null;
}

function saveLanguage(language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    document.cookie = `${LANGUAGE_STORAGE_KEY}=${language};path=/;max-age=31536000;SameSite=Lax`;
  }
}

function detectRegionalLanguage() {
  const spanishRegions = new Set([
    'ar', 'bo', 'cl', 'co', 'cr', 'cu', 'do', 'ec', 'sv', 'gt', 'hn', 'mx',
    'ni', 'pa', 'py', 'pe', 'pr', 'uy', 've', 'es'
  ]);
  const latinAmericaTimeZones = new Set([
    'America/Argentina/Buenos_Aires', 'America/Argentina/Catamarca', 'America/Argentina/Cordoba',
    'America/Argentina/Jujuy', 'America/Argentina/La_Rioja', 'America/Argentina/Mendoza',
    'America/Argentina/Rio_Gallegos', 'America/Argentina/Salta', 'America/Argentina/San_Juan',
    'America/Argentina/San_Luis', 'America/Argentina/Tucuman', 'America/Argentina/Ushuaia',
    'America/Asuncion', 'America/Bogota', 'America/Caracas', 'America/Costa_Rica',
    'America/El_Salvador', 'America/Guatemala', 'America/Guayaquil', 'America/Havana',
    'America/La_Paz', 'America/Lima', 'America/Managua', 'America/Mazatlan',
    'America/Merida', 'America/Mexico_City', 'America/Monterrey', 'America/Panama',
    'America/Puerto_Rico', 'America/Santo_Domingo', 'America/Santiago', 'America/Tegucigalpa',
    'America/Tijuana', 'America/Montevideo', 'Europe/Madrid', 'Atlantic/Canary'
  ]);
  const browserLanguages = window.navigator?.languages?.length ? navigator.languages : [window.navigator?.language || ''];
  const hasSpanishRegion = browserLanguages.some(language => {
    const parts = language.toLowerCase().split('-');
    return parts[0] === 'es' || spanishRegions.has(parts[1]);
  });
  const timeZone = window.Intl?.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';

  return hasSpanishRegion || latinAmericaTimeZones.has(timeZone) ? 'es' : 'en';
}

function readInitialLanguage() {
  const params = new URLSearchParams(window.location.search);
  const languageFromUrl = params.get('lang');
  if (languageFromUrl === 'en' || languageFromUrl === 'es') {
    return { language: languageFromUrl, source: 'url' };
  }

  const storedLanguage = readStoredLanguage();
  if (storedLanguage) return { language: storedLanguage, source: 'preference' };

  return { language: detectRegionalLanguage(), source: 'regional' };
}

let currentLanguageSource = 'regional';

function getLocalizedUrl(href, language) {
  if (!href || href.startsWith('#') || /^(mailto:|tel:|https?:|javascript:)/i.test(href)) return null;

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin || !url.pathname.endsWith('.html')) return null;

  if (language === 'en' || currentLanguageSource === 'url') {
    url.searchParams.set('lang', language);
  } else {
    url.searchParams.delete('lang');
  }

  return url.href;
}

function setMetaContent(selector, content) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute('content', content);
}

function setAlternateLanguageLink(hreflang, href) {
  let link = document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    document.head.appendChild(link);
  }
  link.href = href;
}

function updateLanguageMetadata(language) {
  const route = getRoutePath();
  const metadata = SEO_BY_PATH[route]?.[language];
  const defaultUrl = `${SITE_ORIGIN}${route}`;
  const spanishUrl = defaultUrl;
  const englishUrl = `${defaultUrl}?lang=en`;
  const canonicalUrl = currentLanguageSource === 'url' && language === 'en' ? englishUrl : spanishUrl;

  if (metadata) {
    const [title, description] = metadata;
    document.title = title;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', description);
  }

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = canonicalUrl;
  setMetaContent('meta[property="og:url"]', canonicalUrl);
  setAlternateLanguageLink('es', spanishUrl);
  setAlternateLanguageLink('en', englishUrl);
  setAlternateLanguageLink('x-default', defaultUrl);
}

function updateLanguageLinks(language) {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    const localizedUrl = getLocalizedUrl(href, language);
    if (localizedUrl) link.href = localizedUrl;
  });
}

window.setLang = (language, options = {}) => {
  language = normalizeLanguage(language);
  if (options.source) currentLanguageSource = options.source;
  if (options.persist) saveLanguage(language);
  document.documentElement.lang = language;
  document.querySelectorAll('.lang-btn').forEach(button => {
    button.classList.toggle('active', button.textContent.trim().toLowerCase() === language);
  });
  document.querySelectorAll('[data-es]').forEach(element => {
    const value = element.getAttribute(`data-${language}`);
    if (value) element.innerHTML = value;
  });
  updateLocalizedPlaceholders(language);
  updateLanguageLinks(language);
  updateLanguageMetadata(language);
};

const initialLanguage = readInitialLanguage();
window.setLang(initialLanguage.language, { source: initialLanguage.source });

document.addEventListener('click', event => {
  const button = event.target.closest('.lang-btn');
  if (!button) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  window.setLang(button.textContent.trim().toLowerCase(), { persist: true, source: 'preference' });
}, true);

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link) return;

  const language = normalizeLanguage(document.documentElement.lang);
  if (language === 'es') return;

  const localizedUrl = getLocalizedUrl(link.getAttribute('href'), language);
  if (!localizedUrl) return;

  event.preventDefault();
  window.location.href = localizedUrl;
});

document.addEventListener('click', event => {
  const filter = event.target.closest('.blog-filter');
  if (!filter) return;

  const selected = filter.dataset.filter || 'all';
  document.querySelectorAll('.blog-filter').forEach(button => {
    button.classList.toggle('active', button === filter);
  });
  document.querySelectorAll('.blog-card[data-category]').forEach(card => {
    card.classList.toggle('is-hidden', selected !== 'all' && card.dataset.category !== selected);
  });
});

document.addEventListener('click', event => {
  const button = event.target.closest('.btn-send');
  if (!button) return;

  const fields = [...button.parentElement.querySelectorAll('input, textarea')];
  if (!fields.length) return;

  event.preventDefault();
  const [name, email, phone, message] = fields.map(field => field.value.trim());
  const subject = encodeURIComponent(`Mensaje de ${name || 'sitio web IFLS'}`);
  const body = encodeURIComponent([
    `Nombre: ${name}`,
    `Correo: ${email}`,
    `Teléfono: ${phone || 'No proporcionado'}`,
    '',
    message || 'Mensaje no escrito.'
  ].join('\n'));

  window.location.href = `mailto:contacto@insightandforward.com?subject=${subject}&body=${body}`;
});

function setupRelatedServicesFallback() {
  const article = document.querySelector('.article-page article');
  if (!article || article.querySelector('.related-services')) return;

  const content = article.querySelector('.article-content');
  if (!content) return;

  const title = article.querySelector('h1')?.textContent?.trim() || document.title.replace(/\s*\|.*$/, '');
  const text = `${title} ${content.textContent || ''}`.toLowerCase();
  const services = [
    {
      label: 'Comercio Exterior y Aduanas',
      url: '../comercio-exterior.html',
      keywords: ['aduana', 'aduanero', 'comercio exterior', 'importación', 'importacion', 'exportación', 'exportacion', 'incoterm', 'tmec', 't-mec', 'origen', 'pedimento', 'arancel', 'mercancía', 'mercancia', 'immex', 'valor en aduana', 'rgce'],
      description: `Puede apoyar la revisión operativa y documental de los temas aduaneros o de comercio exterior abordados en "${title}".`
    },
    {
      label: 'Movilidad Internacional y Migración',
      url: '../migratorio.html',
      keywords: ['migración', 'migracion', 'migratorio', 'movilidad internacional', 'estancia', 'residencia', 'permanencia', 'extranjero', 'visitante', 'visa', 'voluntario', 'personal extranjero'],
      description: `Puede ser relevante cuando el análisis de "${title}" involucra ingreso, estancia, permanencia o movilidad de personas extranjeras en México.`
    },
    {
      label: 'Contratos, Patrimonio y Familia',
      url: '../civil.html',
      keywords: ['contrato', 'contractual', 'patrimonio', 'familia', 'familiar', 'sucesión', 'sucesion', 'donación', 'donacion', 'fideicomiso', 'sociedad familiar', 'reunificación familiar', 'reunificacion familiar'],
      description: `Puede ayudar cuando el tema tratado en "${title}" requiere ordenar relaciones contractuales, familiares o patrimoniales con soporte jurídico.`
    }
  ];

  const scoreService = service => service.keywords.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score;
  }, 0);

  const selected = services
    .map(service => ({ ...service, score: scoreService(service) }))
    .filter(service => service.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!selected.length) return;

  const section = document.createElement('section');
  section.className = 'related-services';
  section.setAttribute('aria-labelledby', 'servicios-relacionados');

  const heading = document.createElement('h2');
  heading.id = 'servicios-relacionados';
  heading.textContent = 'Servicios relacionados';
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'related-services-grid';
  selected.forEach(service => {
    const item = document.createElement('div');
    item.className = 'related-service';

    const link = document.createElement('a');
    link.href = service.url;
    link.textContent = service.label;

    const description = document.createElement('p');
    description.textContent = service.description;

    item.append(link, description);
    grid.appendChild(item);
  });
  section.appendChild(grid);

  const insertionPoint = article.querySelector('.linkedin-source') || article.querySelector('.article-conversation');
  if (insertionPoint) {
    article.insertBefore(section, insertionPoint);
  } else {
    article.appendChild(section);
  }
}

setupRelatedServicesFallback();

const navLinks = document.querySelectorAll('.nav-links > li > a');

if (navLinks.length) {
  const updateActiveNav = () => {
    let currentSection = '';
    ['inicio', 'nosotros', 'servicios', 'areas', 'contacto'].forEach(id => {
      const section = document.getElementById(id);
      if (section && section.getBoundingClientRect().top < 100) currentSection = id;
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentSection}`);
    });
  };

  updateActiveNav();
  let navFrame = null;
  window.addEventListener('scroll', () => {
    if (navFrame !== null) return;
    navFrame = window.requestAnimationFrame(() => {
      navFrame = null;
      updateActiveNav();
    });
  }, { passive: true });
}

const revealItems = document.querySelectorAll('.reveal');

if (revealItems.length) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('visible'));
  }

  window.setTimeout(() => {
    revealItems.forEach(item => item.classList.add('visible'));
  }, 600);
}

const contactSection = document.getElementById('contacto');
const pageFooter = document.querySelector('footer');
const whatsappButton = document.querySelector('.wa-float');
const emailButton = document.querySelector('.btn-email');

if ((contactSection || pageFooter) && whatsappButton) {
  const updateWhatsappPosition = () => {
    if (emailButton) {
      const emailRect = emailButton.getBoundingClientRect();
      const waRect = whatsappButton.getBoundingClientRect();
      const emailVisible = emailRect.top < window.innerHeight && emailRect.bottom > 0;

      if (emailVisible) {
        const emailCenter = emailRect.top + emailRect.height / 2;
        const exactBottom = window.innerHeight - emailCenter - waRect.height / 2;
        whatsappButton.style.bottom = `${Math.max(18, Math.round(exactBottom))}px`;
        whatsappButton.classList.remove('contact-safe');
        return;
      }

      whatsappButton.style.bottom = '';
    }

    const watchedSections = [contactSection, pageFooter].filter(Boolean);
    const overlapsContent = watchedSections.some(section => {
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 120;
    });

    whatsappButton.classList.toggle('contact-safe', overlapsContent);
  };

  updateWhatsappPosition();
  let whatsappFrame = null;
  const scheduleWhatsappPosition = () => {
    if (whatsappFrame !== null) return;
    whatsappFrame = window.requestAnimationFrame(() => {
      whatsappFrame = null;
      updateWhatsappPosition();
    });
  };
  window.addEventListener('scroll', scheduleWhatsappPosition, { passive: true });
  window.addEventListener('resize', scheduleWhatsappPosition);
}

const teamTrack = document.querySelector('.team-wrap');
const teamPrevButton = document.querySelector('.team-carousel-prev');
const teamNextButton = document.querySelector('.team-carousel-next');

if (teamTrack && teamPrevButton && teamNextButton) {
  const originalCards = [...teamTrack.querySelectorAll('.team-card')];
  const originalCount = originalCards.length;
  let currentIndex = originalCount;
  let isAnimating = false;

  [...originalCards].reverse().forEach(card => {
    const clone = card.cloneNode(true);
    clone.classList.add('team-card-clone');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    teamTrack.insertBefore(clone, teamTrack.firstChild);
  });

  originalCards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.classList.add('team-card-clone');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    teamTrack.appendChild(clone);
  });

  const touchTeamQuery = window.matchMedia('(hover: none), (pointer: coarse)');

  const clearTeamTouchState = () => {
    teamTrack.querySelectorAll('.team-card.is-touch-active').forEach(card => {
      card.classList.remove('is-touch-active');
    });
  };

  teamTrack.addEventListener('click', event => {
    if (!touchTeamQuery.matches) return;

    const target = event.target instanceof Element ? event.target : null;
    const card = target ? target.closest('.team-card') : null;
    if (!card || !teamTrack.contains(card)) return;
    if (target.closest('a[href]')) return;
    event.preventDefault();

    const wasActive = card.classList.contains('is-touch-active');
    clearTeamTouchState();

    if (!wasActive) {
      card.classList.add('is-touch-active');
    }
  });

  document.addEventListener('click', event => {
    if (!touchTeamQuery.matches) return;

    const target = event.target instanceof Element ? event.target : null;
    if (target && target.closest('.team-card')) return;

    clearTeamTouchState();
  });

  const getTeamMetrics = () => {
    const firstCard = teamTrack.querySelector('.team-card');
    if (!firstCard) return { step: 320, visibleCount: 1 };

    const styles = window.getComputedStyle(teamTrack);
    const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    const step = firstCard.getBoundingClientRect().width + gap;
    const visibleCount = Math.max(1, Math.round(teamTrack.parentElement.clientWidth / step));
    return { step, visibleCount };
  };

  const applyTeamPosition = (animate = true) => {
    const { step } = getTeamMetrics();
    teamTrack.style.transition = animate ? '' : 'none';
    teamTrack.style.transform = `translateX(${-currentIndex * step}px)`;
    if (!animate) {
      window.requestAnimationFrame(() => {
        teamTrack.style.transition = '';
      });
    }
  };

  const moveTeam = direction => {
    if (isAnimating) return;
    clearTeamTouchState();
    isAnimating = true;
    currentIndex += direction;
    applyTeamPosition(true);
  };

  teamTrack.addEventListener('transitionend', event => {
    if (event.propertyName !== 'transform') return;

    if (currentIndex >= originalCount * 2) {
      currentIndex -= originalCount;
      applyTeamPosition(false);
    } else if (currentIndex < originalCount) {
      currentIndex += originalCount;
      applyTeamPosition(false);
    }
    isAnimating = false;
  });

  teamPrevButton.addEventListener('click', () => moveTeam(-1));
  teamNextButton.addEventListener('click', () => moveTeam(1));
  let teamFrame = null;
  const scheduleTeamPosition = () => {
    if (teamFrame !== null) return;
    teamFrame = window.requestAnimationFrame(() => {
      teamFrame = null;
      clearTeamTouchState();
      applyTeamPosition(false);
    });
  };
  window.addEventListener('resize', scheduleTeamPosition);
  window.addEventListener('orientationchange', scheduleTeamPosition);
  window.addEventListener('load', () => {
    clearTeamTouchState();
    applyTeamPosition(false);
  });
  applyTeamPosition(false);
}
