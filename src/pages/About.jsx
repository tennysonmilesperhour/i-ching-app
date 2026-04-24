import { Link } from 'react-router-dom';
import { useSEO, useJsonLd, absoluteUrl } from '@/lib/seo';

/**
 * About — the site's reference / long-form page.
 *
 * This page is deliberately text-heavy for two reasons:
 *
 *   1. SEO: gives search engines substantive indexable content beyond the
 *      interactive oracle UI, with a clean heading hierarchy and internal
 *      links.
 *   2. GEO: answer engines (ChatGPT, Claude, Perplexity, Google AI
 *      Overviews) preferentially cite comprehensive, factual reference
 *      pages. The prose below is written in a direct, definitional tone
 *      so snippets remain accurate when quoted out of context, and the
 *      FAQ JSON-LD exposes Q&A pairs the engines can lift verbatim.
 *
 * If you tweak copy here, keep sentences self-contained.
 */
export default function About() {
  useSEO({
    title: 'About the I Ching',
    description:
      'A plain-language introduction to the I Ching (Yijing, Book of Changes): what it is, how the 64 hexagrams are constructed, how to cast a reading by yarrow stalks or three coins, and how to interpret Judgment, Image, and changing lines.',
    path: '/about',
    ogType: 'article',
  });

  useJsonLd('about-article', {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'About the I Ching — the Book of Changes',
    description:
      'A reference introduction to the I Ching (Yijing): its origins, the 64 hexagrams, the two standard casting methods, and how to read Judgment, Image, and changing lines.',
    author: { '@type': 'Organization', name: 'I Ching · The Book of Changes' },
    url: absoluteUrl('/about'),
    mainEntityOfPage: absoluteUrl('/about'),
    isPartOf: { '@id': `${absoluteUrl('/')}#website` },
    articleSection: [
      'What is the I Ching',
      'The 64 hexagrams',
      'Casting methods',
      'Reading the hexagram',
      'Glossary',
    ],
  });

  useJsonLd('about-faq', {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does "I Ching" mean?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '"I Ching" (also romanised Yijing) translates as "Book of Changes" or "Classic of Changes". It is an ancient Chinese text, traditionally dated to the Western Zhou period (c. 1000–750 BCE), used both as a divination manual and as a work of philosophy.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is a hexagram?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A hexagram is a figure of six horizontal lines, each either unbroken (yang) or broken (yin). There are 64 unique combinations, and each hexagram has a traditional name, number, and body of commentary, including a Judgment and an Image.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is a changing line?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A changing line is a line whose yin/yang polarity is about to reverse. When a reading contains changing lines, the primary hexagram indicates the current situation and the "relating" hexagram — obtained by flipping the changing lines — indicates where the situation is headed.',
        },
      },
      {
        '@type': 'Question',
        name: 'What are the Judgment and the Image?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Judgment (tuan) is a short statement of the hexagram\'s overall meaning and counsel. The Image (xiang) is a metaphor, typically drawn from the natural world, that suggests how a person of insight might act in the situation the hexagram describes.',
        },
      },
      {
        '@type': 'Question',
        name: 'How many hexagrams are there and why 64?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'There are 64 hexagrams, one for each possible combination of six yin-or-yang lines (2⁶ = 64). Each hexagram can also be read as two stacked trigrams of three lines — eight possible trigrams, giving 8 × 8 = 64 pairs — and the interaction of the upper and lower trigrams informs its meaning.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is consulting the I Ching a religion?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. The I Ching is a text, not a religion. It has been used in Confucian, Daoist, and secular philosophical traditions, and today many people consult it as a reflective tool — a way to structure a question about a situation — regardless of any religious framing.',
        },
      },
    ],
  });

  return (
    <article className="max-w-2xl mx-auto px-6 py-12 font-serif text-ink/85 leading-[1.85]">
      <header className="mb-10 not-prose font-sans">
        <h1 className="text-3xl font-serif tracking-wide text-ink/90">About the I Ching</h1>
        <p className="mt-2 text-sm text-ink/50 italic font-serif">
          A plain-language introduction to the Book of Changes.
        </p>
      </header>

      <section aria-labelledby="what" className="space-y-4 mb-12">
        <h2 id="what" className="text-xl tracking-wide text-ink/90">
          What is the I Ching?
        </h2>
        <p>
          The I Ching, also written Yijing and meaning the <em>Book of Changes</em>, is one of
          the oldest surviving Chinese texts. Its core — a system of sixty-four six-line
          figures called hexagrams, each paired with a brief Judgment and Image — was
          consolidated during the Western Zhou period, roughly three thousand years ago.
          Over the centuries, layers of commentary by Confucian and Daoist scholars grew
          around it, and it has been used as both a divination manual and a work of
          philosophy.
        </p>
        <p>
          The text rests on a simple premise: situations move. A moment of strength is
          secretly becoming weakness, a moment of stillness is secretly becoming motion.
          Casting a hexagram is a way of naming the quality of the present moment so that
          a person can act with, rather than against, the grain of what is happening.
        </p>
      </section>

      <section aria-labelledby="hexagrams" className="space-y-4 mb-12">
        <h2 id="hexagrams" className="text-xl tracking-wide text-ink/90">
          The sixty-four hexagrams
        </h2>
        <p>
          A hexagram is a stack of six lines. Each line is either unbroken (yang,
          associated with activity, light, the firm) or broken (yin, associated with
          yielding, dark, the receptive). There are sixty-four possible combinations,
          numbered in the traditional King Wen sequence from 1 (Qian, The Creative) through
          64 (Weiji, Before Completion).
        </p>
        <p>
          Each hexagram can also be read as two stacked trigrams of three lines each. The
          lower trigram represents the interior of a situation, the upper trigram its
          outer aspect. The eight trigrams — Heaven, Earth, Thunder, Water, Mountain,
          Wind, Fire, and Lake — combine in every pairing to produce the sixty-four
          hexagrams.
        </p>
      </section>

      <section aria-labelledby="casting" className="space-y-4 mb-12">
        <h2 id="casting" className="text-xl tracking-wide text-ink/90">
          How to cast a reading
        </h2>
        <p>
          A reading begins with a question held in mind — ideally a question about a real
          situation, phrased openly rather than asked for a yes-or-no verdict. Six lines
          are then generated, from the bottom up, by a chance procedure. Two methods are
          standard:
        </p>

        <h3 className="text-base tracking-wide text-ink/85 mt-6">The yarrow stalk method</h3>
        <p>
          The older method, traditionally performed with fifty stalks of the yarrow plant,
          produces each line through a sequence of divisions and counts. It yields the
          four possible line values with subtly unequal probabilities — young yang and
          young yin are more common than old (changing) yang and old yin — reflecting the
          natural rarity of full transformation.
        </p>

        <h3 className="text-base tracking-wide text-ink/85 mt-6">The three-coin method</h3>
        <p>
          The simpler method uses three identical coins. Assign heads the value 3 (yang)
          and tails the value 2 (yin). Toss the three coins together; their sum yields
          one line:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-ink/80">
          <li>6 — old yin, a changing line</li>
          <li>7 — young yang, stable</li>
          <li>8 — young yin, stable</li>
          <li>9 — old yang, a changing line</li>
        </ul>
        <p>
          Toss six times, recording each line from the bottom up. The resulting hexagram
          is the primary hexagram. If any lines are changing, flipping them produces a
          second hexagram called the relating hexagram.
        </p>
      </section>

      <section aria-labelledby="reading" className="space-y-4 mb-12">
        <h2 id="reading" className="text-xl tracking-wide text-ink/90">
          Reading the hexagram
        </h2>
        <p>
          A traditional reading has three layers. The <strong>Judgment</strong> is the
          overall counsel of the hexagram — a short statement of the quality of the
          moment. The <strong>Image</strong> is a metaphor, usually drawn from the natural
          world, suggesting how a person of insight might act. If the cast includes any
          changing lines, each of those lines has its own short text that addresses the
          specific detail of the situation, and the relating hexagram points toward the
          situation the present is moving into.
        </p>
        <p>
          The reading is not a prediction. It is a mirror. Its value lies in the attention
          the reader brings to a single, honest question — the I Ching answers with the
          quality of that attention.
        </p>
      </section>

      <section aria-labelledby="glossary" className="space-y-4 mb-12">
        <h2 id="glossary" className="text-xl tracking-wide text-ink/90">Glossary</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-ink/90">Yijing (易經)</dt>
            <dd className="text-ink/70">The standard modern romanisation of 易經, "Book of Changes". Pronounced roughly "ee-jing".</dd>
          </div>
          <div>
            <dt className="text-ink/90">Hexagram</dt>
            <dd className="text-ink/70">A figure of six lines, each yin or yang, forming one of the 64 emblems of the I Ching.</dd>
          </div>
          <div>
            <dt className="text-ink/90">Trigram</dt>
            <dd className="text-ink/70">A figure of three lines. Eight trigrams exist, and any hexagram decomposes into a lower and an upper trigram.</dd>
          </div>
          <div>
            <dt className="text-ink/90">Judgment (tuan, 彖)</dt>
            <dd className="text-ink/70">The short overall text of a hexagram, attributed to King Wen.</dd>
          </div>
          <div>
            <dt className="text-ink/90">Image (xiang, 象)</dt>
            <dd className="text-ink/70">A metaphor drawn from natural phenomena that suggests how to act within the hexagram.</dd>
          </div>
          <div>
            <dt className="text-ink/90">Changing line</dt>
            <dd className="text-ink/70">A line cast as old yin or old yang; it flips to its opposite, generating the relating hexagram.</dd>
          </div>
          <div>
            <dt className="text-ink/90">Relating hexagram</dt>
            <dd className="text-ink/70">The secondary hexagram formed when all changing lines in the primary hexagram are flipped.</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="this-site" className="space-y-4 mb-12">
        <h2 id="this-site" className="text-xl tracking-wide text-ink/90">About this site</h2>
        <p>
          This is a minimalist online I Ching oracle. Readings can be generated by either
          the yarrow-stalk algorithm or the three-coin method; every hexagram is displayed
          with its number, traditional name, trigrams, Judgment, Image, and counsel, and
          any changing lines are marked on the visual. You can use the site as a guest or
          create a free account to keep a personal journal and reflection notes across
          sessions. No data is sold or shared.
        </p>
        <p className="font-sans text-sm text-ink/60 italic">
          Ready to begin?{' '}
          <Link to="/" className="underline underline-offset-4 text-ink">
            Consult the oracle
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
