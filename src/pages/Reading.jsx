import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';
import { HEXAGRAM_NAMES, getTrigrams } from '@/lib/hexagramData';
import { HEXAGRAM_INTERPRETATIONS } from '@/lib/hexagramInterpretations';

export default function Reading() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);

  const { data: reading, isLoading, error } = useQuery({
    queryKey: ['reading', id],
    queryFn: () => base44.entities.Reading.get(id),
  });

  useEffect(() => {
    if (reading && !notesDirty) {
      setNotes(reading.notes || '');
    }
  }, [reading, notesDirty]);

  const saveNotes = useMutation({
    mutationFn: (value) => base44.entities.Reading.update(id, { notes: value }),
    onSuccess: () => {
      toast.success('Reflection saved');
      setNotesDirty(false);
      queryClient.invalidateQueries({ queryKey: ['reading', id] });
      queryClient.invalidateQueries({ queryKey: ['readings'] });
    },
    onError: () => {
      toast.error('Could not save reflection');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-stone/30 border-t-ink/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !reading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-ink/40 mb-4">This reading could not be found.</p>
        <Link to="/journal" className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink">
          Back to Journal
        </Link>
      </div>
    );
  }

  const relatingName = reading.relating_hexagram
    ? HEXAGRAM_NAMES[reading.relating_hexagram]
    : null;
  const interpretation = HEXAGRAM_INTERPRETATIONS[reading.hexagram_number];
  const relatingInterpretation = reading.relating_hexagram
    ? HEXAGRAM_INTERPRETATIONS[reading.relating_hexagram]
    : null;
  const trigrams = getTrigrams(reading.lines);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link to="/journal" className="text-xs tracking-widest uppercase text-ink/35 hover:text-ink/60 transition-colors">
        &larr; Journal
      </Link>

      <div className="mt-8 space-y-10">
        {reading.question && (
          <p className="text-center text-ink/50 italic text-lg font-serif">"{reading.question}"</p>
        )}

        <div className="flex flex-col items-center gap-6">
          <HexagramVisual lines={reading.lines} size="lg" showChanging />

          <div className="text-center">
            <p className="text-4xl font-serif text-ink/90 mb-1">
              {reading.hexagram_number}. {reading.hexagram_name}
            </p>
            {reading.relating_hexagram && (
              <p className="text-sm text-ink/40 mt-2">
                Changing to {reading.relating_hexagram}. {relatingName}
              </p>
            )}
          </div>
        </div>

        {reading.changing_lines?.length > 0 && (
          <div className="text-center text-xs text-ink/35 tracking-wide">
            Changing lines: {reading.changing_lines.map((i) => i + 1).join(', ')}
          </div>
        )}

        {trigrams && (
          <div className="grid grid-cols-2 gap-4 border-t border-stone/20 pt-8">
            <div className="text-center space-y-2">
              <span className="text-xs tracking-widest uppercase text-ink/30">Upper</span>
              <div className="text-4xl text-ink/80 leading-none">{trigrams.upper.symbol}</div>
              <p className="font-serif text-ink/70">
                {trigrams.upper.element} · {trigrams.upper.chinese}
              </p>
              <p className="text-xs text-ink/45 italic leading-relaxed">
                {trigrams.upper.attribute}
              </p>
            </div>
            <div className="text-center space-y-2">
              <span className="text-xs tracking-widest uppercase text-ink/30">Lower</span>
              <div className="text-4xl text-ink/80 leading-none">{trigrams.lower.symbol}</div>
              <p className="font-serif text-ink/70">
                {trigrams.lower.element} · {trigrams.lower.chinese}
              </p>
              <p className="text-xs text-ink/45 italic leading-relaxed">
                {trigrams.lower.attribute}
              </p>
            </div>
          </div>
        )}

        {interpretation && (
          <div className="border-t border-stone/20 pt-8 space-y-10">
            {interpretation.judgment && (
              <div className="space-y-4">
                <h2 className="text-xs tracking-widest uppercase text-ink/30">The Judgment</h2>
                <p className="font-serif text-lg leading-[1.85] text-ink/85">
                  {interpretation.judgment}
                </p>
              </div>
            )}
            {interpretation.image && (
              <div className="space-y-4">
                <h2 className="text-xs tracking-widest uppercase text-ink/30">The Image</h2>
                <p className="font-serif text-lg italic leading-[1.85] text-ink/70">
                  {interpretation.image}
                </p>
              </div>
            )}
            {interpretation.counsel && (
              <div className="space-y-4">
                <h2 className="text-xs tracking-widest uppercase text-ink/30">Counsel</h2>
                <p className="font-serif text-lg leading-[1.85] text-ink/85">
                  {interpretation.counsel}
                </p>
              </div>
            )}
          </div>
        )}

        {relatingInterpretation && (
          <div className="border-t border-stone/20 pt-8 space-y-6">
            <h2 className="text-xs tracking-widest uppercase text-ink/30">
              Changing toward {reading.relating_hexagram}. {relatingName}
            </h2>
            <p className="font-serif text-base leading-[1.85] text-ink/70">
              {relatingInterpretation.judgment}
            </p>
            {relatingInterpretation.counsel && (
              <p className="font-serif text-base leading-[1.85] text-ink/70">
                {relatingInterpretation.counsel}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm border-t border-stone/20 pt-8">
          <div>
            <span className="text-xs tracking-widest uppercase text-ink/30">Method</span>
            <p className="text-ink/70 mt-1 capitalize">{reading.method}</p>
          </div>
          {reading.mood_tag && (
            <div>
              <span className="text-xs tracking-widest uppercase text-ink/30">Mood</span>
              <p className="text-ink/70 mt-1 capitalize">{reading.mood_tag}</p>
            </div>
          )}
          {reading.created_date && (
            <div>
              <span className="text-xs tracking-widest uppercase text-ink/30">Date</span>
              <p className="text-ink/70 mt-1">
                {new Date(reading.created_date).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-stone/20 pt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs tracking-widest uppercase text-ink/30">Your Reflection</h2>
            {notesDirty && (
              <span className="text-[10px] tracking-widest uppercase text-sage/70">
                Unsaved
              </span>
            )}
          </div>
          <p className="text-sm text-ink/40 italic leading-relaxed">
            Sit with the reading. What does it stir in you? Where in your life does this speak?
          </p>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesDirty(true);
            }}
            placeholder="Write what arises…"
            rows={8}
            className="w-full bg-transparent border border-stone/30 rounded px-4 py-3 text-ink placeholder:text-ink/25 focus:outline-none focus:border-ink/40 resize-y font-serif text-base leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              onClick={() => saveNotes.mutate(notes)}
              disabled={!notesDirty || saveNotes.isPending}
              className="px-5 py-2 bg-ink text-parchment rounded text-sm tracking-wide hover:bg-ink/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saveNotes.isPending ? 'Saving…' : 'Save Reflection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
