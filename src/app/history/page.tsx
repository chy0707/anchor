'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePreferences } from '@/components/PreferencesProvider';

const STORAGE_KEY = 'moodEntries';
const GENTLE_ACTIONS_HISTORY_KEY = 'moodbuddy.gentleActions.history.v1';
const GENTLE_ACTIONS_COMPLETION_STATS_KEY = 'moodbuddy.gentleActions.completionStats.v1';

function readGentleActionsCompletionDays(): string[] {
  try {
    const raw = localStorage.getItem(GENTLE_ACTIONS_HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
  } catch {
    // ignore
  }
  return [];
}

type GentleCompletionStats = Record<string, { total: number; completed: number }>;

function readGentleActionsCompletionStats(): GentleCompletionStats {
  try {
    const raw = localStorage.getItem(GENTLE_ACTIONS_COMPLETION_STATS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as GentleCompletionStats;
    }
  } catch {
    // ignore
  }
  return {};
}

function parseISODateKey(key: string) {
  const [y, m, d] = key.split('-').map((v) => Number(v));
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

function toDateKey(d: Date): string {
  // Use local date to avoid timezone shifting issues (e.g., entries appearing on the wrong day)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysKey(baseKey: string, deltaDays: number) {
  const dt = parseISODateKey(baseKey);
  dt.setDate(dt.getDate() + deltaDays);
  return toDateKey(dt);
}

function countCompletionInRange(history: string[], startKeyInclusive: string, endKeyInclusive: string) {
  const start = parseISODateKey(startKeyInclusive).getTime();
  const end = parseISODateKey(endKeyInclusive).getTime();
  let n = 0;
  for (const k of history) {
    const t = parseISODateKey(k).getTime();
    if (t >= start && t <= end) n += 1;
  }
  return n;
}

function computeCompletionStreak(history: string[], today: string) {
  const set = new Set(history);
  let streak = 0;
  let cursor = today;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDaysKey(cursor, -1);
    if (streak > 365) break;
  }
  return streak;
}

function buildGentleActionsOneLiner(history: string[], today: string) {
  const last7Start = addDaysKey(today, -6);
  const prev7Start = addDaysKey(today, -13);
  const prev7End = addDaysKey(today, -7);

  const last7 = countCompletionInRange(history, last7Start, today);
  const prev7 = countCompletionInRange(history, prev7Start, prev7End);
  const diff = last7 - prev7;
  const diffText =
    diff > 0 ? `up ${diff} vs last week` : diff < 0 ? `down ${Math.abs(diff)} vs last week` : 'same as last week';

  const streak = computeCompletionStreak(history, today);
  const streakText = streak === 1 ? 'a 1-day streak' : `${streak}-day streak`;

  return `Suggestions: ${last7}/7 days (${diffText}) · ${streakText}`;
}

type MoodId = 'very_bad' | 'bad' | 'okay' | 'good' | 'great';

type WeatherSnapshot = {
  tempC: number; // stored in Celsius
  label: string;
  icon: string;
  city?: string;
};

type Entry = {
  id: string;
  moodId: MoodId;
  moodScore?: number;
  note: string;
  dateKey: string; // YYYY-MM-DD
  timestamp: string; // ISO
  imageDataUrl?: string; // base64 dataURL
  weather?: WeatherSnapshot;
};

const MOODS: { id: MoodId; icon: string; score: number }[] = [
  { id: 'very_bad', icon: '😞', score: 1 },
  { id: 'bad', icon: '😕', score: 2 },
  { id: 'okay', icon: '😐', score: 3 },
  { id: 'good', icon: '🙂', score: 4 },
  { id: 'great', icon: '😄', score: 5 },
];

const WEEKDAYS_3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function safeDate(v: any): Date {
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function setNoon(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function sameWeekMon(a: Date, b: Date) {
  return toDateKey(startOfWeekMon(a)) === toDateKey(startOfWeekMon(b));
}

function addMonths(d: Date, delta: number) {
  const x = new Date(d);
  x.setDate(15); // avoid month length issues
  x.setMonth(x.getMonth() + delta);
  x.setHours(12, 0, 0, 0);
  return x;
}

function weekdayMon0(d: Date) {
  return (d.getDay() + 6) % 7; // Mon = 0
}

function startOfWeekMon(d: Date) {
  const x = new Date(d);
  const diff = weekdayMon0(x); // Mon=0
  x.setDate(x.getDate() - diff);
  x.setHours(12, 0, 0, 0);
  return x;
}

function endOfWeekSun(d: Date) {
  const start = startOfWeekMon(d);
  const x = new Date(start);
  x.setDate(start.getDate() + 6);
  x.setHours(12, 0, 0, 0);
  return x;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function cToF(c: number) {
  return Math.round((c * 9) / 5 + 32);
}

function formatTemp(tempC: number, unit: 'celsius' | 'fahrenheit') {
  if (unit === 'fahrenheit') return `${cToF(tempC)}°F`;
  return `${Math.round(tempC)}°C`;
}

function formatMMDD(key: string) {
  if (!key) return '';
  return `${key.slice(5, 7)}/${key.slice(8, 10)}`;
}

function emojiForValue(v: number | null) {
  if (v == null) return '—';
  const r = clamp(Math.round(v), 1, 5);
  return MOODS.find((m) => m.score === r)?.icon ?? '😐';
}

/**
 * Trend window:
 * - days=7  => Weekly (Mon → Sun, but for the current week we end at today)
 * - days=30 => Monthly (1st → last day, but for the current month we end at today)
 */
function buildSeries(entries: Entry[], days: 7 | 30, anchor: Date) {
  const map = new Map<string, number[]>();

  for (const e of entries) {
    const s =
      typeof e.moodScore === 'number'
        ? e.moodScore
        : MOODS.find((m) => m.id === e.moodId)?.score ?? 3;

    if (!map.has(e.dateKey)) map.set(e.dateKey, []);
    map.get(e.dateKey)!.push(s);
  }

  const today = setNoon(new Date());
  const a = setNoon(anchor);

  let start: Date;
  let end: Date;

  if (days === 7) {
    // Full calendar week: Mon → Sun (always 7 days)
    start = startOfWeekMon(a);
    end = endOfWeekSun(a);
  } else {
    // Full calendar month: 1st → last day (always full month)
    start = startOfMonth(a);
    start.setHours(12, 0, 0, 0);
    end = endOfMonth(a);
    end.setHours(12, 0, 0, 0);
  }

  const points: { dateKey: string; value: number | null }[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const key = toDateKey(d);
    const arr = map.get(key);
    points.push({
      dateKey: key,
      value: arr && arr.length ? arr.reduce((aa, bb) => aa + bb, 0) / arr.length : null,
    });
  }

  return points;
}

function computeSummary(series: { dateKey: string; value: number | null }[]) {
  const vals = series.map((p) => p.value).filter((v): v is number => typeof v === 'number');
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  const last = (() => {
    for (let i = series.length - 1; i >= 0; i--) {
      if (typeof series[i].value === 'number') return series[i].value as number;
    }
    return null;
  })();

  const trackedDays = series.filter((p) => typeof p.value === 'number').length;

  const scoreCounts = new Map<number, number>();
  for (const p of series) {
    if (p.value == null) continue;
    const s = clamp(Math.round(p.value), 1, 5);
    scoreCounts.set(s, (scoreCounts.get(s) ?? 0) + 1);
  }

  let topScore: number | null = null;
  let topCount = -1;
  for (const [s, c] of scoreCounts.entries()) {
    if (c > topCount) {
      topCount = c;
      topScore = s;
    }
  }

  const topMood = topScore == null ? null : MOODS.find((m) => m.score === topScore) ?? null;

  return {
    avg,
    last,
    trackedDays,
    totalDays: series.length,
    topMoodIcon: topMood?.icon ?? null,
    topMoodScore: topScore,
  };
}

/* ======================= */
/*   INTERACTIVE LINE      */
/* ======================= */
function LineChart({ series }: { series: { dateKey: string; value: number | null }[] }) {
  const w = 320;
  const h = 150;
  const padX = 12;
  const padY = 12;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [lockedIdx, setLockedIdx] = useState<number | null>(null);

  const stepX = (w - padX * 2) / Math.max(1, series.length - 1);

  const originalCount = useMemo(
    () => series.filter((p) => typeof p.value === 'number').length,
    [series]
  );

  const pts = useMemo(() => {
    const raw = series.map((p) => p.value);

    const shouldConnect = originalCount >= 2;
    const filled: Array<number | null> = new Array(raw.length).fill(null);

    if (shouldConnect) {
      const first = raw.findIndex((v) => typeof v === 'number');
      let last = -1;
      for (let i = raw.length - 1; i >= 0; i--) {
        if (typeof raw[i] === 'number') {
          last = i;
          break;
        }
      }

      if (first >= 0 && last >= 0 && last > first) {
        let lastKnown: number | null = null;
        for (let i = first; i <= last; i++) {
          const v = raw[i];
          if (typeof v === 'number') {
            lastKnown = v;
            filled[i] = v;
          } else {
            filled[i] = lastKnown;
          }
        }

        // Back-fill any nulls inside [first,last] using the first known value
        const firstKnown = filled.slice(first, last + 1).find((v) => typeof v === 'number') ?? null;
        if (firstKnown != null) {
          for (let i = first; i <= last; i++) {
            if (filled[i] == null) filled[i] = firstKnown;
            else break;
          }
        }
      }
    } else {
      // No connection: only plot where we truly have a value
      for (let i = 0; i < raw.length; i++) {
        filled[i] = typeof raw[i] === 'number' ? (raw[i] as number) : null;
      }
    }

    return series.map((p, i) => {
      const x = padX + i * stepX;
      const plotValue = filled[i];
      if (plotValue == null) return { x, y: null as number | null, plotValue: null as number | null, ...p };
      const y = padY + (5 - plotValue) * ((h - padY * 2) / 4);
      return { x, y, plotValue, ...p };
    });
  }, [series, stepX, originalCount]);

  const path = useMemo(() => {
    if (originalCount < 2) return '';
    return pts
      .map((p, i) => {
        if (p.y == null) return '';
        const prev = i > 0 && pts[i - 1].y != null;
        return `${prev ? 'L' : 'M'} ${p.x} ${p.y}`;
      })
      .filter(Boolean)
      .join(' ');
  }, [pts, originalCount]);

  const activeIdx = lockedIdx ?? hoverIdx;
  const active = activeIdx == null ? null : pts[activeIdx];

  function pickIndex(clientX: number) {
    const el = svgRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * w;
    return clamp(Math.round((x - padX) / stepX), 0, series.length - 1);
  }

  const tipX = active ? clamp(active.x - 40, 6, w - 86) : 6;

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-[150px] select-none"
        onMouseMove={(e) => lockedIdx == null && setHoverIdx(pickIndex(e.clientX))}
        onMouseLeave={() => lockedIdx == null && setHoverIdx(null)}
        onClick={() => hoverIdx != null && setLockedIdx((p) => (p === hoverIdx ? null : hoverIdx))}
        onTouchMove={(e) => setHoverIdx(pickIndex(e.touches[0].clientX))}
        onTouchEnd={() => hoverIdx != null && setLockedIdx(hoverIdx)}
      >
        {path && (
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots only on real check-ins (original value exists) */}
        {pts.map((p, i) => {
          const hasOriginal = typeof p.value === 'number';
          if (!hasOriginal || p.y == null) return null;
          return <circle key={i} cx={p.x} cy={p.y} r={activeIdx === i ? 5 : 3.5} fill="currentColor" />;
        })}

        {active && (
          <>
            <rect x={tipX} y={6} width={86} height={34} rx={12} fill="currentColor" opacity="0.12" />
            <text x={tipX + 10} y={20} fontSize="11" opacity="0.85">
              {formatMMDD(active.dateKey)}
            </text>
            <text x={tipX + 10} y={34} fontSize="16" fontWeight="700">
              {emojiForValue(active.value)}
            </text>
          </>
        )}
      </svg>

      <div className="flex justify-between text-[11px] text-gray-500 mt-1">
        <span>{formatMMDD(series[0]?.dateKey ?? '')}</span>
        <span>{formatMMDD(series.at(-1)?.dateKey ?? '')}</span>
      </div>
    </div>
  );
}

/* ======================= */
/*   HISTORY PAGE          */
/* ======================= */
export default function HistoryPage() {
  const { resolvedTempUnit } = usePreferences();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [trendAnchor, setTrendAnchor] = useState<Date>(() => setNoon(new Date()));
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const [gentleCompletionDays, setGentleCompletionDays] = useState<string[]>([]);
  const [gentleCompletionStats, setGentleCompletionStats] = useState<GentleCompletionStats>({});

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setEntries(Array.isArray(raw) ? raw : []);
    } catch {
      setEntries([]);
    } finally {
      setLoaded(true);
      try {
        setGentleCompletionDays(readGentleActionsCompletionDays());
      } catch {
        setGentleCompletionDays([]);
      }
      try {
        setGentleCompletionStats(readGentleActionsCompletionStats());
      } catch {
        setGentleCompletionStats({});
      }
    }
  }, []);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const gentleCompletionSet = useMemo(() => new Set(gentleCompletionDays), [gentleCompletionDays]);
  const gentleOneLiner = useMemo(
    () => buildGentleActionsOneLiner(gentleCompletionDays, todayKey),
    [gentleCompletionDays, todayKey]
  );
  const gentleStreak = useMemo(() => computeCompletionStreak(gentleCompletionDays, todayKey), [gentleCompletionDays, todayKey]);

  const dayLatest = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const e of entries) {
      const prev = map.get(e.dateKey);
      if (!prev || safeDate(e.timestamp) > safeDate(prev.timestamp)) map.set(e.dateKey, e);
    }
    return map;
  }, [entries]);

  const calendarCells = useMemo(() => {
    const start = startOfMonth(monthCursor);
    const end = endOfMonth(monthCursor);
    const gridStart = addDays(start, -weekdayMon0(start));
    const gridEnd = addDays(end, 6 - weekdayMon0(end));

    const cells: { date: Date; key: string; inMonth: boolean; entry?: Entry }[] = [];
    for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
      const key = toDateKey(d);
      cells.push({
        date: new Date(d),
        key,
        inMonth: d.getMonth() === monthCursor.getMonth(),
        entry: dayLatest.get(key),
      });
    }
    return cells;
  }, [monthCursor, dayLatest]);

  const selectedEntry = useMemo(() => {
    if (!selectedDateKey) return null;
    const list = entries.filter((e) => e.dateKey === selectedDateKey);
    if (list.length === 0) return null;
    return list.sort((a, b) => +safeDate(b.timestamp) - +safeDate(a.timestamp))[0];
  }, [entries, selectedDateKey]);

  const series = useMemo(() => buildSeries(entries, rangeDays, trendAnchor), [entries, rangeDays, trendAnchor]);
  const summary = useMemo(() => computeSummary(series), [series]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDateKey) return '';
    const d = safeDate(`${selectedDateKey}T12:00:00`);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }, [selectedDateKey]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black px-4 pt-24 pb-24">
      <div className="max-w-md mx-auto w-full space-y-10">
        {!loaded && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}

        {loaded && entries.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400">No records yet.</div>
        )}

        {loaded && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-black dark:text-white">Mood Calendar</div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
                className="w-9 h-9 rounded-full bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-black dark:text-white"
                aria-label="Previous month"
              >
                ‹
              </button>

              <div className="text-sm font-semibold text-black dark:text-white">
                {monthCursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </div>

              <button
                onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
                className="w-9 h-9 rounded-full bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-black dark:text-white"
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 px-1 text-[12px] text-gray-500 dark:text-gray-400">
              {WEEKDAYS_3.map((x) => (
                <div key={x} className="text-center whitespace-nowrap">
                  {x}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((c) => {
                const isToday = c.key === todayKey;
                const isSelected = selectedDateKey === c.key;

                const moodIcon = c.entry ? MOODS.find((m) => m.id === c.entry!.moodId)?.icon ?? '😐' : null;

                return (
                  <div key={c.key} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedDateKey((prev) => (prev === c.key ? null : c.key))}
                      className={`
                        relative aspect-square w-full rounded-2xl
                        border border-gray-200 dark:border-white/10
                        bg-white/70 dark:bg-white/5
                        flex items-center justify-center
                        ${c.inMonth ? 'opacity-100' : 'opacity-35'}
                        ${isSelected ? 'ring-2 ring-black dark:ring-white' : ''}
                        transition-transform duration-150 active:scale-[0.97]
                      `}
                      aria-label={`Open ${c.key}`}
                    >
                      <div className="absolute top-2 left-2 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        {c.date.getDate()}
                      </div>

                      <div className="flex flex-col items-center">
                        {moodIcon && <div className="text-lg">{moodIcon}</div>}
                        {gentleCompletionSet.has(c.key) && (
                          <div
                            className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500/80 dark:bg-green-400/80"
                            aria-label="Suggestions completed"
                          />
                        )}
                      </div>
                    </button>

                    <div className="h-4 flex items-center justify-center">
                      {isToday && (
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80 dark:bg-rose-300/80" aria-label="Today" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={`
                overflow-hidden transition-all duration-300 ease-out
                ${selectedDateKey ? 'max-h-[620px] opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              <div className="mt-3 rounded-3xl bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-black dark:text-white">
                      {selectedDateLabel || 'Day details'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedDateKey(null)}
                    className="h-9 w-9 rounded-full border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-black dark:text-white"
                    aria-label="Close details"
                  >
                    ✕
                  </button>
                </div>

                {!selectedEntry && (
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">No check-in for this day.</div>
                )}

                {selectedEntry && (
                  <div className="mt-4 space-y-4">
                    {selectedEntry.weather && (
                      <div className="rounded-2xl bg-white/70 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0 text-sm text-gray-700 dark:text-gray-300">
                            {selectedEntry.weather.city && <span className="truncate">{selectedEntry.weather.city}</span>}
                            {selectedEntry.weather.city && <span className="opacity-60">·</span>}
                            <span aria-hidden>{selectedEntry.weather.icon}</span>
                            <span className="truncate">{selectedEntry.weather.label}</span>
                          </div>

                          <div className="text-sm font-semibold text-black dark:text-white tabular-nums shrink-0">
                            {formatTemp(selectedEntry.weather.tempC, resolvedTempUnit)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center text-xl dark:bg-white dark:text-black">
                        {MOODS.find((m) => m.id === selectedEntry.moodId)?.icon ?? '😐'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-black dark:text-white">
                          {safeDate(selectedEntry.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    {selectedDateKey &&
                      (gentleCompletionSet.has(selectedDateKey) || !!gentleCompletionStats[selectedDateKey]) && (
                        <div className="rounded-2xl bg-white/70 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-gray-600 dark:text-gray-400">Suggestions</div>
                            <div className="text-sm font-semibold text-black dark:text-white">
                              {(() => {
                                const s = gentleCompletionStats[selectedDateKey];
                                const completed = s && typeof s.completed === 'number' ? s.completed : null;
                                const total = s && typeof s.total === 'number' ? s.total : null;
                                if (completed != null && total != null) return `${completed}/${total} completed`;
                                return `—/— completed`;
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                    {selectedEntry.note?.trim() && (
                      <div className="rounded-2xl bg-white/70 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Memo</div>
                        <div className="text-sm text-black dark:text-white whitespace-pre-wrap">{selectedEntry.note}</div>
                      </div>
                    )}

                    {selectedEntry.imageDataUrl && (
                      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5">
                        <img src={selectedEntry.imageDataUrl} alt="Mood photo" className="w-full h-auto block" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loaded && entries.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold tracking-wide text-black dark:text-white">Mood Trend</div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTrendAnchor((prev) => (rangeDays === 7 ? addDays(prev, -7) : addMonths(prev, -1)));
                  }}
                  className="h-9 w-9 rounded-full bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-black dark:text-white"
                  aria-label="Previous period"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTrendAnchor((prev) => (rangeDays === 7 ? addDays(prev, 7) : addMonths(prev, 1)));
                  }}
                  disabled={
                    rangeDays === 7
                      ? sameWeekMon(trendAnchor, new Date())
                      : sameMonth(trendAnchor, new Date())
                  }
                  className="h-9 w-9 rounded-full bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-black dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next period"
                >
                  ›
                </button>

                <div className="flex gap-2">
                  {[7, 30].map((d) => {
                    const active = rangeDays === d;
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          setRangeDays(d as 7 | 30);
                          setTrendAnchor(setNoon(new Date()));
                        }}
                        className={`
                          px-3 py-1 rounded-full text-xs border
                          ${
                            active
                              ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                              : 'bg-white/70 dark:bg-white/5 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10'
                          }
                        `}
                      >
                        {d === 7 ? 'Weekly' : 'Monthly'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* close the two wrappers after the tabs */}
            {/* close for <div className="flex gap-2"> and <div className="flex items-center gap-2"> */}
            {/* The actual closing tags are after the tab container */}

            <LineChart series={series} />
          </div>
        )}

        {loaded && entries.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-black dark:text-white">Summary</div>

            <div className="rounded-3xl bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Tracked</div>
                  <div className="mt-1 text-xl font-extrabold text-black dark:text-white">
                    {summary.trackedDays}/{summary.totalDays}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Avg</div>
                  <div className="mt-1 text-xl font-extrabold text-black dark:text-white">
                    {summary.avg == null ? '—' : emojiForValue(summary.avg)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Most</div>
                  <div className="mt-1 text-xl font-extrabold text-black dark:text-white">{summary.topMoodIcon ?? '—'}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/80 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Last</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="text-xl">{emojiForValue(summary.last)}</div>
                    <div className="text-sm font-semibold text-black dark:text-white">
                      {summary.last == null ? '--' : `${summary.last.toFixed(1)}/5`}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/80 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Most common</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="text-xl">{summary.topMoodIcon ?? '—'}</div>
                    <div className="text-sm font-semibold text-black dark:text-white">
                      {summary.topMoodScore == null ? '--' : `${summary.topMoodScore}/5`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-white/80 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Suggestions</div>
                    <div className="mt-1 text-sm font-semibold text-black dark:text-white">{gentleOneLiner}</div>
                  </div>
                  <div className="shrink-0 rounded-full bg-gray-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-black dark:text-white">
                    🔥 {gentleStreak}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                Summary updates when you switch This week / This month.
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}