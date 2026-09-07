import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Check, Droplets, Image, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import supporterIcon from '@/assets/supporter-icon.png';
import { useSupporter } from '@/lib/SupporterContext';

const benefits = [
  {
    icon: Image,
    title: 'Gilded app icon',
    description: 'Choose a warm gold-leaf version of the icon for your Home Screen.',
  },
  {
    icon: Droplets,
    title: 'Flowing-water background',
    description: 'A quiet, mostly transparent current that moves behind your readings.',
  },
  {
    icon: Sparkles,
    title: 'Support the project',
    description: 'Help sustain the app and the thoughtful development of future themes.',
  },
];

function messageFor(error) {
  return error?.message || 'Something went wrong. Please try again.';
}

export default function Supporter() {
  const supporter = useSupporter();
  const [working, setWorking] = useState(null);

  if (!supporter.native) return <Navigate to="/" replace />;

  const buy = async () => {
    setWorking('purchase');
    try {
      const result = await supporter.purchase();
      if (result.status === 'pending') {
        toast('Your purchase is awaiting Apple’s approval.');
      } else if (result.status === 'cancelled') {
        toast('Purchase cancelled.');
      } else {
        toast.success('Thank you for supporting The Free I Ching.');
      }
    } catch (error) {
      toast.error(messageFor(error));
    } finally {
      setWorking(null);
    }
  };

  const restore = async () => {
    setWorking('restore');
    try {
      const result = await supporter.restorePurchases();
      if (result.entitled) {
        toast.success('Supporter Upgrade restored.');
      } else {
        toast('No previous Supporter Upgrade was found for this Apple Account.');
      }
    } catch (error) {
      toast.error(messageFor(error));
    } finally {
      setWorking(null);
    }
  };

  const changeIcon = async (gilded) => {
    setWorking('icon');
    try {
      await supporter.setGildedIcon(gilded);
      toast.success(gilded ? 'Gilded icon selected.' : 'Standard icon selected.');
    } catch (error) {
      toast.error(messageFor(error));
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-10 text-center">
        <img
          src={supporterIcon}
          alt="Gilded Supporter app icon"
          className="mx-auto mb-6 h-24 w-24 rounded-[22%] shadow-lg shadow-amber-950/15"
        />
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-amber-800/75">Optional upgrade</p>
        <h1 className="font-serif text-3xl tracking-wide text-ink/90">Supporter Edition</h1>
        <p className="mx-auto mt-3 max-w-lg font-serif text-lg leading-relaxed text-ink/70">
          The complete I Ching remains free. This one-time upgrade adds a little beauty while helping
          support future development.
        </p>
      </div>

      <div className="mb-8 border-y border-stone/25">
        {benefits.map(({ icon: Icon, title, description }, index) => (
          <div key={title} className={`flex gap-4 py-5 ${index ? 'border-t border-stone/20' : ''}`}>
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-700/10">
              <Icon className="h-4 w-4 text-amber-800" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-serif text-lg text-ink/90">{title}</h2>
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink/70">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {supporter.loading ? (
        <div className="space-y-3 py-4" role="status" aria-label="Checking purchase status">
          <div className="h-12 animate-pulse rounded bg-stone/15" />
          <div className="mx-auto h-3 w-56 animate-pulse rounded bg-stone/15" />
        </div>
      ) : supporter.entitled ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-lg border border-amber-700/25 bg-amber-500/[0.08] px-5 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-white">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-serif text-lg text-ink/85">Supporter Upgrade unlocked</p>
              <p className="text-sm text-ink/70">Thank you. Your support keeps this work growing.</p>
            </div>
          </div>

          <div className="divide-y divide-stone/20 rounded-lg border border-stone/25 bg-parchment/80">
            <section className="p-5">
              <h2 className="text-xs uppercase tracking-widest text-ink/65">Background</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ['parchment', 'Parchment'],
                  ['water', 'Flowing water'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => supporter.setBackground(value)}
                    aria-pressed={supporter.background === value}
                    className={`rounded border px-4 py-3 text-sm transition-colors ${
                      supporter.background === value
                        ? 'border-amber-700/55 bg-amber-600/10 text-ink'
                        : 'border-stone/25 text-ink/70 hover:border-ink/35'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="p-5">
              <h2 className="text-xs uppercase tracking-widest text-ink/65">Home Screen icon</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => changeIcon(false)}
                  disabled={working === 'icon'}
                  aria-pressed={supporter.activeIcon === 'standard'}
                  className={`rounded border px-4 py-3 text-sm transition-colors disabled:opacity-50 ${
                    supporter.activeIcon === 'standard'
                      ? 'border-amber-700/55 bg-amber-600/10 text-ink'
                      : 'border-stone/25 text-ink/70 hover:border-ink/35'
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => changeIcon(true)}
                  disabled={working === 'icon'}
                  aria-pressed={supporter.activeIcon === 'gilded'}
                  className={`rounded border px-4 py-3 text-sm transition-colors disabled:opacity-50 ${
                    supporter.activeIcon === 'gilded'
                      ? 'border-amber-700/55 bg-amber-600/10 text-ink'
                      : 'border-stone/25 text-ink/70 hover:border-ink/35'
                  }`}
                >
                  Gilded
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-stone/30 bg-parchment/80 p-6 text-center">
          <button
            type="button"
            onClick={buy}
            disabled={!supporter.available || working !== null}
            className="inline-flex min-h-12 items-center justify-center rounded bg-ink px-7 py-3 text-sm tracking-wide text-parchment transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {working === 'purchase' && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {supporter.available
              ? `Get Supporter Upgrade · ${supporter.displayPrice}`
              : 'Supporter Upgrade unavailable'}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-ink/65">
            One-time purchase. Payment is charged to your Apple Account after confirmation.
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={restore}
          disabled={working !== null}
          className="inline-flex min-h-11 items-center gap-2 rounded px-3 text-sm text-ink/65 underline decoration-stone/60 underline-offset-4 hover:text-ink disabled:opacity-45"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${working === 'restore' ? 'animate-spin' : ''}`} aria-hidden="true" />
          Restore purchases
        </button>
      </div>
    </div>
  );
}
