'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePreferences } from '@/components/PreferencesProvider';
import { useRouter } from 'next/navigation';

type MoodOption = {
  id: 'very_bad' | 'bad' | 'okay' | 'good' | 'great';
  icon: string;
  slogan: string;
  selectedBg: string;
  selectedText: string;
};

type WeatherSnapshot = {
  tempC: number; // Store internal as Celsius (stable for analytics)
  code: number;
  label: string;
  icon: string;
  city?: string;
};

type Entry = {
  moodId: MoodOption['id'];
  note: string;
  dateKey: string;
  timestamp: string;
  imageDataUrl?: string;
  weather?: WeatherSnapshot;
};

const STORAGE_KEY = 'moodEntries';
const MAX_IMAGE_BYTES = 1_500_000;

const MOODS: MoodOption[] = [
  { id: 'very_bad', icon: '😞', slogan: 'Ugh… not it', selectedBg: 'bg-rose-600', selectedText: 'text-white' },
  { id: 'bad', icon: '😕', slogan: 'Meh… kinda off', selectedBg: 'bg-orange-500', selectedText: 'text-white' },
  { id: 'okay', icon: '😐', slogan: 'Just so-so', selectedBg: 'bg-amber-400', selectedText: 'text-black' },
  { id: 'good', icon: '🙂', slogan: 'Pretty good', selectedBg: 'bg-emerald-500', selectedText: 'text-white' },
  { id: 'great', icon: '😄', slogan: 'Feeling it', selectedBg: 'bg-sky-500', selectedText: 'text-white' },
];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function todayKey() {
  // Use local date key to avoid timezone shifting issues
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function weatherLabel(code?: number) {
  if (code === 0) return 'Clear';
  if ([1, 2, 3].includes(code ?? -1)) return 'Partly cloudy';
  if ([45, 48].includes(code ?? -1)) return 'Foggy';
  if (code != null && code >= 51 && code <= 67) return 'Drizzle';
  if (code != null && code >= 71 && code <= 77) return 'Snow';
  if (code != null && code >= 80 && code <= 82) return 'Rain';
  if (code != null && code >= 95) return 'Thunderstorm';
  return 'Weather';
}

function weatherIcon(code?: number) {
  if (code === 0) return '☀️';
  if ([1, 2, 3].includes(code ?? -1)) return '⛅️';
  if ([45, 48].includes(code ?? -1)) return '🌫️';
  if (code != null && code >= 51 && code <= 67) return '🌦️';
  if (code != null && code >= 71 && code <= 77) return '🌨️';
  if (code != null && code >= 80 && code <= 82) return '🌧️';
  if (code != null && code >= 95) return '⛈️';
  return '🌤️';
}

function cToF(c: number) {
  return Math.round((c * 9) / 5 + 32);
}

function formatTemp(tempC: number, unit: 'celsius' | 'fahrenheit') {
  if (unit === 'fahrenheit') return `${cToF(tempC)}°F`;
  return `${Math.round(tempC)}°C`;
}

export default function CheckInPage() {
  const router = useRouter();

  // Temperature unit follows Settings (auto -> resolved)
  const { resolvedTempUnit } = usePreferences();

  const [moodId, setMoodId] = useState<MoodOption['id'] | null>(null);
  const [note, setNote] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Weather snapshot for this check-in session
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const handlePickImage = async (file?: File) => {
    setErrorMsg(null);
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMsg('Image is too large. Please choose a smaller one.');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setImageDataUrl(dataUrl);
    } catch {
      setErrorMsg('Failed to load image.');
    }
  };

  // Fetch weather + city once (best effort). If it fails, check-in still works.
  useEffect(() => {
    if (!navigator.geolocation) return;

    setWeatherStatus('loading');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const w = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
          ).then((r) => r.json());

          const code = w?.current?.weather_code;
          const tempC = w?.current?.temperature_2m;

          let city: string | undefined;

          try {
            const g = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            ).then((r) => r.json());

            city = g?.city || g?.locality || g?.principalSubdivision;
          } catch {
            // Ignore city errors.
          }

          if (typeof tempC === 'number' && typeof code === 'number') {
            setWeather({
              tempC,
              code,
              label: weatherLabel(code),
              icon: weatherIcon(code),
              city: typeof city === 'string' && city.length > 0 ? city : undefined,
            });
            setWeatherStatus('ok');
          } else {
            setWeatherStatus('error');
          }
        } catch {
          setWeatherStatus('error');
        }
      },
      () => setWeatherStatus('error'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const weatherText = useMemo(() => {
    if (weatherStatus === 'loading') return 'Loading weather…';
    if (weatherStatus === 'error') return 'Weather unavailable';
    if (weatherStatus === 'ok' && weather) {
      const city = weather.city ?? 'Near you';
      return `${weather.icon} ${weather.label} · ${city}`;
    }
    return 'Weather';
  }, [weather, weatherStatus]);

  const weatherTempText = useMemo(() => {
    if (weatherStatus === 'ok' && weather) return formatTemp(weather.tempC, resolvedTempUnit);
    return '';
  }, [weather, weatherStatus, resolvedTempUnit]);

  const handleSave = () => {
    if (!moodId) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const timestamp = new Date().toISOString();

      const entry: Entry = {
        moodId,
        note: note.trim(),
        timestamp,
        dateKey: todayKey(),
        imageDataUrl,
        // Attach weather snapshot at save time
        weather: weather ?? undefined,
      };

      const prev: Entry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...prev]));

      router.push('/history');
    } catch {
      setErrorMsg('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black px-4 pt-24 pb-24">
      <div className="max-w-md mx-auto w-full space-y-10">
        {/* Prompt */}
        <div className="space-y-2">
          <div className="text-2xl font-extrabold text-black dark:text-white">Check in with yourself</div>
          <div className="text-gray-700 dark:text-white/80">How do you feel right now?</div>
        </div>

        {/* Mood icons (toggleable) */}
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-3">
            {MOODS.map((m) => {
              const selected = moodId === m.id;

              return (
                <button
                  key={m.id}
                  onClick={() => setMoodId((prev) => (prev === m.id ? null : m.id))}
                  className="flex flex-col items-center gap-2"
                  aria-label={m.slogan}
                >
                  <div
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center text-2xl
                      border border-gray-200 dark:border-white/10
                      transition-transform transition-colors duration-150
                      ${selected ? `${m.selectedBg} ${m.selectedText} scale-[1.03]` : 'bg-white/70 dark:bg-white/5 text-black dark:text-white'}
                      active:scale-95
                    `}
                  >
                    <span className={selected ? 'animate-[mb_pop_220ms_ease-out]' : ''}>{m.icon}</span>
                  </div>

                  <div className="min-h-[16px]">
                    {selected && (
                      <div className="text-[11px] leading-tight text-center text-black dark:text-white font-semibold animate-[mb_slideUp_240ms_ease-out]">
                        {m.slogan}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Weather row */}
          <div className={`flex items-center justify-between pt-1 text-sm ${'text-gray-700 dark:text-white/80'}`}>
            <div className="truncate">{weatherText}</div>
            <div className="font-semibold tabular-nums text-black dark:text-white">{weatherTempText}</div>
          </div>

          <style jsx>{`
            @keyframes mb_pop {
              0% { transform: scale(0.85); }
              60% { transform: scale(1.12); }
              100% { transform: scale(1); }
            }
            @keyframes mb_slideUp {
              0% { opacity: 0; transform: translateY(6px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>

        {/* What's fun today */}
        <div className="space-y-2">
          <div className="text-lg font-semibold text-black dark:text-white">What&apos;s fun today?</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="One tiny thing, one fun detail, anything."
            className="w-full h-28 rounded-2xl px-4 py-3 bg-white/70 dark:bg-white/5 text-black dark:text-white outline-none border border-gray-200 dark:border-white/10 focus:border-gray-300 dark:focus:border-white/20 transition"
          />
        </div>

        {/* Photo (+ rectangle) */}
        <div className="space-y-3">
          <div className="text-gray-600 dark:text-white/65 text-sm">Photo update (optional)</div>

          <input
            id="mood-photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handlePickImage(e.target.files?.[0])}
            className="hidden"
          />

          <label
            htmlFor="mood-photo"
            className={`
              w-full rounded-2xl border border-gray-200 dark:border-white/10
              bg-white/70 dark:bg-white/5
              flex items-center justify-center
              aspect-[16/9]
              cursor-pointer
              hover:bg-white dark:hover:bg-white/10
              active:scale-[0.99]
              transition
              ${imageDataUrl ? 'p-0 overflow-hidden' : 'p-6'}
            `}
            aria-label="Add photo"
          >
            {imageDataUrl ? (
              <img src={imageDataUrl} alt="Mood preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-300">
                <div className="w-14 h-14 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-3xl shadow-sm">
                  +
                </div>
                <div className="text-sm">Add a photo</div>
              </div>
            )}
          </label>

          {imageDataUrl && (
            <div className="flex justify-end">
              <button
                onClick={() => setImageDataUrl(undefined)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

        <button
          onClick={handleSave}
          disabled={!moodId || saving}
          className="w-full rounded-2xl py-3 bg-black text-white dark:bg-white dark:text-black font-semibold disabled:opacity-40 transition"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </main>
  );
}