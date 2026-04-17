import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';
import { HEXAGRAM_NAMES, HEXAGRAM_CHINESE } from '@/lib/hexagramData';

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function Timeline() {
  const { data: readings, isLoading } = useQuery({
    queryKey: ['readings-timeline'],
    queryFn: () => base44.entities.Reading.list('created_date'),
  });

  const sorted = readings
    ? [...readings].sort((a, b) => {
        const da = a.created_date ? new Date(a.created_date) : 0;
        const db = b.created_date ? new Date(b.created_date) : 0;
        return db - da;
      })
    : [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-2xl font-serif tracking-wide text-ink/90">Timeline</h1>
        <p className="text-xs text-ink/35 tracking-widest uppercase mt-1">
          Your journey through the changes
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-stone/30 border-t-ink/60 rounded-full animate-spin" />
        </div>
      ) : !sorted.length ? (
        <div className="text-center py-16">
          <p className="text-ink/30 mb-4">No readings yet.</p>
          <Link to="/" className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink">
            Consult the Dao
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* Central vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone/20 -translate-x-px" />

          <div className="space-y-16">
            {sorted.map((r, idx) => {
              const isLeft = idx % 2 === 0;
              const chinese = HEXAGRAM_CHINESE[r.hexagram_number] || '';
              const relatingChinese = r.relating_hexagram
                ? HEXAGRAM_CHINESE[r.relating_hexagram] || ''
                : '';
              const relatingName = r.relating_hexagram
                ? HEXAGRAM_NAMES[r.relating_hexagram]
                : null;

              return (
                <div key={r.id} className="relative flex items-start">
                  {/* Dot on the line */}
                  <div className="absolute left-1/2 top-8 -translate-x-1/2 z-10">
                    <div className="w-3 h-3 rounded-full border-2 border-stone/30 bg-parchment" />
                  </div>

                  {/* Card */}
                  {isLeft ? (
                    <>
                      <div className="w-[calc(50%-24px)] pr-2">
                        <TimelineCard
                          reading={r}
                          chinese={chinese}
                          relatingChinese={relatingChinese}
                          relatingName={relatingName}
                        />
                      </div>
                      <div className="w-[calc(50%+24px)]" />
                    </>
                  ) : (
                    <>
                      <div className="w-[calc(50%+24px)]" />
                      <div className="w-[calc(50%-24px)] pl-2">
                        <TimelineCard
                          reading={r}
                          chinese={chinese}
                          relatingChinese={relatingChinese}
                          relatingName={relatingName}
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineCard({ reading: r, chinese, relatingChinese, relatingName }) {
  return (
    <Link
      to={`/reading/${r.id}`}
      className="block border border-stone/25 rounded-lg p-5 hover:border-stone/50 transition-colors group bg-parchment"
    >
      {/* Header: name + Chinese character */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-serif text-lg text-ink/85 group-hover:text-ink transition-colors leading-tight">
            {r.hexagram_name}
          </p>
          <p className="text-xs text-ink/35 mt-0.5">#{r.hexagram_number}</p>
        </div>
        <span className="text-4xl text-ink/70 font-serif leading-none shrink-0">
          {chinese}
        </span>
      </div>

      {/* Hexagram visual */}
      <div className="flex justify-center my-3">
        <HexagramVisual lines={r.lines} size="md" showChanging />
      </div>

      {/* Question */}
      {r.question && (
        <p className="text-sm italic text-ink/50 font-serif mt-3 leading-relaxed">
          {r.question}
        </p>
      )}

      {/* Date */}
      {r.created_date && (
        <p className="text-xs text-ink/35 mt-2">
          {formatDate(r.created_date)}
        </p>
      )}

      {/* Relating hexagram */}
      {r.relating_hexagram && relatingName && (
        <div className="border-t border-stone/15 mt-3 pt-3 flex items-center gap-2">
          <span className="text-2xl text-ink/60 font-serif leading-none">
            {relatingChinese}
          </span>
          <span className="text-sm text-ink/50">
            &rarr; {relatingName}
          </span>
        </div>
      )}
    </Link>
  );
}
