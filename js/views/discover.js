window.PC = window.PC || {};
PC.views = PC.views || {};

/* Discover view: browse people, filter them, and take action on each card. */

(function () {

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
        '<button class="btn btn-sm"' + b + ' data-action="message">Message</button>' +
        '<button class="btn btn-ghost btn-sm"' + b + ' data-action="pass">Pass</button>';
    }
    if (rel === 'passed') {
      return '<button class="btn btn-sm"' + b + ' data-action="undo">Undo pass</button>' +
        '<button class="btn btn-sm"' + b + ' data-action="message">Message</button>';
    }
    return '<button class="btn btn-primary btn-sm"' + b + ' data-action="connect">Connect</button>' +
      '<button class="btn btn-sm"' + b + ' data-action="interested">Interested</button>' +
      '<button class="btn btn-sm"' + b + ' data-action="message">Message</button>' +
      '<button class="btn btn-ghost btn-sm"' + b + ' data-action="pass">Pass</button>';
  }

  function cardHTML(u, me) {
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
      '<div class="scorebar" title="' + note + '"><div class="scorebar-fill" style="width:' + r.score + '%"></div></div>' +
      '<div class="score-line"><strong>' + r.score + '%</strong> match <span title="' + note + '">ⓘ</span></div>' +
      reasons + discLine +
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
      '<span class="badge">Premium — coming soon</span>' +
      '<h3 class="section-title">Go Premium</h3>' +
      '<ul>' + items + '</ul>' +
      '<button class="btn btn-primary" data-action="premium">Notify me</button>' +
    '</section>';
  }

  function handleAction(act, id) {
    if (act === 'clear') {
      PC.store.saveSettings({ discoverFilters: {} });
      PC.router.refresh();
      return;
    }
    if (act === 'premium') {
      /* EXT-POINT: premium-upsell — wire to real subscription flow when launched. */
      PC.ui.toast('Premium is coming soon');
      return;
    }
    var res;
    switch (act) {
      case 'connect':
        /* EXT-POINT: mutual-match notification — notify both sides when the
           connection becomes mutual (both connected). */
        PC.store.setRelation(id, 'connected');
        PC.ui.toast('Connected 🎉');
        PC.router.refresh();
        break;
      case 'interested':
        PC.store.setRelation(id, 'interested');
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

    el.innerHTML =
      '<h1 class="page-title">Discover</h1>' +
      '<p class="page-sub">People you might like to know — at your pace, no pressure.</p>' +
      filterBarHTML(f, pool) +
      (list.length
        ? '<p class="result-count">' + list.length + ' ' + (list.length === 1 ? 'person' : 'people') + '</p>' +
          '<div class="discover-list">' + cards + '</div>' +
          '<p class="score-footnote"><small title="' + note + '">' + note + '</small></p>'
        : '<div class="empty">' +
            '<h3 class="section-title">Nobody matches those filters</h3>' +
            '<p>Try widening the age range or clearing a filter or two — the right people might be one filter away.</p>' +
            '<button class="btn btn-primary btn-sm" data-action="clear">Clear filters</button>' +
          '</div>') +
      premiumHTML();

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-action]');
      if (!b) return;
      handleAction(b.getAttribute('data-action'), b.getAttribute('data-id'));
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
