window.PC = window.PC || {};

/* PC.util — shared helpers (plain script, no modules; file:// safe) */
(function () {
  'use strict';

  var ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESCAPES[c]; });
  }

  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
    var out = parts.slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
    return out || '?';
  }

  function avClass(name) {
    var s = String(name || '?');
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return 'av-' + (h % 8);
  }

  function avatarHTML(user, size) {
    var name = (user && user.name) || '?';
    var sz = ['sm', 'md', 'lg', 'xl'].indexOf(size) >= 0 ? size : 'md';
    return '<div class="avatar ' + avClass(name) + ' sz-' + sz + '">' + esc(initials(name)) + '</div>';
  }

  function timeAgo(ts) {
    var t = Number(ts) || 0;
    var diff = Math.max(0, Date.now() - t);
    var s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    var d = Math.floor(h / 24);
    if (d < 30) return d + 'd ago';
    var mo = Math.floor(d / 30);
    if (mo < 12) return mo + 'mo ago';
    return Math.floor(mo / 12) + 'y ago';
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  var COUNTRIES = ['Pakistan', 'UK', 'USA', 'Canada', 'UAE', 'Saudi Arabia', 'Australia', 'Europe', 'Worldwide'];
  var MODES = ['Friendship', 'Discussion', 'Networking', 'Relationship', 'Marriage'];
  var INTENTIONS = ['Friendship', 'Discussions', 'Networking', 'Serious relationship', 'Marriage'];
  var LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Saraiki', 'Hindko', 'Arabic', 'Other'];

  function normList(list) {
    return (list || []).map(function (v) { return String(v).trim().toLowerCase(); }).filter(Boolean);
  }

  function originalLabels(list, sharedLower) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (v) {
      var k = String(v).trim().toLowerCase();
      if (sharedLower.indexOf(k) >= 0 && !seen[k]) { seen[k] = true; out.push(String(v).trim()); }
    });
    return out;
  }

  function joinAnd(items) {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  function intersectLower(aList, bList) {
    var sa = normList(aList);
    return normList(bList).filter(function (v) { return sa.indexOf(v) >= 0; });
  }

  function topicTitles(ids) {
    // Prefer store titles; fall back to ids (guard for store not loaded yet)
    var titles = {};
    try {
      if (window.PC && PC.store && PC.store.topics) {
        PC.store.topics().forEach(function (t) { titles[String(t.id).toLowerCase()] = t.title; });
      }
    } catch (e) { /* store not ready — use ids */ }
    return ids.map(function (id) { return titles[String(id).toLowerCase()] || String(id); });
  }

  /* Match score weights: shared interests 12 each cap 36; shared values 10 each cap 20;
     shared favTopics OR shared participated topics 8 each cap 16; shared languages 4 each cap 8;
     any shared lookingFor intention 10; shared traits 2 each cap 10; cap total at 100. */
  function matchScore(a, b) {
    if (!a || !b) return { score: 0, reasons: [] };
    var reasons = [];
    var total = 0;

    // Interests: 12 each, cap 36
    var shInt = intersectLower(a.interests, b.interests);
    if (shInt.length) {
      total += Math.min(36, shInt.length * 12);
      reasons.push('You share ' + shInt.length + (shInt.length === 1 ? ' interest' : ' interests'));
    }

    // Values: 10 each, cap 20
    var shVal = intersectLower(a.values, b.values);
    if (shVal.length) {
      total += Math.min(20, shVal.length * 10);
      reasons.push('You both value ' + joinAnd(originalLabels(a.values, shVal)));
    }

    // Topics: favTopics shared OR participated-in topics shared — 8 each, cap 16
    var topicPts = 0;
    var shFav = intersectLower(a.favTopics, b.favTopics);
    if (shFav.length) {
      topicPts += shFav.length * 8;
      var favTitles = topicTitles(shFav);
      reasons.push('You both enjoy discussing ' + joinAnd(favTitles.slice(0, 3)));
    }
    try {
      if (window.PC && PC.store && PC.store.participatedTopicIds && a.id && b.id) {
        var pa = PC.store.participatedTopicIds(a.id).map(String);
        var shPart = PC.store.participatedTopicIds(b.id).filter(function (id) { return pa.indexOf(String(id)) >= 0; });
        if (shPart.length) {
          topicPts += shPart.length * 8;
          reasons.push('You both participated in the same discussion');
        }
      }
    } catch (e) { /* store not ready — favTopics only */ }
    total += Math.min(16, topicPts);

    // Languages: 4 each, cap 8
    var shLang = intersectLower(a.languages, b.languages);
    if (shLang.length) {
      total += Math.min(8, shLang.length * 4);
      reasons.push('You both speak ' + joinAnd(originalLabels(a.languages, shLang).slice(0, 3)));
    }

    // Looking-for intention: any shared → 10
    var shInt2 = intersectLower(a.lookingFor, b.lookingFor);
    if (shInt2.length) {
      total += 10;
      reasons.push('You\u2019re both looking for ' + joinAnd(originalLabels(a.lookingFor, shInt2)));
    }

    // Traits: 2 each, cap 10
    var shTraits = intersectLower(a.traits, b.traits);
    if (shTraits.length) {
      total += Math.min(10, shTraits.length * 2);
      reasons.push('You share ' + shTraits.length + (shTraits.length === 1 ? ' trait' : ' traits'));
    }

    return { score: Math.min(100, total), reasons: reasons };
  }

  var SCORE_NOTE = "Match scores are suggestions only \u2014 they can't predict love or guarantee compatibility.";

  PC.util = {
    esc: esc,
    initials: initials,
    avClass: avClass,
    avatarHTML: avatarHTML,
    timeAgo: timeAgo,
    uid: uid,
    COUNTRIES: COUNTRIES,
    MODES: MODES,
    INTENTIONS: INTENTIONS,
    LANGUAGES: LANGUAGES,
    matchScore: matchScore,
    SCORE_NOTE: SCORE_NOTE
  };

  /* PC.ui — toast / modal / confirm dialog */
  function toast(msg) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var d = document.createElement('div');
    d.className = 'toast';
    d.textContent = String(msg == null ? '' : msg);
    root.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2500);
  }

  function modal(html) {
    var root = document.getElementById('modal-root');
    if (!root) return function () {};
    var bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    var card = document.createElement('div');
    card.className = 'modal-card';
    card.innerHTML = html;
    bd.appendChild(card);
    function close() { if (bd.parentNode) bd.parentNode.removeChild(bd); }
    bd.addEventListener('click', function (e) { if (e.target === bd) close(); });
    root.appendChild(bd);
    return close;
  }

  function confirmDlg(msg) {
    return new Promise(function (resolve) {
      var done = false;
      function finish(v) { if (!done) { done = true; close(); resolve(v); } }
      var close = modal(
        '<p>' + esc(msg) + '</p>' +
        '<div style="text-align:right;margin-top:16px">' +
        '<button type="button" class="btn" data-x="cancel">Cancel</button> ' +
        '<button type="button" class="btn btn-primary" data-x="ok">OK</button>' +
        '</div>'
      );
      var root = document.getElementById('modal-root');
      var cards = root ? root.querySelectorAll('.modal-card') : [];
      var card = cards.length ? cards[cards.length - 1] : null;
      if (card) {
        var ok = card.querySelector('[data-x="ok"]');
        var cancel = card.querySelector('[data-x="cancel"]');
        if (ok) ok.addEventListener('click', function () { finish(true); });
        if (cancel) cancel.addEventListener('click', function () { finish(false); });
      }
    });
  }

  PC.ui = { toast: toast, modal: modal, confirmDlg: confirmDlg };
})();
