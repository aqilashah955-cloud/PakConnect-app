window.PC = window.PC || {};
PC.views = PC.views || {};
/* PakConnect — Mehfil: live audio discussion rooms (simulated demo).
   Routes wired by another agent: 'mehfil' (#/mehfil), 'mehfilRoom' (#/mehfil/:id). */

/* EXT-POINT: webrtc-audio — replace simulated room with real WebRTC audio when backend exists */

(function () {
  'use strict';
  var U = PC.util, S = PC.store, ui = PC.ui;

  function topicTitle(topicId) {
    try {
      var ts = S.topics ? S.topics() : [];
      for (var i = 0; i < ts.length; i++) {
        if (String(ts[i].id) === String(topicId)) return ts[i].title;
      }
    } catch (e) { /* topics not ready — fall back to id */ }
    return topicId ? String(topicId) : 'Open';
  }

  function userOf(id) {
    try { return S.getUser(id); } catch (e) { return null; }
  }

  function speakerRow(user, isHost, raised) {
    var html =
      '<div class="list-row" style="align-items:center">' +
        U.avatarHTML(user, 'md') +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:600">' + U.esc(user ? user.name : 'Guest') + '</div>' +
          '<div style="font-size:.82em;color:var(--muted,#666)">' +
            (isHost ? '🎤 Host' : '🎤 Speaker') +
            (raised ? ' · <span class="badge badge-demo">demo</span>' : '') +
          '</div>' +
        '</div>' +
        '<span style="font-size:1.3em" title="Speaking">🎙️</span>' +
      '</div>';
    return html;
  }

  /* ---------- Listing: #/mehfil ---------- */

  PC.views.mehfil = function (el, params) {
    var rooms = S.mehfilRooms();
    var live = rooms.filter(function (r) { return r.live; });
    var upcoming = rooms.filter(function (r) { return !r.live; });

    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="page-title">🎙️ Mehfil — live audio discussions</div>' +
      '<p style="color:var(--muted,#666);margin-top:0">Pull up a chair. Live voice conversations with Pakistanis around the world. <span class="badge badge-demo">Demo</span> <span style="font-size:.85em">rooms are simulated.</span></p>' +
      '<div class="tabs">' +
        '<button class="tab tab-on" data-tab="live">🔴 Live now' + (live.length ? ' (' + live.length + ')' : '') + '</button>' +
        '<button class="tab" data-tab="upcoming">📅 Upcoming' + (upcoming.length ? ' (' + upcoming.length + ')' : '') + '</button>' +
      '</div>' +
      '<div data-live></div>' +
      '<div data-upcoming style="display:none"></div>';

    var liveBox = wrap.querySelector('[data-live]');
    var upBox = wrap.querySelector('[data-upcoming]');

    if (!live.length) {
      liveBox.innerHTML = '<div class="empty">No rooms are live right now.<br>Check the upcoming schedule or come back later.</div>';
    } else {
      live.forEach(function (room) { liveBox.appendChild(liveCard(room)); });
    }

    if (!upcoming.length) {
      upBox.innerHTML = '<div class="empty">No upcoming rooms scheduled yet.</div>';
    } else {
      upcoming.forEach(function (room) { upBox.appendChild(upcomingCard(room)); });
    }

    var tabs = wrap.querySelectorAll('.tab');
    Array.prototype.forEach.call(tabs, function (t) {
      t.addEventListener('click', function () {
        Array.prototype.forEach.call(tabs, function (x) { x.classList.remove('tab-on'); });
        t.classList.add('tab-on');
        var isLive = t.getAttribute('data-tab') === 'live';
        liveBox.style.display = isLive ? '' : 'none';
        upBox.style.display = isLive ? 'none' : '';
      });
    });

    el.appendChild(wrap);
  };

  function liveCard(room) {
    var card = document.createElement('div');
    card.className = 'card';
    var host = userOf(room.hostId);
    var hostName = room.hostName || (host && host.name) || 'Host';
    var spkAvatars = room.speakers.slice(0, 4).map(function (sid) {
      return U.avatarHTML(userOf(sid), 'sm');
    }).join('');
    card.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
        '<span class="live-dot" aria-hidden="true"></span>' +
        '<b style="color:#c0392b">LIVE</b>' +
        '<span class="badge badge-demo">demo</span>' +
        '<span class="chip">' + U.esc(topicTitle(room.topicId)) + '</span>' +
      '</div>' +
      '<div style="font-weight:600;font-size:1.05em">' + U.esc(room.title) + '</div>' +
      (room.desc ? '<div style="color:var(--muted,#666);margin:6px 0">' + U.esc(room.desc) + '</div>' : '') +
      '<div style="display:flex;align-items:center;gap:6px;margin:8px 0">' + spkAvatars +
        '<span style="color:var(--muted,#666);font-size:.85em;margin-left:4px">👂 ' +
          U.esc(String(room.listeners != null ? room.listeners : 0) + ' listening · 🎤 ' + String(room.speakers.length) + ' speaking') +
        '</span>' +
      '</div>' +
      '<div style="font-size:.85em;color:var(--muted,#666);margin-bottom:10px">Hosted by ' + U.esc(hostName) + '</div>' +
      '<button class="btn btn-primary btn-sm" data-join>Join room</button>';
    card.querySelector('[data-join]').addEventListener('click', function () {
      S.joinMehfil(room.id);
      PC.router.go('/mehfil/' + encodeURIComponent(room.id));
    });
    return card;
  }

  function upcomingCard(room) {
    var card = document.createElement('div');
    card.className = 'card';
    var hostName = room.hostName || (userOf(room.hostId) || {}).name || 'Host';
    var when = room.startsAt ? new Date(room.startsAt).toLocaleString() : 'TBA';
    card.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
        '<span class="chip">📅 ' + U.esc(when) + '</span>' +
        '<span class="chip">' + U.esc(topicTitle(room.topicId)) + '</span>' +
        '<span class="badge badge-demo">demo</span>' +
      '</div>' +
      '<div style="font-weight:600;font-size:1.05em">' + U.esc(room.title) + '</div>' +
      (room.desc ? '<div style="color:var(--muted,#666);margin:6px 0">' + U.esc(room.desc) + '</div>' : '') +
      '<div style="font-size:.85em;color:var(--muted,#666);margin:8px 0">Hosted by ' + U.esc(hostName) +
        (room.listeners ? ' · 👂 ' + U.esc(String(room.listeners)) + ' waiting' : '') + '</div>' +
      '<button class="btn btn-ghost btn-sm" data-remind>🔔 Remind me</button>';
    card.querySelector('[data-remind]').addEventListener('click', function () {
      ui.toast("We'll remind you (demo).");
    });
    return card;
  }

  /* ---------- Room detail: #/mehfil/:id ---------- */

  PC.views.mehfilRoom = function (el, params) {
    var id = params && params.id;
    var room = id ? S.getMehfil(id) : null;
    if (!room) {
      el.innerHTML = '<div class="empty"><div class="page-title">Room not found</div>' +
        '<p>This Mehfil room may have ended.</p>' +
        '<button class="btn" id="mfBack">Back to Mehfil</button></div>';
      el.querySelector('#mfBack').addEventListener('click', function () { PC.router.go('/mehfil'); });
      return;
    }

    var host = userOf(room.hostId);
    var hostName = room.hostName || (host && host.name) || 'Host';
    var me = S.me();
    var meId = me && me.id;
    var handRaised = room.raisedHands && meId && room.raisedHands.indexOf(meId) >= 0;
    var joined = S.isJoined(room.id);
    var baseListeners = Number(room.listeners) || 0;
    var tick = 0; // total simulated drift, so count stays plausible

    var wrap = document.createElement('div');
    var head =
      '<a href="#/mehfil" style="color:var(--muted,#666);font-size:.9em">&larr; All rooms</a>' +
      '<div class="page-title" style="margin-top:6px">' + U.esc(room.title) + '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin:6px 0">';
    head += room.live
      ? '<span class="live-dot" aria-hidden="true"></span><b style="color:#c0392b">LIVE</b>'
      : '<span class="chip">📅 ' + U.esc(room.startsAt ? new Date(room.startsAt).toLocaleString() : 'Scheduled') + '</span>';
    head += '<span class="badge badge-demo">demo</span>' +
      '<span class="chip">' + U.esc(topicTitle(room.topicId)) + '</span></div>';
    if (room.desc) head += '<p style="color:var(--muted,#666);margin-top:0">' + U.esc(room.desc) + '</p>';
    wrap.innerHTML = head;

    // On stage
    var stage = document.createElement('div');
    stage.className = 'card';
    var stageHtml = '<div class="section-title">On stage</div>';
    stageHtml += speakerRow(host, true, false);
    room.speakers.forEach(function (sid) {
      if (host && String(sid) === String(host.id)) return;
      stageHtml += speakerRow(userOf(sid), false, false);
    });
    stageHtml += '<div style="margin-top:12px;display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:1.1em">👂</span>' +
      '<b data-listener-count>' + baseListeners + '</b>' +
      '<span style="color:var(--muted,#666);font-size:.85em">listening · <span class="badge badge-demo">demo ticker</span></span>' +
    '</div>';
    stage.innerHTML = stageHtml;
    wrap.appendChild(stage);

    // Listeners sample
    var lbox = document.createElement('div');
    lbox.className = 'card';
    var lisAvatars = room.speakers.slice(0, 6).map(function (sid) { return U.avatarHTML(userOf(sid), 'sm'); }).join('');
    lbox.innerHTML =
      '<div class="section-title">Listeners</div>' +
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' + lisAvatars +
        '<span style="color:var(--muted,#666);font-size:.85em">+ ' + U.esc(String(Math.max(0, baseListeners - 6))) + ' more (demo)</span>' +
      '</div>';
    wrap.appendChild(lbox);

    // Actions
    var act = document.createElement('div');
    act.className = 'card';
    act.innerHTML =
      '<div class="section-title">You</div>' +
      (joined ? '' : '<button class="btn btn-primary" data-joinroom style="margin-bottom:8px">Join room</button><br>') +
      '<button class="btn" data-hand>' + (handRaised ? '✋ Hand raised — you\'re on the speaker list' : '✋ Raise hand') + '</button> ' +
      '<button class="btn btn-ghost" data-leave>Leave room</button>' +
      '<p style="font-size:.82em;color:var(--muted,#666);margin-bottom:0">Room audio is simulated in this demo — no real microphone or speaker access is used.</p>';
    var joinBtn = act.querySelector('[data-joinroom]');
    if (joinBtn) {
      joinBtn.addEventListener('click', function () {
        S.joinMehfil(room.id);
        PC.router.refresh();
      });
    }
    act.querySelector('[data-hand]').addEventListener('click', function (ev) {
      S.toggleHand(room.id);
      ui.toast("You're on the speaker list (simulated).");
      PC.router.refresh();
      ev.preventDefault();
    });
    act.querySelector('[data-leave]').addEventListener('click', function () {
      S.leaveMehfil(room.id);
      PC.router.go('/mehfil');
    });
    wrap.appendChild(act);

    el.appendChild(wrap);

    // Live listener ticker: ±1-3 every 4s (demo). Cleaned up on hashchange.
    var countEl = wrap.querySelector('[data-listener-count]');
    if (countEl && room.live) {
      if (window._pcMehfilTicker) clearInterval(window._pcMehfilTicker);
      window._pcMehfilTicker = setInterval(function () {
        tick += Math.floor(Math.random() * 7) - 3; // -3..+3
        countEl.textContent = String(Math.max(0, baseListeners + tick));
      }, 4000);
      if (!window._pcMehfilTickerCleaner) {
        window._pcMehfilTickerCleaner = true;
        window.addEventListener('hashchange', function () {
          if (window._pcMehfilTicker) { clearInterval(window._pcMehfilTicker); window._pcMehfilTicker = null; }
        });
      }
    }
  };
})();
