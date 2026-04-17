import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Sparkles, Coins, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';
import {
  castReading,
  hexagramFromLines,
  getRelatingHexagram,
  getChangingLineIndices,
  HEXAGRAM_NAMES,
} from '@/lib/hexagramData';

export default function Oracle() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [method, setMethod] = useState(null);
  const [reading, setReading] = useState(null);
  const [saving, setSaving] = useState(false);
  const [coinStep, setCoinStep] = useState(null); // null=not started, 0-5=line index
  const [coinLines, setCoinLines] = useState([]); // accumulated line values

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
    setMethod(null);
    setCoinStep(null);
    setCoinLines([]);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif tracking-wide text-ink/90 mb-3">Consult the Dao</h1>
        <p className="text-sm text-ink/50 italic font-serif max-w-md mx-auto leading-relaxed">
          Still your mind. Let a question arise. The oracle responds to the quality of your attention.
        </p>
      </div>

      {!reading ? (
        /* Pre-cast form */
        <div className="space-y-8">
          <div>
            <label className="block text-xs tracking-widest uppercase text-ink/40 mb-2">
              Your Question <span className="normal-case tracking-normal text-ink/30">(optional)</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What do I need to understand about..."
              className="w-full bg-transparent border border-stone/30 rounded px-4 py-3 text-ink placeholder:text-ink/25 focus:outline-none focus:border-ink/40 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-ink/40 mb-4">
              Choose Your Method
            </label>
            <div className="space-y-3">
              <button
                onClick={() => { setMethod('auto'); cast(); }}
                className="w-full flex items-center gap-4 p-4 rounded border border-stone/30 hover:border-ink/40 hover:bg-ink/[0.02] transition-colors text-left"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full border border-stone/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-ink/60" strokeWidth={1.5} />
                </span>
                <span className="flex-1">
                  <span className="block font-serif text-lg text-ink/90">Cast by the Dao</span>
                  <span className="block text-sm text-ink/50">Yarrow stalk probabilities, cast by the Dao</span>
                </span>
                <ChevronRight className="w-4 h-4 text-ink/40" strokeWidth={1.5} />
              </button>

              <button
                onClick={() => { setMethod('coin'); setCoinStep(0); setCoinLines([]); }}
                className="w-full flex items-center gap-4 p-4 rounded border border-stone/30 hover:border-ink/40 hover:bg-ink/[0.02] transition-colors text-left"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full border border-stone/30 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-ink/60" strokeWidth={1.5} />
                </span>
                <span className="flex-1">
                  <span className="block font-serif text-lg text-ink/90">Three Coin Method</span>
                  <span className="block text-sm text-ink/50">Toss three coins yourself and enter each result</span>
                </span>
                <ChevronRight className="w-4 h-4 text-ink/40" strokeWidth={1.5} />
              </button>
            </div>
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
