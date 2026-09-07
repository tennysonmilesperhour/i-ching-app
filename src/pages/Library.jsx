import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import HexagramVisual from '@/components/HexagramVisual';
import { HEXAGRAM_CHINESE, HEXAGRAM_NAMES, getLinesForHexagram } from '@/lib/hexagramData';
import { HEXAGRAM_INTERPRETATIONS } from '@/lib/hexagramInterpretations';

const HEXAGRAMS = Array.from({ length: 64 }, (_, index) => index + 1);

export default function Library() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return HEXAGRAMS;
    return HEXAGRAMS.filter((number) => (
      String(number) === term
      || HEXAGRAM_NAMES[number].toLowerCase().includes(term)
      || HEXAGRAM_CHINESE[number].includes(term)
    ));
  }, [query]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs tracking-[0.2em] uppercase text-ink/55">The sixty-four changes</p>
        <h1 className="mt-2 font-serif text-3xl tracking-wide text-ink/90">Hexagram Library</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink/60">
          Browse the figures outside the ritual of a cast. Study their structure, contemporary interpretation, and line text at your own pace.
        </p>
      </div>

      <label className="relative mx-auto mt-8 block max-w-md">
        <span className="sr-only">Search the hexagram library</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by number, name, or character"
          className="w-full rounded-full border border-stone/35 bg-transparent py-3 pl-11 pr-4 text-sm text-ink placeholder:text-ink/45 focus:border-ink/55 focus:outline-none"
        />
      </label>

      {filtered.length ? (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((number) => {
            const lines = getLinesForHexagram(number);
            const interpretation = HEXAGRAM_INTERPRETATIONS[number];
            return (
              <Link
                key={number}
                to={`/library/${number}`}
                className="group flex min-h-44 items-center gap-5 rounded-lg border border-stone/25 p-5 transition-colors hover:border-ink/40 hover:bg-ink/[0.02]"
              >
                <HexagramVisual lines={lines} size="sm" label={`Hexagram ${number}, ${HEXAGRAM_NAMES[number]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs tracking-widest text-ink/55">{number}</p>
                    <span className="font-serif text-2xl text-ink/70" aria-hidden="true">{HEXAGRAM_CHINESE[number]}</span>
                  </div>
                  <h2 className="mt-1 font-serif text-lg leading-tight text-ink/85 group-hover:text-ink">{HEXAGRAM_NAMES[number]}</h2>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink/55">{interpretation?.judgment}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-12 text-center text-sm text-ink/60">No hexagram matches that search.</p>
      )}
    </div>
  );
}
