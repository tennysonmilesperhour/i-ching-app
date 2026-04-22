import { useEffect, useRef } from 'react';
import { getAdsenseClient, loadAdSense } from './adsenseLoader';

/**
 * AdSlot — a single AdSense ad unit.
 *
 * Architecture:
 *   - Reads publisher ID from VITE_GOOGLE_ADS_CLIENT_ID.
 *   - Per-placement slot IDs come from VITE_GOOGLE_ADS_SLOT_<PLACEMENT>
 *     (uppercase, hyphens → underscores). e.g. placement="reading-footer"
 *     looks up VITE_GOOGLE_ADS_SLOT_READING_FOOTER.
 *   - If either the client ID or the specific slot ID is missing:
 *       * dev: render a lightly-styled placeholder so layout is visible
 *       * prod: render nothing
 *   - Renders an adsbygoogle <ins> tag and pushes it on mount.
 *
 * Props:
 *   placement: string — logical name used to look up the slot ID env var
 *   slot:      string — explicit slot ID override
 *   format:    string — defaults to "auto"
 *   layout:    string — optional AdSense data-ad-layout
 *   className: string — outer wrapper classes
 *
 * When switching backends (GAM, Ezoic, etc.) only this file needs to change.
 */
function slotEnvKey(placement) {
  const safe = String(placement || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  return `VITE_GOOGLE_ADS_SLOT_${safe}`;
}

function resolveSlotId(placement, explicit) {
  if (explicit) return explicit;
  if (!placement) return null;
  return import.meta.env[slotEnvKey(placement)] || null;
}

export default function AdSlot({
  placement,
  slot,
  format = 'auto',
  layout,
  responsive = true,
  className = '',
  style,
}) {
  const insRef = useRef(null);
  const pushedRef = useRef(false);
  const client = getAdsenseClient();
  const slotId = resolveSlotId(placement, slot);
  const enabled = Boolean(client && slotId);

  useEffect(() => {
    if (!enabled || pushedRef.current) return;
    let cancelled = false;
    loadAdSense().then((ok) => {
      if (cancelled || !ok || !insRef.current) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch {
        // AdSense throws on double-push / bad state; safe to ignore.
      }
    });
    return () => { cancelled = true; };
  }, [enabled, slotId, placement]);

  if (!enabled) {
    if (import.meta.env.DEV) {
      return (
        <div
          className={`text-[10px] tracking-widest uppercase text-ink/20 text-center py-4 border border-dashed border-stone/30 rounded ${className}`}
          style={style}
        >
          ad slot · {placement || 'unnamed'}
        </div>
      );
    }
    return null;
  }

  return (
    <div className={className} style={style}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
