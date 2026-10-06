window.PC = window.PC || {};
/* PakConnect — communities view: country-based community cards. */

/* EXT-POINT: community-groups — interest-based groups inside each country community. */
/* EXT-POINT: community-events — virtual/in-person meetups per community with RSVPs. */
/* EXT-POINT: community-moderators — elected moderators per country community. */
/* EXT-POINT: community-rules — per-community guidelines layered on global safety rules. */

(function () {
  'use strict';
  var U = PC.util, S = PC.store, ui = PC.ui;

  var STARS = ['★', '✦', '✧', '✶', '✷', '✸', '✹', '✺', '✻'];

  PC.views.communities = function (el, params) {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="page-title">Communities</div>' +
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
    wrap.appendChild(grid);
    el.appendChild(wrap);
  };
})();
