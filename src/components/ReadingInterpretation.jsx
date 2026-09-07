import classicalLines from '@/data/classicalLines.json';
import { HEXAGRAM_CHINESE, HEXAGRAM_NAMES, getLineType, getTrigrams } from '@/lib/hexagramData';
import { HEXAGRAM_INTERPRETATIONS } from '@/lib/hexagramInterpretations';
import { normalizeReadingMode } from '@/lib/readingMode';

const LINE_NAMES = {
  6: 'Old Yin',
  7: 'Young Yang',
  8: 'Young Yin',
  9: 'Old Yang',
};

const LINE_POSITION_GUIDANCE = [
  'The beginning: notice the first impulse before it becomes momentum.',
  'The inner field: attend to relationship, support, and the foundation beneath the matter.',
  'The threshold: pressure is building where inner preparation meets outward action.',
  'The outer field: a private understanding is entering responsibility, work, or relationship.',
  'The center of influence: consider how leadership, integrity, or example shapes the whole.',
  'The culmination: something has reached fullness and may need release rather than more effort.',
];

const SPHERES = [
  {
    key: 'social',
    label: 'Social',
    context: 'Language · story · relationship',
    prompt: 'What name, role, promise, or story is shaping the way you see this?',
  },
  {
    key: 'martial',
    label: 'Martial',
    context: 'Body · action · boundary',
    prompt: 'What single embodied action—or clean boundary—would make the counsel real?',
  },
  {
    key: 'qi',
    label: 'Qi',
    context: 'Energy · rhythm · vitality',
    prompt: 'Where does this situation feel open, depleted, charged, or obstructed?',
  },
  {
    key: 'tao',
    label: 'Tao',
    context: 'Presence · direct perception',
    prompt: 'Set the explanation aside for a moment. What becomes perceptible when you stop forcing an answer?',
  },
];

function TrigramStructure({ trigrams }) {
  return (
    <section className="grid grid-cols-2 gap-4 border-t border-stone/25 pt-8" aria-labelledby="trigram-structure">
      <h2 id="trigram-structure" className="sr-only">Trigram structure</h2>
      {[
        ['Upper', trigrams.upper],
        ['Lower', trigrams.lower],
      ].map(([position, trigram]) => (
        <div key={position} className="space-y-2 text-center">
          <span className="text-xs tracking-widest uppercase text-ink/55">{position}</span>
          <div className="text-4xl leading-none text-ink/80" aria-hidden="true">{trigram.symbol}</div>
          <p className="font-serif text-ink/80">{trigram.element} · {trigram.chinese}</p>
          <p className="text-xs italic leading-relaxed text-ink/60">{trigram.attribute}</p>
        </div>
      ))}
    </section>
  );
}

