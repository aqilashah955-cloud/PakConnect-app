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
```

Hash routes: `#/` `#/onboarding` `#/discover` `#/discussions` `#/discussions/:topic`
`#/dthread/:id` `#/connections` `#/messages` `#/chat/:id` `#/communities`
`#/profile` `#/profile/edit` `#/marriage` `#/safety` `#/admin`.

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

`premium-subscriptions` · `verified-profiles` · `events` · `community-groups` ·
`video-calls` · `backend-sync` / `backend-auth` · photo uploads · moderation AI.
The Premium upsell card is present but non-functional and clearly labeled "coming soon".

## Verification

- `node --check` passes on every JS file.
- Grep-confirmed: no `input` fields for phone/CNIC/address/password anywhere.
- Pure static files — no fetch/XHR/WebSocket; safe on `file://`.
