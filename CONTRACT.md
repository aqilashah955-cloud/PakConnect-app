# PakConnect — Shared Build Contract v1

All JS files are plain `<script>` (NO modules, NO import/export) so the app works from
`file://` with zero network. Every file starts with `window.PC = window.PC || {};`.

Load order in index.html:
`js/data.js → js/util.js → js/store.js → js/router.js → js/views/*.js → PC.router.init()`

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
- `suspiciousUsers()` — heuristic: seeded `flagged` users + users with ≥2 open reports
- `suspendUser(id)`, `unsuspendUser(id)`, `removeUser(id)`
- `settings()`, `saveSettings(patch)` — `{theme, mode, onboarded, discoverFilters}`
- `familyInvites()`, `addFamilyInvite({name, relation})`

Seed data lives in `PC.seed` (data.js): `users`, `topics`, `discussionThreads`,
`reports`, `starters`, `replyIdeas`, `communityBase`, `guidelines`, `premiumFeatures`.

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
- Chrome: `#topbar` (logo, `#modeSel` select, `#themeBtn`) and `#bottomnav`
  (6 items, `data-route`). Router shows/hides them and sets the active item.

## Views
`PC.views.<name> = function(el, params){ ... }` — `el` is the cleared `#view` element.
Bottom-nav `active` keys: discover, discussions, connections, messages, communities, profile.

## CSS classes to use (defined in styles.css)
`.card .btn .btn-primary .btn-ghost .btn-danger .btn-sm .chip .chip-on .input .select
.textarea .label .field .avatar .av-0…av-7 .sz-sm .sz-md .sz-lg .sz-xl .badge
.badge-demo .badge-verified .page-title .section-title .empty .list-row .bubble
.bubble-me .bubble-them .banner-warn .grid-2 .toggle-row .stat-card .table-wrap
table.data .modal-backdrop .modal-card .scorebar .scorebar-fill .kv .menu-row
.premium-card .tabs .tab .tab-on .filter-bar .hero .seo-section`

## Hard constraints
- NO input fields for phone numbers, CNIC, home/exact address, or passwords ANYWHERE.
  (Safety copy may say "never share your password" as plain text — no field.)
- No external images, fonts, or network calls. Avatars = `avatarHTML()`.
- Every button does something real or fires a "coming soon" toast. No dead controls.
- Escape user text with `esc()`.
- Mark future features with `/* EXT-POINT: name — description */` comments.
- `node --check` must pass on every file.
