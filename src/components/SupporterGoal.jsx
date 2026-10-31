import { useEffect, useState } from 'react';
import { goalProgress, parseSupporterCount, SUPPORTER_GOAL } from '@/lib/supporterGoal';

export default function SupporterGoal() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/api/supporters')
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (active && body) setCount(parseSupporterCount(body.count));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const percent = goalProgress(count);
  const reached = count !== null && count >= SUPPORTER_GOAL;

  return (
    <div className="mt-4 max-w-xl border-t border-sage/25 pt-4 text-sm text-ink/65">
      <p className="leading-relaxed">
        I only need {SUPPORTER_GOAL} yearly supporters to cover hosting and upkeep, which keeps the site free for everyone.
      </p>
      <div
        role="progressbar"
        aria-label="Yearly supporters"
        aria-valuemin={0}
        aria-valuemax={SUPPORTER_GOAL}
        aria-valuenow={count ?? 0}
        className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10"
      >
        <div className="h-full rounded-full bg-sage transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink/55">
        {count === null
          ? `Goal: ${SUPPORTER_GOAL} yearly supporters`
          : reached
            ? `${count} of ${SUPPORTER_GOAL} yearly supporters. Goal reached, thank you.`
            : `${count} of ${SUPPORTER_GOAL} yearly supporters`}
      </p>
    </div>
  );
}
