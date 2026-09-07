import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';
import { normalizeReadingMode } from '@/lib/readingMode';

function isDue(date) {
  if (!date) return false;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return new Date(`${date.slice(0, 10)}T12:00:00`) <= endOfToday;
}

export default function Journal() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { data: readings, isLoading } = useQuery({
    queryKey: ['readings'],
    queryFn: () => base44.entities.Reading.list('-created_date'),
  });

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (readings || []).filter((reading) => {
      const matchesQuery = !term || [
        reading.hexagram_number,
        reading.hexagram_name,
        reading.question,
        reading.notes,
        reading.practice_intention,
      ].some((value) => String(value || '').toLowerCase().includes(term));
      const matchesFilter = filter === 'all'
        || (filter === 'due' && isDue(reading.follow_up_at) && reading.revisit_status !== 'integrated')
        || (filter === 'open' && reading.revisit_status !== 'integrated')
        || (filter === 'integrated' && reading.revisit_status === 'integrated');
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, readings]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-2xl tracking-wide text-ink/90">Journal</h1>
        <p className="mt-1 text-xs tracking-widest uppercase text-ink/55">Readings, practices, and returns</p>
      </div>

      {!isLoading && readings?.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Search your readings</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions and reflections"
              className="w-full rounded border border-stone/35 bg-transparent py-2.5 pl-11 pr-4 text-sm placeholder:text-ink/45 focus:border-ink/55 focus:outline-none"
            />
          </label>
          <label>
            <span className="sr-only">Filter readings</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-full w-full rounded border border-stone/35 bg-parchment px-4 py-2.5 text-sm text-ink/70 focus:border-ink/55 focus:outline-none sm:w-auto"
            >
              <option value="all">All readings</option>
              <option value="due">Due to revisit</option>
              <option value="open">Open</option>
              <option value="integrated">Integrated</option>
            </select>
          </label>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone/30 border-t-ink/60" />
        </div>
      ) : !readings?.length ? (
        <div className="py-16 text-center">
          <p className="mb-4 text-ink/55">No readings yet.</p>
          <Link to="/" className="text-sm text-ink/60 underline underline-offset-4 hover:text-ink">Consult the Oracle</Link>
        </div>
      ) : !filtered.length ? (
        <p className="py-12 text-center text-sm text-ink/60">No readings match this view.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((reading) => {
            const due = isDue(reading.follow_up_at) && reading.revisit_status !== 'integrated';
            return (
              <Link
                key={reading.id}
                to={`/reading/${reading.id}`}
                className="group flex items-center gap-5 rounded-lg border border-stone/25 px-5 py-4 transition-colors hover:border-ink/40"
              >
                <HexagramVisual
                  lines={reading.lines}
                  size="sm"
                  label={`Hexagram ${reading.hexagram_number}, ${reading.hexagram_name}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-sm text-ink/85 transition-colors group-hover:text-ink">
                      {reading.hexagram_number}. {reading.hexagram_name}
                    </p>
                    <span className="rounded-full border border-stone/30 px-2 py-0.5 text-[9px] tracking-widest uppercase text-ink/55">
                      {normalizeReadingMode(reading.reading_mode)}
                    </span>
                    {reading.sphere_focus && (
                      <span className="rounded-full border border-sage/40 px-2 py-0.5 text-[9px] tracking-widest uppercase text-sage/90">
                        {reading.sphere_focus}
                      </span>
                    )}
                  </div>
                  {reading.question && <p className="mt-1 truncate text-xs text-ink/60">{reading.question}</p>}
                  {reading.practice_intention && <p className="mt-2 line-clamp-1 text-xs italic text-ink/65">Practice: {reading.practice_intention}</p>}
                </div>
                <div className="shrink-0 text-right">
                  {due && (
                    <span className="inline-flex items-center gap-1 text-[10px] tracking-wide text-sage/95">
                      <CalendarClock className="h-3 w-3" /> Return
                    </span>
                  )}
                  {reading.created_date && (
                    <p className="mt-1 text-[10px] text-ink/50">{new Date(reading.created_date).toLocaleDateString()}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
