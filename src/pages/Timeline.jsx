import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';
import { HEXAGRAM_NAMES, TRIGRAMS, getTrigrams } from '@/lib/hexagramData';

function computeInsights(readings) {
  if (!readings?.length) return null;

  const hexagramCounts = {};
  const trigramCounts = Object.fromEntries(TRIGRAMS.map((t) => [t.name, 0]));
  let changingLineTotal = 0;
  let readingsWithChange = 0;
  const byMonth = {};
  let oldestDate = null;
  let newestDate = null;

  for (const r of readings) {
    hexagramCounts[r.hexagram_number] = (hexagramCounts[r.hexagram_number] || 0) + 1;

    const tri = getTrigrams(r.lines);
    if (tri) {
      trigramCounts[tri.upper.name] += 1;
      trigramCounts[tri.lower.name] += 1;
    }

    const changes = r.changing_lines?.length || 0;
    changingLineTotal += changes;
    if (changes > 0) readingsWithChange += 1;

    if (r.created_date) {
      const d = new Date(r.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
      if (!oldestDate || d < oldestDate) oldestDate = d;
      if (!newestDate || d > newestDate) newestDate = d;
    }
  }

  const topHexagrams = Object.entries(hexagramCounts)
    .map(([num, count]) => ({ num: Number(num), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const trigramTotal = Object.values(trigramCounts).reduce((a, b) => a + b, 0) || 1;
  const trigramBalance = TRIGRAMS
    .map((t) => ({
      ...t,
      count: trigramCounts[t.name],
      percent: Math.round((trigramCounts[t.name] / trigramTotal) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const monthlyKeys = Object.keys(byMonth).sort();
  const monthlySeries = monthlyKeys.map((k) => ({ key: k, count: byMonth[k] }));
  const maxMonthly = Math.max(1, ...monthlySeries.map((m) => m.count));

  return {
    total: readings.length,
    changingLineTotal,
    avgChanges: (changingLineTotal / readings.length).toFixed(1),
    readingsWithChange,
    topHexagrams,
    trigramBalance,
    monthlySeries,
    maxMonthly,
    oldestDate,
    newestDate,
  };
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

export default function Timeline() {
  const { data: readings, isLoading } = useQuery({
    queryKey: ['readings-timeline'],
    queryFn: () => base44.entities.Reading.list('created_date'),
  });

  const insights = computeInsights(readings);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-serif tracking-wide text-ink/90">Timeline</h1>
        <p className="text-xs text-ink/35 tracking-widest uppercase mt-1">
          Patterns across your consultations
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-stone/30 border-t-ink/60 rounded-full animate-spin" />
        </div>
      ) : !insights ? (
        <div className="text-center py-16">
          <p className="text-ink/30 mb-4">No readings yet — patterns appear once you've consulted the Dao a few times.</p>
          <Link to="/" className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink">
            Consult the Dao
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center border border-stone/20 rounded p-4">
              <p className="text-3xl font-serif text-ink/80">{insights.total}</p>
              <p className="text-[10px] tracking-widest uppercase text-ink/35 mt-1">Readings</p>
            </div>
            <div className="text-center border border-stone/20 rounded p-4">
              <p className="text-3xl font-serif text-ink/80">{insights.avgChanges}</p>
              <p className="text-[10px] tracking-widest uppercase text-ink/35 mt-1">Avg. changing lines</p>
            </div>
            <div className="text-center border border-stone/20 rounded p-4">
              <p className="text-3xl font-serif text-ink/80">
                {Math.round((insights.readingsWithChange / insights.total) * 100)}%
              </p>
              <p className="text-[10px] tracking-widest uppercase text-ink/35 mt-1">In transition</p>
            </div>
          </div>

          {/* Trigram balance */}
          <div>
            <h2 className="text-xs tracking-widest uppercase text-ink/30 mb-4 border-b border-stone/15 pb-2">
              Trigram balance
            </h2>
            <div className="space-y-3">
              {insights.trigramBalance.map((t) => (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="text-2xl text-ink/70 w-8 text-center leading-none">{t.symbol}</span>
                  <span className="font-serif text-sm text-ink/75 w-24 shrink-0">{t.element}</span>
                  <div className="flex-1 h-1.5 bg-stone/15 rounded overflow-hidden">
                    <div
                      className="h-full bg-ink/60"
                      style={{ width: `${t.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-ink/40 w-10 text-right">{t.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recurring hexagrams */}
          {insights.topHexagrams.length > 0 && (
            <div>
              <h2 className="text-xs tracking-widest uppercase text-ink/30 mb-4 border-b border-stone/15 pb-2">
                Recurring hexagrams
              </h2>
              <div className="space-y-3">
                {insights.topHexagrams.map(({ num, count }) => {
                  const example = readings.find((r) => r.hexagram_number === num);
                  return (
                    <Link
                      key={num}
                      to={example ? `/reading/${example.id}` : '#'}
                      className="flex items-center gap-5 px-4 py-3 border border-stone/15 rounded hover:border-stone/40 transition-colors group"
                    >
                      {example && <HexagramVisual lines={example.lines} size="sm" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-serif text-ink/70 group-hover:text-ink transition-colors">
                          {num}. {HEXAGRAM_NAMES[num]}
                        </p>
                      </div>
                      <span className="text-xs text-ink/40">
                        {count}× {count === 1 ? 'time' : 'times'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly rhythm */}
          {insights.monthlySeries.length > 0 && (
            <div>
              <h2 className="text-xs tracking-widest uppercase text-ink/30 mb-4 border-b border-stone/15 pb-2">
                Monthly rhythm
              </h2>
              <div className="flex items-end gap-2 h-32">
                {insights.monthlySeries.map((m) => (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <div
                      className="w-full bg-ink/60 rounded-sm"
                      style={{ height: `${(m.count / insights.maxMonthly) * 100}%` }}
                      title={`${m.count} reading${m.count !== 1 ? 's' : ''}`}
                    />
                    <span className="text-[9px] text-ink/35 tracking-wide truncate">
                      {monthLabel(m.key)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
