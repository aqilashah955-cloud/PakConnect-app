# PakConnect — Connect with Pakistanis Worldwide

A premium, mobile-first, **static front-end demo** of the PakConnect global social
connection platform for Pakistanis and friends of Pakistani culture (18+).
**No backend, no network calls** — all state lives in `localStorage`, so the app
opens straight from `file://` and works fully offline.

> Demo build: profiles, discussions, messages and admin data are clearly badged
> "Demo". Nothing leaves the device.

## Run it

- **Easiest:** open `index.html` in any modern browser (double-click works — `file://`).
- Or serve locally: `cd ~/workspace/pakconnect && python3 -m http.server 8080`
  then visit `http://localhost:8080`.

First visit lands on the marketing page → **Get started** → 7-step onboarding
(18+ DOB gate first) → Discover. State persists in `localStorage` key
`pakconnect_v1`; "Reset demo data" in Profile restores the seed.

## Structure

```
index.html          App shell: SEO meta/OG/JSON-LD, topbar, bottom nav, script boot order
styles.css          Warm design system (deep teal + amber/sand), light/dark via [data-theme]
CONTRACT.md         Shared API contract every module follows
js/data.js          Seed data: 12 demo profiles, 15 discussion topics, threads, reports,
                    starters, guidelines, community counts, premium feature list
js/util.js          PC.util (esc, avatars, matchScore, constants) + PC.ui (toast/modal/confirm)
js/store.js         PC.store — localStorage persistence + all domain logic
js/router.js        PC.router — hash routing (#/discover …), topbar/bottom-nav chrome
js/views/landing.js      Marketing + SEO sections ("Pakistani dating app", …)
js/views/onboarding.js   7-question wizard with 18+ gate
js/views/discover.js     Filterable discovery cards: Connect / Interested / Message / Pass
js/views/discussions.js  Topic grid, thread lists, thread view + replies (views.discussions/.dthread)
js/views/connections.js  Connected / Interested / Passed tabs
js/views/messages.js     Thread list + chat (views.messages/.chat), starters, reply ideas
js/views/communities.js  9 country/region community cards → filtered Discover
js/views/profile.js      My profile, menu, full profile editor (views.profile/.profileEdit)
js/views/marriage.js     Optional Marriage Mode prefs + consent-gated family invite (simulated)
js/views/safety.js       Guidelines, scam warnings, block/report help, verification request
js/views/admin.js        Demo moderation: users, reports, verification queue, suspicious
                    accounts, discussion moderation, analytics
js/views/stories.js      Stories (build 2): story tray + full-screen viewer
js/views/groupchat.js    Community group chats (build 2): per-country rooms
js/views/mehfil.js       Mehfil live audio rooms (build 2): rooms list + room view
js/views/events.js       Community events (build 2): list + RSVP
js/views/premium.js      Premium (build 2): profile premium card + demo checkout page
```

Hash routes: `#/` `#/onboarding` `#/discover` `#/discussions` `#/discussions/:topic`
`#/dthread/:id` `#/connections` `#/messages` `#/chat/:id` `#/communities`
`#/profile` `#/profile/edit` `#/marriage` `#/safety` `#/admin`
`#/stories/:id` `#/mehfil` `#/mehfil/:id` `#/events` `#/gchat/:country` `#/premium`.

## Build 2 features

- **Stories:** story tray on Discover + full-screen story viewer (`#/stories/:id`).
- **Voice notes:** record/play in chat (`views.messages/.chat`) with a pulsing rec UI.
- **Mehfil live audio rooms:** rooms list (`#/mehfil`) + room view (`#/mehfil/:id`)
  with a pulsing live indicator.
- **Events:** community events with RSVP counts (`#/events`); Communities tab shows
  the next 3 events as a teaser.
- **Polls:** poll bars with animated fills (used in verification ID-check sim and polls).
- **Profile prompts:** pick 3 from 12 seed prompts + answer each in Profile → Edit;
  shown as Q&A cards on your profile. Validation: exactly 3, all answered.
- **Badges + streaks:** earned-badge showcase (earned highlighted, rest grayed)
  and a 🔥 login-streak chip on the profile, both driven by the store.
- **Verification (3-step, simulated):** press-and-hold liveness → ID check with
  fake progress → optional social-profile link. Submits `{liveness, id, social}`
  for admin review; admin queue shows each step and approve grants the badge.
- **Communities tabs:** Members (original country cards) · 💬 Group chats
  (per-country rooms, `#/gchat/:country`) · 📅 Events teaser.

### How the Premium demo works

- **Free:** 10 Connects/day, 20 Interested/day. **Premium: PKR 499/month**, unlimited.
- Profile → **Subscribe (demo checkout)** opens `#/premium`, which shows a
  "🧪 Demo checkout — no real payment is processed" banner. **Pay PKR 499** simply
  flips your demo tier (`S.setPremium('premium')`) in localStorage — nothing real
  happens, and "Reset demo data" restores Free.
- With Premium active the profile card shows toggles for **🚀 Profile Boost** and
  **🕵️ Incognito**, persisted via the store. **Cancel Premium** flips back to Free.

## Key behaviours

- **Discussion-first:** 15 topics with seeded threads; "You both participated in the
  same discussion" lines; one-tap "start conversation" from any discussion post.
- **Match score (0–100)** from interests/values/topics/languages/intentions/traits —
  always labeled *"a suggestion, not a guarantee; it can't predict love."*
- **Five modes** (Friendship/Discussion/Networking/Relationship/Marriage), switchable
  from the top bar; no-pressure copy throughout.
- **Privacy:** profile visibility (Everyone / Connections only / Nobody), hide-age
  toggle, restrict-messages-from-strangers toggle — all honored by Discover and chat.
- **Safety:** 18+ gate, block/report everywhere, scam-warning banners
  ("Never send money to strangers"), simulated verification + family-invite flows,
  seeded suspicious account + open reports in the admin queue.
- **No sensitive fields:** there are no inputs for phone numbers, CNIC, home/exact
  address, or passwords anywhere in the app.

## Extension points (commented `EXT-POINT` in code)

`premium-subscriptions` · `verified-profiles` · `community-groups` ·
`video-calls` · `backend-sync` / `backend-auth` · photo uploads · moderation AI.
Premium ships with a demo checkout (no real payment); the real-billing hook is
marked in `js/views/premium.js`.

## Verification

- `node --check` passes on every JS file.
- Grep-confirmed: no `input` fields for phone/CNIC/address/password anywhere.
- Pure static files — no fetch/XHR/WebSocket; safe on `file://`.
