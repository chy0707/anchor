'use client';

import { useEffect, useMemo, useState } from 'react';
import ENCOURAGEMENTS from '../data/Encouragement';
import { usePreferences } from '@/components/PreferencesProvider';

type WeatherState = {
  status: 'idle' | 'loading' | 'ok' | 'error';
  tempC?: number;
  code?: number;
};

type LocationState = {
  label: string;
};

function formatTime(d: Date) {
  return d.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function getTimeGreeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function weatherLabel(code?: number) {
  if (code === 0) return 'Clear';
  if ([1, 2, 3].includes(code ?? -1)) return 'Partly cloudy';
  if ([45, 48].includes(code ?? -1)) return 'Foggy';
  if (code && code >= 51 && code <= 67) return 'Drizzle';
  if (code && code >= 71 && code <= 77) return 'Snow';
  if (code && code >= 80 && code <= 82) return 'Rain';
  if (code && code >= 95) return 'Thunderstorm';
  return 'Weather';
}

function weatherIcon(code?: number) {
  if (code === 0) return '☀️';
  if ([1, 2, 3].includes(code ?? -1)) return '⛅️';
  if ([45, 48].includes(code ?? -1)) return '🌫️';
  if (code && code >= 51 && code <= 67) return '🌦️';
  if (code && code >= 71 && code <= 77) return '🌨️';
  if (code && code >= 80 && code <= 82) return '🌧️';
  if (code && code >= 95) return '⛈️';
  return '🌤️';
}

function dayIndex(d: Date, size: number) {
  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % size;
  }
  return hash;
}

