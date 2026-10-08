import { HEXAGRAM_NAMES } from './hexagramData.js';
import { HEXAGRAM_INTERPRETATIONS } from './hexagramInterpretations.js';

export const SITE_ORIGIN = 'https://thefreeiching.com';
export const OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;
export const DEFAULT_DESCRIPTION = 'A quiet, transparent I Ching oracle with guided and deep readings, changing-line text, and a private reflection journal.';
const OG_IMAGE_ALT = 'The Free I Ching, a quiet oracle';

const APP_TITLES = {
  '/journal': 'Journal',
  '/timeline': 'Timeline',
  '/privacy': 'Privacy',
  '/support': 'Support',
  '/support/thanks': 'Thank you',
  '/supporter': 'Supporter',
  '/login': 'Sign in',
  '/signup': 'Create an account',
  '/profile': 'Profile',
};

function normalizePath(pathname) {
  if (!pathname) return '/';
  const path = String(pathname).split('?')[0].split('#')[0] || '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

function truncate(text, max = 170) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > 80 ? cut.slice(0, space) : cut).trim()}…`;
}

export function publicPaths() {
  const hexagrams = Array.from({ length: 64 }, (_, index) => `/library/${index + 1}`);
  return ['/', '/library', ...hexagrams];
}

export function seoForPath(pathname) {
  const path = normalizePath(pathname);

  if (path === '/') {
    return page({
      path,
      title: 'The Free I Ching: A Quiet Oracle',
      description: DEFAULT_DESCRIPTION,
      canonical: `${SITE_ORIGIN}/`,
    });
  }

  if (path === '/library') {
    return page({
      path,
      title: 'Hexagram Library · The Free I Ching',
      description: 'Browse all sixty-four I Ching hexagrams. Study their structure, contemporary interpretation, and line text at your own pace.',
      canonical: `${SITE_ORIGIN}/library`,
    });
  }

  const hexagramMatch = path.match(/^\/library\/(\d+)$/);
  if (hexagramMatch) {
    const number = Number(hexagramMatch[1]);
    const name = HEXAGRAM_NAMES[number];
    const interpretation = HEXAGRAM_INTERPRETATIONS[number];
    if (name && interpretation) {
      return page({
        path,
        title: `${number}. ${name} · The Free I Ching`,
        description: truncate(interpretation.judgment),
        canonical: `${SITE_ORIGIN}/library/${number}`,
        type: 'article',
      });
    }
  }

  const appTitle = APP_TITLES[path] || (path.startsWith('/reading/') ? 'Reading' : null);
  if (appTitle) {
    return page({
      path,
      title: `${appTitle} · The Free I Ching`,
      description: DEFAULT_DESCRIPTION,
      robots: 'noindex',
      prerender: false,
    });
  }

  return page({
    path,
    title: 'Path Not Found · The Free I Ching',
    description: 'The way you seek does not exist. Return to the oracle and begin again.',
    robots: 'noindex',
    prerender: false,
  });
}

function page({
  path,
  title,
  description,
  canonical = null,
  robots = 'index, follow',
  type = 'website',
  prerender = true,
}) {
  return { path, title, description, canonical, robots, type, prerender };
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderHead(seo, prerenderPath = '') {
  const title = esc(seo.title);
  const description = esc(seo.description);
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
  ];

  if (seo.canonical) {
    tags.push(`<link rel="canonical" href="${esc(seo.canonical)}" />`);
  }

  tags.push(
    `<meta name="robots" content="${esc(seo.robots)}" />`,
    `<meta property="og:type" content="${esc(seo.type)}" />`,
    `<meta property="og:site_name" content="The Free I Ching" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
  );

  if (seo.canonical) {
    tags.push(`<meta property="og:url" content="${esc(seo.canonical)}" />`);
  }

  tags.push(
    `<meta property="og:image" content="${esc(OG_IMAGE)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(OG_IMAGE_ALT)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${esc(OG_IMAGE)}" />`,
    `<meta name="prerender-path" content="${esc(prerenderPath)}" />`,
  );

  return tags.map((tag) => `    ${tag}`).join('\n');
}

export function sitemapXml(paths = publicPaths()) {
  const urls = paths.map((path) => {
    const loc = path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
    return `  <url><loc>${esc(loc)}</loc></url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applyDocumentMeta(pathname) {
  if (typeof document === 'undefined') return;
  const seo = seoForPath(pathname);
  document.title = seo.title;
  upsertMeta('name', 'description', seo.description);
  upsertMeta('name', 'robots', seo.robots);
  upsertMeta('property', 'og:type', seo.type);
  upsertMeta('property', 'og:site_name', 'The Free I Ching');
  upsertMeta('property', 'og:title', seo.title);
  upsertMeta('property', 'og:description', seo.description);
  upsertMeta('property', 'og:url', seo.canonical);
  upsertMeta('property', 'og:image', OG_IMAGE);
  upsertMeta('property', 'og:image:alt', OG_IMAGE_ALT);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', seo.title);
  upsertMeta('name', 'twitter:description', seo.description);
  upsertMeta('name', 'twitter:image', OG_IMAGE);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!seo.canonical) {
    canonical?.remove();
    return;
  }
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = seo.canonical;
}
