import { build } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { DEFAULT_DESCRIPTION, publicPaths, renderHead, seoForPath, sitemapXml } from '../src/lib/seo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

function inject(template, appHtml, head) {
  if (!template.includes('<!--seo:start-->') || !template.includes('<!--seo:end-->')) {
    throw new Error('dist/index.html is missing seo markers');
  }
  if (!template.includes('<div id="root"></div>')) {
    throw new Error('dist/index.html is missing an empty #root');
  }

  return template
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n${head}\n    <!--seo:end-->`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertPage(file, needles) {
  const html = fs.readFileSync(file, 'utf8');
  const text = visibleText(html);
  for (const needle of needles) {
    if (!html.includes(needle) && !text.includes(needle)) {
      throw new Error(`${path.relative(root, file)} is missing ${JSON.stringify(needle)}`);
    }
  }
  if (html.includes('ad slot')) {
    throw new Error(`${path.relative(root, file)} includes the development ad placeholder`);
  }
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 40) {
    throw new Error(`${path.relative(root, file)} has only ${words} visible words`);
  }
  return words;
}

const serverDir = path.join(root, '.prerender');
await build({
  root,
  logLevel: 'error',
  build: {
    ssr: path.join(root, 'src/entry-server.jsx'),
    outDir: serverDir,
    emptyOutDir: true,
  },
});

const { render } = await import(pathToFileURL(path.join(serverDir, 'entry-server.js')).href);
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const shell = {
  title: 'The Free I Ching',
  description: DEFAULT_DESCRIPTION,
  canonical: null,
  robots: 'noindex',
  type: 'website',
};
fs.writeFileSync(
  path.join(dist, 'spa.html'),
  inject(template, '', renderHead(shell, '')),
);

const wordCounts = {};
for (const route of publicPaths()) {
  const seo = seoForPath(route);
  const html = inject(template, render(route), renderHead(seo, route));
  const file = route === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, route.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  wordCounts[route] = assertPage(file, ['<h1', 'by Tennyson Taggart']);
}

const notFound = seoForPath('/does-not-exist');
const notFoundFile = path.join(dist, '404.html');
fs.writeFileSync(
  notFoundFile,
  inject(template, render('/does-not-exist'), renderHead(notFound, '')),
);
assertPage(notFoundFile, ['Path Not Found', 'by Tennyson Taggart']);

fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemapXml());

if (!fs.existsSync(path.join(dist, 'robots.txt'))) throw new Error('robots.txt was not copied into dist');
if (!fs.existsSync(path.join(dist, 'favicon.ico'))) throw new Error('favicon.ico was not copied into dist');
if (!fs.existsSync(path.join(dist, 'og-image.png'))) throw new Error('og-image.png was not copied into dist');

console.log(`Prerendered ${publicPaths().length} pages. Homepage ${wordCounts['/']} words, hexagram 1 ${wordCounts['/library/1']} words.`);
