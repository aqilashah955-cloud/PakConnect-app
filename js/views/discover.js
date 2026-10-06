window.PC = window.PC || {};
PC.views = PC.views || {};

/* Discover view: browse people, filter them, and take action on each card. */

(function () {

  /* Sub-tab state: 'all' (Discover) or 'picks' (Today's Picks). Local only. */
  var discoverTab = 'all';

  function esc(s) { return PC.util.esc(s == null ? '' : String(s)); }

  function opt(value, cur) {
    return '<option value="' + esc(value) + '"' + (value === cur ? ' selected' : '') + '>' + esc(value) + '</option>';
  }

  function optFromList(values, cur, allLabel) {
    return '<option value="">' + esc(allLabel) + '</option>' +
      values.map(function (v) { return opt(v, cur); }).join('');
  }

  /* Build select options from distinct values present in the user pool. */
  function dynOptions(users, key, cur, allLabel, cap) {
    var set = {}, i, u, v;
    for (i = 0; i < users.length; i++) {
      u = users[i];
      v = u[key];
      if (Array.isArray(v)) {
        v.forEach(function (x) { if (x) set[x] = 1; });
      } else if (v) {
        set[v] = 1;
      }
    }
    var keys = Object.keys(set).sort().slice(0, cap || 60);
    return optFromList(keys, cur, allLabel);
  }

  function readFilters() {
    function val(id) {
      var n = document.getElementById(id);
      return n ? n.value.trim() : '';
    }
    var f = {
      q: val('f-q'),
      minAge: val('f-minAge') === '' ? '' : parseInt(val('f-minAge'), 10),
      maxAge: val('f-maxAge') === '' ? '' : parseInt(val('f-maxAge'), 10),
      country: val('f-country'),
      city: val('f-city'),
      interest: val('f-interest'),
      profession: val('f-profession'),
      education: val('f-education'),
      language: val('f-language'),
      value: val('f-value'),
      trait: val('f-trait'),
      intention: val('f-intention'),
      background: val('f-background')
    };
    Object.keys(f).forEach(function (k) {
      if (f[k] === '' || f[k] === null || (typeof f[k] === 'number' && isNaN(f[k]))) delete f[k];
    });
    return f;
  }

  function applyFilters() {
    var f = readFilters();
    PC.store.saveSettings({ discoverFilters: f });
    PC.router.refresh();
  }

  function hasFilters(f) {
    return Object.keys(f).length > 0;
  }

  function sameDiscussion(aId, bId) {
    try {
      if (!PC.store.participatedTopicIds) return false;
      var a = PC.store.participatedTopicIds(aId) || [];
      var b = PC.store.participatedTopicIds(bId) || [];
      return a.some(function (t) { return b.indexOf(t) !== -1; });
    } catch (e) {
      return false;
    }
  }

  function actionButtons(u) {
    var rel = PC.store.relation(u.id);
    var id = esc(u.id);
    var b = ' data-id="' + id + '"';
    if (rel === 'connected') {
      return '<button class="btn btn-primary btn-sm"' + b + ' data-action="message">Message</button>' +
        '<button class="btn btn-ghost btn-sm"' + b + ' data-action="unconnect">Unconnect</button>';
    }
    if (rel === 'interested') {
      return '<button class="btn btn-primary btn-sm"' + b + ' data-action="connect">Connect</button>' +
        '<button class="btn btn-sm"' + b + ' data-action="superconnect">⚡ Super Connect</button>' +
        '<button class="btn btn-sm"' + b + ' data-action="message">Message</button>' +
        '<button class="btn btn-ghost btn-sm"' + b + ' data-action="pass">Pass</button>';
    }
    if (rel === 'passed') {
      return '<button class="btn btn-sm"' + b + ' data-action="undo">Undo pass</button>' +
        '<button class="btn btn-sm"' + b + ' data-action="superconnect">⚡ Super Connect</button>' +
        '<button class="btn btn-sm"' + b + ' data-action="message">Message</button>';
    }
    return '<button class="btn btn-primary btn-sm"' + b + ' data-action="connect">Connect</button>' +
      '<button class="btn btn-sm"' + b + ' data-action="superconnect">⚡ Super Connect</button>' +
      '<button class="btn btn-sm"' + b + ' data-action="interested">Interested</button>' +
      '<button class="btn btn-sm"' + b + ' data-action="message">Message</button>' +
      '<button class="btn btn-ghost btn-sm"' + b + ' data-action="pass">Pass</button>';
  }

  function cardHTML(u, me, extraHTML) {
    var r = PC.util.matchScore(me, u) || { score: 0, reasons: [] };
    var reasons = (r.reasons || []).slice(0, 2).map(function (x) {
      return '<div class="match-reason">✓ ' + esc(x) + '</div>';
    }).join('');
    var alreadyMentionsDiscussion = (r.reasons || []).some(function (x) {
      return /same discussion/i.test(x);
    });
    var discLine = '';
    if (sameDiscussion(me.id, u.id) && !alreadyMentionsDiscussion) {
      /* EXT-POINT: shared-discussion deep link — link this line to the discussion
         you both participated in once discussion routing ids are final. */
      discLine = '<div class="match-reason">💬 You both participated in the same discussion</div>';
    }
    var badgeDefs = (PC.seed && PC.seed.badgeDefs) || {};
    var badgeRow = '';
    if (u.badges && u.badges.length) {
      badgeRow = '<div class="discover-badges" style="margin-top:6px">' + u.badges.map(function (bd) {
        var d = badgeDefs[bd];
        var icon = (d && d.icon) || (typeof d === 'string' ? d : '🏅');
        var label = (d && d.label) || String(bd);
        return '<span title="' + esc(label) + '" style="font-size:1.1rem;margin-right:6px;cursor:default">' +
          esc(icon) + '</span>';
      }).join('') + '</div>';
    }
    var age = (u.privacy && u.privacy.hideAge) ? '••' : esc(u.age);
    var loc = [u.country, u.city].filter(Boolean).map(esc).join(' · ');
    var intentions = (u.lookingFor || []).map(function (x) {
      return '<span class="chip">' + esc(x) + '</span>';
    }).join(' ');
    var note = esc(PC.util.SCORE_NOTE);

    return '<article class="card discover-card">' +
      '<div class="discover-head">' +
        PC.util.avatarHTML(u, 'lg') +
        '<div>' +
          '<div class="discover-name">' + esc(u.name) +
            (u.verified ? ' <span class="badge badge-verified">✓ Verified</span>' : '') +
            (u.demo ? ' <span class="badge badge-demo">Demo</span>' : '') +
          '</div>' +
          '<div class="discover-meta">' + age + (loc ? ' · ' + loc : '') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="discover-chips">' +
        (u.mode ? '<span class="chip chip-on">' + esc(u.mode) + '</span>' : '') +
        intentions +
      '</div>' +
      badgeRow +
      '<div class="scorebar" title="' + note + '"><div class="scorebar-fill" style="width:' + r.score + '%"></div></div>' +
      '<div class="score-line"><strong>' + r.score + '%</strong> match <span title="' + note + '">ⓘ</span></div>' +
      reasons + discLine +
      (extraHTML || '') +
      '<div class="btn-row">' + actionButtons(u) + '</div>' +
    '</article>';
  }

  function filterBarHTML(f, pool) {
    function sel(id, label, optsHTML) {
      return '<div class="field"><label class="label" for="' + id + '">' + esc(label) + '</label>' +
        '<select class="select" id="' + id + '" data-filter>' + optsHTML + '</select></div>';
    }
    function txt(id, label, type, ph) {
      return '<div class="field"><label class="label" for="' + id + '">' + esc(label) + '</label>' +
        '<input class="input" type="' + type + '" id="' + id + '" data-filter-text placeholder="' + esc(ph) + '" value="' + esc(f[id.replace('f-', '')] != null ? f[id.replace('f-', '')] : '') + '"></div>';
    }
    return '<details class="filter-bar card"' + (hasFilters(f) ? ' open' : '') + '>' +
      '<summary class="section-title">🔍 Filters' + (hasFilters(f) ? ' (' + Object.keys(f).length + ' active)' : '') + '</summary>' +
      '<div class="grid-2">' +
        txt('f-q', 'Search', 'text', 'Name, interest, profession…') +
        txt('f-city', 'City', 'text', 'e.g. Lahore') +
        '<div class="field"><label class="label" for="f-minAge">Min age</label>' +
          '<input class="input" type="number" id="f-minAge" data-filter-text min="18" max="99" value="' + esc(f.minAge != null ? f.minAge : '') + '"></div>' +
        '<div class="field"><label class="label" for="f-maxAge">Max age</label>' +
          '<input class="input" type="number" id="f-maxAge" data-filter-text min="18" max="99" value="' + esc(f.maxAge != null ? f.maxAge : '') + '"></div>' +
        sel('f-country', 'Country', optFromList(PC.util.COUNTRIES, f.country, 'All countries')) +
        sel('f-language', 'Language', optFromList(PC.util.LANGUAGES, f.language, 'Any language')) +
        sel('f-interest', 'Interest', dynOptions(pool, 'interests', f.interest, 'Any interest')) +
        sel('f-profession', 'Profession', dynOptions(pool, 'profession', f.profession, 'Any profession')) +
        sel('f-education', 'Education', dynOptions(pool, 'education', f.education, 'Any education')) +
        sel('f-value', 'Value', dynOptions(pool, 'values', f.value, 'Any value')) +
        sel('f-trait', 'Trait', dynOptions(pool, 'traits', f.trait, 'Any trait')) +
        sel('f-intention', 'Intention', optFromList(PC.util.INTENTIONS, f.intention, 'Any intention')) +
        sel('f-background', 'Background', dynOptions(pool, 'background', f.background, 'Any background')) +
      '</div>' +
      '<div class="btn-row">' +
        '<button class="btn btn-ghost btn-sm" data-action="clear">Clear filters</button>' +
        '<span class="filter-hint">Filters apply automatically as you change them.</span>' +
      '</div>' +
    '</details>';
  }

  function premiumHTML() {
    var feats = (PC.seed && PC.seed.premiumFeatures) || [];
    var items = feats.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    return '<section class="card premium-card">' +
      '<span class="badge">Premium</span>' +
      '<h3 class="section-title">Go Premium</h3>' +
      '<ul>' + items + '</ul>' +
      '<button class="btn btn-primary" data-action="premium">See Premium plans</button>' +
    '</section>';
  }

  /* Deterministic daily seed: YYYY-MM-DD (local time). */
  function daySeedStr() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function hashStr(s) {
    var h = 5381, i;
    for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }

  /* 3 deterministic daily picks from the full privacy-respecting pool. */
  function todaysPicks() {
    var seed = daySeedStr();
    var pool = PC.store.filterUsers({});
    var scored = pool.map(function (u) { return { u: u, h: hashStr(u.id + '|' + seed) }; });
    scored.sort(function (a, b) { return a.h - b.h; });
    return scored.slice(0, 3).map(function (x) { return x.u; });
  }

  function todayDisplayStr() {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function whyPickHTML(u, me) {
    var r = PC.util.matchScore(me, u) || { reasons: [] };
    var items = (r.reasons || []).slice(0, 2).map(function (x) {
      return '<li>✓ ' + esc(x) + '</li>';
    });
    items.push('<li>⚡ Active in ' + esc(u.mode || 'Friendship') + ' mode</li>');
    items.push('<li>📍 ' + (me.country && me.country === u.country
      ? 'Lives in your country'
      : 'From ' + esc(u.country || 'abroad')) + '</li>');
    return '<div class="why-pick" style="margin:8px 0;padding:10px 12px;border-radius:10px;' +
      'background:var(--card,#f7f4ff);border:1px dashed var(--line,#ddd)">' +
      '<div style="font-weight:700;margin-bottom:4px">✨ Why this pick</div>' +
      '<ul style="margin:0;padding-left:18px;font-size:.9em">' + items.join('') + '</ul>' +
    '</div>';
  }

  function handleAction(act, id) {
    if (act === 'clear') {
      PC.store.saveSettings({ discoverFilters: {} });
      PC.router.refresh();
      return;
    }
    if (act === 'premium') {
      PC.router.go('/premium');
      return;
    }
    var res;
    switch (act) {
      case 'connect':
        if (typeof PC.store.canConnect === 'function' && !PC.store.canConnect()) {
          PC.ui.toast('Daily Connect limit reached (10/day on Free). Go Premium for unlimited.');
          PC.router.go('/premium');
          return;
        }
        /* EXT-POINT: mutual-match notification — notify both sides when the
           connection becomes mutual (both connected). */
        PC.store.setRelation(id, 'connected');
        if (typeof PC.store.recordConnect === 'function') PC.store.recordConnect();
        PC.ui.toast('Connected 🎉');
        PC.router.refresh();
        break;
      case 'superconnect':
        if (typeof PC.store.isPremium === 'function' && !PC.store.isPremium()) {
          PC.ui.toast('Super Connect is a Premium feature.');
          PC.router.go('/premium');
          return;
        }
        PC.store.setRelation(id, 'connected');
        PC.ui.toast('Super Connect sent ⚡');
        PC.router.refresh();
        break;
      case 'interested':
        if (typeof PC.store.canInterested === 'function' && !PC.store.canInterested()) {
          PC.ui.toast('Daily Interested limit reached on Free. Go Premium for unlimited.');
          PC.router.go('/premium');
          return;
        }
        PC.store.setRelation(id, 'interested');
        if (typeof PC.store.recordInterested === 'function') PC.store.recordInterested();
        PC.ui.toast('Marked as interested');
        PC.router.refresh();
        break;
      case 'pass':
        PC.store.setRelation(id, 'passed');
        PC.ui.toast('Passed — they will stay out of your Discover');
        PC.router.refresh();
        break;
      case 'undo':
        PC.store.setRelation(id, null);
        PC.ui.toast('Removed from your passed list');
        PC.router.refresh();
        break;
      case 'unconnect':
        PC.ui.confirmDlg('Remove this connection?').then(function (ok) {
          if (!ok) return;
          PC.store.setRelation(id, null);
          PC.ui.toast('Connection removed');
          PC.router.refresh();
        });
        break;
      case 'message':
        res = PC.store.getOrCreateThread(id);
        if (res && res.thread) {
          PC.router.go('/chat/' + res.thread.id);
        } else {
          PC.ui.toast('Couldn\'t open chat right now');
        }
        break;
    }
  }

  PC.views.discover = function (el, params) {
    document.title = 'Discover · PakConnect';
    var me = PC.store.me();
    var settings = PC.store.settings() || {};
    var f = settings.discoverFilters || {};
    var pool = (typeof PC.store.allUsers === 'function') ? PC.store.allUsers() : PC.store.users();
    var list = PC.store.filterUsers(f);
    var note = esc(PC.util.SCORE_NOTE);

    var cards = list.map(function (u) { return cardHTML(u, me); }).join('');

    var tray = (typeof PC.views.storyTrayHTML === 'function') ? PC.views.storyTrayHTML() : '';

    var banners = '';
    if (typeof PC.store.isBoost === 'function' && PC.store.isBoost()) {
      banners += '<div class="banner">🚀 Boost active — your profile is at the top of Discover</div>';
    }
    if (typeof PC.store.isIncognito === 'function' && PC.store.isIncognito()) {
      banners += '<div class="banner">🥷 Incognito on — browsing privately</div>';
    }

    var tabs =
      '<div class="tabs">' +
        '<button class="tab' + (discoverTab === 'all' ? ' tab-on' : '') + '" data-dtab="all">Discover</button>' +
        '<button class="tab' + (discoverTab === 'picks' ? ' tab-on' : '') + '" data-dtab="picks">✨ Today\'s Picks</button>' +
      '</div>';

    var content;
    if (discoverTab === 'picks') {
      var picks = todaysPicks();
      var pickCards = picks.map(function (u) { return cardHTML(u, me, whyPickHTML(u, me)); }).join('');
      content =
        '<h2 class="section-title">✨ Today\'s Picks — refreshed daily</h2>' +
        '<p class="page-sub">' + esc(todayDisplayStr()) + ' · three people worth a hello</p>' +
        (picks.length
          ? '<div class="discover-list">' + pickCards + '</div>' +
            '<p class="score-footnote"><small title="' + note + '">' + note + '</small></p>'
          : '<div class="empty"><h3 class="section-title">No picks today</h3>' +
            '<p>Check back tomorrow for a fresh set.</p></div>');
    } else {
      content = filterBarHTML(f, pool) +
        (list.length
          ? '<p class="result-count">' + list.length + ' ' + (list.length === 1 ? 'person' : 'people') + '</p>' +
            '<div class="discover-list">' + cards + '</div>' +
            '<p class="score-footnote"><small title="' + note + '">' + note + '</small></p>'
          : '<div class="empty">' +
              '<h3 class="section-title">Nobody matches those filters</h3>' +
              '<p>Try widening the age range or clearing a filter or two — the right people might be one filter away.</p>' +
              '<button class="btn btn-primary btn-sm" data-action="clear">Clear filters</button>' +
            '</div>');
    }

    el.innerHTML =
      '<h1 class="page-title">Discover</h1>' +
      tray +
      '<p class="page-sub">People you might like to know — at your pace, no pressure.</p>' +
      banners +
      tabs +
      content +
      premiumHTML();

    function onStoryTarget(t) {
      var a = t.closest('[data-story-author]');
      if (a && typeof PC.views.openStories === 'function') {
        PC.views.openStories(a.getAttribute('data-story-author'));
        return true;
      }
      var n = t.closest('[data-story-new]');
      if (n && typeof PC.views.openStoryComposer === 'function') {
        PC.views.openStoryComposer();
        return true;
      }
      return false;
    }

    el.addEventListener('click', function (e) {
      if (onStoryTarget(e.target)) return;
      var tb = e.target.closest('[data-dtab]');
      if (tb) {
        discoverTab = tb.getAttribute('data-dtab');
        PC.router.refresh();
        return;
      }
      var b = e.target.closest('[data-action]');
      if (!b) return;
      handleAction(b.getAttribute('data-action'), b.getAttribute('data-id'));
    });

    /* Keyboard access for story circles. */
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (onStoryTarget(e.target)) e.preventDefault();
    });

    var debounce = null;
    el.querySelectorAll('[data-filter]').forEach(function (n) {
      n.addEventListener('change', applyFilters);
    });
    el.querySelectorAll('[data-filter-text]').forEach(function (n) {
      n.addEventListener('input', function () {
        clearTimeout(debounce);
        debounce = setTimeout(applyFilters, 450);
      });
    });
  };

})();
