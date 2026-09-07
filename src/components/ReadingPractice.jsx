import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const MOODS = [
  ['clarity', 'Clarity'],
  ['uncertainty', 'Uncertainty'],
  ['transition', 'Transition'],
  ['stillness', 'Stillness'],
  ['growth', 'Growth'],
  ['release', 'Release'],
];

const SPHERES = [
  ['social', 'Social'],
  ['martial', 'Martial'],
  ['qi', 'Qi'],
  ['tao', 'Tao'],
];

function fieldsFromReading(reading) {
  return {
    notes: reading?.notes || '',
    mood_tag: reading?.mood_tag || '',
    sphere_focus: reading?.sphere_focus || '',
    practice_intention: reading?.practice_intention || '',
    follow_up_at: reading?.follow_up_at?.slice(0, 10) || '',
    outcome_notes: reading?.outcome_notes || '',
    revisit_status: reading?.revisit_status || 'open',
  };
}

export default function ReadingPractice({ reading }) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState(() => fieldsFromReading(reading));
  const [dirty, setDirty] = useState(false);

  const savePractice = useMutation({
    mutationFn: () => base44.entities.Reading.update(reading.id, {
      notes: fields.notes,
      practice_intention: fields.practice_intention,
      outcome_notes: fields.outcome_notes,
      revisit_status: fields.revisit_status,
      ...(fields.mood_tag ? { mood_tag: fields.mood_tag } : {}),
      ...(fields.sphere_focus ? { sphere_focus: fields.sphere_focus } : {}),
      ...(fields.follow_up_at ? { follow_up_at: fields.follow_up_at } : {}),
    }),
    onSuccess: () => {
      toast.success('Practice saved');
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['reading', reading.id] });
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['readings-timeline'] });
    },
    onError: () => toast.error('Could not save practice'),
  });

  const update = (key, value) => {
    setFields((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const textFieldClass = 'w-full rounded border border-stone/35 bg-transparent px-4 py-3 text-ink placeholder:text-ink/45 focus:border-ink/55 focus:outline-none';

  return (
    <section className="space-y-8 border-t border-stone/25 pt-8" aria-labelledby="practice-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="practice-heading" className="text-xs tracking-widest uppercase text-ink/55">Carry it into practice</h2>
          <p className="mt-2 text-sm italic leading-relaxed text-ink/60">
            Record the first resonance now, then return after life has answered back.
          </p>
        </div>
        {dirty && <span className="shrink-0 text-[10px] tracking-widest uppercase text-sage/90">Unsaved</span>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-xs tracking-widest uppercase text-ink/55">
          Mood of the moment
          <select
            value={fields.mood_tag}
            onChange={(event) => update('mood_tag', event.target.value)}
            className={`${textFieldClass} block text-sm normal-case tracking-normal`}
          >
            <option value="">Choose a mood</option>
            {MOODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-xs tracking-widest uppercase text-ink/55">
          Return on
          <input
            type="date"
            value={fields.follow_up_at}
            onChange={(event) => update('follow_up_at', event.target.value)}
            className={`${textFieldClass} block text-sm normal-case tracking-normal`}
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-xs tracking-widest uppercase text-ink/55">Sphere with the most charge</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {SPHERES.map(([value, label]) => {
            const selected = fields.sphere_focus === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => update('sphere_focus', value)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink/40 ${selected ? 'border-ink/55 bg-ink text-parchment' : 'border-stone/35 text-ink/65 hover:border-ink/45 hover:text-ink'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block space-y-2">
        <span className="text-xs tracking-widest uppercase text-ink/55">First response</span>
        <span className="block text-sm italic leading-relaxed text-ink/60">What does this stir, and where does it already appear in your life?</span>
        <textarea
          value={fields.notes}
          onChange={(event) => update('notes', event.target.value)}
          placeholder="Write what arises…"
          rows={6}
          className={`${textFieldClass} resize-y font-serif text-base leading-relaxed`}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs tracking-widest uppercase text-ink/55">One practice</span>
        <span className="block text-sm italic leading-relaxed text-ink/60">Name one small, observable way you will live the counsel.</span>
        <textarea
          value={fields.practice_intention}
          onChange={(event) => update('practice_intention', event.target.value)}
          placeholder="For the next seven days, I will…"
          rows={3}
          className={`${textFieldClass} resize-y font-serif text-base leading-relaxed`}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs tracking-widest uppercase text-ink/55">What changed?</span>
        <span className="block text-sm italic leading-relaxed text-ink/60">When you return, record what became visible—not whether the oracle was “right.”</span>
        <textarea
          value={fields.outcome_notes}
          onChange={(event) => update('outcome_notes', event.target.value)}
          placeholder="On returning to this reading…"
          rows={4}
          className={`${textFieldClass} resize-y font-serif text-base leading-relaxed`}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => update('revisit_status', fields.revisit_status === 'integrated' ? 'open' : 'integrated')}
          className="flex items-center gap-2 text-sm text-ink/65 hover:text-ink"
        >
          {fields.revisit_status === 'integrated'
            ? <Check className="h-4 w-4 text-sage" />
            : <Circle className="h-4 w-4" />}
          {fields.revisit_status === 'integrated' ? 'Integrated' : 'Keep open'}
        </button>
        <button
          type="button"
          onClick={() => savePractice.mutate()}
          disabled={!dirty || savePractice.isPending}
          className="rounded bg-ink px-5 py-2 text-sm tracking-wide text-parchment transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {savePractice.isPending ? 'Saving…' : 'Save practice'}
        </button>
      </div>
    </section>
  );
}
