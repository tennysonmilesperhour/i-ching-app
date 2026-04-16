import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';
import { HEXAGRAM_NAMES } from '@/lib/hexagramData';

export default function Reading() {
  const { id } = useParams();

  const { data: reading, isLoading, error } = useQuery({
    queryKey: ['reading', id],
    queryFn: () => base44.entities.Reading.get(id),
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

        {reading.notes && (
          <div className="border-t border-stone/20 pt-8">
            <span className="text-xs tracking-widest uppercase text-ink/30">Notes</span>
            <p className="text-ink/60 mt-2 whitespace-pre-wrap">{reading.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
