window.PC = window.PC || {};
PC.views = PC.views || {};

/* PakConnect — Stories (build 2).
   24h ephemeral text stories: horizontal tray, composer modal, full-screen viewer.
   Expiry is handled by the store (S.stories() only returns active stories). */

(function () {
  'use strict';
  var U = PC.util, S = PC.store, ui = PC.ui;

  function esc(s) { return U.esc(s == null ? '' : String(s)); }

  /* 6 gradient backgrounds shared by the composer and the viewer.
     A story's `bg` is stored as an index (0-5) into this palette. */
  var STORY_BGS = [
    'linear-gradient(135deg,#ff6a88,#ff9a44)',
    'linear-gradient(135deg,#7b2ff7,#f107a3)',
    'linear-gradient(135deg,#11998e,#38ef7d)',
    'linear-gradient(135deg,#396afc,#2948ff)',
    'linear-gradient(135deg,#f857a6,#ff5858)',
    'linear-gradient(135deg,#232526,#414345)'
  ];
  var STORY_EMOJIS = ['😊', '😂', '😍', '🤔', '🎉', '🔥', '💪', '🌙'];
  var STORY_MS = 5000; /* auto-advance every 5s */

  function storyBg(bg) {
    if (typeof bg === 'number' && STORY_BGS[bg]) return STORY_BGS[bg];
    if (typeof bg === 'string' && /gradient/i.test(bg)) return bg;
    return STORY_BGS[0];
  }

  function hasStories() { return S && typeof S.stories === 'function'; }

  function myStories() {
    if (!hasStories()) return [];
    var me = S.me();
    if (!me) return [];
    return S.stories().filter(function (st) { return st.authorId === me.id; });
  }

  function storyUnviewed(st) {
    if (typeof S.storyViewed !== 'function') return false;
    try { return !S.storyViewed(st.id); } catch (e) { return false; }
  }

  /* [{user, stories:[...], unviewed:bool}] in first-seen order. */
  function authorsWithStories() {
    if (!hasStories()) return [];
    var map = {}, order = [];
    S.stories().forEach(function (st) {
      var u = (typeof S.getUser === 'function') ? S.getUser(st.authorId) : null;
      if (!u) return;
      if (!map[st.authorId]) {
        map[st.authorId] = { user: u, stories: [], unviewed: false };
        order.push(st.authorId);
      }
      map[st.authorId].stories.push(st);
      if (storyUnviewed(st)) map[st.authorId].unviewed = true;
    });
    return order.map(function (id) { return map[id]; });
  }

  function ringStyle(kind) {
    if (kind === 'new') {
      return 'padding:3px;border-radius:50%;' +
        'background:linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)';
    }
    return 'padding:3px;border-radius:50%;background:#cfcfcf';
  }

  function storyCircle(user, label, ring, attr) {
    return '<div ' + attr + ' role="button" tabindex="0" class="story-circle"' +
      ' style="cursor:pointer;text-align:center;flex:0 0 auto">' +
      '<div style="' + ringStyle(ring) + '">' +
        '<div style="border-radius:50%;background:var(--card,#fff);padding:2px;line-height:0">' +
          U.avatarHTML(user, 'lg') +
        '</div>' +
      '</div>' +
      '<div style="font-size:.72rem;margin-top:4px;max-width:70px;line-height:1.2;' +
        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(label) + '</div>' +
    '</div>';
  }

  /* Horizontal story tray. Rendered by Discover (top of view). */
  PC.views.storyTrayHTML = function () {
    var me = S.me();
    var mine = myStories();
    var h = '<div class="story-tray" id="storyTray" style="display:flex;gap:14px;' +
      'overflow-x:auto;padding:12px 4px;margin:0">';
    if (me && mine.length) {
      var unviewed = mine.some(storyUnviewed);
      h += storyCircle(me, 'Your story', unviewed ? 'new' : 'seen',
        'data-story-author="' + esc(me.id) + '"');
    } else {
      h += '<div data-story-new="1" role="button" tabindex="0" class="story-circle"' +
        ' style="cursor:pointer;text-align:center;flex:0 0 auto">' +
        '<div style="width:64px;height:64px;border-radius:50%;border:2px dashed #bdbdbd;' +
          'display:flex;align-items:center;justify-content:center;font-size:1.6rem;' +
          'color:#888;background:var(--card,#f7f7f7)">+</div>' +
        '<div style="font-size:.72rem;margin-top:4px;max-width:70px;line-height:1.2;' +
          'overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Your story</div>' +
      '</div>';
    }
    authorsWithStories().forEach(function (a) {
      if (me && a.user.id === me.id) return;
      h += storyCircle(a.user, a.user.name, a.unviewed ? 'new' : 'seen',
        'data-story-author="' + esc(a.user.id) + '"');
    });
    return h + '</div>';
  };

  /* Story composer modal. */
  PC.views.openStoryComposer = function () {
    var selBg = 0, selEmoji = STORY_EMOJIS[0];

    var swatches = STORY_BGS.map(function (g, i) {
      return '<button type="button" class="story-swatch" data-bg="' + i + '"' +
        ' style="width:42px;height:42px;border-radius:12px;cursor:pointer;' +
        'border:' + (i === 0 ? '3px solid var(--teal,#0aa)' : '2px solid transparent') + ';' +
        'background:' + g + '" aria-label="Background ' + (i + 1) + '"></button>';
    }).join('');
    var emojis = STORY_EMOJIS.map(function (e, i) {
      return '<button type="button" class="story-emoji" data-emoji="' + i + '"' +
        ' style="font-size:1.5rem;cursor:pointer;padding:4px;border-radius:10px;background:none;' +
        'border:' + (i === 0 ? '2px solid var(--teal,#0aa)' : '2px solid transparent') + '">' + e + '</button>';
    }).join('');

    var body =
      '<div class="section-title">✨ New story <span class="badge badge-demo">demo</span></div>' +
      '<p style="color:var(--muted,#666);font-size:.85em;margin-top:0">Stories disappear after 24 hours.</p>' +
      '<div class="field"><label class="label" for="storyText">Your story</label>' +
        '<textarea class="textarea" id="storyText" rows="3" maxlength="140" ' +
          'placeholder="What\'s on your mind?"></textarea>' +
        '<div style="text-align:right;font-size:.8em;color:var(--muted,#666)">' +
          '<span id="storyCount">0</span>/140</div></div>' +
      '<div class="field"><label class="label">Background</label>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' + swatches + '</div></div>' +
      '<div class="field"><label class="label">Emoji</label>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap">' + emojis + '</div></div>' +
      '<div class="field"><label class="label">Preview</label>' +
        '<div id="storyPreview" style="border-radius:12px;padding:20px 14px;text-align:center;' +
          'color:#fff;min-height:100px;display:flex;flex-direction:column;align-items:center;' +
          'justify-content:center;gap:8px;background:' + STORY_BGS[0] + '">' +
          '<div style="font-size:2.2rem" id="storyPreviewEmoji">' + STORY_EMOJIS[0] + '</div>' +
          '<div id="storyPreviewText" style="font-weight:700;white-space:pre-wrap">Your story text…</div>' +
        '</div></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">' +
        '<button class="btn btn-ghost" id="storyCancel">Cancel</button>' +
        '<button class="btn btn-primary" id="storyPost">Post story</button>' +
      '</div>';

    var close = ui.modal(body);

    function refreshPreview() {
      var t = document.getElementById('storyText');
      var txt = t ? t.value : '';
      var c = document.getElementById('storyCount');
      if (c) c.textContent = String(txt.length);
      var pv = document.getElementById('storyPreview');
      if (pv) pv.style.background = STORY_BGS[selBg];
      var pe = document.getElementById('storyPreviewEmoji');
      if (pe) pe.textContent = selEmoji;
      var pt = document.getElementById('storyPreviewText');
      if (pt) pt.textContent = txt.trim() ? txt : 'Your story text…';
    }

    Array.prototype.forEach.call(document.querySelectorAll('.story-swatch'), function (b) {
      b.addEventListener('click', function () {
        selBg = parseInt(b.getAttribute('data-bg'), 10) || 0;
        Array.prototype.forEach.call(document.querySelectorAll('.story-swatch'), function (x) {
          x.style.border = (x === b) ? '3px solid var(--teal,#0aa)' : '2px solid transparent';
        });
        refreshPreview();
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.story-emoji'), function (b) {
      b.addEventListener('click', function () {
        selEmoji = STORY_EMOJIS[parseInt(b.getAttribute('data-emoji'), 10) || 0];
        Array.prototype.forEach.call(document.querySelectorAll('.story-emoji'), function (x) {
          x.style.border = (x === b) ? '2px solid var(--teal,#0aa)' : '2px solid transparent';
        });
        refreshPreview();
      });
    });
    var ta = document.getElementById('storyText');
    if (ta) ta.addEventListener('input', refreshPreview);

    document.getElementById('storyCancel').addEventListener('click', close);
    document.getElementById('storyPost').addEventListener('click', function () {
      var text = document.getElementById('storyText').value.trim();
      if (!text) { ui.toast('Write something first.'); return; }
      if (typeof S.addStory !== 'function') { ui.toast('Stories are not available yet.'); return; }
      S.addStory({ text: text, bg: selBg, emoji: selEmoji });
      close();
      ui.toast('Story posted');
      PC.router.refresh();
    });
  };

  /* ---- auto-advance timer: cleared whenever the hash changes (unmount) ---- */
  var storyTimer = null;
  function clearStoryTimer() {
    if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; }
  }
  window.addEventListener('hashchange', function () { clearStoryTimer(); });

  /* ---- #/stories/<authorId> route ----
     The router owns route registration. If it has no native /stories route,
     this shim renders the view so tray taps never hit a dead end. */
  function storiesRouteId() {
    var m = (window.location.hash || '').match(/^#\/stories\/([^\/]+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function routerHandlesStories() {
    try {
      var r = PC.router._parse();
      return !!(r && r.view === 'stories');
    } catch (e) { return false; }
  }

  function renderStoriesRoute(authorId) {
    clearStoryTimer();
    var viewEl = document.getElementById('view');
    if (!viewEl) return;
    viewEl.innerHTML = '';
    var topbar = document.getElementById('topbar');
    if (topbar) topbar.style.display = '';
    var bottomnav = document.getElementById('bottomnav');
    if (bottomnav) bottomnav.style.display = '';
    Array.prototype.forEach.call(
      document.querySelectorAll('#bottomnav [data-route]'),
      function (el) { el.classList.toggle('active', el.getAttribute('data-route') === 'discover'); }
    );
    PC.views.stories(viewEl, { id: authorId });
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', function (e) {
    var authorId = storiesRouteId();
    if (!authorId) return;
    if (routerHandlesStories()) return; /* native route wins */
    /* EXT-POINT: stories-route — remove this shim once router.js registers
       { pattern: /^\/stories\/([^\/]+)$/, view: 'stories',
         params: function (m) { return { id: decodeURIComponent(m[1]) }; } } */
    if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
    renderStoriesRoute(authorId);
  });

  /* Open an author's stories. Goes to #/stories/<authorId> (hash reflects the view). */
  PC.views.openStories = function (authorId) {
    var target = '#/stories/' + encodeURIComponent(authorId);
    if (window.location.hash === target && !routerHandlesStories()) {
      renderStoriesRoute(authorId);
      return;
    }
    PC.router.go('/stories/' + encodeURIComponent(authorId));
  };

  /* Cover a fresh boot directly on #/stories/<id> (router.init renders by hash). */
  if (PC.router && PC.router.init) {
    var origInit = PC.router.init;
    PC.router.init = function () {
      origInit();
      var authorId = storiesRouteId();
      if (authorId && !routerHandlesStories()) renderStoriesRoute(authorId);
    };
  }

  /* Full-screen viewer for one author's active stories. params.id = authorId. */
  PC.views.stories = function (el, params) {
    document.title = 'Stories · PakConnect';
    var authorId = params && params.id;
    var me = S.me();
    var isMine = !!(me && authorId === me.id);
    var idx = 0;

    function fetchStories() {
      if (!hasStories() || !authorId) return [];
      return S.stories()
        .filter(function (st) { return st.authorId === authorId; })
        .sort(function (a, b) { return a.ts - b.ts; });
    }

    function closeViewer() {
      clearStoryTimer();
      if (window.history.length > 1) window.history.back();
      else PC.router.go('/discover');
    }

    function next() {
      var stories = fetchStories();
      if (idx < stories.length - 1) { idx++; render(); }
      else closeViewer();
    }

    function prev() {
      if (idx > 0) { idx--; render(); }
    }

    function render() {
      clearStoryTimer();
      var stories = fetchStories();
      if (!stories.length) { closeViewer(); return; }
      if (idx >= stories.length) idx = stories.length - 1;
      var st = stories[idx];
      var author = ((typeof S.getUser === 'function') && S.getUser(authorId)) ||
        { name: 'PakConnect', id: authorId };
      if (typeof S.viewStory === 'function') { try { S.viewStory(st.id); } catch (e) {} }

      var segs = stories.map(function (s, i) {
        return '<div style="flex:1;height:4px;border-radius:2px;background:' +
          (i <= idx ? '#fff' : 'rgba(255,255,255,.35)') + '"></div>';
      }).join('');

      el.innerHTML =
        '<div style="max-width:480px;margin:0 auto">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
            U.avatarHTML(author, 'sm') +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
                esc(author.name) + '</div>' +
              '<div style="font-size:.8em;color:var(--muted,#666)">' +
                U.timeAgo(st.ts) + ' · ' + (idx + 1) + '/' + stories.length + '</div>' +
            '</div>' +
            (isMine && typeof S.deleteMyStory === 'function'
              ? '<button class="btn btn-ghost btn-sm" id="storyDel">Delete</button>' : '') +
            '<button class="btn btn-ghost btn-sm" id="storyClose" aria-label="Close">✕</button>' +
          '</div>' +
          '<div class="card" style="position:relative;overflow:hidden;padding:0;border:0;' +
            'min-height:420px;display:flex;flex-direction:column;justify-content:center;' +
            'align-items:center;text-align:center;color:#fff;background:' + storyBg(st.bg) + '">' +
            '<div style="position:absolute;top:10px;left:12px;right:12px;display:flex;gap:4px">' +
              segs + '</div>' +
            '<button id="storyPrev" aria-label="Previous story" ' +
              'style="position:absolute;left:0;top:0;bottom:0;width:30%;background:none;border:0;cursor:pointer"></button>' +
            '<button id="storyNext" aria-label="Next story" ' +
              'style="position:absolute;right:0;top:0;bottom:0;width:30%;background:none;border:0;cursor:pointer"></button>' +
            '<div style="font-size:3.4rem;margin-bottom:10px;line-height:1">' + esc(st.emoji || '') + '</div>' +
            '<div style="font-size:1.25rem;font-weight:700;padding:0 32px;white-space:pre-wrap">' +
              esc(st.text) + '</div>' +
          '</div>' +
          (isMine ? '' :
            '<div class="card" style="margin-top:10px">' +
              '<div style="display:flex;gap:8px">' +
                '<input class="input" id="storyReply" maxlength="200" ' +
                  'placeholder="Reply to ' + esc(String(author.name || '').split(' ')[0]) + '…">' +
                '<button class="btn btn-primary btn-sm" id="storyReplySend">Send</button>' +
              '</div>' +
            '</div>') +
        '</div>';

      document.getElementById('storyClose').addEventListener('click', closeViewer);
      document.getElementById('storyPrev').addEventListener('click', prev);
      document.getElementById('storyNext').addEventListener('click', next);

      var delBtn = document.getElementById('storyDel');
      if (delBtn) {
        delBtn.addEventListener('click', function () {
          ui.confirmDlg('Delete this story?').then(function (ok) {
            if (!ok) return;
            S.deleteMyStory(st.id);
            ui.toast('Story deleted.');
            render();
          });
        });
      }

      var sendBtn = document.getElementById('storyReplySend');
      if (sendBtn) {
        sendBtn.addEventListener('click', function () {
          var input = document.getElementById('storyReply');
          var text = input ? input.value.trim() : '';
          if (!text) { ui.toast('Write a reply first.'); return; }
          var res = S.getOrCreateThread(authorId);
          if (res && res.thread) {
            S.setDraft(res.thread.id, 'Re your story: ' + text);
            PC.router.go('/chat/' + res.thread.id);
          } else {
            ui.toast('Couldn\'t open chat right now');
          }
        });
      }

      storyTimer = setTimeout(next, STORY_MS);
    }

    if (!authorId || !fetchStories().length) {
      el.innerHTML = '<div class="empty">' +
        '<div class="page-title">No stories</div>' +
        '<p>This person has no active stories right now.</p>' +
        '<button class="btn btn-primary btn-sm" id="storyBack">Back to Discover</button>' +
      '</div>';
      document.getElementById('storyBack').addEventListener('click', function () {
        PC.router.go('/discover');
      });
      return;
    }
    render();
  };
})();
