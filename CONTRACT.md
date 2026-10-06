# PakConnect — Shared Build Contract v2

Build 2 additions: stories, voice notes, Mehfil live audio rooms, events, polls,
profile prompts, Today's Picks, verification badges, real premium tiers (demo
checkout), chat reactions/typing/online status, community group chats, badges,
login streaks. All still plain `<script>`, no modules, `file://` safe.

All JS files are plain `<script>` (NO modules, NO import/export) so the app works from
`file://` with zero network. Every file starts with `window.PC = window.PC || {};`.

Load order in index.html:
`js/data.js → js/util.js → js/store.js → js/router.js → js/views/*.js → PC.router.init()`
View scripts load in this order: landing, onboarding, discover, discussions,
connections, messages, communities, profile, marriage, safety, admin,
**stories, groupchat, mehfil, events, premium** (build 2).

---

## PC.util
- `esc(s)` — HTML-escape a string (use for ALL user-generated text)
- `initials(name)` — "Ayesha Khan" → "AK"
- `avClass(name)` — deterministic "av-0".."av-7" from name hash
- `avatarHTML(user, size)` — size in 'sm','md','lg','xl'; returns avatar div (CSS initial-avatar)
- `timeAgo(ts)` — "3h ago"
- `uid(prefix)` — unique id
- `COUNTRIES` — ["Pakistan","UK","USA","Canada","UAE","Saudi Arabia","Australia","Europe","Worldwide"]
- `MODES` — ["Friendship","Discussion","Networking","Relationship","Marriage"]
- `INTENTIONS` — ["Friendship","Discussions","Networking","Serious relationship","Marriage"]
- `LANGUAGES` — ["English","Urdu","Punjabi","Sindhi","Pashto","Balochi","Saraiki","Hindko","Arabic","Other"]
- `matchScore(a, b)` — → `{score: 0-100, reasons: [strings]}`. Reasons read like
  "You share 5 interests", "You both value education and entrepreneurship",
  "You both participated in the same discussion".
- `SCORE_NOTE` — "Match scores are suggestions only — they can't predict love or guarantee compatibility."

## PC.ui
- `toast(msg)` — small toast notification
- `modal(html)` — opens modal, returns `close()`
- `confirmDlg(msg)` — Promise<boolean>

## PC.store (localStorage key "pakconnect_v1")
- `init()`, `save()`, `reset()` (clear + reseed)
- `me()`, `getUser(id)`
- `users()` — excludes me, removed, suspended, blocked
- `allUsers()` — every profile incl. suspended/removed (admin only)
- `createMe(profile)` — onboarding; also seeds a welcome message thread
- `updateMe(patch)`
- `relation(userId)` — null | 'connected' | 'interested' | 'passed'
- `setRelation(userId, type|null)`
- `connectionLists()` — `{connected:[user], interested:[user], passed:[user]}`
- `threads()` — enriched `[{id, user, messages, lastTs}]`, newest first
- `getThread(id)`, `getOrCreateThread(userId)` → `{thread}` or `{error:'blocked'|'restricted'|'self'}`
- `sendMessage(threadId, text)` — also auto-replies once per thread with a friendly canned demo reply
- `setDraft(threadId, text)`, `consumeDraft(threadId)` — prefill chat input (used by discussion prompts)
- `blockUser(id)`, `unblockUser(id)`, `isBlocked(id)`, `blockedUsers()`
- `fileReport(targetId, reason, detail)`, `reports()`, `resolveReport(id, action)` —
  action in 'dismissed'|'warned'|'suspended'|'removed' (applies suspension/removal)
