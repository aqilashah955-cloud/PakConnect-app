window.PC = window.PC || {};

/* PC.router — hash router + chrome management (plain script, no modules; file:// safe).
   Routes: '#/discussions/culture' -> view 'discussions', params {topic:'culture'};
           '#/chat/abc' -> view 'chat', params {id:'abc'}. */
(function () {
  'use strict';

  var ROUTES = [
    { pattern: /^\/$/, view: 'landing' },
    { pattern: /^\/onboarding$/, view: 'onboarding' },
    { pattern: /^\/discover$/, view: 'discover' },
    { pattern: /^\/discussions(?:\/([^\/]+))?$/, view: 'discussions',
      params: function (m) { return m[1] ? { topic: decodeURIComponent(m[1]) } : {}; } },
    { pattern: /^\/dthread\/([^\/]+)$/, view: 'dthread',
      params: function (m) { return { id: decodeURIComponent(m[1]) }; } },
    { pattern: /^\/connections$/, view: 'connections' },
    { pattern: /^\/messages$/, view: 'messages' },
    { pattern: /^\/chat\/([^\/]+)$/, view: 'chat',
      params: function (m) { return { id: decodeURIComponent(m[1]) }; } },
    { pattern: /^\/communities$/, view: 'communities' },
    { pattern: /^\/profile$/, view: 'profile' },
    { pattern: /^\/profile\/edit$/, view: 'profileEdit' },
    { pattern: /^\/marriage$/, view: 'marriage' },
    { pattern: /^\/safety$/, view: 'safety' },
    { pattern: /^\/admin$/, view: 'admin' }
  ];

  var CHROMELESS = { landing: true, onboarding: true };

  // Maps a view name to the bottom-nav active key (per contract).
  var NAVMAP = {
    discover: 'discover',
    discussions: 'discussions', dthread: 'discussions',
    connections: 'connections',
    messages: 'messages', chat: 'messages',
    communities: 'communities',
    profile: 'profile', profileEdit: 'profile'
    // marriage / safety / admin have no bottom-nav item
  };

  function parseHash() {
    var h = window.location.hash || '';
    var path = h.charAt(0) === '#' ? h.slice(1) : h;
    if (!path || path.charAt(0) !== '/') path = '/';
    for (var i = 0; i < ROUTES.length; i++) {
      var m = path.match(ROUTES[i].pattern);
      if (m) {
        return { view: ROUTES[i].view, params: ROUTES[i].params ? ROUTES[i].params(m) : {} };
      }
    }
    return { view: 'landing', params: {} };
  }

  function applyTheme(theme) {
    theme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) document.body.setAttribute('data-theme', theme);
  }

  function syncChrome(route) {
    var chromeless = !!CHROMELESS[route.view];
    var topbar = document.getElementById('topbar');
    var bottomnav = document.getElementById('bottomnav');
    if (topbar) topbar.style.display = chromeless ? 'none' : '';
    if (bottomnav) bottomnav.style.display = chromeless ? 'none' : '';
    // Active bottom-nav item via data-route.
    var active = NAVMAP[route.view] || '';
    var items = document.querySelectorAll('#bottomnav [data-route]');
    Array.prototype.forEach.call(items, function (el) {
      el.classList.toggle('active', el.getAttribute('data-route') === active);
    });
    // Sync mode select + theme from settings.
    var settings = (window.PC && PC.store && PC.store.settings) ? PC.store.settings() : null;
    var modeSel = document.getElementById('modeSel');
    if (modeSel && settings) modeSel.value = settings.mode || 'Friendship';
    if (settings) applyTheme(settings.theme);
  }

  function comingSoon(el, view) {
    el.innerHTML =
      '<div class="empty">' +
        '<div class="page-title">Coming soon</div>' +
        '<p>The \u201C' + view + '\u201D section is on its way. Check back shortly.</p>' +
      '</div>';
  }

  function render() {
    var route = parseHash();
    // Onboarding guard: any chrome route requires a profile.
    var hasMe = !!(window.PC && PC.store && PC.store.me && PC.store.me());
    if (!hasMe && !CHROMELESS[route.view]) { go('/'); return; }
    var viewEl = document.getElementById('view');
    if (!viewEl) return;
    viewEl.innerHTML = '';
    syncChrome(route);
    var fn = (window.PC && PC.views) ? PC.views[route.view] : null;
    if (typeof fn === 'function') {
      fn(viewEl, route.params);
    } else {
      // Never render blank — friendly empty state when the view isn't built yet.
      comingSoon(viewEl, route.view);
    }
    window.scrollTo(0, 0);
  }

  function go(path) {
    var target = '#' + path;
    if (window.location.hash === target) { render(); }
    else { window.location.hash = target; }
  }

  function refresh() { render(); }

  function wireControls() {
    // Populate #modeSel from MODES if index.html didn't.
    var modeSel = document.getElementById('modeSel');
    if (modeSel && !modeSel.options.length && window.PC && PC.util && PC.util.MODES) {
      PC.util.MODES.forEach(function (m) {
        var opt = document.createElement('option');
        opt.value = m; opt.textContent = m;
        modeSel.appendChild(opt);
      });
    }
    if (modeSel) {
      modeSel.addEventListener('change', function () {
        if (window.PC && PC.store && PC.store.saveSettings) PC.store.saveSettings({ mode: modeSel.value });
        if (window.PC && PC.ui && PC.ui.toast) PC.ui.toast('Mode: ' + modeSel.value);
        refresh();
      });
    }
    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var cur = (window.PC && PC.store && PC.store.settings) ? PC.store.settings().theme : 'light';
        var next = cur === 'dark' ? 'light' : 'dark';
        if (window.PC && PC.store && PC.store.saveSettings) PC.store.saveSettings({ theme: next });
        applyTheme(next);
        if (window.PC && PC.ui && PC.ui.toast) PC.ui.toast(next === 'dark' ? 'Dark theme on' : 'Light theme on');
      });
    }
    var brandBtn = document.getElementById('brandBtn');
    if (brandBtn) brandBtn.addEventListener('click', function () { go('/'); });
  }

  function init() {
    if (window.PC && PC.store && PC.store.init) PC.store.init();
    if (!window.location.hash) window.location.hash = '#/';
    wireControls();
    window.addEventListener('hashchange', render);
    // Live-update chat/messages views when a canned auto-reply lands.
    window.addEventListener('pc:message', function () {
      var route = parseHash();
      if (route.view === 'messages' || route.view === 'chat') render();
    });
    render();
  }

  PC.router = { go: go, refresh: refresh, init: init, _parse: parseHash };
})();