function daySeed(d: Date) {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function cToF(c: number) {
  return Math.round((c * 9) / 5 + 32);
}

function heartBackground(seed: number, mode: 'light' | 'dark') {
  const light = [
    ['#FFE6E6', '#FFF2E6'],
    ['#FFF1E6', '#FFEAF2'],
    ['#FFEAF2', '#FFF7E6'],
    ['#FFF7E6', '#FFE6F0'],
  ];
  const dark = [
    ['#0B0A0F', '#1A1220'],
    ['#0B0A0F', '#241218'],
    ['#0A0B10', '#1A1A2E'],
    ['#0B0A0F', '#1C1C1C'],
  ];

  const p = (mode === 'dark' ? dark : light)[seed % 4];

  if (mode === 'dark') {
    return `
      radial-gradient(900px 600px at 20% 20%, rgba(255,190,170,.14), transparent 55%),
      radial-gradient(700px 500px at 80% 35%, rgba(255,160,210,.10), transparent 55%),
      linear-gradient(135deg, ${p[0]}, ${p[1]})
    `;
  }

  return `linear-gradient(135deg, ${p[0]}, ${p[1]})`;
}

/** ---------- Gentle Actions ---------- */

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type GentleActionItem = { id: string; title: string };

type GentleActionsStore = {
  date: string; // YYYY-MM-DD
  checked: Record<string, boolean>;
  assignedIds: string[]; // current suggested list (3–5)
  refreshNonce: number; // increments when user refreshes remaining items
};

const GENTLE_ACTIONS_STORAGE_KEY = 'moodbuddy.gentleActions.v1';
const GENTLE_ACTIONS_HISTORY_KEY = 'moodbuddy.gentleActions.history.v1';
const GENTLE_ACTIONS_COMPLETION_STATS_KEY = 'moodbuddy.gentleActions.completionStats.v1';
const GENTLE_ACTIONS_STAGE_KEY = 'moodbuddy.gentleActions.stage.v1';
type GentleActionsStageStore = { date: string; stage: 'none' | 'congrats' | 'insights' };

function readStageStore(): GentleActionsStageStore | null {
  try {
    const raw = localStorage.getItem(GENTLE_ACTIONS_STAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GentleActionsStageStore;
    if (!parsed?.date || !parsed?.stage) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStageStore(store: GentleActionsStageStore) {
  try {
    localStorage.setItem(GENTLE_ACTIONS_STAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

const GENTLE_ACTIONS: GentleActionItem[] = [
  { id: 'breath_30', title: '30-second breathing (4-4-6)' },
  { id: 'breath_2', title: 'Two minutes of slow breathing' },
  { id: 'water', title: 'Drink a glass of water' },
  { id: 'tea', title: 'Make a warm tea (no rush)' },
  { id: 'stand', title: 'Stand up and stretch for one minute' },
  { id: 'walk_3', title: 'Walk for three minutes' },
  { id: 'sunlight', title: 'Get near daylight for one minute' },
  { id: 'open_window', title: 'Open a window for fresh air' },
  { id: 'shower', title: 'Wash your face or take a quick refresh' },
  { id: 'music', title: 'Play one calming song' },
  { id: 'tidy_1', title: 'Tidy one small area (30 seconds)' },
  { id: 'one_sentence', title: 'Write one sentence about how you feel' },
  { id: 'name_emotion', title: 'Name the emotion (e.g., anxious, tired, lonely)' },
  { id: 'body_scan', title: 'Do a one-minute body scan' },
  { id: 'ground_5', title: '5-4-3-2-1 grounding (one round)' },
  { id: 'shoulders', title: 'Relax your shoulders and jaw (three breaths)' },
  { id: 'hand_on_heart', title: 'Hand on heart: “I’m here with you.”' },
  { id: 'kind_words', title: 'Say one kind sentence to yourself' },
  { id: 'mini_break', title: 'Take a two-minute pause (no phone)' },
  { id: 'task_next', title: 'Write the next tiny step for one task' },
  { id: 'task_pause', title: 'Choose one thing to not do today' },
  { id: 'message_friend', title: 'Send a gentle message to someone you trust' },
  { id: 'ask_help', title: 'Ask for help with one specific thing' },
  { id: 'gratitude_1', title: 'Write one thing you’re grateful for' },
  { id: 'win_1', title: 'Write one small win from today' },
  { id: 'self_compassion', title: 'Self-compassion: “This is hard, and I’m doing my best.”' },
  { id: 'snack', title: 'Have a small snack if you’re hungry' },
  { id: 'posture', title: 'Reset posture: feet on the floor, sit tall' },
  { id: 'screen_break', title: 'Look away from the screen for 20 seconds' },
  { id: 'plan_sleep', title: 'Set a gentle bedtime reminder' },
  { id: 'note_trigger', title: 'Note one possible trigger (no judgment)' },
  { id: 'comfort_item', title: 'Hold a comfort item (blanket, plush, pillow)' },
  { id: 'short_walk_out', title: 'Step outside (even just the doorway)' },
  { id: 'stretch_neck', title: 'Slow neck stretch (left/right)' },
  { id: '3_good_things', title: 'Write three good things (tiny counts)' },
];

const CHECKIN_CANDIDATE_KEYS = [
  'moodbuddy.checkin.latest.v1',
  'moodbuddy.checkin.v1',
  'moodbuddy.checkin.latest',
  'moodbuddy.checkin',
];

type CheckinLike = {
  mood?: string;
  moodId?: string;
  moodLabel?: string;
  emotion?: string;
  feeling?: string;
};

function readLatestCheckinMood(): string | undefined {
  try {
    for (const key of CHECKIN_CANDIDATE_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as CheckinLike;
      const m =
        parsed?.mood ||
        parsed?.moodId ||
        parsed?.moodLabel ||
        parsed?.emotion ||
        parsed?.feeling;
      if (typeof m === 'string' && m.trim()) return m.trim();
    }
  } catch {
    // ignore
  }
  return undefined;
}

function normalizeMood(raw?: string):
  | 'happy'
  | 'calm'
  | 'neutral'
  | 'sad'
  | 'tired'
  | 'anxious'
  | 'stressed'
  | 'angry'
  | 'unknown' {
  if (!raw) return 'unknown';
  const s = raw.toLowerCase();
  if (s.includes('happy') || s.includes('great') || s.includes('joy')) return 'happy';
  if (s.includes('calm') || s.includes('relax') || s.includes('peace')) return 'calm';
  if (s.includes('neutral') || s.includes('ok') || s.includes('fine')) return 'neutral';
  if (s.includes('sad') || s.includes('down') || s.includes('blue') || s.includes('depress')) return 'sad';
  if (s.includes('tired') || s.includes('exhaust') || s.includes('sleep')) return 'tired';
  if (s.includes('anx') || s.includes('worry') || s.includes('nerv')) return 'anxious';
  if (s.includes('stress') || s.includes('overwhelm') || s.includes('pressure')) return 'stressed';
  if (s.includes('angry') || s.includes('mad') || s.includes('irrit')) return 'angry';
  return 'unknown';
}

function getTargetCount(mood: ReturnType<typeof normalizeMood>) {
  return mood === 'anxious' || mood === 'stressed' || mood === 'angry' ? 5 : 3;
}

function pickDailySuggestions(all: GentleActionItem[], mood: ReturnType<typeof normalizeMood>, seed: number) {
  const pools: Record<string, string[]> = {
    happy: ['win_1', 'gratitude_1', 'walk_3', 'sunlight', 'message_friend', '3_good_things'],
    calm: ['body_scan', 'breath_2', 'mini_break', 'shoulders', 'hand_on_heart', 'screen_break'],
    neutral: ['water', 'stand', 'screen_break', 'task_next', 'tidy_1', 'one_sentence'],
    sad: ['hand_on_heart', 'kind_words', 'comfort_item', 'music', 'one_sentence', 'message_friend'],
    tired: ['water', 'snack', 'stand', 'open_window', 'screen_break', 'plan_sleep'],
    anxious: ['breath_30', 'ground_5', 'shoulders', 'body_scan', 'hand_on_heart', 'open_window'],
    stressed: ['breath_2', 'task_next', 'task_pause', 'mini_break', 'open_window', 'note_trigger'],
    angry: ['breath_30', 'walk_3', 'shoulders', 'open_window', 'one_sentence', 'ground_5'],
    unknown: ['breath_30', 'water', 'stand', 'one_sentence', 'mini_break', 'screen_break'],
  };

  const targetCount = getTargetCount(mood);
  const candidateIds = pools[mood] ?? pools.unknown;

  // deterministic shuffle
  const ids = [...candidateIds];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = (seed + i * 31) % (i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  const picked = ids.slice(0, targetCount);
  const map = new Map(all.map((a) => [a.id, a]));
  return picked.map((id) => map.get(id)).filter(Boolean) as GentleActionItem[];
}

function ensureAssignedIds(params: {
  mood: ReturnType<typeof normalizeMood>;
  seed: number;
  checked: Record<string, boolean>;
  existingAssignedIds?: string[];
}) {
  const { mood, seed, checked, existingAssignedIds } = params;
  const targetCount = getTargetCount(mood);

  const existing = (existingAssignedIds ?? []).filter((id) => !!GENTLE_ACTIONS.find((a) => a.id === id));
  const checkedIds = new Set(Object.entries(checked).filter(([, v]) => v).map(([k]) => k));

  // keep already checked from existing list
  const keepChecked = existing.filter((id) => checkedIds.has(id));

  // pick candidates excluding checked + keep
  const picked = pickDailySuggestions(GENTLE_ACTIONS, mood, seed)
    .map((a) => a.id)
    .filter((id) => !checkedIds.has(id) && !keepChecked.includes(id));

  const result = [...keepChecked];
  for (const id of picked) {
    if (result.length >= targetCount) break;
    if (!result.includes(id)) result.push(id);
  }

  // fill if short
  if (result.length < targetCount) {
    const allIds = GENTLE_ACTIONS.map((a) => a.id);
    for (let i = 0; i < allIds.length && result.length < targetCount; i++) {
      const id = allIds[(seed + i * 17) % allIds.length];
      if (!checkedIds.has(id) && !result.includes(id)) result.push(id);
    }
  }

  return result.slice(0, targetCount);
}

function idsToActions(ids: string[]) {
  const map = new Map(GENTLE_ACTIONS.map((a) => [a.id, a]));
  return ids.map((id) => map.get(id)).filter(Boolean) as GentleActionItem[];
}

/** ---------- Completion history for streak/insight ---------- */

function parseISODateKey(key: string) {
  const [y, m, d] = key.split('-').map((v) => Number(v));
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

function dateKeyFromDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysKey(baseKey: string, deltaDays: number) {
  const dt = parseISODateKey(baseKey);
  dt.setDate(dt.getDate() + deltaDays);
  return dateKeyFromDate(dt);
}

function readCompletionHistory(): string[] {
  try {
    const raw = localStorage.getItem(GENTLE_ACTIONS_HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
  } catch {
    // ignore
  }
  return [];
}

function writeCompletionHistory(days: string[]) {
  try {
    localStorage.setItem(GENTLE_ACTIONS_HISTORY_KEY, JSON.stringify(days));
  } catch {
    // ignore
  }
}

function upsertCompletionDay(dayKey: string) {
  const history = readCompletionHistory();
  if (!history.includes(dayKey)) {
    history.push(dayKey);
    history.sort();
    writeCompletionHistory(history);
  }
  return history;
}

type GentleCompletionStats = Record<string, { total: number; completed: number }>;

function readCompletionStats(): GentleCompletionStats {
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

function writeCompletionStats(stats: GentleCompletionStats) {
  try {
    localStorage.setItem(GENTLE_ACTIONS_COMPLETION_STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

function upsertCompletionStats(dayKey: string, total: number, completed: number) {
  const stats = readCompletionStats();
  stats[dayKey] = { total, completed };
  writeCompletionStats(stats);
}

function computeStreak(history: string[], today: string) {
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

function countInRange(history: string[], startKeyInclusive: string, endKeyInclusive: string) {
  const start = parseISODateKey(startKeyInclusive).getTime();
  const end = parseISODateKey(endKeyInclusive).getTime();
  let n = 0;
  for (const k of history) {
    const t = parseISODateKey(k).getTime();
    if (t >= start && t <= end) n += 1;
  }
  return n;
}

function buildOneSentenceInsight(params: { history: string[]; today: string; streak: number }) {
  const { history, today, streak } = params;
  const last7Start = addDaysKey(today, -6);
  const prev7Start = addDaysKey(today, -13);
  const prev7End = addDaysKey(today, -7);

  const last7 = countInRange(history, last7Start, today);
  const prev7 = countInRange(history, prev7Start, prev7End);
  const diff = last7 - prev7;

  const diffText =
    diff > 0 ? `up ${diff} vs last week` : diff < 0 ? `down ${Math.abs(diff)} vs last week` : 'same as last week';

  const streakText = streak === 1 ? 'a 1-day streak' : `a ${streak}-day streak`;

  return `You’re on ${streakText} — ${last7} completions in the last 7 days (${diffText}).`;
}

export default function HomeOverview() {
  const { resolvedTempUnit, resolvedTheme } = usePreferences();

  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherState>({ status: 'idle' });
  const [location, setLocation] = useState<LocationState>({ label: 'Near you' });

  const isDark = resolvedTheme === 'dark';

  const encouragement = useMemo(() => {
    const idx = dayIndex(now, ENCOURAGEMENTS.length);
    return ENCOURAGEMENTS[idx];
  }, [now]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      const w = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
      ).then((r) => r.json());

      setWeather({
        status: 'ok',
        tempC: w?.current?.temperature_2m,
        code: w?.current?.weather_code,
      });

      const g = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      ).then((r) => r.json());

      const city = g?.city || g?.locality || g?.principalSubdivision;
      setLocation({ label: city || 'Near you' });
    });
  }, []);

  const tempText =
    weather.tempC == null
      ? ''
      : resolvedTempUnit === 'fahrenheit'
      ? `${cToF(weather.tempC)}°F`
      : `${Math.round(weather.tempC)}°C`;

  // today key string (YYYY-MM-DD) used across gentle actions + insights
  const todayStr = useMemo(() => todayKey(), [now]);

  // local mood (for suggestion picking)
  const latestMoodRaw = useMemo(() => readLatestCheckinMood(), [now]);
  const normalizedMood = useMemo(() => normalizeMood(latestMoodRaw), [latestMoodRaw]);

  // persisted gentle store (assigned ids + checked)
  const [gentleActions, setGentleActions] = useState<GentleActionsStore>({
    date: todayKey(),
    checked: {},
    assignedIds: [],
    refreshNonce: 0,
  });

  useEffect(() => {
    try {
      const tk = todayKey();
      const raw = localStorage.getItem(GENTLE_ACTIONS_STORAGE_KEY);

      const base: GentleActionsStore = {
        date: tk,
        checked: {},
        assignedIds: [],
        refreshNonce: 0,
      };

      const parsed = raw ? (JSON.parse(raw) as Partial<GentleActionsStore>) : null;
      const isSameDay = parsed?.date === tk;

      const checked = isSameDay && parsed?.checked ? parsed.checked : {};
      const refreshNonce = isSameDay && typeof parsed?.refreshNonce === 'number' ? parsed.refreshNonce : 0;
      const existingAssignedIds = isSameDay && Array.isArray(parsed?.assignedIds) ? parsed.assignedIds : [];

      const mood = normalizeMood(readLatestCheckinMood());
      const seed = daySeed(new Date()) + refreshNonce * 101 + mood.length * 97;

      const assignedIds = ensureAssignedIds({
        mood,
        seed,
        checked,
        existingAssignedIds,
      });

      const next: GentleActionsStore = { ...base, checked, refreshNonce, assignedIds };
      setGentleActions(next);
      localStorage.setItem(GENTLE_ACTIONS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(GENTLE_ACTIONS_STORAGE_KEY, JSON.stringify(gentleActions));
    } catch {
      // ignore
    }
  }, [gentleActions]);

  function toggleGentleAction(id: string) {
    setGentleActions((prev) => {
      const tk = todayKey();
      const nextChecked = { ...(prev.checked || {}) };
      nextChecked[id] = !nextChecked[id];

      const mood = normalizeMood(readLatestCheckinMood());
      const seed = daySeed(new Date()) + (prev.refreshNonce || 0) * 101 + mood.length * 97;

      const nextAssignedIds = ensureAssignedIds({
        mood,
        seed,
        checked: nextChecked,
        existingAssignedIds: prev.assignedIds,
      });

      return {
        ...prev,
        date: tk,
        checked: nextChecked,
        assignedIds: nextAssignedIds,
      };
    });
  }

  // refresh only remaining (unchecked), keep checked
  function refreshRemainingActions() {
    setGentleActions((prev) => {
      const tk = todayKey();
      const nextNonce = (prev.refreshNonce || 0) + 1;
      const mood = normalizeMood(readLatestCheckinMood());
      const seed = daySeed(new Date()) + nextNonce * 101 + mood.length * 97;

      const nextAssignedIds = ensureAssignedIds({
        mood,
        seed,
        checked: prev.checked || {},
        existingAssignedIds: prev.assignedIds,
      });

      return {
        ...prev,
        date: tk,
        refreshNonce: nextNonce,
        assignedIds: nextAssignedIds,
      };
    });
  }

  const suggestedActions = useMemo(
    () => idsToActions(gentleActions.assignedIds || []),
    [gentleActions.assignedIds]
  );

  const suggestedTotal = suggestedActions.length;
  const suggestedCompleted = useMemo(
    () => suggestedActions.filter((a) => !!gentleActions.checked?.[a.id]).length,
    [suggestedActions, gentleActions.checked]
  );
  const suggestedPct = suggestedTotal ? Math.round((suggestedCompleted / suggestedTotal) * 100) : 0;

  // submit -> congrats -> insights
  const [successStage, setSuccessStage] = useState<'none' | 'congrats' | 'insights'>('none');
  // Load persisted stage for today so refresh stays on Weekly insight
  useEffect(() => {
    try {
      const tk = todayKey();
      const s = readStageStore();
      if (s?.date === tk && (s.stage === 'insights' || s.stage === 'congrats')) {
        setSuccessStage(s.stage);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist stage changes (per-day)
  useEffect(() => {
    writeStageStore({ date: todayStr, stage: successStage });
  }, [todayStr, successStage]);

  // At day change (midnight), reset stage and generate fresh assignedIds
  useEffect(() => {
    if (gentleActions.date === todayStr) return;

    setSuccessStage('none');
    writeStageStore({ date: todayStr, stage: 'none' });

    setGentleActions(() => {
      const mood = normalizeMood(readLatestCheckinMood());
      const seed = daySeed(new Date()) + mood.length * 97;
      const assignedIds = ensureAssignedIds({ mood, seed, checked: {}, existingAssignedIds: [] });
      const next: GentleActionsStore = {
        date: todayStr,
        checked: {},
        assignedIds,
        refreshNonce: 0,
      };
      try {
        localStorage.setItem(GENTLE_ACTIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [todayStr, gentleActions.date]);
  const canSubmit = suggestedTotal > 0 && suggestedCompleted === suggestedTotal;

  const [completionHistory, setCompletionHistory] = useState<string[]>([]);
  useEffect(() => {
    setCompletionHistory(readCompletionHistory());
  }, []);


  const streak = useMemo(() => computeStreak(completionHistory, todayStr), [completionHistory, todayStr]);
  const oneSentenceInsight = useMemo(
    () => buildOneSentenceInsight({ history: completionHistory, today: todayStr, streak }),
    [completionHistory, todayStr, streak]
  );

  useEffect(() => {
    if (successStage !== 'congrats') return;
    const t = setTimeout(() => setSuccessStage('insights'), 950);
    return () => clearTimeout(t);
  }, [successStage]);

  function submitGentleActions() {
    if (!canSubmit) return;
    const updated = upsertCompletionDay(todayStr);
    setCompletionHistory(updated);

    // Persist n/n for History day-details
    upsertCompletionStats(todayStr, suggestedTotal, suggestedCompleted);

    setSuccessStage('congrats');
  }

  function backToSuggestions() {
    setSuccessStage('none');
  }

  return (
    <main
      className="min-h-screen px-4 pt-24"
      style={{ background: heartBackground(daySeed(now), isDark ? 'dark' : 'light') }}
    >
      <div className="mx-auto max-w-md space-y-6">
        <div className={`text-3xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
          {getTimeGreeting(now)}, dear friend.
        </div>

        <div className={`flex justify-between ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
          <div className="text-sm">{formatDate(now)}</div>
          <div className="text-base font-semibold tabular-nums">{formatTime(now)}</div>
        </div>

        <div className={`text-base font-medium leading-relaxed ${isDark ? 'text-white/85' : 'text-black'}`}>
          {encouragement}
        </div>

        {weather.status === 'ok' && (
          <div className={`space-y-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            <div className="text-sm">📍 {location.label}</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{weatherIcon(weather.code)}</span>
                <span>{weatherLabel(weather.code)}</span>
              </div>
              <div className={`text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{tempText}</div>
            </div>
          </div>
        )}

        {/* Today’s Suggestions */}
        <section
          className={`rounded-2xl border p-4 shadow-sm backdrop-blur-md ${
            isDark ? 'border-white/15 bg-white/5' : 'border-black/10 bg-white/50'
          }`}
        >
          {successStage === 'congrats' ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-green-600"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="mt-4 text-lg font-semibold text-black">Congratulations!</div>
              <div className="mt-1 text-sm text-gray-600">You’ve made it. One gentle step at a time.</div>
            </div>
          ) : successStage === 'insights' ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-indigo-600"
                >
                  <path
                    d="M12 2l1.2 4.2L17.5 7.5l-4.3 1.3L12 13l-1.2-4.2L6.5 7.5l4.3-1.3L12 2Z"
                    fill="currentColor"
                    opacity="0.85"
                  />
                  <path
                    d="M19 11l.7 2.5L22 14l-2.3.5L19 17l-.7-2.5L16 14l2.3-.5L19 11Z"
                    fill="currentColor"
                    opacity="0.7"
                  />
                  <path
                    d="M5 12l.7 2.5L8 15l-2.3.5L5 18l-.7-2.5L2 15l2.3-.5L5 12Z"
                    fill="currentColor"
                    opacity="0.7"
                  />
                </svg>
              </div>

              <div className="mt-4 text-lg font-semibold text-black">Weekly insight</div>
              <div className="mt-2 max-w-sm text-sm text-gray-700">{oneSentenceInsight}</div>

              <div className="mt-4 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-black">
                🔥 {streak}-day streak
              </div>

              <button
                onClick={backToSuggestions}
                className="mt-6 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
              >
                Explore More
              </button>
            </div>
          ) : (
            <>
              <header className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                    Today’s Suggestions
                  </h2>
                  <div className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {suggestedCompleted}/{suggestedTotal}
                  </div>
                </div>

                <button
                  onClick={refreshRemainingActions}
                  aria-label="Refresh remaining actions"
                  title="Refresh remaining actions"
                  className={`shrink-0 rounded-lg p-2 transition ${
                    isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-black/5 hover:bg-black/10'
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={isDark ? 'text-white/90' : 'text-black/80'}
                  >
                    <path
                      d="M21 12a9 9 0 1 1-2.64-6.36"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M21 3v6h-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </header>

              <div
                className={`mt-2 h-1.5 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}
                aria-hidden="true"
              >
                <div
                  className={`h-1.5 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`}
                  style={{ width: `${suggestedPct}%` }}
                />
              </div>

              <ul className="mt-4 space-y-2">
                {suggestedActions.map((a) => {
                  const checked = !!gentleActions.checked?.[a.id];
                  return (
                    <li key={a.id} className="w-full">
                      <label
                        className={`flex w-full cursor-pointer select-none items-center gap-3 rounded-xl border p-3 text-sm font-medium transition ${
                          isDark
                            ? checked
                              ? 'border-white/15 bg-white/10 text-white'
                              : 'border-white/10 text-white/80 hover:bg-white/5'
                            : checked
                            ? 'border-black/10 bg-black/5 text-black'
                            : 'border-black/10 text-black/80 hover:bg-black/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGentleAction(a.id)}
                          className={`h-5 w-5 rounded border ${
                            isDark ? 'border-white/30 bg-black/20' : 'border-black/20 bg-white'
                          }`}
                        />
                        <span className="flex-1">{a.title}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4">
                <button
                  onClick={submitGentleActions}
                  disabled={!canSubmit}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    canSubmit
                      ? isDark
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-black text-white hover:bg-black/90'
                      : isDark
                      ? 'bg-white/10 text-white/40'
                      : 'bg-black/5 text-black/40'
                  }`}
                >
                  Submit
                </button>
              </div>

              <div className={`mt-4 text-xs ${isDark ? 'text-white/55' : 'text-gray-600'}`}>
                All actions are provided based on your mood checked in.
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}