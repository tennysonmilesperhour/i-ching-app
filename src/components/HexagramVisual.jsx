import { getLineType } from '../lib/hexagramData';

export default function HexagramVisual({ lines, size = 'md', showChanging = false, partial = false }) {
  if (!lines || lines.length === 0) return null;
  if (!partial && lines.length !== 6) return null;

  const cfg = {
    sm: { w: 72, h: 5, gap: 5, brk: 10 },
    md: { w: 120, h: 7, gap: 7, brk: 16 },
    lg: { w: 160, h: 9, gap: 9, brk: 20 },
  };

  const c = cfg[size] || cfg.md;
  const totalSlots = partial ? 6 : lines.length;
  const paddedLines = partial
    ? [...Array(6 - lines.length).fill(null), ...([...lines].reverse())]
    : [...lines].reverse();
  const displayLines = paddedLines;
  const totalH = totalSlots * c.h + (totalSlots - 1) * c.gap;

  return (
    <svg width={c.w + (showChanging ? 20 : 0)} height={totalH} viewBox={`0 0 ${c.w + (showChanging ? 20 : 0)} ${totalH}`}>
      {displayLines.map((val, idx) => {
        const y = idx * (c.h + c.gap);
        if (val === null) {
          return (
            <g key={idx}>
              <rect x={0} y={y} width={c.w} height={c.h} rx={1} className="fill-ink/10" />
            </g>
          );
        }
        const { yin, changing } = getLineType(val);
        const half = (c.w - c.brk) / 2;

        return (
          <g key={idx}>
            {yin ? (
              <>
                <rect x={0} y={y} width={half} height={c.h} rx={1} className="fill-ink" />
                <rect x={c.w - half} y={y} width={half} height={c.h} rx={1} className="fill-ink" />
              </>
            ) : (
              <rect x={0} y={y} width={c.w} height={c.h} rx={1} className="fill-ink" />
            )}
            {showChanging && changing && (
              <circle cx={c.w + 10} cy={y + c.h / 2} r={2.5} className="fill-sage" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
