window.PC = window.PC || {};
PC.views = PC.views || {};
/* PakConnect — messaging views: thread list + single chat (chat realism: presence,
   timestamps, read receipts, voice notes, emoji reactions, typing indicator). */

/* IMPLEMENTED: typing-indicator — "… typing" bubble while the demo auto-reply is due. */
/* IMPLEMENTED: message-reactions — emoji reactions on individual messages. */
/* EXT-POINT: message-attachments — photo attachments (voice notes implemented). */
/* EXT-POINT: read-receipts — read timestamps per message instead of demo heuristic. */

(function () {
  'use strict';
  var U = PC.util, S = PC.store, ui = PC.ui;

  /* ---------- small shared helpers ---------- */

  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function injectStyle() {
    if (document.getElementById('pc-chatx-style')) return;
    var st = document.createElement('style');
    st.id = 'pc-chatx-style';
    st.textContent =
      '.pc-pulse{display:inline-block;width:10px;height:10px;border-radius:50%;background:#e5484d;animation:pcPulse 1s ease-in-out infinite}' +
      '@keyframes pcPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.45}}' +
      '.pc-pres-on{color:#2ea043;font-size:.8em}' +
      '.pc-pres-off{color:#b0b0b0;font-size:.8em}' +
      '.pc-msgrow{display:flex;justify-content:flex-start;margin:2px 0}' +
      '.pc-msgrow.mine{justify-content:flex-end}' +
      '.pc-msgmeta{font-size:.72em;color:var(--muted,#888);margin-top:2px;display:flex;align-items:center;gap:6px}' +
      '.pc-msgrow.mine .pc-msgmeta{justify-content:flex-end}' +
      '.pc-read{color:#2f7cf6;font-weight:700}' +
      '.pc-sent{color:#999}' +
      '.pc-voice{display:flex;align-items:center;gap:8px;min-width:170px;max-width:230px}' +
      '.pc-play{border:none;background:rgba(0,0,0,.12);border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:1em;line-height:1;flex-shrink:0}' +
      '.pc-track{flex:1;height:6px;background:rgba(0,0,0,.18);border-radius:3px;overflow:hidden}' +
      '.pc-fill{height:100%;width:0;background:#2f7cf6;border-radius:3px}' +
      '.pc-dur{font-size:.8em;white-space:nowrap;font-variant-numeric:tabular-nums}' +
      '.pc-rchips{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px}' +
      '.pc-msgrow.mine .pc-rchips{justify-content:flex-end}' +
      '.pc-rchip{border:1px solid #ddd;border-radius:12px;background:#fff;padding:1px 8px;font-size:.8em;cursor:pointer}' +
      '.pc-rchip-mine{border-color:#2f7cf6;background:#e8f1ff}' +
      '.tdot{animation:pcBlink 1.2s infinite;display:inline-block}' +
      '@keyframes pcBlink{0%,100%{opacity:.25}50%{opacity:1}}';
    document.head.appendChild(st);
  }

  function myIds(me) {
    var ids = ['me'];
    if (me && me.id && ids.indexOf(me.id) === -1) ids.push(me.id);
    return ids;
  }

  function reactedByMe(users, me) {
    var ids = myIds(me);
    for (var i = 0; i < ids.length; i++) {
      if (users.indexOf(ids[i]) !== -1) return true;
    }
    return false;
  }

  /* Store-API guards: these land with the store agent's build-2 batch;
     keep the UI from crashing if they are missing. */
  function safePresence(user) {
    if (typeof S.presenceOf === 'function') {
      try { return S.presenceOf(user) || null; } catch (e) { return null; }
    }
    return null;
  }
  function safeMarkRead(threadId) {
    if (typeof S.markThreadRead === 'function') {
      try { S.markThreadRead(threadId); } catch (e) {}
    }
  }
  function safeReact(threadId, msgId, emoji) {
    if (typeof S.reactToMessage === 'function') {
      try { S.reactToMessage(threadId, msgId, emoji); return true; } catch (e) { return false; }
    }
    ui.toast('Reactions are not available yet.');
    return false;
  }
  function safeSendVoice(threadId, durSec, url) {
    if (typeof S.sendVoiceNote === 'function') {
      try { return S.sendVoiceNote(threadId, durSec, url); } catch (e) { return null; }
    }
    ui.toast('Voice notes are not available yet.');
    return null;
  }

  function openReportModal(targetId) {
    var body =
      '<div class="section-title">Report ' + U.esc((S.getUser(targetId) || {}).name || 'user') + '</div>' +
      '<div class="field"><label class="label">Reason</label>' +
      '<select class="select" id="repReason">' +
        '<option>Spam or scam</option>' +
        '<option>Harassment or hate speech</option>' +
        '<option>Inappropriate content</option>' +
        '<option>Asking for money</option>' +
        '<option>Fake profile</option>' +
        '<option>Other</option>' +
      '</select></div>' +
      '<div class="field"><label class="label">Details (optional)</label>' +
      '<textarea class="textarea" id="repDetail" rows="3" placeholder="Anything else we should know?"></textarea></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">' +
        '<button class="btn btn-ghost" id="repCancel">Cancel</button>' +
        '<button class="btn btn-danger" id="repSend">Send report</button>' +
      '</div>';
    var close = ui.modal(body);
    document.getElementById('repCancel').addEventListener('click', close);
    document.getElementById('repSend').addEventListener('click', function () {
      S.fileReport(targetId, document.getElementById('repReason').value,
        document.getElementById('repDetail').value.trim());
      close();
      ui.toast('Report sent. We\'ll review it soon.');
    });
  }

  function openStarterModal() {
    var cons = S.connectionLists().connected;
    var body =
      '<div class="section-title">Start a conversation</div>' +
      '<p style="color:var(--muted,#666)">Pick a starter, then choose who to send it to.</p>' +
      '<div class="field"><label class="label">Conversation starter</label>' +
      '<select class="select" id="stPick">' +
        (PC.seed.starters || []).map(function (s, i) {
          var label = typeof s === 'string' ? s : (s.text || s.title || JSON.stringify(s));
          return '<option value="' + i + '">' + U.esc(label) + '</option>';
        }).join('') +
      '</select></div>' +
      '<div class="field"><label class="label">Send to</label>' +
      '<select class="select" id="stUser">' +
        (cons.length
          ? cons.map(function (u) { return '<option value="' + U.esc(u.id) + '">' + U.esc(u.name) + '</option>'; }).join('')
          : '<option value="">No connections yet — connect with someone first</option>') +
      '</select></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">' +
        '<button class="btn btn-ghost" id="stCancel">Cancel</button>' +
        '<button class="btn btn-primary" id="stSend">Send</button>' +
      '</div>';
    var close = ui.modal(body);
    document.getElementById('stCancel').addEventListener('click', close);
    document.getElementById('stSend').addEventListener('click', function () {
      var uid = document.getElementById('stUser').value;
      if (!uid) { ui.toast('Connect with someone first.'); return; }
      var idx = +document.getElementById('stPick').value;
      var s = (PC.seed.starters || [])[idx];
      var text = typeof s === 'string' ? s : (s.text || s.title || '');
      var r = S.getOrCreateThread(uid);
      if (r.error) { ui.toast('You can\'t message this person right now.'); return; }
      S.sendMessage(r.thread.id, text);
      close();
      PC.router.go('/chat/' + r.thread.id);
    });
  }

  /* Thread list → /messages */
  PC.views.messages = function (el, params) {
    injectStyle();
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="page-title">Messages</div>' +
      '<div class="banner-warn">⚠️ Never send money to strangers. PakConnect will never ask for your payment details — anyone who does is a scammer. Report them immediately.</div>';

    var threads = S.threads();
    if (!threads.length) {
      var empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerHTML =
        '<div style="font-size:2em">💬</div>' +
        '<p>No conversations yet.</p>' +
        '<p style="color:var(--muted,#666)">Pick a starter below and send it to one of your connections — or say hi from someone\'s profile or a discussion.</p>';
      var chips = document.createElement('div');
      chips.style.display = 'flex';
      chips.style.flexWrap = 'wrap';
      chips.style.gap = '8px';
      chips.style.justifyContent = 'center';
      chips.style.marginTop = '10px';
      (PC.seed.starters || []).slice(0, 6).forEach(function (s) {
        var label = typeof s === 'string' ? s : (s.text || s.title || '');
        var c = document.createElement('button');
        c.className = 'chip';
        c.textContent = label;
        c.addEventListener('click', openStarterModal);
        chips.appendChild(c);
      });
      empty.appendChild(chips);
      wrap.appendChild(empty);
      el.appendChild(wrap);
      return;
    }

    var newBtn = document.createElement('div');
    newBtn.style.margin = '8px 0';
    newBtn.innerHTML = '<button class="btn btn-ghost btn-sm" id="newMsgBtn">✏️ New message</button>';
    wrap.appendChild(newBtn);
    newBtn.querySelector('#newMsgBtn').addEventListener('click', openStarterModal);

    var list = document.createElement('div');
    threads.forEach(function (t) {
      var row = document.createElement('div');
      row.className = 'card list-row';
      row.style.cursor = 'pointer';
      var last = t.messages && t.messages.length ? t.messages[t.messages.length - 1] : null;
      var snippet = '';
      if (last) {
        if (last.kind === 'voice') snippet = '🎤 ' + (last.text ? last.text + ' ' : '') + '(' + fmtDur(last.dur) + ' voice note)';
        else snippet = last.text || '';
      }
      if (snippet.length > 60) snippet = snippet.slice(0, 60) + '…';
      var unread = !!(last && last.from && last.from !== 'me');
      row.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;flex:1">' +
          U.avatarHTML(t.user, 'md') +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:600;display:flex;align-items:center;gap:6px">' +
              U.esc(t.user.name) +
              (unread ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2f7cf6" title="Unread"></span>' : '') +
            '</div>' +
            '<div style="color:var(--muted,#666);font-size:.9em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + U.esc(snippet) + '</div>' +
          '</div>' +
          '<div style="font-size:.8em;color:var(--muted,#666)">' + (t.lastTs ? U.timeAgo(t.lastTs) : '') + '</div>' +
        '</div>';
      row.addEventListener('click', function () { PC.router.go('/chat/' + t.id); });
      list.appendChild(row);
    });
    wrap.appendChild(list);
    el.appendChild(wrap);
  };

  /* ---------- voice playback (one at a time, stopped on re-render) ---------- */
  var activeVoice = null; /* {key, audio, timer, btn, fill} */

  function resetVoiceUI(p) {
    if (p.btn) p.btn.textContent = '▶';
    if (p.fill) p.fill.style.width = '0%';
  }

  function stopVoice() {
    if (!activeVoice) return;
    if (activeVoice.timer) clearInterval(activeVoice.timer);
    if (activeVoice.audio) { try { activeVoice.audio.pause(); } catch (e) {} }
    resetVoiceUI(activeVoice);
    activeVoice = null;
  }

  function playVoice(m, btn, fill) {
    if (activeVoice && activeVoice.key === m.id) { stopVoice(); return; }
    stopVoice();
    btn.textContent = '⏸';
    if (m.audioUrl) {
      var a = new Audio(m.audioUrl);
      activeVoice = { key: m.id, audio: a, btn: btn, fill: fill };
      a.addEventListener('timeupdate', function () {
        if (a.duration && fill) fill.style.width = Math.min(100, (a.currentTime / a.duration) * 100) + '%';
      });
      a.addEventListener('ended', function () { stopVoice(); });
      a.addEventListener('error', function () { stopVoice(); ui.toast('Could not play this voice note.'); });
      try { a.play(); } catch (e) { stopVoice(); }
    } else {
      /* Simulated voice note (no audio): animate progress over `dur` seconds. */
      var dur = Math.max(1, Math.round(m.dur || 3));
      var start = Date.now();
      var parts = { key: m.id, btn: btn, fill: fill, timer: 0 };
      activeVoice = parts;
      parts.timer = setInterval(function () {
        var p = Math.min(1, (Date.now() - start) / 1000 / dur);
        if (fill) fill.style.width = (p * 100) + '%';
        if (p >= 1) stopVoice();
      }, 100);
    }
  }

  /* ---------- reaction picker (single floating element) ---------- */
  var PICKER_EMOJIS = ['❤️', '😂', '😮', '😢', '👍'];
  var pickerEl = null, pickerFor = null;

  function hidePicker() {
    if (pickerEl) pickerEl.style.display = 'none';
    pickerFor = null;
  }

  function ensurePicker(thread, onReact) {
    if (pickerEl) return pickerEl;
    pickerEl = document.createElement('div');
    pickerEl.style.cssText = 'position:fixed;z-index:9999;display:none;background:#fff;border:1px solid #ddd;' +
      'border-radius:20px;padding:6px 8px;box-shadow:0 4px 16px rgba(0,0,0,.18)';
    PICKER_EMOJIS.forEach(function (e) {
      var b = document.createElement('button');
      b.textContent = e;
      b.style.cssText = 'border:none;background:none;font-size:1.3em;cursor:pointer;padding:2px 4px';
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var target = pickerFor;
        hidePicker();
        if (target && safeReact(thread.id, target, e)) PC.router.refresh();
      });
      pickerEl.appendChild(b);
    });
    document.body.appendChild(pickerEl);
    document.addEventListener('click', function (ev) {
      if (pickerEl && pickerEl.style.display !== 'none' && !pickerEl.contains(ev.target)) hidePicker();
    }, true);
    return pickerEl;
  }

  function showPicker(thread, msgId, anchorRect) {
    var p = ensurePicker(thread);
    pickerFor = msgId;
    p.style.display = 'block';
    var w = 210, h = 46;
    var x = Math.min(Math.max(8, anchorRect.left), window.innerWidth - w - 8);
    var y = anchorRect.top - h - 6;
    if (y < 8) y = anchorRect.bottom + 6;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
  }

  /* Single chat → /chat/:id */
  PC.views.chat = function (el, params) {
    injectStyle();
    stopVoice(); /* a re-render kills playback */
    hidePicker();
    var thread = S.getThread(params && params.id);
    if (!thread) { ui.toast('Conversation not found.'); PC.router.go('/messages'); return; }
    var me = S.me();
    var other = S.getUser(thread.userId);
    if (!other) { ui.toast('This conversation is no longer available.'); PC.router.go('/messages'); return; }
    var blocked = S.isBlocked(other.id);

    safeMarkRead(thread.id);

    var wrap = document.createElement('div');

    /* Header with presence */
    var pres = safePresence(other);
    var presHTML;
    if (pres && pres.online) {
      presHTML = '<span class="pc-pres-on">●</span> Online';
    } else {
      var ago = (pres && pres.label != null)
        ? (typeof pres.label === 'number' ? U.timeAgo(pres.label) : U.esc(String(pres.label)))
        : 'recently';
      presHTML = '<span class="pc-pres-off">●</span> Active ' + ago;
    }
    var head = document.createElement('div');
    head.className = 'card';
    head.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<a href="#/messages" style="color:var(--muted,#666);text-decoration:none">&larr;</a>' +
        U.avatarHTML(other, 'md') +
        '<div style="flex:1;min-width:0"><div style="font-weight:600">' + U.esc(other.name) + '</div>' +
        '<div style="font-size:.85em;color:var(--muted,#666)">' + presHTML +
        (other.mode ? ' · <span class="chip">' + U.esc(other.mode) + '</span>' : '') + '</div></div>' +
        '<div style="display:flex;gap:6px">' +
          '<button class="btn btn-ghost btn-sm" id="blockBtn">⛔ Block</button>' +
          '<button class="btn btn-ghost btn-sm" id="reportBtn">🚩 Report</button>' +
        '</div>' +
      '</div>';
    wrap.appendChild(head);

    if (blocked) {
      var notice = document.createElement('div');
      notice.className = 'card';
      notice.style.marginTop = '10px';
      notice.innerHTML =
        '<div class="section-title">⛔ Blocked</div>' +
        '<p style="color:var(--muted,#666)">You blocked ' + U.esc(other.name) + '. You won\'t receive messages from them.</p>' +
        '<button class="btn btn-primary btn-sm" id="unblockBtn">Unblock</button>';
      wrap.appendChild(notice);
      el.appendChild(wrap);
      document.getElementById('unblockBtn').addEventListener('click', function () {
        S.unblockUser(other.id);
        ui.toast('Unblocked.');
        PC.router.refresh();
      });
      wireHeadButtons();
      return;
    }

    /* Discussion-based prompt chip when shared topics exist */
    var myFav = (me && me.favTopics) || [];
    var theirFav = (other && other.favTopics) || [];
    var shared = myFav.filter(function (t) { return theirFav.indexOf(t) !== -1; });
    if (shared.length) {
      var topicTitle = (function () {
        var topics = S.topics(), found = null;
        for (var i = 0; i < topics.length; i++) {
          if (topics[i].id === shared[0]) { found = topics[i]; break; }
        }
        return found ? found.title : shared[0];
      })();
      var chipRow = document.createElement('div');
      chipRow.style.margin = '10px 0';
      chipRow.innerHTML = '<button class="chip" id="topicChip">💬 Talk about ' + U.esc(topicTitle) + '</button>';
      wrap.appendChild(chipRow);
      chipRow.querySelector('#topicChip').addEventListener('click', function () {
        setInput('You\'re also into ' + topicTitle + '! What\'s your take on it?');
      });
    }

    /* Suggestion chips from seed reply ideas */
    var sug = document.createElement('div');
    sug.style.display = 'flex';
    sug.style.flexWrap = 'wrap';
    sug.style.gap = '8px';
    sug.style.margin = '4px 0 10px';
    (PC.seed.replyIdeas || []).slice(0, 5).forEach(function (r) {
      var label = typeof r === 'string' ? r : (r.text || r.title || '');
      var c = document.createElement('button');
      c.className = 'chip';
      c.textContent = label;
      c.addEventListener('click', function () { setInput(label); });
      sug.appendChild(c);
    });
    wrap.appendChild(sug);

    /* Messages */
    var msgsArr = thread.messages || [];
    /* Read heuristic (demo): my message counts as read once the other side sent anything after it. */
    var myReadAfter = {};
    (function () {
      var lastOtherIdx = -1;
      for (var i = 0; i < msgsArr.length; i++) {
        if (msgsArr[i].from !== 'me') lastOtherIdx = i;
      }
      for (var j = 0; j < msgsArr.length; j++) {
        if (msgsArr[j].from === 'me') myReadAfter[msgsArr[j].id] = lastOtherIdx > j;
      }
    })();

    var msgs = document.createElement('div');
    msgs.id = 'chatMsgs';
    msgs.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin:8px 0;max-height:62vh;overflow-y:auto;padding:4px 2px';
    msgsArr.forEach(function (m) {
      var mine = m.from === 'me';
      var row = document.createElement('div');
      row.className = 'pc-msgrow' + (mine ? ' mine' : '');
      var bubble = document.createElement('div');
      bubble.className = 'bubble ' + (mine ? 'bubble-me' : 'bubble-them');
      bubble.style.cursor = 'pointer';
      bubble.title = m.ts ? U.timeAgo(m.ts) : '';
      if (m.kind === 'voice') {
        var vwrap = document.createElement('div');
        vwrap.className = 'pc-voice';
        var play = document.createElement('button');
        play.className = 'pc-play';
        play.textContent = '▶';
        play.setAttribute('aria-label', 'Play voice note');
        var track = document.createElement('div');
        track.className = 'pc-track';
        var fill = document.createElement('div');
        fill.className = 'pc-fill';
        track.appendChild(fill);
        var dur = document.createElement('span');
        dur.className = 'pc-dur';
        dur.textContent = fmtDur(m.dur);
        vwrap.appendChild(play);
        vwrap.appendChild(track);
        vwrap.appendChild(dur);
        bubble.appendChild(vwrap);
        if (m.text) {
          var cap = document.createElement('div');
          cap.style.fontSize = '.85em';
          cap.style.marginTop = '4px';
          cap.textContent = m.text;
          bubble.appendChild(cap);
        }
        play.addEventListener('click', function (ev) {
          ev.stopPropagation();
          playVoice(m, play, fill);
        });
      } else {
        bubble.textContent = m.text || '';
      }
      /* Tap bubble → reaction picker (inner buttons stop propagation). */
      bubble.addEventListener('click', function () {
        showPicker(thread, m.id, bubble.getBoundingClientRect());
      });
      var body = document.createElement('div');
      body.appendChild(bubble);
      /* Reaction chips */
      var reacts = m.reactions || {};
      var keys = Object.keys(reacts);
      if (keys.length) {
        var chipsRow = document.createElement('div');
        chipsRow.className = 'pc-rchips';
        keys.forEach(function (emoji) {
          var users = reacts[emoji] || [];
          if (!users.length) return;
          var chip = document.createElement('button');
          chip.className = 'pc-rchip' + (reactedByMe(users, me) ? ' pc-rchip-mine' : '');
          chip.textContent = emoji + ' ' + users.length;
          chip.addEventListener('click', function (ev) {
            ev.stopPropagation();
            if (safeReact(thread.id, m.id, emoji)) PC.router.refresh();
          });
          chipsRow.appendChild(chip);
        });
        body.appendChild(chipsRow);
      }
      /* Timestamp + read receipt */
      var meta = document.createElement('div');
      meta.className = 'pc-msgmeta';
      var parts = [];
      if (m.ts) parts.push(U.esc(U.timeAgo(m.ts)));
      if (mine) {
        parts.push(myReadAfter[m.id]
          ? '<span class="pc-read">✓✓</span>'
          : '<span class="pc-sent">✓</span>');
      }
      meta.innerHTML = parts.join(' · ');
      body.appendChild(meta);
      row.appendChild(body);
      msgs.appendChild(row);
    });
    wrap.appendChild(msgs);

    /* Input row: mic + text + send */
    var inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex;gap:8px;align-items:center';
    inputRow.innerHTML =
      '<button class="btn btn-ghost" id="micBtn" aria-label="Record voice note" title="Record voice note" style="font-size:1.2em;padding:8px 12px">🎤</button>' +
      '<input class="input" id="chatInput" placeholder="Write a message…" autocomplete="off" style="flex:1">' +
      '<button class="btn btn-primary" id="sendBtn">Send</button>';
    wrap.appendChild(inputRow);
    el.appendChild(wrap);

    function setInput(v) { document.getElementById('chatInput').value = v; }
    function scrollBottom() {
      var box = document.getElementById('chatMsgs');
      if (box) box.scrollTop = box.scrollHeight;
    }

    /* Typing indicator: show until the auto-reply's pc:message event (3s fallback). */
    function showTyping() {
      var box = document.getElementById('chatMsgs');
      if (!box) return;
      var td = document.createElement('div');
      td.id = 'typingInd';
      td.className = 'pc-msgrow';
      td.innerHTML = '<div class="bubble bubble-them"><span class="tdot">●</span> <span class="tdot" style="animation-delay:.2s">●</span> <span class="tdot" style="animation-delay:.4s">●</span> typing</div>';
      box.appendChild(td);
      box.scrollTop = box.scrollHeight;
      var done = false;
      function rm() {
        if (done) return;
        done = true;
        var e = document.getElementById('typingInd');
        if (e && e.parentNode) e.parentNode.removeChild(e);
      }
      var onMsg = function () { rm(); };
      window.addEventListener('pc:message', onMsg, { once: true });
      setTimeout(function () { window.removeEventListener('pc:message', onMsg); rm(); }, 3000);
    }

    function send() {
      var v = document.getElementById('chatInput').value.trim();
      if (!v) return;
      S.sendMessage(thread.id, v);
      document.getElementById('chatInput').value = '';
      PC.router.refresh();
      showTyping();
    }
    document.getElementById('sendBtn').addEventListener('click', send);
    document.getElementById('chatInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') send();
    });

    /* Voice note recording */
    var recSession = null;
    document.getElementById('micBtn').addEventListener('click', function () {
      if (recSession) return;
      var recUI = document.createElement('div');
      recUI.className = 'card';
      recUI.style.cssText = 'display:flex;align-items:center;gap:10px;margin:0 0 8px';
      recUI.innerHTML =
        '<span class="pc-pulse"></span>' +
        '<span id="recLabel" style="font-weight:600">● Recording…</span>' +
        '<span id="recTimer" style="font-variant-numeric:tabular-nums;color:var(--muted,#666)">0:00</span>' +
        '<button class="btn btn-danger btn-sm" id="recStop" style="margin-left:auto">Stop</button>';
      inputRow.parentNode.insertBefore(recUI, inputRow);
      var timerEl = document.getElementById('recTimer');
      var stopBtn = document.getElementById('recStop');
      var t0 = Date.now();
      var tick = setInterval(function () {
        if (timerEl) timerEl.textContent = fmtDur((Date.now() - t0) / 1000);
      }, 250);
      recSession = { active: true };
      function finish(durSec, blobUrl) {
        clearInterval(tick);
        recSession = null;
        if (recUI.parentNode) recUI.parentNode.removeChild(recUI);
        var msg = safeSendVoice(thread.id, Math.max(1, Math.round(durSec)), blobUrl);
        if (msg) PC.router.refresh();
      }
      function simulatedMode() {
        var lbl = document.getElementById('recLabel');
        if (lbl) lbl.textContent = '● Recording (demo)';
        ui.toast('Demo mode: mic unavailable — this sends a simulated voice note.');
        stopBtn.onclick = function () {
          if (!recSession || !recSession.active) return;
          recSession.active = false;
          finish((Date.now() - t0) / 1000, null);
        };
      }
      if (window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          if (!recSession || !recSession.active) {
            stream.getTracks().forEach(function (tr) { tr.stop(); });
            return;
          }
          var chunks = [];
          var rec;
          try { rec = new MediaRecorder(stream); }
          catch (e) {
            stream.getTracks().forEach(function (tr) { tr.stop(); });
            simulatedMode();
            return;
          }
          rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = function () {
            stream.getTracks().forEach(function (tr) { tr.stop(); });
            var blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
            finish((Date.now() - t0) / 1000, URL.createObjectURL(blob));
          };
          try { rec.start(); } catch (e) { simulatedMode(); return; }
          stopBtn.onclick = function () {
            if (!recSession || !recSession.active) return;
            recSession.active = false;
            try { rec.stop(); } catch (e) { finish((Date.now() - t0) / 1000, null); }
          };
        }, function () { simulatedMode(); });
      } else {
        simulatedMode();
      }
    });

    var draft = S.consumeDraft(thread.id);
    if (draft) setInput(draft);

    scrollBottom();
    function wireHeadButtons() {
      document.getElementById('blockBtn').addEventListener('click', function () {
        ui.confirmDlg('Block ' + other.name + '? They won\'t be able to message you.').then(function (ok) {
          if (ok) { S.blockUser(other.id); ui.toast('Blocked.'); PC.router.go('/messages'); }
        });
      });
      document.getElementById('reportBtn').addEventListener('click', function () {
        openReportModal(other.id);
      });
    }
    wireHeadButtons();
  };
})();
