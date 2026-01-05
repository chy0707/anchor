# MoodBuddy 🌱

**MoodBuddy** is a privacy-first mood tracking app designed to help people gently reflect, take small supportive actions, and understand emotional patterns over time — without pressure, judgment, or dark patterns.

> Not a productivity tool.  
> Not a diagnosis tool.  
> Just a calm space to check in with yourself.

---

## ✨ What MoodBuddy Does

MoodBuddy supports emotional awareness through three lightweight layers:

### 1. Daily Mood Check-in
- Simple mood selection (no long questionnaires)
- Optional notes and context
- Weather snapshot captured automatically

### 2. Gentle Actions
- 3–5 small, low-effort suggestions per day
- Suggestions adapt to the user’s mood
- Completion is optional, not mandatory

### 3. Reflection & Trends
- Calendar view of moods and actions
- Weekly / Monthly mood trends aligned to real calendar periods
- Simple summaries that highlight patterns, not scores

All data stays **local**. No account required.

---

## 🧠 Design Philosophy

MoodBuddy is built around a few core principles:

- **Privacy-first**  
  No cloud sync, no accounts, no tracking. Everything is stored locally.

- **Low pressure**  
  No streak anxiety, no gamified punishment, no “you failed” states.

- **User agency**  
  Users choose how much they engage. Suggestions are supportive, never prescriptive.

- **Explainable insights**  
  Trends and summaries are transparent and easy to understand.

---

## 📊 Current Features

- Mood check-in with emoji-based scale
- Gentle action checklist linked to mood
- Action completion tracking (n / n)
- Mood calendar with daily details
- Weekly & Monthly mood trend charts
  - Fixed calendar periods (Mon–Sun / full month)
  - No misleading interpolation across missing data
- One-line weekly insights & streaks
- Light / Dark mode support
- Temperature unit preference (°C / °F)

---

## 🛠 Tech Stack

- **Framework**: Next.js (App Router)
- **UI**: React + Tailwind CSS
- **State**: Local component state + Context
- **Storage**: LocalStorage (MVP phase)
- **Charts**: Custom SVG (no heavy charting libraries)

The app is intentionally kept lightweight and dependency-minimal.

---

## 🚧 Work in Progress

Planned next iterations include:

- **Discover (Activities)**  
  A swipe-based discovery experience for nearby activities after check-in or action completion, with user-controlled preferences.

- **Insight Quality Upgrade**  
  More human-readable reflections combining mood, actions, and trends.

- **Optional Persistence Layer**  
  Migration path to a backend (e.g. Supabase) if needed — without compromising privacy defaults.

---

## 🧩 Why This Project Exists

MoodBuddy started as an exploration of a simple question:

> *What would a mental-wellbeing app look like if it respected users’ emotional energy as much as their data?*

Instead of maximizing engagement, MoodBuddy focuses on:
- clarity over quantity
- calm over stimulation
- reflection over optimization

---

## 📌 Status

**Current version**: `v0.1.0`  
Local-first MVP, actively iterating.

---

## 📄 License

MIT License.
