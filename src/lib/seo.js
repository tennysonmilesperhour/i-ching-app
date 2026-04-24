import { useEffect } from 'react';

/**
 * SEO / GEO utilities.
 *
 * This module centralises everything search engines and AI answer engines
 * (ChatGPT, Claude, Perplexity, Google AI Overviews) need:
 *
 *   - site config (name, url, default copy)
 *   - canonicalUrl() / absoluteUrl() helpers
 *   - useSEO() hook: updates <title>, meta description, canonical, robots,
 *     Open Graph and Twitter Card tags per route
 *   - useJsonLd(): injects a JSON-LD <script> block for the current route
 *
 * Works without any SSR by mutating document.head on mount / update. Google
 * and the major AI crawlers render JS, so this is sufficient for a Vite SPA.
 * If we later move to prerendering / SSR the same hook calls become the
 * source of truth for static HTML output — no page-level rewrites needed.
 */

export const SITE = {
  name: 'I Ching · The Book of Changes',
  shortName: 'I Ching',
  tagline: 'Consult the ancient Chinese oracle online',
  description:
    'A quiet, minimalist I Ching (Yijing) oracle. Cast a hexagram by yarrow-stalk probabilities or the three-coin method, read the Judgment, Image, and Counsel of any of the 64 hexagrams, and keep a personal journal of your readings.',
  locale: 'en_US',
  twitter: '',
  url: (import.meta.env.VITE_SITE_URL || 'https://i-ching-app.vercel.app').replace(/\/$/, ''),
};

export function absoluteUrl(pathOrUrl = '/') {
  if (!pathOrUrl) return SITE.url;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE.url}${path}`;
}

export function canonicalUrl() {
  if (typeof window === 'undefined') return SITE.url;
  // Strip query + hash from the canonical — reading pages have stable paths.
  return absoluteUrl(window.location.pathname);
}

function upsertMeta({ name, property, content }) {
  if (content == null) return null;
  const selector = name
    ? `meta[name="${name}"]`
    : `meta[property="${property}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    if (name) el.setAttribute('name', name);
    if (property) el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return el;
}

function upsertLink({ rel, href }) {
  if (!href) return null;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return el;
}

/**
 * useSEO — sets per-route head tags.
 *
 * @param {object} opts
 * @param {string} [opts.title]        Page title (site name is appended).
 * @param {string} [opts.description]  Meta description (defaults to SITE.description).
 * @param {string} [opts.path]         Canonical path. Defaults to window.location.pathname.
 * @param {boolean}[opts.noindex]      Private/utility pages set this true.
 * @param {'website'|'article'|'profile'} [opts.ogType]  Defaults to 'website'.
 * @param {string} [opts.image]        Absolute or relative URL for og:image.
 */
export function useSEO({
  title,
  description,
  path,
  noindex = false,
  ogType = 'website',
  image,
} = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE.shortName}` : SITE.name;
    const desc = (description || SITE.description).slice(0, 300);
    const canonical = path ? absoluteUrl(path) : canonicalUrl();
    const imageUrl = image ? absoluteUrl(image) : null;

    document.title = fullTitle;

    upsertMeta({ name: 'description', content: desc });
    upsertMeta({
      name: 'robots',
      content: noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large',
    });
    upsertLink({ rel: 'canonical', href: canonical });

    // Open Graph
    upsertMeta({ property: 'og:site_name', content: SITE.name });
    upsertMeta({ property: 'og:type', content: ogType });
    upsertMeta({ property: 'og:title', content: fullTitle });
    upsertMeta({ property: 'og:description', content: desc });
    upsertMeta({ property: 'og:url', content: canonical });
    upsertMeta({ property: 'og:locale', content: SITE.locale });
    if (imageUrl) upsertMeta({ property: 'og:image', content: imageUrl });

    // Twitter
    upsertMeta({ name: 'twitter:card', content: imageUrl ? 'summary_large_image' : 'summary' });
    upsertMeta({ name: 'twitter:title', content: fullTitle });
    upsertMeta({ name: 'twitter:description', content: desc });
    if (imageUrl) upsertMeta({ name: 'twitter:image', content: imageUrl });
  }, [title, description, path, noindex, ogType, image]);
}

/**
 * useJsonLd — injects (and cleans up) a JSON-LD <script> block for the
 * current route. Uses a stable `id` per block so re-renders don't duplicate.
 */
export function useJsonLd(id, data) {
  const serialized = data ? JSON.stringify(data) : null;
  useEffect(() => {
    if (!id || !serialized) return undefined;
    const scriptId = `ld-${id}`;
    let el = document.getElementById(scriptId);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = scriptId;
      document.head.appendChild(el);
    }
    el.textContent = serialized;
    return () => {
      const stillPresent = document.getElementById(scriptId);
      if (stillPresent) stillPresent.textContent = '';
    };
  }, [id, serialized]);
}
