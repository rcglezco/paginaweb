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
  if (languageFromUrl) return languageFromUrl;

  return detectRegionalLanguage();
}

function getLocalizedUrl(href, language) {
  if (!href || href.startsWith('#') || /^(mailto:|tel:|https?:|javascript:)/i.test(href)) return null;

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin || !url.pathname.endsWith('.html')) return null;

  if (language === 'en') {
    url.searchParams.set('lang', 'en');
  } else {
    url.searchParams.delete('lang');
  }

  return url.href;
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
};

const initialLanguage = normalizeLanguage(readInitialLanguage());
window.setLang(initialLanguage, { skipSave: true });

document.addEventListener('click', event => {
  const button = event.target.closest('.lang-btn');
  if (!button) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  window.setLang(button.textContent.trim().toLowerCase());
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
  window.addEventListener('scroll', updateActiveNav, { passive: true });
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
  window.addEventListener('scroll', updateWhatsappPosition, { passive: true });
  window.addEventListener('resize', updateWhatsappPosition);
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
      teamTrack.offsetHeight;
      teamTrack.style.transition = '';
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
  window.addEventListener('resize', () => {
    clearTeamTouchState();
    applyTeamPosition(false);
  });
  window.addEventListener('orientationchange', () => {
    clearTeamTouchState();
    applyTeamPosition(false);
  });
  applyTeamPosition(false);
}
