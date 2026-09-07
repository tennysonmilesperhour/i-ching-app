import { useState } from 'react';
import { isNativePlatform } from '@/lib/platform';
import { eraseLocalAppData } from '@/lib/localData';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/supportContact';

export default function Privacy() {
  const native = isNativePlatform();
  const [confirmingErase, setConfirmingErase] = useState(false);

  const handleErase = () => {
    eraseLocalAppData();
    window.location.replace('/');
  };

  return (
    <article className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-serif text-3xl text-ink/90">Privacy</h1>
      <p className="mt-2 text-xs tracking-wide text-ink/55">Last updated September 7, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-ink/70">
        <section>
          <h2 className="font-serif text-xl text-ink/90">Your readings stay with you</h2>
          <p className="mt-2">
            Questions, readings, journal entries, and local profile information are stored in your browser or on your device.
            The Free I Ching does not send that material to an application server.
          </p>
          <p className="mt-2">
            That information remains until you erase it below, clear this site&rsquo;s storage, or remove the app. We do not have a server copy to retrieve, share, or delete on your behalf.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-ink/90">Native app</h2>
          <p className="mt-2">
            The iPhone and iPad app stores its journal on the device. It does not display advertising or open the web donation checkout.
            Removing the app also removes its locally stored data unless your device backup preserves it.
          </p>
          <p className="mt-2">
            If you buy the optional Supporter Upgrade, Apple processes the purchase. The app receives the product entitlement, not your payment-card details.
          </p>
        </section>

        {!native && (
          <section>
            <h2 className="font-serif text-xl text-ink/90">Optional web services</h2>
            <p className="mt-2">
              If you choose to contribute, Stripe processes your email address, payment details, and subscription under its own privacy policy.
              The app receives no card details. The web version may also display Google AdSense when advertising is configured; Google may process device and usage information under its own policies.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              <a className="underline underline-offset-4 hover:text-ink" href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
                Stripe privacy policy
              </a>
              <a className="underline underline-offset-4 hover:text-ink" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                Google privacy policy
              </a>
            </div>
          </section>
        )}

        <section>
          <h2 className="font-serif text-xl text-ink/90">Erase local data</h2>
          <p className="mt-2">
            This removes readings, journal entries, local profile and sign-in information, and saved display preferences from this browser or device. A Supporter Upgrade remains associated with your Apple ID and can be restored.
          </p>
          {confirmingErase ? (
            <div className="mt-4 rounded-lg border border-stone/35 p-4">
              <p className="text-sm text-ink/75">This cannot be undone. Erase all local app data?</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleErase}
                  className="min-h-11 rounded bg-ink px-4 py-2 text-sm text-parchment transition-colors hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/55"
                >
                  Erase all data
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingErase(false)}
                  className="min-h-11 rounded px-4 py-2 text-sm text-ink/65 underline underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/55"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingErase(true)}
              className="mt-4 min-h-11 rounded border border-stone/35 px-4 py-2 text-sm text-ink/65 transition-colors hover:border-ink/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/55"
            >
              Erase my local data
            </button>
          )}
        </section>

        <section>
          <h2 className="font-serif text-xl text-ink/90">Contact</h2>
          <p className="mt-2">
            For privacy or deletion questions, email{' '}
            <a className="underline underline-offset-4 hover:text-ink" href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.
            Do not include private reading content in your message.
          </p>
        </section>
      </div>
    </article>
  );
}
