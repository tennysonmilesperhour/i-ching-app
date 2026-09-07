import { useState } from 'react';
import { Heart, X } from 'lucide-react';
import { isNativePlatform } from '@/lib/platform';
import {
  futureTimestamp,
  shouldShowSupportPrompt,
  SUPPORT_PROMPT_KEY,
  SUPPORT_SNOOZE_DAYS,
} from '@/lib/supportPrompt';

function readHiddenUntil() {
  try {
    return localStorage.getItem(SUPPORT_PROMPT_KEY);
  } catch {
    return null;
  }
}

function hidePromptFor(days) {
  try {
    localStorage.setItem(SUPPORT_PROMPT_KEY, String(futureTimestamp(days)));
  } catch {
    // A blocked storage API should never block the reading experience.
  }
}

export default function SupportBanner() {
  const checkoutUrl = import.meta.env.VITE_STRIPE_SUPPORT_URL?.trim();
  const [visible, setVisible] = useState(() => shouldShowSupportPrompt({
    checkoutUrl,
    hiddenUntil: readHiddenUntil(),
    nativePlatform: isNativePlatform(),
  }));

  if (!visible) return null;

  const dismiss = () => {
    hidePromptFor(SUPPORT_SNOOZE_DAYS);
    setVisible(false);
  };

  const support = () => {
    hidePromptFor(7);
    window.location.assign(checkoutUrl);
  };

  return (
    <aside
      aria-label="Support The Free I Ching"
      className="relative rounded-lg border border-sage/40 bg-sage/[0.07] px-5 py-5 sm:px-6"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss support invitation"
        className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <Heart className="mt-0.5 h-5 w-5 shrink-0 text-sage/95" strokeWidth={1.5} aria-hidden="true" />
        <div className="max-w-xl">
          <h2 className="font-serif text-lg text-ink/90">Help keep the oracle available</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/65">
            If this reading was useful, you can help cover hosting and future development for $10 a year.
            The Free I Ching stays fully available whether you contribute or not.
          </p>
          <p className="mt-2 text-xs text-ink/55">Renews yearly until canceled. Stripe handles payment and receipts.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 pl-0 sm:pl-9">
        <button
          type="button"
          onClick={support}
          className="rounded bg-ink px-4 py-2 text-sm tracking-wide text-parchment transition-colors hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
        >
          Support for $10/year
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-10 rounded px-3 text-sm text-ink/60 underline decoration-stone/60 underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
        >
          Not now
        </button>
      </div>
    </aside>
  );
}
