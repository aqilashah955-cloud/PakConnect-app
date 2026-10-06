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
      familyInvites: []     // family invite records
    };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o == null ? null : o)); }

  function seed() {
    var s = (window.PC && window.PC.seed) || {};
    state.users = clone(s.users) || [];
    state.dthreads = clone(s.discussionThreads) || [];
    state.reports = clone(s.reports) || [];
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
          { id: u('m'), from: greeter.id, text: '\uD83D\uDCA1 Starter suggestion: ' + starterText, ts: now - 1000 }
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
    var msg = { id: u('m'), from: 'me', text: body, ts: Date.now() };
    t.messages.push(msg);
    t.lastTs = msg.ts;
    save();
    // One canned friendly auto-reply per thread (demo), only if the thread still exists.
    if (!state.autoReplied[threadId]) {
      state.autoReplied[threadId] = true;
      save();
      setTimeout(function () {
        var still = getThread(threadId);
        if (!still) return;
        var pool = replyPool();
        var reply = pool[Math.floor(Math.random() * pool.length)];
        var r = { id: u('m'), from: still.userId, text: reply, ts: Date.now() };
        still.messages.push(r);
        still.lastTs = r.ts;
        save();
        try { window.dispatchEvent(new CustomEvent('pc:message', { detail: { threadId: threadId } })); } catch (e) {}
      }, 1200);
    }
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
    addFamilyInvite: addFamilyInvite
  };

  // Seed early so helpers (e.g. matchScore's topic titles) work before router boot.
  init();
})();
