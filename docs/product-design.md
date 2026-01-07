# Anchor — Product Design Document (MVP)

> This document reflects early-stage product design thinking for Anchor.
> Details may evolve as the product iterates.

---

## 1. Product Overview

**Product Name:** Anchor

**One-line Description**  
Anchor is a privacy-first mood tracking application that helps users gently reflect on their emotions, take small supportive actions, and understand emotional patterns over time — without pressure, judgment, or over-intervention.

Anchor is not a therapy product.  
It is a calm, supportive space for everyday emotional awareness.

---

## 2. Background & Motivation

College students and young adults increasingly face emotional stress caused by academic pressure, social isolation, cultural transitions, and uncertainty about the future. While professional mental health services are essential, many users do not seek them due to cost, stigma, accessibility, or emotional readiness.

Anchor is designed to fill the gap between clinical mental health services and everyday emotional needs. Instead of diagnosing or treating mental health conditions, Anchor focuses on:

- helping users notice how they feel  
- encouraging small, manageable supportive actions  
- enabling long-term self-reflection through patterns, not scores  

All interactions are designed to feel optional, lightweight, and non-judgmental.

---

## 3. Target Users

Anchor is designed for users who:

- want to build emotional awareness without committing to therapy  
- prefer private, low-pressure reflection  
- feel overwhelmed by highly gamified or productivity-driven wellness apps  
- value transparency and control over personal data  

The MVP primarily targets:
- college students  
- early-career young adults  
- users exploring self-reflection tools for the first time  

---

## 4. Core Features (Current MVP)

### 4.1 Daily Mood Check-in
- Emoji-based mood selection
- Optional short text reflection
- Automatic contextual capture (e.g., weather)
- Designed to take less than one minute

---

### 4.2 Gentle Action Suggestions
- 3–5 small, low-effort actions generated daily
- Suggestions are loosely adapted to the selected mood
- No penalties for skipping actions
- Completion tracked as `n / n` (supportive, not competitive)

Examples:
- Stand up and stretch for one minute
- Take a few slow breaths
- Step away from the screen briefly

---

### 4.3 Reflection History
- Calendar-based mood history
- Daily details view (mood, notes, actions completed)
- Gentle action completion indicators
- Designed for reflection, not performance review

---

### 4.4 Mood Trends & Summaries
- Weekly and Monthly mood trends aligned to real calendar periods  
  - Weekly: Monday → Sunday  
  - Monthly: 1st → end of month
- Trend lines only connect meaningful data points
- Lightweight summaries that highlight patterns rather than scores

---

### 4.5 Privacy-First Design
- No account required
- No cloud sync in MVP
- All data stored locally on the user’s device
- No behavioral tracking or third-party analytics

---

## 5. Design Philosophy

Anchor is built around the following principles:

- **Low pressure over engagement maximization**  
  No streak punishment, no missed-day warnings.

- **User agency over automation**  
  Suggestions support users; they do not instruct or evaluate them.

- **Clarity over gamification**  
  Visualizations explain patterns rather than rank performance.

- **Respect for emotional energy**  
  Every interaction is optional and reversible.

---

## 6. MVP Scope Summary

### Included in MVP
- Mood check-in
- Gentle action suggestions
- Action completion tracking
- Mood history & calendar
- Weekly / Monthly trends
- Local-only data storage
- Light / Dark mode
- Temperature unit preferences

### Explicitly Out of Scope (MVP)
- AI chatbot or conversational agent
- Social sharing or feeds
- Cloud accounts or cross-device sync
- Clinical assessment or diagnosis

---

## 7. Future Considerations (Post-MVP)

### AI-Assisted Reflection (Future)
- Optional AI-generated reflection prompts
- Pattern-based emotional summaries
- Explainable, non-diagnostic feedback

### Discover & Exploration
- Location-based activity discovery after check-in or action completion
- Swipe-based interaction with user-controlled preferences
- Emphasis on exploration, not optimization

### Optional Backend
- Migration path to an opt-in backend (e.g., Supabase)
- Local-first remains the default

---

## 8. Why Anchor

Anchor explores a simple but often overlooked question:

> What would an emotional support app look like if it prioritized gentleness, autonomy, and clarity over engagement metrics?

By focusing on small actions and long-term reflection, Anchor aims to help users build emotional awareness sustainably — one check-in at a time.

---

## 9. Current Status

**Version:** v0.1.0  
**Stage:** Local-first MVP, actively iterating.