window.PC = window.PC || {};

/* PC.store — localStorage-backed data layer (plain script, no modules; file:// safe).
   Key: "pakconnect_v1". Seeds from PC.seed (data.js) on first init. */
(function () {
  'use strict';

  var KEY = 'pakconnect_v1';
  var state = null;

  function blankState() {
    return {
      version: 1,
      me: null,
      users: [],            // seeded profiles (PC.seed.users)
      relations: {},        // userId -> 'connected' | 'interested' | 'passed'
      blocked: [],          // [userId]
      threads: [],          // my 1:1 chat threads [{id,userId,messages:[{id,from,text,ts}],lastTs}]
      drafts: {},           // threadId -> text (chat prefill)
      autoReplied: {},      // threadId -> true (one canned reply per thread)
      reports: [],          // safety reports
      dthreads: [],         // discussion threads (PC.seed.discussionThreads)
      verifications: [],    // verification requests
      settings: { theme: 'light', mode: 'Friendship', onboarded: false, discoverFilters: {} },
      familyInvites: [],    // family invite records
      stories: [],          // ephemeral 24h stories
      mehfil: [],           // mehfil audio rooms
      mehfilJoined: [],     // [roomId] rooms I joined
      events: [],           // community events
      polls: [],            // discussion polls
      groupChats: {},       // country -> {messages:[{id,authorId,text,ts}], members:[userId]}
      activity: { posts: 0, messages: 0, groupmsgs: 0, mehfils: 0, logins: 0, lastLoginDay: '', streak: 0, badges: [] },
      premium: { tier: 'free', since: null, boost: false, incognito: false },
      daily: { day: '', connects: 0, interested: 0 },
      myVotes: {}           // pollId -> optionId
    };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o == null ? null : o)); }

  function seed() {
    var s = (window.PC && window.PC.seed) || {};
    state.users = clone(s.users) || [];
    state.dthreads = clone(s.discussionThreads) || [];
    state.reports = clone(s.reports) || [];
    state.stories = clone(s.stories) || [];
    state.mehfil = clone(s.mehfilRooms) || [];
    state.events = clone(s.events) || [];
    state.polls = clone(s.polls) || [];
    // Build group chats from the seed message packs.
    state.groupChats = {};
    var gseed = s.groupChatSeed || {};
    Object.keys(gseed).forEach(function (country) {
      var pack = gseed[country] || [];
      var seen = {};
      var members = [];
      var messages = pack.map(function (m, i) {
        if (!seen[m.authorId]) { seen[m.authorId] = true; members.push(m.authorId); }
        return {
          id: 'gm_seed_' + String(country).replace(/\s+/g, '') + '_' + i,
          authorId: m.authorId,
          text: m.text,
          ts: Date.now() - (Number(m.hoursAgo) || 0) * 36e5
        };
      });
      state.groupChats[country] = { messages: messages, members: members };
    });
    // topics/guidelines/communityBase/replyIdeas/starters are read live from PC.seed.
  }

  function load() {
    state = blankState();
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { /* private mode */ }
    if (raw) {
      try {
        state = Object.assign(blankState(), JSON.parse(raw));
      } catch (e) { seed(); }
    } else {
      seed();
    }
    /* EXT-POINT: backend-sync — on init, merge API snapshot with local state here
       (replace the localStorage read with a fetch + conflict resolution). */
  }

  function init() {
    if (!state) load();
    // pruneStories touches state directly (no ensure()) to avoid re-entering init.
    pruneStories();
    return state;
  }

  function reset() {
    try { window.localStorage.removeItem(KEY); } catch (e) {}
    state = null;
    load();
    save();
    /* EXT-POINT: backend-sync — also clear server-side session/cache on reset */
  }

  function save() {
    if (!state) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* quota/private mode — app keeps running in memory */ }
    /* EXT-POINT: backend-sync — push the mutated state (or a delta) to the API here */
  }

  function ensure() { if (!state) init(); }

  /* ---------- users ---------- */
  function me() { ensure(); return state.me; }

  function getUser(id) {
    ensure();
    if (!id) return null;
    if (state.me && state.me.id === id) return state.me;
    var list = state.users.filter(function (u) { return u && u.id === id; });
    return list.length ? list[0] : null;
  }

  function isBlocked(id) {
    ensure();
    return state.blocked.indexOf(id) >= 0;
  }

  function users() {
    ensure();
    return state.users.filter(function (u) {
      return u && !u.isMe && !u.removed && !u.suspended && !isBlocked(u.id);
    });
  }

  function allUsers() {
    ensure();
    var out = state.users.slice();
    if (state.me) out.push(state.me);
    return out;
  }

  function createMe(profile) {
    ensure();
    var util = (window.PC && window.PC.util) || {};
    var u = util.uid || function (p) { return (p || 'id') + '_' + Date.now(); };
    var s = (window.PC && window.PC.seed) || {};
    var m = Object.assign({
      id: u('me'),
      isMe: true,
      onboarded: true,
      verified: false,
      flagged: false,
      demo: false,
      privacy: { visibility: 'everyone', hideAge: false, restrictUnknown: false },
      marriagePrefs: null
    }, profile || {});
    state.me = m;
    state.settings.onboarded = true;
    // Welcome thread from u1: 2 warm messages + a starter suggestion.
    var greeter = getUser('u1') || state.users[0] || null;
    if (greeter) {
      var now = Date.now();
      var starters = s.starters || [];
      var starterText = starters.length ? String(starters[0]) : 'Introduce yourself: where are you from, and what do you love talking about?';
      var thread = {
        id: u('t'),
        userId: greeter.id,
        lastTs: now,
        messages: [
          { id: u('m'), from: greeter.id, text: 'Welcome to PakConnect' + (m.name ? ', ' + m.name : '') + '! Really glad you joined us.', ts: now - 120000 },
          { id: u('m'), from: greeter.id, text: 'Tap Discussions to join a conversation, or browse Discover to meet Pakistanis around the world.', ts: now - 60000 },
          { id: u('m'), from: greeter.id, text: '\uD83D\uDCA1 Starter suggestion: ' + starterText, ts: now - 1000 },
          // 4th message: a simulated voice note so the chat view can render a voice bubble.
          { id: u('m'), from: greeter.id, kind: 'voice', dur: 14, simulated: true, text: '', ts: now - 500 }
        ]
      };
      state.threads.push(thread);
    }
    save();
    return m;
  }

  function updateMe(patch) {
    ensure();
    if (!state.me) return null;
    Object.assign(state.me, patch || {});
    save();
    return state.me;
  }

  /* ---------- relations ---------- */
  function relation(userId) {
    ensure();
    return state.relations[userId] || null;
  }

  function setRelation(userId, type) {
    ensure();
    if (type === null || type === undefined) { delete state.relations[userId]; }
    else if (type === 'connected' || type === 'interested' || type === 'passed') { state.relations[userId] = type; }
    save();
  }

  function connectionLists() {
    ensure();
    var lists = { connected: [], interested: [], passed: [] };
    Object.keys(state.relations).forEach(function (id) {
      var t = state.relations[id];
      var u = getUser(id);
      if (u && lists[t]) lists[t].push(u);
    });
    return lists;
  }

  /* ---------- 1:1 chat ---------- */
  function threads() {
    ensure();
    return state.threads
      .map(function (t) {
        return { id: t.id, user: getUser(t.userId), messages: t.messages || [], lastTs: t.lastTs || 0 };
      })
      .filter(function (t) {
        return t.user && !t.user.removed && !t.user.suspended && !isBlocked(t.user.id);
      })
      .sort(function (a, b) { return b.lastTs - a.lastTs; });
  }

  function getThread(id) {
    ensure();
    var list = state.threads.filter(function (t) { return t.id === id; });
    return list.length ? list[0] : null;
  }

  function getOrCreateThread(userId) {
    ensure();
    var util = (window.PC && window.PC.util) || {};
    var u = util.uid || function (p) { return (p || 'id') + '_' + Date.now(); };
    if (state.me && userId === state.me.id) return { error: 'self' };
    if (isBlocked(userId)) return { error: 'blocked' };
    var target = getUser(userId);
    if (!target || target.removed || target.suspended) return { error: 'blocked' };
    if (target.privacy && target.privacy.restrictUnknown && relation(userId) !== 'connected') {
      return { error: 'restricted' };
    }
    var list = state.threads.filter(function (t) { return t.userId === userId; });
    var t = list.length ? list[0] : null;
    if (!t) {
      t = { id: u('t'), userId: userId, messages: [], lastTs: Date.now() };
      state.threads.push(t);
      save();
    }
    return { thread: t };
  }

  function replyPool() {
    var s = (window.PC && window.PC.seed) || {};
    if (Array.isArray(s.replyIdeas) && s.replyIdeas.length) return s.replyIdeas;
    // Canned, friendly, and personal-detail-free (demo auto-reply).
    return [
      'Thanks for reaching out! How is your day going?',
      'Nice to meet you here! What brought you to PakConnect?',
      'Hey! Good to hear from you. How is everything on your side?',
      'Happy to chat! What do you enjoy talking about most?'
    ];
  }

  function sendMessage(threadId, text) {
    ensure();
    var t = getThread(threadId);
    var body = String(text == null ? '' : text).trim();
    if (!t || !body) return null;
    var util = (window.PC && window.PC.util) || {};
    var u = util.uid || function (p) { return (p || 'id') + '_' + Date.now(); };
    var msg = { id: u('m'), from: 'me', text: body, read: false, ts: Date.now() };
    t.messages.push(msg);
    t.lastTs = msg.ts;
    awardActivity('message');
    save();
    // One canned friendly auto-reply per thread (demo), only if the thread still exists.
    queueAutoReply(threadId);
    return msg;
  }

  function setDraft(threadId, text) {
    ensure();
    state.drafts[threadId] = String(text == null ? '' : text);
    save();
  }

  function consumeDraft(threadId) {
    ensure();
    var d = state.drafts[threadId] || '';
    delete state.drafts[threadId];
    save();
    return d;
  }

  /* ---------- blocking ---------- */
  function blockUser(id) {
    ensure();
    if (state.blocked.indexOf(id) < 0) state.blocked.push(id);
    delete state.relations[id];
    save();
  }

  function unblockUser(id) {
    ensure();
    state.blocked = state.blocked.filter(function (x) { return x !== id; });
    save();
  }

  function blockedUsers() {
    ensure();
    return state.blocked.map(getUser).filter(Boolean);
  }

  /* ---------- reports & moderation ---------- */
  function fileReport(targetId, reason, detail) {
    ensure();
    var util = (window.PC && window.PC.util) || {};
    var u = util.uid || function (p) { return (p || 'id') + '_' + Date.now(); };
    var r = {
      id: u('r'),
      targetId: targetId,
      reporterId: state.me ? state.me.id : 'anonymous',
      reason: String(reason || ''),
      detail: String(detail || ''),
      status: 'open',
      ts: Date.now()
    };
    state.reports.push(r);
    save();
    return r;
  }

  function reports() {
    ensure();
    return state.reports.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  }

  function resolveReport(id, action) {
    ensure();
    var list = state.reports.filter(function (r) { return r.id === id; });
    var r = list.length ? list[0] : null;
    if (!r) return null;
    if (['dismissed', 'warned', 'suspended', 'removed'].indexOf(action) < 0) return r;
    r.status = action;
    if (action === 'suspended') suspendUser(r.targetId);
    else if (action === 'removed') removeUser(r.targetId);
    else if (action === 'warned') { var tg = getUser(r.targetId); if (tg) tg.warned = true; }
    save();
    return r;
  }

  function suspendUser(id) {
    ensure();
    var u = getUser(id);
    if (u) { u.suspended = true; save(); }
  }

  function unsuspendUser(id) {
    ensure();
    var u = getUser(id);
    if (u) { u.suspended = false; save(); }
  }

  function removeUser(id) {
    ensure();
    var u = getUser(id);
    if (u) { u.removed = true; save(); }
  }

  function suspiciousUsers() {
    ensure();
    var seen = {};
    var out = [];
    function add(u) { if (u && u.id && !seen[u.id]) { seen[u.id] = true; out.push(u); } }
    state.users.forEach(function (u) { if (u.flagged) add(u); });
    var openCounts = {};
    state.reports.forEach(function (r) {
      if (r.status === 'open') openCounts[r.targetId] = (openCounts[r.targetId] || 0) + 1;
    });
    Object.keys(openCounts).forEach(function (id) {
      if (openCounts[id] >= 2) add(getUser(id));
    });
    return out;
  }

  /* ---------- discussions ---------- */
  function topics() {
    ensure();
    var s = (window.PC && window.PC.seed) || {};
    var base = Array.isArray(s.topics) ? s.topics : [];
    return base.map(function (t) {
      var dts = state.dthreads.filter(function (d) { return d.topicId === t.id; });
      var posts = dts.reduce(function (n, d) { return n + ((d.posts || []).length); }, 0);
      return {
        id: t.id, title: t.title, desc: t.desc, icon: t.icon,
        threadCount: dts.length, postCount: posts
      };
    });
  }

  function resolveAuthor(authorId) {
    if (authorId === 'me' || (state.me && authorId === state.me.id)) return state.me;
    return getUser(authorId) || { id: authorId, name: 'Member' };
  }

  function threadsForTopic(topicId) {
    ensure();
    return state.dthreads
      .filter(function (d) { return d.topicId === topicId; })
      .map(function (d) {
        return {
          id: d.id,
          title: d.title,
          author: resolveAuthor(d.authorId),
          postCount: (d.posts || []).length,
          lastTs: d.lastTs || d.ts || 0
        };
      })
      .sort(function (a, b) { return b.lastTs - a.lastTs; });
  }

  function getDThread(id) {
    ensure();
    var list = state.dthreads.filter(function (d) { return d.id === id; });
    var d = list.length ? list[0] : null;
    if (!d) return null;
    return {
      id: d.id,
      topicId: d.topicId,
      title: d.title,
      authorId: d.authorId,
      author: resolveAuthor(d.authorId),
      posts: (d.posts || []).map(function (p) {
        return {
          id: p.id,
          authorId: p.authorId,
          author: resolveAuthor(p.authorId),
          text: p.text,
          ts: p.ts
        };
      }),
      ts: d.ts
    };
  }

  function addDThread(topicId, title, text) {
    ensure();
    if (!state.me) return null;
    var util = (window.PC && window.PC.util) || {};
    var u = util.uid || function (p) { return (p || 'id') + '_' + Date.now(); };
    var now = Date.now();
    var dt = {
      id: u('dt'),
      topicId: topicId,
      title: String(title || '').trim(),
      authorId: state.me.id,
      ts: now,
      lastTs: now,
      posts: [{ id: u('p'), authorId: state.me.id, text: String(text || '').trim(), ts: now }]
    };
    state.dthreads.push(dt);
    save();
    return dt;
  }

  function addDPost(dthreadId, text) {
    ensure();
    if (!state.me) return null;
    var util = (window.PC && window.PC.util) || {};
    var u = util.uid || function (p) { return (p || 'id') + '_' + Date.now(); };
    var list = state.dthreads.filter(function (d) { return d.id === dthreadId; });
    var d = list.length ? list[0] : null;
    if (!d) return null;
    var body = String(text == null ? '' : text).trim();
    if (!body) return null;
    var p = { id: u('p'), authorId: state.me.id, text: body, ts: Date.now() };
    d.posts = d.posts || [];
    d.posts.push(p);
    d.lastTs = p.ts;
    awardActivity('post');
    save();
    return p;
  }

  function deleteDThread(id) {
    ensure();
    state.dthreads = state.dthreads.filter(function (d) { return d.id !== id; });
    save();
  }

  function deleteDPost(dthreadId, postId) {
    ensure();
    var list = state.dthreads.filter(function (d) { return d.id === dthreadId; });
    var d = list.length ? list[0] : null;
    if (!d) return;
    d.posts = (d.posts || []).filter(function (p) { return p.id !== postId; });
    save();
  }

  function participatedTopicIds(userId) {
    ensure();
    var ids = {};
    state.dthreads.forEach(function (d) {
      var mine = d.authorId === userId ||
        (d.posts || []).some(function (p) { return p.authorId === userId; });
      if (mine) ids[d.topicId] = true;
    });
    return Object.keys(ids);
  }

  /* ---------- communities ---------- */
  function communityStats() {
    ensure();
    var s = (window.PC && window.PC.seed) || {};
    var base = s.communityBase || [];
    var util = (window.PC && window.PC.util) || {};
    var countries = util.COUNTRIES || [];
    var live = {};
    countries.forEach(function (c) { live[c] = 0; });
    users().forEach(function (u) { if (live.hasOwnProperty(u.country)) live[u.country]++; });
    function baseCount(c) {
      if (Array.isArray(base)) {
        var r = base.filter(function (b) { return b && b.country === c; })[0];
        return r ? (r.count || 0) : 0;
      }
      return base[c] || 0;
    }
    return countries.map(function (c) { return { country: c, count: baseCount(c) + live[c] }; });
  }

  /* ---------- discovery & privacy ---------- */
  function filterUsers(f) {
    ensure();
    f = f || {};
    var q = String(f.q || '').trim().toLowerCase();
    return users().filter(function (u) {
      var vis = (u.privacy && u.privacy.visibility) || 'everyone';
      if (vis === 'nobody') return false;
      if (vis === 'connections' && relation(u.id) !== 'connected') return false;
      if (q) {
        var hay = [u.name, u.city, u.profession, u.about, u.education].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      var hideAge = u.privacy && u.privacy.hideAge;
      if ((f.minAge != null && f.minAge !== '') || (f.maxAge != null && f.maxAge !== '')) {
        if (hideAge) return false;
        if (f.minAge != null && f.minAge !== '' && !(u.age >= Number(f.minAge))) return false;
        if (f.maxAge != null && f.maxAge !== '' && !(u.age <= Number(f.maxAge))) return false;
      }
      if (f.country && u.country !== f.country) return false;
      if (f.city && String(u.city || '').toLowerCase() !== String(f.city).toLowerCase()) return false;
      if (f.profession && String(u.profession || '').toLowerCase().indexOf(String(f.profession).toLowerCase()) < 0) return false;
      if (f.education && String(u.education || '').toLowerCase().indexOf(String(f.education).toLowerCase()) < 0) return false;
      if (f.background && String(u.background || '').toLowerCase().indexOf(String(f.background).toLowerCase()) < 0) return false;
      function has(list, v) {
        return (list || []).some(function (x) { return String(x).toLowerCase() === String(v).toLowerCase(); });
      }
      if (f.interest && !has(u.interests, f.interest)) return false;
      if (f.language && !has(u.languages, f.language)) return false;
      if (f.value && !has(u.values, f.value)) return false;
      if (f.trait && !has(u.traits, f.trait)) return false;
      if (f.intention && !has(u.lookingFor, f.intention)) return false;
      return true;
    });
  }

  /* ---------- verification ---------- */
  function requestVerification() {
    ensure();
    if (!state.me) return null;
    var util = (window.PC && window.PC.util) || {};
    var u = util.uid || function (p) { return (p || 'id') + '_' + Date.now(); };
    var pending = state.verifications.filter(function (v) {
      return v.userId === state.me.id && v.status === 'pending';
    })[0];
    if (pending) return pending;
    var v = { id: u('v'), userId: state.me.id, name: state.me.name, status: 'pending', ts: Date.now() };
    state.verifications.push(v);
    save();
    return v;
  }

  function verifications() {
    ensure();
    return state.verifications.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  }

  function approveVerification(userId) {
    ensure();
    var u = getUser(userId);
    state.verifications.forEach(function (v) {
      if (v.userId === userId) v.status = 'approved';
    });
    if (u) u.verified = true;
    save();
  }

  function rejectVerification(userId) {
    ensure();
    state.verifications.forEach(function (v) {
      if (v.userId === userId && v.status === 'pending') v.status = 'rejected';
    });
    save();
  }

  /* ---------- settings ---------- */
  function settings() {
    ensure();
    return state.settings;
  }

  function saveSettings(patch) {
    ensure();
    Object.assign(state.settings, patch || {});
    save();
    return state.settings;
  }

  /* ---------- family invites ---------- */
  function familyInvites() {
    ensure();
    return state.familyInvites.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  }

  function addFamilyInvite(inv) {
    ensure();
    var util = (window.PC && window.PC.util) || {};
    var u = util.uid || function (p) { return (p || 'id') + '_' + Date.now(); };
    inv = inv || {};
    var rec = {
      id: u('fi'),
      name: String(inv.name || '').trim(),
      relation: String(inv.relation || '').trim(),
      status: 'invited',
      ts: Date.now()
    };
    state.familyInvites.push(rec);
    save();
    return rec;
  }

  /* ---------- build 2: stories, voice notes, mehfil, events, polls,
     group chats, activity, premium, verification steps, presence ----------
     EXT-POINT: build2-apis — each of these sections maps to a backend
     endpoint in the server build; the localStorage shapes stay the same. */

  var DAY = 864e5;

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function yesterdayStr() {
    return new Date(Date.now() - DAY).toISOString().slice(0, 10);
  }

  // Simple local timeAgo for presence labels (mirrors PC.util.timeAgo).
  function localTimeAgo(ts) {
    var s = Math.max(1, Math.floor((Date.now() - (ts || 0)) / 1000));
    if (s < 60) return 'just now';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    var d = Math.floor(h / 24);
    if (d < 30) return d + 'd ago';
    return Math.floor(d / 30) + 'mo ago';
  }

  function genId(prefix) {
    var util = (window.PC && window.PC.util) || {};
    var u = util.uid || function (p) { return (p || 'id') + '_' + Date.now(); };
    return u(prefix);
  }

  /* ---------- stories ---------- */
  function pruneStories() {
    // NOTE: operates on loaded state directly — never call ensure() here,
    // or init() -> pruneStories() -> ensure() -> init() recurses forever.
    if (!state || !state.stories) return;
    var cutoff = Date.now() - DAY;
    var before = state.stories.length;
    state.stories = state.stories.filter(function (s) { return (s.ts || 0) > cutoff; });
    if (state.stories.length !== before) save();
  }

  function stories() {
    ensure();
    var cutoff = Date.now() - DAY;
    return state.stories
      .filter(function (s) { return (s.ts || 0) > cutoff; })
      .sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  }

  function addStory(o) {
    ensure();
    if (!state.me) return null;
    o = o || {};
    var s = {
      id: genId('s'),
      authorId: state.me.id,
      text: String(o.text || '').trim(),
      bg: Math.max(0, Math.min(5, Number(o.bg) || 0)),
      emoji: String(o.emoji || ''),
      views: [],
      ts: Date.now()
    };
    if (!s.text) return null;
    state.stories.push(s);
    save();
    return s;
  }

  function viewStory(id) {
    ensure();
    var myId = state.me ? state.me.id : 'me';
    var list = state.stories.filter(function (s) { return s.id === id; });
    var s = list.length ? list[0] : null;
    if (!s) return null;
    s.views = s.views || [];
    if (s.views.indexOf(myId) < 0) { s.views.push(myId); save(); }
    return s;
  }

  function storyViewed(id) {
    ensure();
    var myId = state.me ? state.me.id : 'me';
    var list = state.stories.filter(function (s) { return s.id === id; });
    var s = list.length ? list[0] : null;
    return !!(s && s.views && s.views.indexOf(myId) >= 0);
  }

  function deleteMyStory(id) {
    ensure();
    var myId = state.me ? state.me.id : 'me';
    state.stories = state.stories.filter(function (s) { return !(s.id === id && s.authorId === myId); });
    save();
  }

  /* ---------- voice notes & message helpers ---------- */
  function queueAutoReply(threadId) {
    // Extracted from sendMessage: one canned friendly reply per thread (demo).
    if (state.autoReplied[threadId]) return;
    state.autoReplied[threadId] = true;
    save();
    setTimeout(function () {
      var still = getThread(threadId);
      if (!still) return;
      var pool = replyPool();
      var reply = pool[Math.floor(Math.random() * pool.length)];
      var r = { id: genId('m'), from: still.userId, text: reply, read: false, ts: Date.now() };
      still.messages.push(r);
      still.lastTs = r.ts;
      save();
      try { window.dispatchEvent(new CustomEvent('pc:message', { detail: { threadId: threadId } })); } catch (e) {}
    }, 1200);
  }

  function sendVoiceNote(threadId, durSec, audioUrl) {
    ensure();
    var t = getThread(threadId);
    if (!t) return null;
    var msg = {
      id: genId('m'),
      from: 'me',
      kind: 'voice',
      dur: Math.max(1, Math.round(Number(durSec) || 0)),
      audioUrl: audioUrl || null,
      simulated: !audioUrl,
      text: '',
      reactions: {},
      read: false,
      ts: Date.now()
    };
    t.messages.push(msg);
    t.lastTs = msg.ts;
    awardActivity('message');
    save();
    queueAutoReply(threadId);
    return msg;
  }

  function reactToMessage(threadId, msgId, emoji) {
    ensure();
    var t = getThread(threadId);
    if (!t || !emoji) return null;
    var myId = state.me ? state.me.id : 'me';
    var list = (t.messages || []).filter(function (m) { return m.id === msgId; });
    var m = list.length ? list[0] : null;
    if (!m) return null;
    m.reactions = m.reactions || {};
    var arr = m.reactions[emoji] || [];
    var ix = arr.indexOf(myId);
    if (ix >= 0) arr.splice(ix, 1); else arr.push(myId);
    if (arr.length) m.reactions[emoji] = arr; else delete m.reactions[emoji];
    save();
    return m;
  }

  function markThreadRead(threadId) {
    ensure();
    var t = getThread(threadId);
    if (!t) return;
    var changed = false;
    (t.messages || []).forEach(function (m) {
      if (m.from !== 'me' && !m.read) { m.read = true; changed = true; }
    });
    if (changed) save();
  }

  /* ---------- mehfil rooms ---------- */
  function mehfilRooms() {
    ensure();
    return state.mehfil.slice().sort(function (a, b) {
      if (!!a.live !== !!b.live) return a.live ? -1 : 1;
      return (a.startsAt || 0) - (b.startsAt || 0);
    });
  }

  function getMehfil(id) {
    ensure();
    var list = state.mehfil.filter(function (r) { return r.id === id; });
    return list.length ? list[0] : null;
  }

  function isJoined(id) {
    ensure();
    return state.mehfilJoined.indexOf(id) >= 0;
  }

  function joinMehfil(id) {
    ensure();
    var r = getMehfil(id);
    if (!r) return null;
    if (state.mehfilJoined.indexOf(id) < 0) state.mehfilJoined.push(id);
    r.listeners = (r.listeners || 0) + 1;
    awardActivity('mehfil');
    save();
    return r;
  }

  function leaveMehfil(id) {
    ensure();
    var r = getMehfil(id);
    if (!r) return null;
    state.mehfilJoined = state.mehfilJoined.filter(function (x) { return x !== id; });
    r.listeners = Math.max(0, (r.listeners || 0) - 1);
    save();
    return r;
  }

  function toggleHand(id) {
    ensure();
    var r = getMehfil(id);
    if (!r || !state.me) return null;
    var myId = state.me.id;
    r.raisedHands = r.raisedHands || [];
    var ix = r.raisedHands.indexOf(myId);
    if (ix >= 0) r.raisedHands.splice(ix, 1); else r.raisedHands.push(myId);
    save();
    return r;
  }

  /* ---------- events ---------- */
  function eventsList() {
    ensure();
    return state.events.slice().sort(function (a, b) { return (a.date || 0) - (b.date || 0); });
  }

  function getEvent(id) {
    ensure();
    var list = state.events.filter(function (e) { return e.id === id; });
    return list.length ? list[0] : null;
  }

  function rsvpEvent(id, choice) {
    ensure();
    var e = getEvent(id);
    if (!e || !state.me) return e;
    var myId = state.me.id;
    e.attendees = (e.attendees || []).filter(function (x) { return x !== myId; });
    e.interested = (e.interested || []).filter(function (x) { return x !== myId; });
    if (choice === 'going') e.attendees.push(myId);
    else if (choice === 'interested') e.interested.push(myId);
    save();
    return e;
  }

  function createEvent(o) {
    ensure();
    if (!state.me) return null;
    o = o || {};
    var e = {
      id: genId('e'),
      title: String(o.title || '').trim(),
      city: String(o.city || '').trim(),
      country: String(o.country || ''),
      date: Number(o.date) || (Date.now() + 7 * DAY),
      desc: String(o.desc || ''),
      hostId: state.me.id,
      attendees: [state.me.id],
      interested: [],
      ts: Date.now()
    };
    if (!e.title) return null;
    state.events.push(e);
    save();
    return e;
  }

  /* ---------- polls ---------- */
  function pollsForTopic(topicId) {
    ensure();
    return state.polls
      .filter(function (p) { return p.topicId === topicId; })
      .sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  }

  function getPoll(id) {
    ensure();
    var list = state.polls.filter(function (p) { return p.id === id; });
    return list.length ? list[0] : null;
  }

  function createPoll(topicId, title, options) {
    ensure();
    if (!state.me) return null;
    options = (options || []).filter(function (x) { return String(x == null ? '' : x).trim(); });
    if (options.length < 2 || options.length > 4) return null;
    var pid = genId('p');
    var poll = {
      id: pid,
      topicId: topicId,
      title: String(title || '').trim(),
      options: options.map(function (txt, i) {
        return { id: pid + 'o' + (i + 1), text: String(txt).trim(), votes: [] };
      }),
      authorId: state.me.id,
      ts: Date.now()
    };
    state.polls.push(poll);
    save();
    return poll;
  }

  function votePoll(pollId, optionId) {
    ensure();
    if (!state.me) return false;
    if (state.myVotes[pollId]) return false; // already voted
    var poll = getPoll(pollId);
    if (!poll) return false;
    var opt = (poll.options || []).filter(function (o) { return o.id === optionId; })[0];
    if (!opt) return false;
    opt.votes = opt.votes || [];
    if (opt.votes.indexOf(state.me.id) < 0) opt.votes.push(state.me.id);
    state.myVotes[pollId] = optionId;
    save();
    return true;
  }

  function myVote(pollId) {
    ensure();
    return state.myVotes[pollId] || null;
  }

  /* ---------- group chats ---------- */
  function groupChat(country) {
    ensure();
    if (!state.groupChats[country]) state.groupChats[country] = { messages: [], members: [] };
    return state.groupChats[country];
  }

  function isGroupMember(country) {
    ensure();
    var g = groupChat(country);
    var myId = state.me ? state.me.id : 'me';
    return g.members.indexOf(myId) >= 0;
  }

  function joinGroup(country) {
    ensure();
    var g = groupChat(country);
    var myId = state.me ? state.me.id : 'me';
    if (g.members.indexOf(myId) < 0) { g.members.push(myId); save(); }
    return g;
  }

  function leaveGroup(country) {
    ensure();
    var g = groupChat(country);
    var myId = state.me ? state.me.id : 'me';
    g.members = g.members.filter(function (x) { return x !== myId; });
    save();
    return g;
  }

  function sendGroupMessage(country, text) {
    ensure();
    if (!state.me) return null;
    var body = String(text == null ? '' : text).trim();
    if (!body) return null;
    var g = groupChat(country);
    var msg = { id: genId('gm'), authorId: state.me.id, text: body, ts: Date.now() };
    g.messages.push(msg);
    awardActivity('groupmsg');
    save();
    return msg;
  }

  /* ---------- activity & badges ---------- */
  var ACT_MAP = { post: 'posts', message: 'messages', groupmsg: 'groupmsgs', mehfil: 'mehfils' };

  function awardActivity(kind) {
    ensure();
    var awarded = [];
    var key = ACT_MAP[kind];
    if (!key) return awarded;
    state.activity[key] = (state.activity[key] || 0) + 1;
    var a = state.activity;
    var checks = [
      ['discussion-starter', a.posts >= 5],
      ['mehfil-regular', a.mehfils >= 3],
      ['community-helper', a.groupmsgs >= 10],
      ['conversation-starter', a.messages >= 10]
    ];
    checks.forEach(function (c) {
      if (c[1] && a.badges.indexOf(c[0]) < 0) { a.badges.push(c[0]); awarded.push(c[0]); }
    });
    save();
    return awarded;
  }

  function myBadges() {
    ensure();
    return state.activity.badges.slice();
  }

  function loginPing() {
    ensure();
    var t = todayStr();
    var y = yesterdayStr();
    if (state.activity.lastLoginDay === t) return state.activity.streak;
    state.activity.streak = (state.activity.lastLoginDay === y) ? (state.activity.streak || 0) + 1 : 1;
    state.activity.lastLoginDay = t;
    state.activity.logins = (state.activity.logins || 0) + 1;
    save();
    return state.activity.streak;
  }

  /* ---------- premium & daily limits ---------- */
  function ensureDaily() {
    var t = todayStr();
    if (state.daily.day !== t) state.daily = { day: t, connects: 0, interested: 0 };
  }

  function premiumTier() {
    ensure();
    return (state.premium && state.premium.tier) || 'free';
  }

  function setPremium(tier) {
    ensure();
    var was = state.premium.tier;
    state.premium.tier = (tier === 'premium') ? 'premium' : 'free';
    if (state.premium.tier === 'premium' && was !== 'premium') state.premium.since = Date.now();
    if (state.premium.tier !== 'premium') state.premium.since = null;
    save();
    return premiumTier();
  }

  function isPremium() { return premiumTier() === 'premium'; }

  function canConnect() {
    ensure();
    ensureDaily();
    if (isPremium()) return true;
    return (state.daily.connects || 0) < 10;
  }

  function recordConnect() {
    ensure();
    ensureDaily();
    state.daily.connects = (state.daily.connects || 0) + 1;
    save();
    return state.daily.connects;
  }

  function canInterested() {
    ensure();
    ensureDaily();
    if (isPremium()) return true;
    return (state.daily.interested || 0) < 20;
  }

  function recordInterested() {
    ensure();
    ensureDaily();
    state.daily.interested = (state.daily.interested || 0) + 1;
    save();
    return state.daily.interested;
  }

  function setBoost(b) { ensure(); state.premium.boost = !!b; save(); }
  function isBoost() { ensure(); return !!(state.premium && state.premium.boost); }
  function setIncognito(b) { ensure(); state.premium.incognito = !!b; save(); }
  function isIncognito() { ensure(); return !!(state.premium && state.premium.incognito); }

  /* ---------- profile prompts ---------- */
  function saveMyPrompts(list) {
    ensure();
    if (!state.me) return null;
    list = (list || []).slice(0, 3).map(function (x) {
      return { prompt: String(x.prompt || ''), answer: String(x.answer || '') };
    });
    while (list.length < 3) list.push({ prompt: '', answer: '' });
    state.me.prompts = list;
    save();
    return state.me.prompts;
  }

  function myPrompts() {
    ensure();
    return state.me ? (state.me.prompts || []) : [];
  }

  /* ---------- verification steps ---------- */
  function submitVerificationSteps(steps) {
    ensure();
    if (!state.me) return null;
    steps = steps || {};
    var clean = { liveness: !!steps.liveness, id: !!steps.id, social: !!steps.social };
    var existing = state.verifications.filter(function (v) {
      return v.userId === state.me.id && v.status === 'pending';
    })[0];
    if (existing) {
      existing.steps = clean;
      existing.ts = Date.now();
      save();
      return existing;
    }
    var v = {
      id: genId('v'),
      userId: state.me.id,
      name: state.me.name,
      status: 'pending',
      steps: clean,
      ts: Date.now()
    };
    state.verifications.push(v);
    save();
    return v;
  }

  function myVerification() {
    ensure();
    if (!state.me) return null;
    var mine = state.verifications
      .filter(function (v) { return v.userId === state.me.id; })
      .sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    return mine.length ? mine[0] : null;
  }

  /* ---------- presence ---------- */
  function presenceOf(user) {
    if (!user) return { online: false, label: 'Active ' + localTimeAgo(0) };
    var online = (user.lastActive || 0) > Date.now() - 5 * 60e3;
    return online
      ? { online: true, label: 'Online' }
      : { online: false, label: 'Active ' + localTimeAgo(user.lastActive || 0) };
  }

  PC.store = {
    init: init,
    save: save,
    reset: reset,
    me: me,
    getUser: getUser,
    users: users,
    allUsers: allUsers,
    createMe: createMe,
    updateMe: updateMe,
    relation: relation,
    setRelation: setRelation,
    connectionLists: connectionLists,
    threads: threads,
    getThread: getThread,
    getOrCreateThread: getOrCreateThread,
    sendMessage: sendMessage,
    setDraft: setDraft,
    consumeDraft: consumeDraft,
    blockUser: blockUser,
    unblockUser: unblockUser,
    isBlocked: isBlocked,
    blockedUsers: blockedUsers,
    fileReport: fileReport,
    reports: reports,
    resolveReport: resolveReport,
    topics: topics,
    threadsForTopic: threadsForTopic,
    getDThread: getDThread,
    addDThread: addDThread,
    addDPost: addDPost,
    deleteDThread: deleteDThread,
    deleteDPost: deleteDPost,
    participatedTopicIds: participatedTopicIds,
    communityStats: communityStats,
    filterUsers: filterUsers,
    requestVerification: requestVerification,
    verifications: verifications,
    approveVerification: approveVerification,
    rejectVerification: rejectVerification,
    suspiciousUsers: suspiciousUsers,
    suspendUser: suspendUser,
    unsuspendUser: unsuspendUser,
    removeUser: removeUser,
    settings: settings,
    saveSettings: saveSettings,
    familyInvites: familyInvites,
    addFamilyInvite: addFamilyInvite,
    // build 2
    stories: stories,
    addStory: addStory,
    viewStory: viewStory,
    storyViewed: storyViewed,
    deleteMyStory: deleteMyStory,
    sendVoiceNote: sendVoiceNote,
    reactToMessage: reactToMessage,
    markThreadRead: markThreadRead,
    mehfilRooms: mehfilRooms,
    getMehfil: getMehfil,
    joinMehfil: joinMehfil,
    leaveMehfil: leaveMehfil,
    toggleHand: toggleHand,
    isJoined: isJoined,
    eventsList: eventsList,
    getEvent: getEvent,
    rsvpEvent: rsvpEvent,
    createEvent: createEvent,
    pollsForTopic: pollsForTopic,
    getPoll: getPoll,
    createPoll: createPoll,
    votePoll: votePoll,
    myVote: myVote,
    groupChat: groupChat,
    joinGroup: joinGroup,
    leaveGroup: leaveGroup,
    isGroupMember: isGroupMember,
    sendGroupMessage: sendGroupMessage,
    awardActivity: awardActivity,
    myBadges: myBadges,
    loginPing: loginPing,
    premiumTier: premiumTier,
    setPremium: setPremium,
    isPremium: isPremium,
    canConnect: canConnect,
    recordConnect: recordConnect,
    canInterested: canInterested,
    recordInterested: recordInterested,
    setBoost: setBoost,
    isBoost: isBoost,
    setIncognito: setIncognito,
    isIncognito: isIncognito,
    saveMyPrompts: saveMyPrompts,
    myPrompts: myPrompts,
    submitVerificationSteps: submitVerificationSteps,
    myVerification: myVerification,
    presenceOf: presenceOf
  };

  // Seed early so helpers (e.g. matchScore's topic titles) work before router boot.
  init();
})();
