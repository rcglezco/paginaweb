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

  window.location.href = `mailto:insightf.legals@gmail.com?subject=${subject}&body=${body}`;
});

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
  window.addEventListener('resize', () => applyTeamPosition(false));
  applyTeamPosition(false);
}
