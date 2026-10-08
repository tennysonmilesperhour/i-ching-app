import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/lib/posthog.js'

const rootEl = document.getElementById('root')
const prerenderPath = document.querySelector('meta[name="prerender-path"]')?.getAttribute('content')
const app = <App />

if (prerenderPath && prerenderPath === window.location.pathname && rootEl.childElementCount > 0) {
  ReactDOM.hydrateRoot(rootEl, app)
} else {
  ReactDOM.createRoot(rootEl).render(app)
}
