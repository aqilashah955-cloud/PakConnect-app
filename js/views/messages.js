window.PC = window.PC || {};
/* PakConnect — messaging views: thread list + single chat. */

/* EXT-POINT: typing-indicator — show "…is typing" when the other side types. */
/* EXT-POINT: message-reactions — emoji reactions on individual messages. */
/* EXT-POINT: message-attachments — photo/voice note attachments (no large binaries yet). */
/* EXT-POINT: read-receipts — read timestamps per message instead of demo auto-reply. */

(function () {
  'use strict';
  var U = PC.util, S = PC.store, ui = PC.ui;

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
    document.getElementById('newMsgBtn').addEventListener('click', openStarterModal);

    var list = document.createElement('div');
    threads.forEach(function (t) {
      var row = document.createElement('div');
      row.className = 'card list-row';
      row.style.cursor = 'pointer';
      var last = t.messages && t.messages.length ? t.messages[t.messages.length - 1] : null;
      var snippet = last ? last.text : '';
      if (snippet.length > 60) snippet = snippet.slice(0, 60) + '…';
      var me = S.me();
      var unread = last && me && last.author !== me.id;
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

  /* Single chat → /chat/:id */
  PC.views.chat = function (el, params) {
    var thread = S.getThread(params && params.id);
    if (!thread) { ui.toast('Conversation not found.'); PC.router.go('/messages'); return; }
    var me = S.me();
    var other = S.getUser(thread.userId);
    if (!other) { ui.toast('This conversation is no longer available.'); PC.router.go('/messages'); return; }
    var blocked = S.isBlocked(other.id);

    var wrap = document.createElement('div');
    var head = document.createElement('div');
    head.className = 'card';
    head.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<a href="#/messages" style="color:var(--muted,#666);text-decoration:none">&larr;</a>' +
        U.avatarHTML(other, 'md') +
        '<div style="flex:1"><div style="font-weight:600">' + U.esc(other.name) + '</div>' +
        '<div style="font-size:.85em;color:var(--muted,#666)">' + (other.mode ? '<span class="chip">' + U.esc(other.mode) + '</span>' : '') + '</div></div>' +
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

    var msgs = document.createElement('div');
    msgs.style.display = 'flex';
    msgs.style.flexDirection = 'column';
    msgs.style.gap = '8px';
    msgs.style.margin = '8px 0';
    (thread.messages || []).forEach(function (m) {
      var b = document.createElement('div');
      b.className = 'bubble ' + (m.author === me.id ? 'bubble-me' : 'bubble-them');
      b.textContent = m.text;
      b.title = m.ts ? U.timeAgo(m.ts) : '';
      msgs.appendChild(b);
    });
    wrap.appendChild(msgs);

    var inputRow = document.createElement('div');
    inputRow.style.display = 'flex';
    inputRow.style.gap = '8px';
    inputRow.innerHTML =
      '<input class="input" id="chatInput" placeholder="Write a message…" autocomplete="off">' +
      '<button class="btn btn-primary" id="sendBtn">Send</button>';
    wrap.appendChild(inputRow);
    el.appendChild(wrap);

    function setInput(v) { document.getElementById('chatInput').value = v; }
    function send() {
      var v = document.getElementById('chatInput').value.trim();
      if (!v) return;
      S.sendMessage(thread.id, v);
      document.getElementById('chatInput').value = '';
      PC.router.refresh();
    }
    document.getElementById('sendBtn').addEventListener('click', send);
    document.getElementById('chatInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') send();
    });
    var draft = S.consumeDraft(thread.id);
    if (draft) setInput(draft);

    msgs.scrollTop = msgs.scrollHeight;
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
