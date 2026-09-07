import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/supportContact';

export default function Support() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-xs tracking-[0.2em] uppercase text-ink/50">The Free I Ching</p>
      <h1 className="mt-2 font-serif text-3xl text-ink/90">Support</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-ink/65">
        For help with a reading, accessibility, privacy, or the Supporter Upgrade, email us directly.
      </p>

      <a
        href={SUPPORT_MAILTO}
        className="mt-8 flex min-h-14 items-center gap-4 rounded-lg border border-stone/30 px-5 py-4 text-ink/75 transition-colors hover:border-ink/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50"
      >
        <Mail className="h-5 w-5 shrink-0 text-sage" strokeWidth={1.5} aria-hidden="true" />
        <span>
          <span className="block text-xs tracking-widest uppercase text-ink/50">Email support</span>
          <span className="mt-1 block font-serif text-lg">{SUPPORT_EMAIL}</span>
        </span>
      </a>

      <div className="mt-10 space-y-8 text-sm leading-7 text-ink/70">
        <section>
          <h2 className="font-serif text-xl text-ink/90">Purchases</h2>
          <p className="mt-2">
            If a previous Supporter Upgrade is not showing, open Upgrade in the app and choose Restore Purchases. Include the device model and iOS version in your email if the problem continues. Never email payment-card details.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-ink/90">Your data</h2>
          <p className="mt-2">
            Readings and journal entries stay on your device. You can remove them at any time from the{' '}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-ink">Privacy page</Link>.
          </p>
        </section>
      </div>
    </article>
  );
}
