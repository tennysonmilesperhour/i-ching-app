import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import {
  futureTimestamp,
  SUPPORT_PROMPT_KEY,
  SUPPORT_THANK_YOU_DAYS,
} from '@/lib/supportPrompt';

export default function SupportThanks() {
  useEffect(() => {
    try {
      localStorage.setItem(
        SUPPORT_PROMPT_KEY,
        String(futureTimestamp(SUPPORT_THANK_YOU_DAYS)),
      );
    } catch {
      // Gratitude does not depend on storage access.
    }
  }, []);

  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <Heart className="mx-auto h-7 w-7 text-sage/95" strokeWidth={1.4} aria-hidden="true" />
      <h1 className="mt-6 font-serif text-3xl text-ink/90">Thank you for supporting the work</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/65">
        Your contribution helps cover hosting and continued development. The oracle remains open to everyone.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-11 items-center rounded bg-ink px-5 py-2 text-sm tracking-wide text-parchment transition-colors hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
      >
        Return to the oracle
      </Link>
    </div>
  );
}
