window.PC = window.PC || {};
PC.views = PC.views || {};

/* Connections view: Connected / Interested / Passed tabs with per-row actions. */

(function () {

  var TAB = 'connected';
  var TABS = ['connected', 'interested', 'passed'];

  function esc(s) { return PC.util.esc(s == null ? '' : String(s)); }

  function metaLine(u) {
    var age = (u.privacy && u.privacy.hideAge) ? '••' : esc(u.age);
    var loc = [u.country, u.city].filter(Boolean).map(esc).join(' · ');
    var bits = [age];
    if (loc) bits.push(loc);
    if (u.mode) bits.push(esc(u.mode));
    return bits.join(' · ');
  }

  function actionsHTML(u) {
    var id = ' data-id="' + esc(u.id) + '"';
    if (TAB === 'connected') {
      return '<button class="btn btn-primary btn-sm"' + id + ' data-action="message">Message</button>' +
        '<button class="btn btn-ghost btn-sm"' + id + ' data-action="unconnect">Unconnect</button>';
    }
    if (TAB === 'interested') {
      return '<button class="btn btn-primary btn-sm"' + id + ' data-action="connect">Connect</button>' +
        '<button class="btn btn-sm"' + id + ' data-action="message">Message</button>' +
        '<button class="btn btn-ghost btn-sm"' + id + ' data-action="pass">Pass</button>' +
        '<button class="btn btn-ghost btn-sm"' + id + ' data-action="remove">Remove</button>';
    }
    return '<button class="btn btn-sm"' + id + ' data-action="undo">Undo</button>' +
      '<button class="btn btn-sm"' + id + ' data-action="message">Message</button>';
  }

  function rowHTML(u, me) {
    var r = PC.util.matchScore(me, u) || { score: 0 };
    var note = esc(PC.util.SCORE_NOTE);
    return '<div class="list-row">' +
      PC.util.avatarHTML(u, 'md') +
      '<div class="conn-main">' +
        '<div class="conn-name">' + esc(u.name) +
          (u.verified ? ' <span class="badge badge-verified">✓ Verified</span>' : '') +
          (u.demo ? ' <span class="badge badge-demo">Demo</span>' : '') +
        '</div>' +
        '<div class="conn-meta">' + metaLine(u) + '</div>' +
      '</div>' +
      '<span class="chip" title="' + note + '">' + r.score + '%</span>' +
      '<div class="btn-row">' + actionsHTML(u) + '</div>' +
    '</div>';
  }

  function emptyHTML() {
    if (TAB === 'connected') {
      return '<div class="empty">' +
        '<h3 class="section-title">No connections yet</h3>' +
        '<p>When you connect with someone, they\'ll show up here. Take it slow — quality over quantity.</p>' +
        '<button class="btn btn-primary btn-sm" data-action="godes">Discover people</button>' +
      '</div>';
    }
    if (TAB === 'interested') {
      return '<div class="empty">' +
        '<h3 class="section-title">Nobody on your radar yet</h3>' +
        '<p>Tap “Interested” on someone\'s card in Discover and they\'ll wait for you here — no rush, no pressure.</p>' +
        '<button class="btn btn-primary btn-sm" data-action="godes">Discover people</button>' +
      '</div>';
    }
    return '<div class="empty">' +
      '<h3 class="section-title">You haven\'t passed on anyone</h3>' +
      '<p>Passed profiles stay hidden from your Discover. Changed your mind? Use “Undo” on any row to bring them back.</p>' +
      '<button class="btn btn-primary btn-sm" data-action="godes">Discover people</button>' +
    '</div>';
  }

  function handleAction(act, id) {
    switch (act) {
      case 'godes':
        PC.router.go('/discover');
        break;
      case 'connect':
        /* EXT-POINT: mutual-match notification — notify both sides when the
           connection becomes mutual (both connected). */
        PC.store.setRelation(id, 'connected');
        PC.ui.toast('Connected 🎉');
        PC.router.refresh();
        break;
      case 'pass':
        PC.store.setRelation(id, 'passed');
        PC.ui.toast('Passed — they will stay out of your Discover');
        PC.router.refresh();
        break;
      case 'undo':
        PC.store.setRelation(id, null);
        PC.ui.toast('Moved back to Discover');
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
      case 'remove':
        PC.ui.confirmDlg('Remove this person from your Interested list?').then(function (ok) {
          if (!ok) return;
          PC.store.setRelation(id, null);
          PC.ui.toast('Removed');
          PC.router.refresh();
        });
        break;
      case 'message': {
        var res = PC.store.getOrCreateThread(id);
        if (res && res.thread) {
          PC.router.go('/chat/' + res.thread.id);
        } else {
          PC.ui.toast('Couldn\'t open chat right now');
        }
        break;
      }
    }
  }

  PC.views.connections = function (el, params) {
    document.title = 'Connections · PakConnect';
    if (params && params.tab && TABS.indexOf(params.tab) > -1) TAB = params.tab;

    var me = PC.store.me();
    var lists = PC.store.connectionLists() || { connected: [], interested: [], passed: [] };
    var rows = lists[TAB] || [];

    var tabsHTML = TABS.map(function (t) {
      var label = t.charAt(0).toUpperCase() + t.slice(1);
      var count = (lists[t] || []).length;
      return '<button class="tab' + (TAB === t ? ' tab-on' : '') + '" data-tab="' + t + '">' +
        esc(label) + ' (' + count + ')</button>';
    }).join('');

    var body = rows.length
      ? rows.map(function (u) { return rowHTML(u, me); }).join('')
      : emptyHTML();

    el.innerHTML =
      '<h1 class="page-title">Connections</h1>' +
      '<p class="page-sub">' +
        (lists.connected || []).length + ' connected · ' +
        (lists.interested || []).length + ' interested · ' +
        (lists.passed || []).length + ' passed' +
      '</p>' +
      '<div class="tabs">' + tabsHTML + '</div>' +
      '<div class="conn-list">' + body + '</div>';

    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]');
      if (t) {
        TAB = t.getAttribute('data-tab');
        PC.router.refresh();
        return;
      }
      var b = e.target.closest('[data-action]');
      if (!b) return;
      handleAction(b.getAttribute('data-action'), b.getAttribute('data-id'));
    });
  };

})();
