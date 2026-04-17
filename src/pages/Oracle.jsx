import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Sparkles, Coins, ChevronRight, ChevronUp, ChevronDown, Undo2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';
import {
  castReading,
  hexagramFromLines,
  getRelatingHexagram,
  getChangingLineIndices,
  HEXAGRAM_NAMES,
} from '@/lib/hexagramData';

const LINE_LABELS = ['Bottom', '2', '3', '4', '5', 'Top'];
const HEADS_TO_LINE = { 0: 6, 1: 7, 2: 8, 3: 9 };
const LINE_DESCRIPTIONS = {
  6: 'Old Yin (changing)',
  7: 'Young Yang',
  8: 'Young Yin',
  9: 'Old Yang (changing)',
};

export default function Oracle() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [method, setMethod] = useState(null);
  const [reading, setReading] = useState(null);
  const [saving, setSaving] = useState(false);
  const [coinStep, setCoinStep] = useState(null);
  const [coinLines, setCoinLines] = useState([]);
  const [showInstructions, setShowInstructions] = useState(true);

  const cast = () => {
    const lines = castReading();
    finishCast(lines);
  };

  const finishCast = (lines) => {
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

  const selectHeads = (heads) => {
    const lineVal = HEADS_TO_LINE[heads];
    const newLines = [...coinLines, lineVal];
    setCoinLines(newLines);
    if (newLines.length === 6) {
      setCoinStep(null);
      finishCast(newLines);
    } else {
      setCoinStep(newLines.length);
    }
  };

  const undoLastLine = () => {
    if (coinLines.length === 0) return;
    const newLines = coinLines.slice(0, -1);
    setCoinLines(newLines);
    setCoinStep(newLines.length);
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

  const isCoinFlow = coinStep !== null && !reading;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif tracking-wide text-ink/90 mb-3">Consult the Dao</h1>
        <p className="text-sm text-ink/50 italic font-serif max-w-md mx-auto leading-relaxed">
          Still your mind. Let a question arise. The oracle responds to the quality of your attention.
        </p>
      </div>

      {isCoinFlow ? (
        /* Three Coin Method  - step-by-step input */
        <div className="space-y-8">
          {question && (
            <div>
              <label className="block text-xs tracking-widest uppercase text-ink/40 mb-2">
                Your Question <span className="normal-case tracking-normal text-ink/30">(optional)</span>
              </label>
              <div className="w-full bg-transparent border border-stone/30 rounded px-4 py-3 text-ink/60 text-sm">
                {question}
              </div>
            </div>
          )}

          {/* Collapsible instructions */}
          <div className="border border-stone/30 rounded">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-serif text-ink/80">How to toss the coins</span>
              {showInstructions
                ? <ChevronUp className="w-4 h-4 text-ink/40" />
                : <ChevronDown className="w-4 h-4 text-ink/40" />
              }
            </button>
            {showInstructions && (
              <div className="px-5 pb-5 space-y-3 text-sm text-ink/60 leading-relaxed">
                <p>
                  Hold three coins of the same kind. Concentrate on your question. When ready, let them
                  fall. Assign: <strong className="text-ink/80">Heads = 3</strong> (yang) · <strong className="text-ink/80">Tails = 2</strong> (yin).
                </p>
                <p>
                  The sum of three coins gives the line: 6 = Old Yin (changing) · 7 = Young Yang · 8 = Young
                  Yin · 9 = Old Yang (changing).
                </p>
                <p>
                  Build from the <em>bottom up</em>  - the first toss is the bottom line.
                </p>
              </div>
            )}
          </div>

          {/* Progress indicator + hexagram visual */}
          {coinLines.length > 0 && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs tracking-widest uppercase text-ink/40">
                Lines cast: {coinLines.length} of 6
              </p>
              <HexagramVisual lines={coinLines} size="md" partial />
            </div>
          )}

          {/* Current line input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-widest uppercase text-ink/50">
                Line {coinStep + 1}  - {LINE_LABELS[coinStep]}
              </p>
              {coinLines.length > 0 && (
                <button
                  onClick={undoLastLine}
                  className="flex items-center gap-1 text-xs text-ink/35 hover:text-ink/60 transition-colors"
                  title="Undo last line"
                >
                  <Undo2 className="w-3 h-3" strokeWidth={1.5} />
                  <span>Undo</span>
                </button>
              )}
            </div>
            <p className="text-lg font-serif text-ink/80">
              Toss three coins. How many landed heads?
            </p>
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((h) => (
                <button
                  key={h}
                  onClick={() => selectHeads(h)}
                  className="py-4 rounded border text-center font-serif text-lg transition-colors border-stone/30 text-ink/50 hover:border-ink/40 hover:text-ink/70 active:bg-ink/5"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : !reading ? (
        /* Method selection */
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
            <p className="text-center text-ink/50 italic text-lg font-serif">&ldquo;{question}&rdquo;</p>
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
