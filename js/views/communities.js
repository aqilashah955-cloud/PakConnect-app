window.PC = window.PC || {};
/* PakConnect — communities view: tabbed (Members | Group chats | Events).
   Members tab keeps the original country-card grid + explore-members behavior.
   Group chats tab renders PC.views.groupchatListHTML() (owned by another build-2
   agent — guarded). Events tab teases /events with the next 3 events mini-list. */

/* EXT-POINT: community-groups — interest-based groups inside each country community. */
/* EXT-POINT: community-moderators — elected moderators per country community. */
/* EXT-POINT: community-rules — per-community guidelines layered on global safety rules. */

(function () {
  'use strict';
  var U = PC.util, S = PC.store, ui = PC.ui;

  var STARS = ['★', '✦', '✧', '✶', '✷', '✸', '✹', '✺', '✻'];

  var cmTab = 'members'; /* 'members' | 'gchat' | 'events' */

  function has(fn) { return !!(S && typeof S[fn] === 'function'); }

  function membersHTML(host) {
    var intro = document.createElement('div');
    intro.innerHTML =
      '<p style="color:var(--muted,#666);margin-top:0">Find your people. Each community gathers Pakistanis living in the same country — swap stories, plan meetups, and help each other settle in.</p>' +
      '<p style="color:var(--muted,#666);font-size:.85em">Member counts shown are demo counts.</p>';

    var stats = S.communityStats();
    var byCountry = {};
    stats.forEach(function (s) { byCountry[s.country] = s.count; });

    var grid = document.createElement('div');
    grid.className = 'grid-2';
    U.COUNTRIES.forEach(function (country, i) {
      var card = document.createElement('div');
      card.className = 'card';
      var mine = S.me() && S.me().country === country;
      card.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-size:1.6em" aria-hidden="true">' + STARS[i % STARS.length] + '</span>' +
          '<div style="font-weight:600;font-size:1.05em">' + U.esc(country) +
            (mine ? ' <span class="chip chip-on">your community</span>' : '') + '</div>' +
        '</div>' +
        '<div style="margin:8px 0;color:var(--muted,#666)"><b>' +
          (byCountry[country] != null ? byCountry[country] : 0) +
        '</b> members</div>' +
        '<button class="btn btn-ghost btn-sm" data-explore>Explore members</button>';
      card.querySelector('[data-explore]').addEventListener('click', function () {
        var settings = S.settings();
        var f = settings.discoverFilters || {};
        f.country = country;
        settings.discoverFilters = f;
        S.saveSettings({ discoverFilters: f });
        ui.toast('Showing members in ' + country + '.');
        PC.router.go('/discover');
      });
      grid.appendChild(card);
    });
    host.appendChild(intro);
    host.appendChild(grid);
  }

  function gchatHTML(host) {
    var head = document.createElement('div');
    head.innerHTML =
      '<div class="section-title">💬 Country group chats</div>' +
      '<p style="color:var(--muted,#666);margin-top:0">Jump into the conversation for your country — or lurk in another community\'s chat to see what they\'re talking about.</p>' +
      '<p style="color:var(--muted,#666);font-size:.85em">Member counts shown are demo counts.</p>';
    host.appendChild(head);
    var body = document.createElement('div');
    if (PC.views && typeof PC.views.groupchatListHTML === 'function') {
      body.innerHTML = PC.views.groupchatListHTML();
      /* Let the groupchat module wire its own buttons if it exposes a hook. */
      if (typeof PC.views.wireGroupchatList === 'function') PC.views.wireGroupchatList(body);
    } else {
      body.innerHTML = '<div class="empty"><span class="big">💬</span>Group chats are landing in build 2 — check back soon.</div>';
    }
    host.appendChild(body);
  }

  function eventsHTML(host) {
    var head = document.createElement('div');
    head.innerHTML =
      '<div class="section-title">📅 Upcoming community events</div>' +
      '<p style="color:var(--muted,#666);margin-top:0">Meetups, hangouts and virtual gatherings organised by community members.</p>';
    host.appendChild(head);

    var list = has('eventsList') ? (S.eventsList() || []) : [];
    var teaser = document.createElement('div');
    teaser.className = 'card';
    var rows = list.slice(0, 3).map(function (ev) {
      var name = ev.name || ev.title || 'Community event';
      var when = ev.date || (ev.ts ? U.timeAgo(ev.ts) : '') || '';
      var rsvps = ev.rsvps ? ev.rsvps.length : (ev.rsvpCount || 0);
      return '<div class="list-row">' +
        '<span class="event-date">' + U.esc(String(when).slice(0, 10) || '—') + '</span>' +
        '<span style="flex:1;"><b>' + U.esc(name) + '</b><br>' +
        '<span style="opacity:.7;font-size:.85em;">' + U.esc(String(when)) + ' · ' + rsvps + ' going</span></span>' +
      '</div>';
    }).join('');
    teaser.innerHTML =
      (rows || '<p style="opacity:.7;">No events yet — be the first to plan one.</p>') +
      '<button class="btn btn-primary" data-events style="margin-top:8px;">Browse all events</button>' +
      '<p style="color:var(--muted,#666);font-size:.85em;margin-bottom:0;">Event details are demo content.</p>';
    teaser.querySelector('[data-events]').addEventListener('click', function () { PC.router.go('/events'); });
    host.appendChild(teaser);
  }

  PC.views.communities = function (el, params) {
    var tabs = [
      ['members', 'Members'],
      ['gchat', '💬 Group chats'],
      ['events', '📅 Events']
    ];
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="page-title">Communities</div>' +
      '<div class="tabs">' + tabs.map(function (t) {
        return '<button class="tab' + (cmTab === t[0] ? ' tab-on' : '') + '" data-cmtab="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +
      '<div id="cmContent"></div>';
    el.appendChild(wrap);
    var content = wrap.querySelector('#cmContent');

    function renderTab() {
      content.innerHTML = '';
      if (cmTab === 'gchat') gchatHTML(content);
      else if (cmTab === 'events') eventsHTML(content);
      else membersHTML(content);
    }
    renderTab();

    wrap.querySelectorAll('[data-cmtab]').forEach(function (b) {
      b.addEventListener('click', function () {
        cmTab = b.getAttribute('data-cmtab');
        wrap.querySelectorAll('[data-cmtab]').forEach(function (x) {
          x.classList.toggle('tab-on', x.getAttribute('data-cmtab') === cmTab);
        });
        renderTab();
      });
    });
  };
})();
