import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';
import {
  castReading,
  hexagramFromLines,
  getRelatingHexagram,
  getChangingLineIndices,
  HEXAGRAM_NAMES,
} from '@/lib/hexagramData';

const MOOD_TAGS = ['clarity', 'uncertainty', 'transition', 'stillness', 'growth', 'release'];

export default function Oracle() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [method, setMethod] = useState('coin');
  const [moodTag, setMoodTag] = useState('');
  const [reading, setReading] = useState(null);
  const [saving, setSaving] = useState(false);

  const cast = () => {
    const lines = castReading();
    const hexNum = hexagramFromLines(lines);
    const relating = getRelatingHexagram(lines);
    const changingLines = getChangingLineIndices(lines);

    setReading({
      lines,
      hexagram_number: hexNum,
      hexagram_name: HEXAGRAM_NAMES[hexNum],
      relating_hexagram: relating,
      relating_name: relating ? HEXAGRAM_NAMES[relating] : null,
      changing_lines: changingLines,
    });
  };

  const save = async () => {
    if (!reading) return;
    setSaving(true);
    try {
      const record = {
        hexagram_number: reading.hexagram_number,
        hexagram_name: reading.hexagram_name,
        lines: reading.lines,
        changing_lines: reading.changing_lines,
        relating_hexagram: reading.relating_hexagram,
        question: question || undefined,
        method,
        mood_tag: moodTag || undefined,
      };
      const created = await base44.entities.Reading.create(record);
      toast.success('Reading saved to your journal');
      if (created?.id) {
        navigate(`/reading/${created.id}`);
      }
    } catch {
      toast.error('Could not save reading');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setReading(null);
    setQuestion('');
    setMoodTag('');
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif tracking-wide text-ink/90 mb-2">Consult the Oracle</h1>
        <p className="text-sm text-ink/40 tracking-widest uppercase">The Book of Changes</p>
      </div>

      {!reading ? (
        /* Pre-cast form */
        <div className="space-y-8">
          <div>
            <label className="block text-xs tracking-widest uppercase text-ink/40 mb-2">
              Your Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you ask of the oracle?"
              className="w-full bg-transparent border border-stone/30 rounded px-4 py-3 text-ink placeholder:text-ink/25 focus:outline-none focus:border-ink/40 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-ink/40 mb-3">Method</label>
            <div className="flex gap-3">
              {['coin', 'auto'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-4 py-2 rounded border text-sm tracking-wide transition-colors ${
                    method === m
                      ? 'border-ink/40 text-ink bg-ink/5'
                      : 'border-stone/20 text-ink/40 hover:text-ink/60'
                  }`}
                >
                  {m === 'coin' ? 'Three Coins' : 'Automatic'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-ink/40 mb-3">
              Mood (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setMoodTag(moodTag === tag ? '' : tag)}
                  className={`px-3 py-1 rounded-full border text-xs tracking-wide transition-colors ${
                    moodTag === tag
                      ? 'border-sage text-sage bg-sage/10'
                      : 'border-stone/20 text-ink/35 hover:text-ink/55'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 text-center">
            <button
              onClick={cast}
              className="px-10 py-3 bg-ink text-parchment rounded tracking-widest text-sm uppercase hover:bg-ink/85 transition-colors"
            >
              Cast the Hexagram
            </button>
          </div>
        </div>
      ) : (
        /* Post-cast result */
        <div className="space-y-10">
          {question && (
            <p className="text-center text-ink/50 italic text-lg font-serif">"{question}"</p>
          )}

          <div className="flex flex-col items-center gap-6">
            <HexagramVisual lines={reading.lines} size="lg" showChanging />

            <div className="text-center">
              <p className="text-4xl font-serif text-ink/90 mb-1">
                {reading.hexagram_number}. {reading.hexagram_name}
              </p>
              {reading.relating_hexagram && (
                <p className="text-sm text-ink/40 mt-2">
                  Changing to {reading.relating_hexagram}. {reading.relating_name}
                </p>
              )}
            </div>

            {reading.changing_lines.length > 0 && (
              <div className="text-xs text-ink/35 tracking-wide">
                Changing lines: {reading.changing_lines.map((i) => i + 1).join(', ')}
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={save}
              disabled={saving}
              className="px-6 py-2 bg-ink text-parchment rounded text-sm tracking-wide hover:bg-ink/85 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save to Journal'}
            </button>
            <button
              onClick={reset}
              className="px-6 py-2 border border-stone/30 text-ink/60 rounded text-sm tracking-wide hover:text-ink hover:border-ink/30 transition-colors"
            >
              Cast Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
