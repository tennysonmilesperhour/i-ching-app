import { getLineType } from '../lib/hexagramData';

export default function HexagramVisual({ lines, size = 'md', showChanging = false }) {
  if (!lines || lines.length !== 6) return null;

  const cfg = { sm:{w:72,h:5,gap:5,brk:10}, md:{w:120,h:7,gap:7,brk:16}, lg:{w:160,h:9,gap:9,bt={totalH} viewBox={`0 0 ${c.w + (showChanging ? 20 : 0)} ${totalH}`}>
      {displayLines.map((val, idx) => {
        const { yin, changing } = getLineType(val);
        const y = idx * (c.h + c.gap);
        const half = (c.w - c.brk) / 2;

        return (
          <g key={idx}>
           ="fill-ink" />
              </>
            ) : (
              <rect x={0} y={y} width={c.w} height={c.h} rx={1} className="fill-ink" />
            )}
            {showChanging && changing && (
              <circle cx={c.w + 10} cy={y + c.h / 2} r={2.5} className="fill-sage" />
            )}
   r={2.5} className="fill-sage" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
