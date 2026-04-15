import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';

export default function Timeline() {
  const { data: readings, isLoading } = useQuery({
    queryKey: ['readings-timeline'],
    queryFn: () => base44.entities.Reading.list('created_date'),
  });

  // Group readings by month
  const grouped = {};
  if (readings) {
    for (const r of readings) {
      const date = r.created_date ? new Date(r.created_date) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
      if (!grouped[key]) grouped[key] = { label, items: [] };
      grouped[key].items.push(r);
    }
  }

  const months = Object.keys(grouped).sort().reverse();

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-serif tracking-wide text-ink/90">Timeline</h1>
        <p className="text-xs text-ink/35 tracking-widest uppercase mt-1">Your journey through the changes</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-stone/30 border-t-ink/60 rounded-full animate-spin" />
        </div>
      ) : !months.length ? (
        <div className="text-center py-16">
          <p className="text-ink/30 mb-4">No readings yet.</p>
          <Link to="/" className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink">
            Consult the Oracle
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {months.map((key) => (
            <div key={key}>
              <h2 className="text-xs tracking-widest uppercase text-ink/30 mb-4 border-b border-stone/15 pb-2">
                {grouped[key].label}
              </h2>
              <div className="relative pl-6 border-l border-stone/20 space-y-6">
                {grouped[key].items.map((r) => (
                  <Link
                    key={r.id}
                    to={`/reading/${r.id}`}
                    className="block relative group"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[25px] top-3 w-2 h-2 rounded-full bg-stone/40 group-hover:bg-ink/60 transition-colors" />

                    <div className="flex items-start gap-4">
                      <HexagramVisual lines={r.lines} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-serif text-ink/70 group-hover:text-ink transition-colors">
                          {r.hexagram_number}. {r.hexagram_name}
                        </p>
                        {r.question && (
                          <p className="text-xs text-ink/30 truncate mt-0.5">{r.question}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {r.created_date && (
                            <span className="text-[10px] text-ink/20">
                              {new Date(r.created_date).toLocaleDateString()}
                            </span>
                          )}
                          {r.mood_tag && (
                            <span className="text-[10px] tracking-widest uppercase text-sage/60">
                              {r.mood_tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
