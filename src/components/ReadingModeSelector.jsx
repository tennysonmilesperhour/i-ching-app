import { BookOpen, Layers3 } from 'lucide-react';

const MODES = [
  {
    value: 'inquirer',
    label: 'Inquirer',
    eyebrow: 'Meaning first',
    description: 'Clear counsel and a gentle path into personal reflection.',
    icon: BookOpen,
  },
  {
    value: 'adept',
    label: 'Adept',
    eyebrow: 'Structure & sources',
    description: 'A practice-oriented view of trigrams, line texts, method, and change.',
    icon: Layers3,
  },
];

export default function ReadingModeSelector({ value, onChange, compact = false }) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Reading role">
        <span className="text-[10px] tracking-[0.2em] uppercase text-ink/55">Reading role</span>
        <div className="inline-flex rounded-full border border-stone/30 p-1 bg-parchment">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange(mode.value)}
              aria-pressed={value === mode.value}
              className={`rounded-full px-4 py-1.5 text-xs tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink/40
                ${value === mode.value
                  ? 'bg-ink text-parchment'
                  : 'text-ink/55 hover:text-ink/80'
                }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="block text-xs tracking-widest uppercase text-ink/50 mb-2">
        How are you consulting?
      </legend>
      <p className="text-sm text-ink/50 italic leading-relaxed mb-4">
        The cast is the same. Choose the role that best reflects your intention today.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const selected = value === mode.value;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange(mode.value)}
              aria-pressed={selected}
              className={`relative min-h-36 rounded-lg border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink/40
                ${selected
                  ? 'border-ink/55 bg-ink/[0.035] shadow-[inset_0_0_0_1px_rgba(31,28,26,0.04)]'
                  : 'border-stone/30 hover:border-ink/35 hover:bg-ink/[0.015]'
                }`}
            >
              <span className="mb-5 flex items-start justify-between gap-4">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${selected ? 'border-ink/35' : 'border-stone/30'}`}>
                  <Icon className="h-4 w-4 text-ink/60" strokeWidth={1.35} />
                </span>
                <span className={`mt-1 h-2 w-2 rounded-full transition-colors ${selected ? 'bg-sage' : 'bg-stone/25'}`} />
              </span>
              <span className="block text-[10px] tracking-[0.2em] uppercase text-ink/55">
                {mode.eyebrow}
              </span>
              <span className="mt-1 block font-serif text-xl text-ink/90">{mode.label}</span>
              <span className="mt-2 block text-sm leading-relaxed text-ink/55">
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
