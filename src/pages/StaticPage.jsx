import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from '@/lib/PageNotFound';
import { getPage, renderBodyHtml } from '@/lib/siteContent';

/**
 * Renders the same content the build script prerenders into static HTML, so
 * people and bots see identical pages. Used for trigrams, methods and data.
 */
export default function StaticPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const page = getPage(pathname);

  useEffect(() => {
    if (page) document.title = page.title;
  }, [page]);

  if (!page) return <PageNotFound />;

  const handleClick = (event) => {
    const anchor = event.target.closest?.('a');
    const href = anchor?.getAttribute('href');
    if (!href || !href.startsWith('/') || href.endsWith('.md') || href.startsWith('/data/') || href.startsWith('/llms') || href === '/mcp') return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(href);
  };

  return (
    <article
      className="mx-auto max-w-2xl px-6 py-12"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: renderBodyHtml(page) }}
    />
  );
}
