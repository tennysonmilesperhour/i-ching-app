import { Link, useParams } from 'react-router-dom';
import classicalLines from '@/data/classicalLines.json';
import HexagramVisual from '@/components/HexagramVisual';
import { HEXAGRAM_CHINESE, HEXAGRAM_NAMES, getLinesForHexagram, getTrigrams } from '@/lib/hexagramData';
import { HEXAGRAM_INTERPRETATIONS } from '@/lib/hexagramInterpretations';

export default function HexagramGuide() {
  const { number: numberParam } = useParams();
  const number = Number(numberParam);
  const lines = getLinesForHexagram(number);

  if (!Number.isInteger(number) || !lines) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-ink/60">That hexagram is not in the library.</p>
        <Link to="/library" className="mt-4 inline-block text-sm underline underline-offset-4">Return to the library</Link>
      </div>
    );
  }

  const name = HEXAGRAM_NAMES[number];
  const interpretation = HEXAGRAM_INTERPRETATIONS[number];
  const trigrams = getTrigrams(lines);
  const lineTexts = classicalLines[String(number)] || [];

  return (
    <article className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/library" className="text-xs tracking-widest uppercase text-ink/55 hover:text-ink/75">&larr; Library</Link>

      <header className="mt-10 flex flex-col items-center text-center">
        <HexagramVisual lines={lines} size="lg" label={`Hexagram ${number}, ${name}`} />
        <p className="mt-8 text-xs tracking-[0.2em] uppercase text-ink/55">Hexagram {number}</p>
        <h1 className="mt-2 font-serif text-4xl text-ink/90">{name}</h1>
        <p className="mt-2 font-serif text-3xl text-ink/65" lang="zh-Hant">{HEXAGRAM_CHINESE[number]}</p>
      </header>

      <div className="mt-12 grid grid-cols-2 gap-4 border-y border-stone/25 py-6 text-center">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink/55">Upper</p>
          <p className="mt-2 font-serif text-lg text-ink/80">{trigrams.upper.element} · {trigrams.upper.chinese}</p>
          <p className="mt-1 text-xs italic text-ink/60">{trigrams.upper.attribute}</p>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-ink/55">Lower</p>
          <p className="mt-2 font-serif text-lg text-ink/80">{trigrams.lower.element} · {trigrams.lower.chinese}</p>
          <p className="mt-1 text-xs italic text-ink/60">{trigrams.lower.attribute}</p>
        </div>
      </div>

      <div className="mt-10 space-y-10">
        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-ink/55">Contemporary judgment</h2>
          <p className="font-serif text-lg leading-[1.85] text-ink/85">{interpretation?.judgment}</p>
        </section>
        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-ink/55">Image</h2>
          <p className="font-serif text-lg italic leading-[1.85] text-ink/75">{interpretation?.image}</p>
        </section>
        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-ink/55">Counsel</h2>
          <p className="font-serif text-lg leading-[1.85] text-ink/85">{interpretation?.counsel}</p>
        </section>

        <section className="border-t border-stone/25 pt-8">
          <h2 className="text-xs tracking-widest uppercase text-ink/55">The six lines</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">Numbered from the bottom upward; displayed here from first to sixth.</p>
          <ol className="mt-6 space-y-4">
            {lineTexts.map((text, index) => (
              <li key={index} className="rounded-lg border border-stone/30 p-5">
                <h3 className="font-serif text-lg text-ink/90">Line {index + 1}</h3>
                <p className="mt-3 whitespace-pre-line font-serif text-base italic leading-[1.75] text-ink/75">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <p className="border-t border-stone/25 pt-6 text-xs leading-relaxed text-ink/55">
          Contemporary sections are original app interpretations. Line text comes from the CC0 translation in{' '}
          <a href="https://github.com/jesshewitt/i-ching" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-ink">jesshewitt/i-ching</a>.
        </p>
      </div>
    </article>
  );
}
