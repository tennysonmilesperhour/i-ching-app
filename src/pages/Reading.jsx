import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import HexagramVisual from '@/components/HexagramVisual';
import ReadingInterpretation from '@/components/ReadingInterpretation';
import ReadingModeSelector from '@/components/ReadingModeSelector';
import ReadingPractice from '@/components/ReadingPractice';
import { HEXAGRAM_NAMES } from '@/lib/hexagramData';
import { normalizeReadingMode } from '@/lib/readingMode';
import { useAuth } from '@/lib/AuthContext';
import AdSlot from '@/components/ads/AdSlot';
import SupportBanner from '@/components/SupportBanner';
import { isNativePlatform } from '@/lib/platform';

export default function Reading() {
  const { id } = useParams();
  const { isGuest } = useAuth();
  const native = isNativePlatform();
  const [viewMode, setViewMode] = useState('inquirer');

  const { data: reading, isLoading, error } = useQuery({
    queryKey: ['reading', id],
    queryFn: () => base44.entities.Reading.get(id),
  });
  const savedReadingMode = normalizeReadingMode(reading?.reading_mode);
  const savedReadingId = reading?.id;

  useEffect(() => {
    if (savedReadingId) {
      setViewMode(savedReadingMode);
    }
  }, [savedReadingId, savedReadingMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-stone/30 border-t-ink/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !reading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-ink/55 mb-4">This reading could not be found.</p>
        <Link to="/journal" className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink">
          Back to Journal
        </Link>
      </div>
    );
  }

  const relatingName = reading.relating_hexagram
    ? HEXAGRAM_NAMES[reading.relating_hexagram]
    : null;
  const methodLabel = reading.method === 'yarrow'
    ? 'Yarrow-weighted oracle cast'
    : reading.method === 'coin'
      ? 'Three Coin Method'
      : 'Oracle cast · legacy';

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link to="/journal" className="text-xs tracking-widest uppercase text-ink/55 hover:text-ink/75 transition-colors">
        &larr; Journal
      </Link>

      <div className="mt-8 space-y-10">
        {reading.question && (
          <p className="text-center text-ink/50 italic text-lg font-serif">"{reading.question}"</p>
        )}

        <div className="flex flex-col items-center gap-6">
          <HexagramVisual
            lines={reading.lines}
            size="lg"
            showChanging
            label={`Hexagram ${reading.hexagram_number}, ${reading.hexagram_name}`}
          />

          <div className="text-center">
            <p className="text-4xl font-serif text-ink/90 mb-1">
              {reading.hexagram_number}. {reading.hexagram_name}
            </p>
            {reading.relating_hexagram && (
              <p className="text-sm text-ink/55 mt-2">
                Changing to {reading.relating_hexagram}. {relatingName}
              </p>
            )}
          </div>
        </div>

        {reading.changing_lines?.length > 0 && (
          <div className="text-center text-xs text-ink/55 tracking-wide">
            Changing lines: {reading.changing_lines.map((i) => i + 1).join(', ')}
          </div>
        )}

        <ReadingModeSelector value={viewMode} onChange={setViewMode} compact />

        <ReadingInterpretation reading={reading} mode={viewMode} />

        <div className="grid gap-4 border-t border-stone/25 pt-8 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs tracking-widest uppercase text-ink/55">Method</span>
            <p className="text-ink/70 mt-1">{methodLabel}</p>
          </div>
          {reading.mood_tag && (
            <div>
              <span className="text-xs tracking-widest uppercase text-ink/55">Mood</span>
              <p className="text-ink/70 mt-1 capitalize">{reading.mood_tag}</p>
            </div>
          )}
          {reading.created_date && (
            <div>
              <span className="text-xs tracking-widest uppercase text-ink/55">Date</span>
              <p className="text-ink/70 mt-1">
                {new Date(reading.created_date).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          )}
          {reading.sphere_focus && (
            <div>
              <span className="text-xs tracking-widest uppercase text-ink/55">Sphere</span>
              <p className="mt-1 capitalize text-ink/70">{reading.sphere_focus}</p>
            </div>
          )}
          {reading.follow_up_at && (
            <div>
              <span className="text-xs tracking-widest uppercase text-ink/55">Return on</span>
              <p className="mt-1 text-ink/70">
                {new Date(`${reading.follow_up_at.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>

        {isGuest && !reading.user_id && !native && (
          <div className="border-t border-stone/20 pt-8">
            <div className="rounded border border-sage/40 bg-sage/5 px-6 py-6 text-center space-y-3">
              <h2 className="font-serif text-lg text-ink/85">
                Keep this reading.
              </h2>
              <p className="text-sm text-ink/55 leading-relaxed max-w-md mx-auto">
                You&rsquo;re consulting as a guest. Create an account to save this
                reading to a personal journal you can return to.
              </p>
              <div className="flex justify-center gap-3 pt-2 flex-wrap">
                <Link
                  to={`/signup?claimReading=${reading.id}`}
                  className="px-5 py-2 bg-ink text-parchment rounded text-sm tracking-wide hover:bg-ink/85 transition-colors"
                >
                  Save &amp; Create Account
                </Link>
                <Link
                  to={`/login?claimReading=${reading.id}&next=/reading/${reading.id}`}
                  className="px-5 py-2 border border-stone/30 text-ink/60 rounded text-sm tracking-wide hover:text-ink hover:border-ink/30 transition-colors"
                >
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        )}

        <ReadingPractice key={reading.id} reading={reading} />

        <SupportBanner />

        <AdSlot placement="reading-footer" className="border-t border-stone/20 pt-8" />
      </div>
    </div>
  );
}
