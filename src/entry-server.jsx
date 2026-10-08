import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppProviders, AuthenticatedApp } from './App';

export function render(url) {
  return renderToString(
    <AppProviders>
      <StaticRouter location={url}>
        <AuthenticatedApp />
      </StaticRouter>
    </AppProviders>,
  );
}
