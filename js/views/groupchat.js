window.PC = window.PC || {};
PC.views = PC.views || {};
/* PakConnect — country group chats (build 2). List cards + single group chat view.
   Used by the communities view via PC.views.groupchatListHTML(). */

(function () {
  'use strict';
  var U = PC.util, S = PC.store, ui = PC.ui;

  /* Store-API guards: group chat APIs land with the store agent's build-2 batch. */
  function gdata(country) {
    if (typeof S.groupChat === 'function') {
      try { return S.groupChat(country) || { messages: [], members: [] }; } catch (e) {}
    }
    return { messages: [], members: [] };
  }
  function memberOf(country) {
    if (typeof S.isGroupMember === 'function') {
      try { return !!S.isGroupMember(country); } catch (e) { return false; }
    }
    return false;
  }
  function baseCounts() {
    var out = {};
    if (typeof S.communityStats === 'function') {
      try {
        S.communityStats().forEach(function (r) { out[r.country] = r.count || 0; });
      } catch (e) {}
    }
    return out;
  }

  function memberName(authorId) {
    var me = (typeof S.me === 'function') ? S.me() : null;
    if (authorId === 'me' || (me && authorId === me.id)) return me ? me.name + ' (you)' : 'You';
    var u = (typeof S.getUser === 'function') ? S.getUser(authorId) : null;
    return u ? u.name : 'Member';
  }
  function memberAvatar(authorId) {
    var me = (typeof S.me === 'function') ? S.me() : null;
    var u = (authorId === 'me' || (me && authorId === me.id)) ? me
      : ((typeof S.getUser === 'function') ? S.getUser(authorId) : null);
    return u ? U.avatarHTML(u, 'sm') : '<div class="avatar sz-sm av-0">M</div>';
  }

  /* HTML string of the 9 country group-chat cards (called by communities view). */
  PC.views.groupchatListHTML = function () {
    var countries = U.COUNTRIES || [];
    var stats = baseCounts();
    var cards = countries.map(function (c) {
      var g = gdata(c);
      var live = (g.members && g.members.length) || 0;
      var total = live + (stats[c] || 0);
      var joined = memberOf(c);
      return '<div class="card">' +
        '<div class="section-title">💬 ' + U.esc(c) + '</div>' +
        '<div style="color:var(--muted,#666);font-size:.9em;margin-bottom:10px">' +
          U.esc(String(total)) + ' members · group chat' +
        '</div>' +
        '<a class="btn ' + (joined ? 'btn-ghost' : 'btn-primary') + ' btn-sm" ' +
          'href="#/gchat/' + encodeURIComponent(c) + '">' +
          (joined ? 'Open' : 'Join') + '</a>' +
      '</div>';
    }).join('');
    return '<div class="grid-2">' + cards + '</div>';
  };

  /* Single group chat → /gchat/:country */
  PC.views.gchat = function (el, params) {
    var country = params && params.country ? params.country : '';
    if (!country) { PC.router.go('/communities'); return; }
    var g = gdata(country);
    var joined = memberOf(country);
    var total = ((g.members && g.members.length) || 0) + (baseCounts()[country] || 0);

    var wrap = document.createElement('div');
    var head = document.createElement('div');
    head.className = 'card';
    head.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<a href="#/communities" style="color:var(--muted,#666);text-decoration:none">&larr;</a>' +
        '<div style="flex:1;min-width:0">' +
          '<div class="page-title" style="margin:0">' + U.esc(country) + ' Group</div>' +
          '<div style="font-size:.85em;color:var(--muted,#666)">' + U.esc(String(total)) + ' members</div>' +
        '</div>' +
        '<button class="btn ' + (joined ? 'btn-ghost' : 'btn-primary') + ' btn-sm" id="gJoinLeave">' +
          (joined ? 'Leave' : 'Join') + '</button>' +
      '</div>';
    wrap.appendChild(head);

    var note = document.createElement('div');
    note.style.cssText = 'font-size:.85em;color:var(--muted,#666);margin:8px 0';
    note.textContent = 'Demo group chat — be kind, no personal contact info.';
    wrap.appendChild(note);

    var msgs = document.createElement('div');
    msgs.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin:8px 0;max-height:62vh;overflow-y:auto;padding:4px 2px';
    (g.messages || []).forEach(function (m) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
      var text = m.text != null ? String(m.text) : '';
      row.innerHTML =
        memberAvatar(m.authorId) +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:.8em;color:var(--muted,#666)">' +
            U.esc(memberName(m.authorId)) +
            (m.ts ? ' · ' + U.esc(U.timeAgo(m.ts)) : '') +
          '</div>' +
          '<div class="bubble bubble-them" style="display:inline-block;margin-top:2px">' + U.esc(text) + '</div>' +
        '</div>';
      msgs.appendChild(row);
    });
    if (!(g.messages || []).length) {
      var empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerHTML = '<p>No messages yet — say salam and start the conversation! 👋</p>';
      msgs.appendChild(empty);
    }
    wrap.appendChild(msgs);
    el.appendChild(wrap);

    document.getElementById('gJoinLeave').addEventListener('click', function () {
      if (joined) {
        if (typeof S.leaveGroup === 'function') {
          try { S.leaveGroup(country); } catch (e) {}
          ui.toast('You left the ' + country + ' group.');
        } else { ui.toast('Leaving groups is not available yet.'); }
      } else {
        if (typeof S.joinGroup === 'function') {
          try { S.joinGroup(country); } catch (e) {}
          ui.toast('Welcome to the ' + country + ' group! 🎉');
        } else { ui.toast('Joining groups is not available yet.'); }
      }
      PC.router.refresh();
    });

    if (!joined) {
      var prompt = document.createElement('div');
      prompt.className = 'card';
      prompt.style.textAlign = 'center';
      prompt.innerHTML =
        '<div class="section-title">👋 You\'re reading along</div>' +
        '<p style="color:var(--muted,#666)">Join the ' + U.esc(country) + ' group to participate in the conversation.</p>' +
        '<button class="btn btn-primary" id="gJoinNow">Join to participate</button>';
      wrap.appendChild(prompt);
      document.getElementById('gJoinNow').addEventListener('click', function () {
        if (typeof S.joinGroup === 'function') {
          try { S.joinGroup(country); } catch (e) {}
          ui.toast('Welcome to the ' + country + ' group! 🎉');
          PC.router.refresh();
        } else { ui.toast('Joining groups is not available yet.'); }
      });
      return;
    }

    var inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex;gap:8px;margin-top:6px';
    inputRow.innerHTML =
      '<input class="input" id="gInput" placeholder="Message the ' + U.esc(country) + ' group…" autocomplete="off" style="flex:1">' +
      '<button class="btn btn-primary" id="gSend">Send</button>';
    wrap.appendChild(inputRow);

    function gsend() {
      var v = document.getElementById('gInput').value.trim();
      if (!v) return;
      if (typeof S.sendGroupMessage === 'function') {
        var msg = null;
        try { msg = S.sendGroupMessage(country, v); } catch (e) { msg = null; }
        if (msg === null || msg === false) { ui.toast('Could not send — please try again.'); return; }
      } else { ui.toast('Group messaging is not available yet.'); return; }
      PC.router.refresh();
    }
    document.getElementById('gSend').addEventListener('click', gsend);
    document.getElementById('gInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') gsend();
    });

    msgs.scrollTop = msgs.scrollHeight;
  };
})();
