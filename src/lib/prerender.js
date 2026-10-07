/** Turns a siteContent page into a full static HTML document from the Vite shell. */
import { SITE_NAME, SITE_URL, allPages, renderBodyHtml } from './siteContent.js';
import { mdPath } from './agentData.js';

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

export function pageHtml(shell, page) {
  const url = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" type="text/markdown" href="${SITE_URL}${mdPath(page.path)}" />`,
    `<meta property="og:type" content="${page.kind === 'home' ? 'website' : 'article'}" />`,
    `<meta property="og:site_name" content="${attr(SITE_NAME)}" />`,
    `<meta property="og:title" content="${attr(page.title)}" />`,
    `<meta property="og:description" content="${attr(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary" />`,
    ...(page.jsonld || []).map(jsonLd),
  ].join('\n    ');
  const nav = [['/', 'Home'], ['/library', 'Library'], ['/trigrams', 'Trigrams'], ['/methods', 'Methods'], ['/data', 'Data'], ['/privacy', 'Privacy']]
    .map(([h, l]) => `<a class="underline underline-offset-4 hover:text-ink" href="${h}">${l}</a>`).join(' ');
  const body = `<div class="min-h-screen bg-parchment text-ink"><main class="safe-area-main min-h-screen"><article class="mx-auto max-w-2xl px-6 py-12">${renderBodyHtml(page)}<nav aria-label="Site" class="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-stone/25 pt-6 text-xs text-ink/60">${nav}</nav></article></main></div>`;
  return shell
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${attr(page.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${attr(page.description)}" />`)
    .replace('</head>', () => `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
}

export const PRERENDER_PAGES = () => allPages();