- `topics()` — `[{id,title,desc,icon,threadCount,postCount}]`
- `threadsForTopic(topicId)` — `[{id,title,author,postCount,lastTs}]`
- `getDThread(id)` — `{id,topicId,title,authorId,posts:[{id,author,text,ts}],ts}`
- `addDThread(topicId,title,text)`, `addDPost(dthreadId,text)`, `deleteDThread(id)`, `deleteDPost(dthreadId,postId)`
- `participatedTopicIds(userId)` — topic ids where user authored a post
- `communityStats()` — `[{country,count}]` for the 9 COUNTRIES buckets
- `filterUsers(f)` — f may contain q,minAge,maxAge,country,city,interest,profession,education,
  language,value,trait,intention,background. Honors profile privacy visibility.
- `requestVerification()`, `verifications()`, `approveVerification(userId)`, `rejectVerification(userId)`
- `submitVerificationSteps({liveness, id, social})` — 3-step demo flow; stores
  `{status:'pending', steps:{liveness:true, id:true, social:''|url}}`;
  `myVerification()` → `{status, steps} | null`. Approve → status 'approved' +
  grants the verified badge (visible via `S.myBadges()` / `me.verified`).
- `premiumTier()` → `'free'|'premium'`; `setPremium(tier)`; `isPremium()`;
  `isBoost()`, `setBoost(b)`; `isIncognito()`, `setIncognito(b)`
- `myBadges()` → `[badgeId]` earned by me; `loginPing()` → current login streak
  (call ONCE per profile render — never in router init)
- `saveMyPrompts([{prompt, answer} x3])`, `myPrompts()` → `[{prompt, answer}]`
- `groupChat(country)` — group-chat state/counts per country (drives
  `PC.views.groupchatListHTML()`); `eventsList()` → `[{id,name|title,date|ts,rsvps[]}]`
- `suspiciousUsers()` — heuristic: seeded `flagged` users + users with ≥2 open reports
- `suspendUser(id)`, `unsuspendUser(id)`, `removeUser(id)`
- `settings()`, `saveSettings(patch)` — `{theme, mode, onboarded, discoverFilters}`
- `familyInvites()`, `addFamilyInvite({name, relation})`

Seed data lives in `PC.seed` (data.js): `users`, `topics`, `discussionThreads`,
`reports`, `starters`, `replyIdeas`, `communityBase`, `guidelines`, `premiumFeatures`,
`badgeDefs` (build 2: `[{id, icon, name, desc}]` — badge award thresholds), `premiumTiers`
(build 2: array of perk strings / `{title}` objects for the Premium plan card),
`prompts` (build 2: 12 profile-prompt strings).

## User object shape
`{id, name, age, gender, country, city, background, education, profession,
  languages[], interests[], traits[], values[], goals, about, lookingFor[],
  mode, favTopics[], verified, flagged, flagNote, demo,
  privacy:{visibility:'everyone'|'connections'|'nobody', hideAge:bool, restrictUnknown:bool},
  marriagePrefs:{intentions, ageMin, ageMax, location, education, career, values, lifestyle, family, relocation}|null}`

`me` additionally: `{isMe:true}`.

## PC.router
- `go(path)` e.g. `PC.router.go('/discover')`
- `refresh()` — re-render current route
- `init()` — wire hashchange + first render (called once at boot)
- Routes → `PC.views` keys:
  `#/` → landing (chrome hidden) · `#/onboarding` → onboarding (chrome hidden)
  `#/discover` → discover · `#/discussions` → discussions · `#/discussions/:topic` → discussions
  `#/dthread/:id` → dthread · `#/connections` → connections · `#/messages` → messages
  `#/chat/:id` → chat · `#/communities` → communities · `#/profile` → profile
  `#/profile/edit` → profileEdit · `#/marriage` → marriage · `#/safety` → safety
  `#/admin` → admin
  `#/stories/:id` → stories · `#/mehfil` → mehfil · `#/mehfil/:id` → mehfilRoom
  `#/events` → events · `#/gchat/:country` → gchat · `#/premium` → premium
- Chrome: `#topbar` (logo, `#modeSel` select, `#themeBtn`) and `#bottomnav`
  (6 items, `data-route`). Router shows/hides them and sets the active item.
