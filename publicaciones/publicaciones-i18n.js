(function () {
  const ORIGINAL_HEAD = {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
    twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '',
    twitterDescription: document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || ''
  };

  const loaded = new Map();

  function remember(el) {
    if (!el || el.dataset.originalHtml) return;
    el.dataset.originalHtml = el.innerHTML;
  }

  function setContent(el, value, lang) {
    if (!el) return;
    remember(el);
    el.innerHTML = lang === 'en' ? value : el.dataset.originalHtml;
  }

  function setMeta(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  }

  function updateArticleHead(data, lang) {
    if (lang === 'en') {
      const description = data.intro.replace(/<[^>]*>/g, '');
      document.title = data.title + ' | Insight & Forward';
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:title"]', data.title);
      setMeta('meta[property="og:description"]', description);
      setMeta('meta[name="twitter:title"]', data.title);
      setMeta('meta[name="twitter:description"]', description);
      return;
    }

    document.title = ORIGINAL_HEAD.title;
    setMeta('meta[name="description"]', ORIGINAL_HEAD.description);
    setMeta('meta[property="og:title"]', ORIGINAL_HEAD.ogTitle);
    setMeta('meta[property="og:description"]', ORIGINAL_HEAD.ogDescription);
    setMeta('meta[name="twitter:title"]', ORIGINAL_HEAD.twitterTitle);
    setMeta('meta[name="twitter:description"]', ORIGINAL_HEAD.twitterDescription);
  }

  function normalizeHref(href) {
    if (!href) return '';
    return href.replace(/^.*?(publicaciones\/)/, 'publicaciones/').replace(/[?#].*$/, '');
  }

  async function loadOnce(key, loader) {
    if (!loaded.has(key)) loaded.set(key, loader());
    return loaded.get(key);
  }

  async function updateArticle(lang) {
    const key = location.pathname.split('/').pop();
    if (!key || !document.querySelector('.article-page article')) return;

    let module;
    try {
      module = await loadOnce('article:' + key, () => import('./i18n/articles/' + key + '.js?v=lcp-reflow-91'));
    } catch (error) {
      return;
    }
    const data = module.default;
    if (!data) return;

    setContent(document.querySelector('.article-title'), data.title, lang);
    setContent(document.querySelector('.article-hero p'), data.intro, lang);
    setContent(document.querySelector('.article-content'), data.content, lang);
    setContent(document.querySelector('.article-meta span:not(.article-author)'), data.category || '', lang);
    updateArticleHead(data, lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'es';
  }

  async function updateIndex(lang) {
    if (!/\/publicaciones\.html$/.test(location.pathname)) return;

    const { READ_ANALYSIS, INDEX_TRANSLATIONS, INDEX_UI } = await loadOnce('index', () => import('./i18n/index-data.js?v=lcp-reflow-91'));
    const ui = INDEX_UI[lang] || INDEX_UI.es;
    const featuredLabel = document.getElementById('tema-actualidad');
    const recentTitle = document.getElementById('analisis-recientes');
    const recentLink = document.querySelector('.recent-heading a');
    const conversationTitle = document.getElementById('conversemos');
    const conversationText = document.querySelector('.conversation p');
    const conversationAction = document.querySelector('.conversation .entry-action');
    const legalNote = document.querySelector('.legal-note');

    setContent(featuredLabel, ui.currentTopic, lang);
    setContent(recentTitle, ui.recent, lang);
    setContent(recentLink, ui.allArticles, lang);
    setContent(conversationTitle, ui.conversationTitle, lang);
    setContent(conversationText, ui.conversationText, lang);
    setContent(conversationAction, ui.conversationAction, lang);
    setContent(legalNote, ui.legal, lang);

    document.querySelectorAll('.category-filter').forEach((button) => {
      const label = button.querySelector('span:last-child');
      if (!label) return;
      remember(label);
      const original = label.dataset.originalHtml;
      label.innerHTML = lang === 'en' ? (ui.filters[original] || original) : original;
    });

    document.querySelectorAll('.publication-item').forEach((item) => {
      const link = item.querySelector('a[href*="publicaciones/"]');
      const translation = INDEX_TRANSLATIONS[normalizeHref(link && link.getAttribute('href'))];
      if (!translation) return;
      const title = item.querySelector('.featured-title, .card-title');
      const excerpt = item.querySelector('.featured-excerpt, .card-excerpt');
      const tags = item.querySelector('.entry-tags');
      const action = item.querySelector('.entry-action, .card-action');

      setContent(title, translation.title, lang);
      setContent(excerpt, translation.excerpt, lang);
      setContent(tags, '<span>' + translation.tags + '</span>', lang);
      setContent(action, READ_ANALYSIS[lang], lang);
      if (link && lang === 'en') link.setAttribute('aria-label', translation.title);
      if (link && lang === 'es' && title) link.setAttribute('aria-label', title.textContent.trim());
    });
  }

  async function applyPublicationsLanguage(lang) {
    const nextLang = lang === 'en' ? 'en' : 'es';
    document.documentElement.lang = nextLang;
    await Promise.all([updateArticle(nextLang), updateIndex(nextLang)]);
  }

  const previousSetLang = window.setLang;
  window.setLang = function (lang, options) {
    if (typeof previousSetLang === 'function') previousSetLang(lang, options);
    applyPublicationsLanguage(lang);
  };

  document.addEventListener('DOMContentLoaded', function () {
    const initial = document.documentElement.lang === 'en' ? 'en' : 'es';
    applyPublicationsLanguage(initial);
  });
})();