function LineRecord({ lines }) {
  return (
    <section className="border-t border-stone/25 pt-8" aria-labelledby="line-record">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id="line-record" className="text-xs tracking-widest uppercase text-ink/55">Line record</h2>
          <p className="mt-1 text-sm italic text-ink/55">Numbered from the bottom upward.</p>
        </div>
        <span className="text-[10px] tracking-widest uppercase text-ink/50">Top shown first</span>
      </div>
      <ol className="divide-y divide-stone/20 border-y border-stone/25">
        {[...lines].reverse().map((value, displayIndex) => {
          const lineNumber = 6 - displayIndex;
          const { changing } = getLineType(value);

          return (
            <li key={lineNumber} className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 py-3 text-sm">
              <span className="text-xs text-ink/55">{lineNumber}</span>
              <span className="text-ink/75">{LINE_NAMES[value]}</span>
              <span className="flex items-center gap-3">
                {changing && (
                  <span className="rounded-full border border-sage/50 px-2 py-0.5 text-[10px] tracking-widest uppercase text-sage/90">
                    Changing
                  </span>
                )}
                <span className="font-serif text-base text-ink/80">{value}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function InquirerReading({ interpretation }) {
  return (
    <div className="space-y-10 border-t border-stone/25 pt-8">
      {interpretation?.judgment && (
        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-ink/55">The heart of the reading</h2>
          <p className="font-serif text-lg leading-[1.85] text-ink/85">{interpretation.judgment}</p>
        </section>
      )}
      {interpretation?.counsel && (
        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-ink/55">A way to meet it</h2>
          <p className="font-serif text-lg leading-[1.85] text-ink/85">{interpretation.counsel}</p>
        </section>
      )}
      {interpretation?.image && (
        <section className="space-y-3 rounded-lg border border-stone/30 bg-ink/[0.025] px-6 py-6">
          <h2 className="text-xs tracking-widest uppercase text-ink/55">An image to carry</h2>
          <p className="font-serif text-lg italic leading-[1.8] text-ink/75">{interpretation.image}</p>
        </section>
      )}
    </div>
  );
}

function AdeptReading({ reading, interpretation, trigrams }) {
  return (
    <div className="space-y-10">
      {trigrams && <TrigramStructure trigrams={trigrams} />}
      <LineRecord lines={reading.lines} />
      {interpretation && (
        <div className="space-y-10 border-t border-stone/25 pt-8">
          {interpretation.judgment && (
            <section className="space-y-4">
              <h2 className="text-xs tracking-widest uppercase text-ink/55">Contemporary judgment</h2>
              <p className="font-serif text-lg leading-[1.85] text-ink/85">{interpretation.judgment}</p>
            </section>
          )}
          {interpretation.image && (
            <section className="space-y-4">
              <h2 className="text-xs tracking-widest uppercase text-ink/55">Contemporary image</h2>
              <p className="font-serif text-lg italic leading-[1.85] text-ink/75">{interpretation.image}</p>
            </section>
          )}
          {interpretation.counsel && (
            <section className="space-y-4">
              <h2 className="text-xs tracking-widest uppercase text-ink/55">Counsel</h2>
              <p className="font-serif text-lg leading-[1.85] text-ink/85">{interpretation.counsel}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ChangingLineGuidance({ reading, mode }) {
  const indices = reading.changing_lines || [];
  const sourceLines = classicalLines[String(reading.hexagram_number)] || [];

  if (!indices.length) {
    return (
      <section className="border-t border-stone/25 pt-8">
        <h2 className="text-xs tracking-widest uppercase text-ink/55">A stable figure</h2>
        <p className="mt-4 font-serif text-lg leading-relaxed text-ink/75">
          No lines are changing. Let the primary hexagram stand as the whole response, without hurrying it toward a second condition.
        </p>
      </section>
    );
  }

  return (
    <section className="border-t border-stone/25 pt-8" aria-labelledby="changing-lines">
      <div className="mb-6 space-y-2">
        <h2 id="changing-lines" className="text-xs tracking-widest uppercase text-ink/55">Changing lines · where the reading moves</h2>
        <p className="text-sm leading-relaxed text-ink/60">
          Read each changing line as a live hinge between the present figure and what it is becoming.
        </p>
      </div>
      <ol className="space-y-5">
        {indices.map((index) => {
          const value = reading.lines[index];
          const becomes = value === 6 ? 'Yang' : 'Yin';
          return (
            <li key={index} className="rounded-lg border border-stone/30 px-5 py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-lg text-ink/90">Line {index + 1}</h3>
                <span className="text-xs tracking-wide text-ink/60">{LINE_NAMES[value]} becomes {becomes}</span>
              </div>
              {sourceLines[index] && (
                <p className="mt-4 whitespace-pre-line border-l border-sage/50 pl-4 font-serif text-base italic leading-[1.75] text-ink/80">
                  {sourceLines[index]}
                </p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-ink/65">{LINE_POSITION_GUIDANCE[index]}</p>
              {mode === 'inquirer' && (
                <p className="mt-3 text-sm italic leading-relaxed text-ink/60">
                  What would it look like to meet this change without forcing its outcome?
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Transformation({ reading, interpretation, relatingName, mode }) {
  if (!interpretation) return null;
  return (
    <section className="space-y-5 border-t border-stone/25 pt-8">
      <h2 className="text-xs tracking-widest uppercase text-ink/55">
        {mode === 'adept' ? 'Transformation' : 'The movement'} · {reading.relating_hexagram}. {relatingName}
      </h2>
      <p className="font-serif text-lg leading-[1.85] text-ink/80">{interpretation.judgment}</p>
      {mode === 'adept' && interpretation.counsel && (
        <p className="font-serif text-base leading-[1.85] text-ink/75">{interpretation.counsel}</p>
      )}
    </section>
  );
}

function FourSphereReflection() {
  return (
    <section className="border-t border-stone/25 pt-8" aria-labelledby="four-sphere-reflection">
      <div className="space-y-2">
        <h2 id="four-sphere-reflection" className="text-xs tracking-widest uppercase text-ink/55">Four-sphere reflection</h2>
        <p className="text-sm leading-relaxed text-ink/60">
          Carry the reading through four dimensions of practice. Use the sphere that has the most charge; you do not need to answer all four.
        </p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SPHERES.map((sphere) => (
          <article key={sphere.key} className="rounded-lg border border-stone/30 p-5">
            <p className="font-serif text-lg text-ink/90">{sphere.label}</p>
            <p className="mt-1 text-[10px] tracking-widest uppercase text-ink/55">{sphere.context}</p>
            <p className="mt-4 text-sm leading-relaxed text-ink/70">{sphere.prompt}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink/55">
        Inspired by the Four Ascendant sphere framework; this is an independent reflection aid, not an official lineage interpretation.
      </p>
    </section>
  );
}

function SourcesAndMethod({ method }) {
  const isYarrow = method === 'yarrow';
  const isCoin = method === 'coin';
  const methodName = isYarrow ? 'Yarrow-weighted digital cast' : isCoin ? 'Three Coin Method' : 'Legacy oracle cast';
  const methodDetail = isYarrow
    ? 'Each line uses traditional yarrow probabilities: 6 · 1/16, 7 · 5/16, 8 · 7/16, 9 · 3/16. Random values come from the browser cryptography API.'
    : isCoin
      ? 'The visitor enters each physical three-coin toss, building the figure from the bottom upward.'
      : 'This reading predates explicit casting-method versioning.';

  return (
    <details className="group border-t border-stone/25 pt-8">
      <summary className="cursor-pointer list-none text-xs tracking-widest uppercase text-ink/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink/40">
        Sources &amp; method <span aria-hidden="true" className="ml-2 inline-block transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="mt-5 space-y-5 rounded-lg border border-stone/25 bg-ink/[0.02] p-5 text-sm leading-relaxed text-ink/65">
        <div>
          <h3 className="font-medium text-ink/85">{methodName}</h3>
          <p className="mt-1">{methodDetail}</p>
        </div>
        <div>
          <h3 className="font-medium text-ink/85">Reading voice</h3>
          <p className="mt-1">
            The judgment, image, and counsel are original contemporary paraphrases written for The Free I Ching. They are interpretation, not canonical translation or quotation.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-ink/85">Changing-line text</h3>
          <p className="mt-1">
            The line text is drawn from the CC0 translation in{' '}
            <a className="underline underline-offset-4 hover:text-ink" href="https://github.com/jesshewitt/i-ching" target="_blank" rel="noreferrer">
              jesshewitt/i-ching
            </a>, translated from Richard Wilhelm&rsquo;s public-domain 1924 German edition and edited by Jess Hewitt.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-ink/85">Four-sphere layer</h3>
          <p className="mt-1">
            Independently adapted from the{' '}
            <a className="underline underline-offset-4 hover:text-ink" href="https://www.the-taoism-for-modern-world.com/understanding-the-4-spheres-of-the-ascendant/" target="_blank" rel="noreferrer">
              Four Ascendant sphere framework
            </a>. No formal affiliation or lineage authority is implied.
          </p>
        </div>
        <p className="text-xs text-ink/55">Content version 2026.08 · Casting algorithm version 2</p>
      </div>
    </details>
  );
}

export default function ReadingInterpretation({ reading, mode = 'inquirer' }) {
  if (!reading?.lines?.length) return null;

  const normalizedMode = normalizeReadingMode(mode);
  const interpretation = HEXAGRAM_INTERPRETATIONS[reading.hexagram_number];
  const relatingInterpretation = reading.relating_hexagram
    ? HEXAGRAM_INTERPRETATIONS[reading.relating_hexagram]
    : null;
  const relatingName = reading.relating_hexagram ? HEXAGRAM_NAMES[reading.relating_hexagram] : null;
  const trigrams = getTrigrams(reading.lines);
  const chinese = HEXAGRAM_CHINESE[reading.hexagram_number];

  return (
    <div>
      <p className="sr-only">
        Hexagram {reading.hexagram_number}, {reading.hexagram_name}{chinese ? `, ${chinese}` : ''}.
      </p>
      {normalizedMode === 'adept' ? (
        <AdeptReading reading={reading} interpretation={interpretation} trigrams={trigrams} />
      ) : (
        <InquirerReading interpretation={interpretation} />
      )}
      <div className="space-y-10">
        <ChangingLineGuidance reading={reading} mode={normalizedMode} />
        <Transformation
          reading={reading}
          interpretation={relatingInterpretation}
          relatingName={relatingName}
          mode={normalizedMode}
        />
        <FourSphereReflection />
        <section className="border-t border-stone/25 pt-8">
          <h2 className="text-xs tracking-widest uppercase text-ink/55">Sit with this</h2>
          <p className="mt-4 font-serif text-lg italic leading-relaxed text-ink/75">
            Where is this pattern already present—and what is the smallest unforced response available to you?
          </p>
        </section>
        <SourcesAndMethod method={reading.method} />
      </div>
    </div>
  );
}
