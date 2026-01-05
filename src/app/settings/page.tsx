'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePreferences } from '@/components/PreferencesProvider';

const FEEDBACK_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzxetOR1ufe0AEh-x7IvrK5MHJFHr4aLot2iOcdMk6ukiW8x3bVWeDriKv_SLeX024M/exec';

type FeedbackType = 'Bug' | 'Idea' | 'Other';

function isValidEmail(v: string) {
  const s = v.trim();
  if (!s) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function SettingsPage() {
  // ---- hooks ----
  const pathname = usePathname();

  const { theme, language, tempUnit, setTheme, setLanguage, setTempUnit } = usePreferences();

  const [mounted, setMounted] = useState(false);

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('Bug');
  const [feedbackText, setFeedbackText] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const themeOptions = useMemo(
    () =>
      [
        { label: 'System', value: 'system' as const },
        { label: 'Light', value: 'light' as const },
        { label: 'Dark', value: 'dark' as const },
      ] as const,
    []
  );

  const languageOptions = useMemo(
    () =>
      [
        { label: 'English', value: 'en' as const },
        { label: '中文', value: 'zh' as const },
      ] as const,
    []
  );

  const tempOptions = useMemo(
    () =>
      [
        { label: 'Auto', value: 'auto' as const },
        { label: 'Celsius °C', value: 'celsius' as const },
        { label: 'Fahrenheit °F', value: 'fahrenheit' as const },
      ] as const,
    []
  );

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (feedbackText.trim().length < 3) return false;
    if (!isValidEmail(email)) return false;
    return true;
  }, [feedbackText, submitting, email]);

  async function submitFeedback() {
    setError(null);
    setSubmitted(false);

    if (!canSubmit) {
      if (feedbackText.trim().length < 3) return setError('Please write a bit more (at least 3 characters).');
      if (!isValidEmail(email)) return setError('Please enter a valid email (or leave it empty).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: feedbackType.toLowerCase(), // bug / idea / other
        message: feedbackText.trim(),
        email: email.trim(),
        page: pathname || '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        appVersion: 'mvp-0.1',
      };

      // 关键：用 text/plain 发送 JSON，避免 Apps Script CORS preflight（OPTIONS）导致失败
      const res = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      // 有时 Google Script 会返回 200 但不一定是 JSON；这里做容错
      const text = await res.text();
      let ok = false;
      try {
        const j = JSON.parse(text);
        ok = !!j?.ok;
      } catch {
        ok = res.ok;
      }

      if (!ok) throw new Error('Bad response');

      setSubmitted(true);
      setFeedbackText('');
      // email 先不清，方便连续提反馈
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---- render ----
  if (!mounted) return null;

  return (
    <main className="min-h-screen px-4 pt-24 pb-24 bg-gray-50 dark:bg-black">
      <div className="max-w-md mx-auto space-y-10">
        {/* Appearance */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-black dark:text-white">Appearance</h2>

          <div className="rounded-3xl p-3 bg-white/70 dark:bg-white/5 backdrop-blur border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((o) => {
                const active = theme === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => setTheme(o.value)}
                    className={[
                      'py-3 rounded-2xl font-medium transition',
                      active
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'bg-black/5 text-black dark:bg-white/10 dark:text-white',
                    ].join(' ')}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-black dark:text-white">Language</h2>

          <div className="rounded-3xl p-3 bg-white/70 dark:bg-white/5 backdrop-blur border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-2 gap-2">
              {languageOptions.map((o) => {
                const active = language === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => setLanguage(o.value)}
                    className={[
                      'py-3 rounded-2xl font-medium transition',
                      active
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'bg-black/5 text-black dark:bg-white/10 dark:text-white',
                    ].join(' ')}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Temperature */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-black dark:text-white">Temperature</h2>

          <div className="rounded-3xl p-3 bg-white/70 dark:bg-white/5 backdrop-blur border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-3 gap-2">
              {tempOptions.map((o) => {
                const active = tempUnit === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => setTempUnit(o.value)}
                    className={[
                      'py-3 rounded-2xl font-medium transition',
                      active
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'bg-black/5 text-black dark:bg-white/10 dark:text-white',
                    ].join(' ')}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-black dark:text-white">Feedback</h2>

          <div className="rounded-3xl p-4 bg-white/70 dark:bg-white/5 backdrop-blur border border-black/5 dark:border-white/10">
            <div className="text-sm font-semibold text-black dark:text-white mb-3">
              Tell us what you think
            </div>

            {/* Type pills */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(['Bug', 'Idea', 'Other'] as FeedbackType[]).map((t) => {
                const active = feedbackType === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setFeedbackType(t);
                      setSubmitted(false);
                      setError(null);
                    }}
                    className={[
                      'py-2 rounded-2xl text-sm font-medium transition border',
                      active
                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                        : 'bg-black/5 text-black dark:bg-white/10 dark:text-white border-black/10 dark:border-white/10',
                    ].join(' ')}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Message */}
            <textarea
              value={feedbackText}
              onChange={(e) => {
                setFeedbackText(e.target.value);
                setSubmitted(false);
                setError(null);
              }}
              placeholder="What should we improve?"
              className="w-full h-28 rounded-2xl px-4 py-3 bg-white/80 dark:bg-black/20 text-black dark:text-white outline-none border border-gray-200 dark:border-white/10 focus:border-gray-300 dark:focus:border-white/20 transition"
            />

            {/* Email */}
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSubmitted(false);
                setError(null);
              }}
              placeholder="Email (optional)"
              className="mt-3 w-full rounded-2xl px-4 py-3 bg-white/80 dark:bg-black/20 text-black dark:text-white outline-none border border-gray-200 dark:border-white/10 focus:border-gray-300 dark:focus:border-white/20 transition"
            />

            {/* Error / Success */}
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
            {submitted && <div className="mt-3 text-sm text-green-600">Thanks! Feedback sent ✓</div>}

            <button
              onClick={submitFeedback}
              disabled={!canSubmit}
              className="mt-4 w-full rounded-2xl py-3 bg-black text-white dark:bg-white dark:text-black font-semibold disabled:opacity-40 transition"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>

            <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              Feedback will be saved to your Google Sheet.
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-black dark:text-white">Disclaimer</h2>

          <div className="rounded-3xl p-4 bg-white/70 dark:bg-white/5 backdrop-blur border border-black/5 dark:border-white/10">
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-2">
              <p>
                MoodBuddy is for self-reflection and wellness support only and is not a medical device.
                It does not provide diagnosis, treatment, or professional medical advice.
              </p>
              <p>
                If you’re experiencing an emergency or feel at risk of harming yourself or others, please call
                your local emergency number immediately or contact a licensed professional.
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Data in this MVP is stored locally on your device unless you explicitly submit feedback.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}