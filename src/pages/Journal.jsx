import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';
import { useSEO } from '@/lib/seo';

export default function Journal() {
  useSEO({
    title: 'Journal',
    description: 'Your personal I Ching reading journal.',
    path: '/journal',
    noindex: true,
  });

  const { data: readings, isLoading } = useQuery({
    queryKey: ['readings'],
    queryFn: () => base44.entities.Reading.list('-created_date'),
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-serif tracking-wide text-ink/90">Journal</h1>
        <p className="text-xs text-ink/35 tracking-widest uppercase mt-1">Your readings</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-stone/30 border-t-ink/60 rounded-full animate-spin" />
        </div>
      ) : !readings?.length ? (
        <div className="text-center py-16">
          <p className="text-ink/30 mb-4">No readings yet.</p>
          <Link
            to="/"
            className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            Consult the Oracle
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {readings.map((r) => (
            <Link
              key={r.id}
              to={`/reading/${r.id}`}
              className="flex items-center gap-5 px-5 py-4 border border-stone/20 rounded hover:border-stone/40 transition-colors group"
            >
              <HexagramVisual lines={r.lines} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif text-ink/80 group-hover:text-ink transition-colors">
                  {r.hexagram_number}. {r.hexagram_name}
                </p>
                {r.question && (
                  <p className="text-xs text-ink/35 truncate mt-0.5">{r.question}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {r.mood_tag && (
                  <span className="text-[10px] tracking-widest uppercase text-sage/70">{r.mood_tag}</span>
                )}
                {r.created_date && (
                  <p className="text-[10px] text-ink/25 mt-0.5">
                    {new Date(r.created_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