- Bottom-nav mapping additions (NAVMAP): `stories`→discover, `mehfil`+`mehfilRoom`→discussions,
  `events`+`gchat`→communities, `premium`→profile.
- `init()` wires hashchange after `store.init()`; theme/mode sync from settings.
  Note: `S.loginPing()` is called ONLY in `PC.views.profile` (once per render) —
  never in router init — so the streak isn't double-counted.

## Views
`PC.views.<name> = function(el, params){ ... }` — `el` is the cleared `#view` element.
Bottom-nav `active` keys: discover, discussions, connections, messages, communities, profile.
Build-2 views: `stories` (story viewer), `mehfil` (live audio rooms list),
`mehfilRoom` (a room), `events` (community events + RSVP), `gchat` (country
group chat room), `premium` (demo checkout page), `profileEdit` (now includes
the profile-prompts editor + 3-step verification flow).
Cross-view helpers: `PC.views.premiumCard()` → HTML string (profile premium slot;
wired via delegation inside premium.js); `PC.views.storyTrayHTML()` (Discover;
owned by stories.js); `PC.views.groupchatListHTML()` (Communities → Group chats
tab; owned by groupchat.js).

## CSS classes to use (defined in styles.css)
`.card .btn .btn-primary .btn-ghost .btn-danger .btn-sm .chip .chip-on .input .select
.textarea .label .field .avatar .av-0…av-7 .sz-sm .sz-md .sz-lg .sz-xl .badge
.badge-demo .badge-verified .page-title .section-title .empty .list-row .bubble
.bubble-me .bubble-them .banner-warn .grid-2 .toggle-row .stat-card .table-wrap
table.data .modal-backdrop .modal-card .scorebar .scorebar-fill .kv .menu-row
.premium-card .tabs .tab .tab-on .filter-bar .hero .seo-section`
Build 2 additions (styles.css): `.story-tray .story-item .story-ring
.story-ring-seen .story-viewer .story-progress .story-seg .story-seg-fill
.composer-swatches .swatch .voice-bubble .voice-progress .rec-ui .rec-dot
(pulses) .poll-bar .poll-fill .badge-grid .badge-earned .badge-locked
.streak-chip .prompt-card .event-date .mehfil-live-dot (pulses)
.story-bg-0 … .story-bg-5` (story background gradients).

## Premium enforcement rules (demo)
- Free tier limits: **10 Connects/day, 20 Interested/day**. Premium: unlimited.
- Price point shown: **PKR 499/month**. Checkout is a demo — "🧪 Demo checkout —
  no real payment is processed"; the Pay button only flips `S.setPremium('premium')`.
- Enforcement must read `S.premiumTier()` / `S.isPremium()` in the store; views
  only display the tier and flip it. Premium extras: Profile Boost (`S.setBoost`)
  and Incognito (`S.setIncognito`) toggles on the profile premium card.
- EXT-POINT for real billing lives in js/views/premium.js.

## Badges & streaks
- `PC.seed.badgeDefs` defines each badge as `{id, icon, name, desc}`; the store
  awards them and `S.myBadges()` returns earned ids. Profile renders earned
  badges highlighted (`.badge-earned`) and the rest locked/grayed (`.badge-locked`).
- Login streak: `S.loginPing()` returns the streak and is called **once** in
  `PC.views.profile` per render (never in router init); shown as a `.streak-chip`.

## Hard constraints
- NO input fields for phone numbers, CNIC, home/exact address, or passwords ANYWHERE.
  (Safety copy may say "never share your password" as plain text — no field.)
- No external images, fonts, or network calls. Avatars = `avatarHTML()`.
- Every button does something real or fires a "coming soon" toast. No dead controls.
- Escape user text with `esc()`.
- Mark future features with `/* EXT-POINT: name — description */` comments.
- `node --check` must pass on every file.
