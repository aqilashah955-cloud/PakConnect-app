window.PC = window.PC || {};
/* PakConnect — discussion board views: topic grid + thread page + single thread. */

/* EXT-POINT: discussion-moderation — auto-flag threads/posts matching scam or
   harassment patterns; route them to admin review before they go live. */
/* EXT-POINT: thread-subscriptions — notify members when someone replies to a
   thread they started or participated in. */
/* EXT-POINT: pinned-threads — moderators can pin important threads to the top. */

(function () {
  'use strict';
  var U = PC.util, S = PC.store, ui = PC.ui;

  function topicCard(t) {
    var el = document.createElement('div');
    el.className = 'card';
    el.style.cursor = 'pointer';
    el.innerHTML =
      '<div class="section-title">' + U.esc(t.icon) + ' ' + U.esc(t.title) + '</div>' +
      '<p style="margin:4px 0 10px;color:var(--muted,#666)">' + U.esc(t.desc) + '</p>' +
      '<div style="display:flex;gap:12px;color:var(--muted,#666);font-size:.9em">' +
        '<span><b>' + t.threadCount + '</b> discussions</span>' +
        '<span><b>' + t.postCount + '</b> posts</span>' +
      '</div>';
    el.addEventListener('click', function () { PC.router.go('/discussions/' + t.id); });
    return el;
  }

  function openStartDiscussionModal(topicId, onDone) {
    var body =
      '<div class="section-title">Start a discussion</div>' +
      '<div class="field"><label class="label">Title</label>' +
      '<input class="input" id="dthTitle" maxlength="120" placeholder="What do you want to talk about?"></div>' +
      '<div class="field"><label class="label">Your thoughts</label>' +
      '<textarea class="textarea" id="dthText" rows="4" placeholder="Share your perspective…"></textarea></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">' +
        '<button class="btn btn-ghost" id="dthCancel">Cancel</button>' +
        '<button class="btn btn-primary" id="dthPost">Post</button>' +
      '</div>';
    var close = ui.modal(body);
    document.getElementById('dthCancel').addEventListener('click', close);
    document.getElementById('dthPost').addEventListener('click', function () {
      var title = document.getElementById('dthTitle').value.trim();
      var text = document.getElementById('dthText').value.trim();
      if (!title) { ui.toast('Please add a title.'); return; }
      if (!text) { ui.toast('Please write something to start the discussion.'); return; }
      var th = S.addDThread(topicId, title, text);
      close();
      ui.toast('Discussion posted.');
      if (onDone) onDone(th);
    });
  }

  function openReportModal(targetId, onDone) {
    var body =
      '<div class="section-title">Report this post</div>' +
      '<p style="color:var(--muted,#666)">Our team reviews every report. Thank you for keeping PakConnect safe.</p>' +
      '<div class="field"><label class="label">Reason</label>' +
      '<select class="select" id="repReason">' +
        '<option>Spam or scam</option>' +
        '<option>Harassment or hate speech</option>' +
        '<option>Inappropriate content</option>' +
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
      var reason = document.getElementById('repReason').value;
      var detail = document.getElementById('repDetail').value.trim();
      S.fileReport(targetId, reason, detail);
      close();
      ui.toast('Report sent. We\'ll review it soon.');
      if (onDone) onDone();
    });
  }

  /* List of topics → /discussions */
  PC.views.discussions = function (el, params) {
    var topicId = params && params.topic;
    if (topicId) return renderTopicPage(el, topicId);

    var topics = S.topics();
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="page-title">Discussions</div>' +
      '<p style="color:var(--muted,#666);margin-top:0">Join a topic, share your perspective, and meet Pakistanis worldwide who care about the same things.</p>';
    var grid = document.createElement('div');
    grid.className = 'grid-2';
    topics.forEach(function (t) { grid.appendChild(topicCard(t)); });
    wrap.appendChild(grid);
    el.appendChild(wrap);
  };

  function renderTopicPage(el, topicId) {
    var topics = S.topics();
    var topic = null;
    for (var i = 0; i < topics.length; i++) {
      if (topics[i].id === topicId) { topic = topics[i]; break; }
    }
    if (!topic) { PC.router.go('/discussions'); return; }

    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div><a href="#/discussions" style="color:var(--muted,#666);font-size:.9em">&larr; All topics</a></div>' +
      '<div class="card" style="margin-top:8px">' +
        '<div class="page-title" style="margin-bottom:2px">' + U.esc(topic.icon) + ' ' + U.esc(topic.title) + '</div>' +
        '<p style="color:var(--muted,#666);margin:0">' + U.esc(topic.desc) + '</p>' +
        '<div style="margin-top:10px"><button class="btn btn-primary" id="startBtn">✏️ Start a discussion</button></div>' +
      '</div>';

    var threads = S.threadsForTopic(topicId);
    var list = document.createElement('div');
    list.style.marginTop = '12px';
    if (!threads.length) {
      list.innerHTML = '<div class="empty">No discussions yet. Be the first to start one!</div>';
    } else {
      threads.forEach(function (th) {
        var row = document.createElement('div');
        row.className = 'card list-row';
        var mine = th.author && S.me() && th.author.id === S.me().id;
        row.innerHTML =
          '<div style="flex:1">' +
            '<div style="font-weight:600">' + U.esc(th.title) + '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;margin-top:6px;color:var(--muted,#666);font-size:.88em">' +
              (th.author ? U.avatarHTML(th.author, 'sm') + '<span>' + U.esc(th.author.name) + '</span>' : '<span>PakConnect</span>') +
              '<span>·</span><span>' + th.postCount + ' posts</span>' +
              '<span>·</span><span>' + U.timeAgo(th.lastTs) + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:6px">' +
            (mine ? '<button class="btn btn-danger btn-sm" data-del>Delete</button>' : '') +
            '<button class="btn btn-primary btn-sm" data-join>Join discussion</button>' +
          '</div>';
        row.querySelector('[data-join]').addEventListener('click', function (e) {
          e.stopPropagation();
          PC.router.go('/dthread/' + th.id);
        });
        if (mine) {
          row.querySelector('[data-del]').addEventListener('click', function (e) {
            e.stopPropagation();
            ui.confirmDlg('Delete this discussion?').then(function (ok) {
              if (ok) { S.deleteDThread(th.id); ui.toast('Discussion deleted.'); PC.router.refresh(); }
            });
          });
        }
        list.appendChild(row);
      });
    }
    wrap.appendChild(list);
    el.appendChild(wrap);

    document.getElementById('startBtn').addEventListener('click', function () {
      openStartDiscussionModal(topicId, function () { PC.router.refresh(); });
    });
  }

  /* Single thread → /dthread/:id */
  PC.views.dthread = function (el, params) {
    var th = S.getDThread(params && params.id);
    if (!th) { ui.toast('Discussion not found.'); PC.router.go('/discussions'); return; }
    var me = S.me();

    var wrap = document.createElement('div');
    var topics = S.topics(), topic = null;
    for (var i = 0; i < topics.length; i++) {
      if (topics[i].id === th.topicId) { topic = topics[i]; break; }
    }
    var head = document.createElement('div');
    head.innerHTML =
      '<div><a href="#/discussions/' + U.esc(th.topicId) + '" style="color:var(--muted,#666);font-size:.9em">&larr; ' + U.esc(topic ? topic.title : 'Discussions') + '</a></div>' +
      '<div class="card" style="margin-top:8px">' +
        '<div style="margin-bottom:6px"><span class="chip">' + U.esc(topic ? topic.icon + ' ' + topic.title : 'Discussion') + '</span></div>' +
        '<div class="page-title" style="margin-bottom:0">' + U.esc(th.title) + '</div>' +
      '</div>';
    wrap.appendChild(head);

    var postsEl = document.createElement('div');
    postsEl.style.marginTop = '8px';
    th.posts.forEach(function (p) {
      var author = S.getUser(p.author) || { name: 'PakConnect', id: p.author };
      var mine = me && p.author === me.id;
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px">' +
          U.avatarHTML(author, 'sm') +
          '<div><div style="font-weight:600">' + U.esc(author.name) + (mine ? ' <span class="chip chip-on">you</span>' : '') + '</div>' +
          '<div style="font-size:.85em;color:var(--muted,#666)">' + U.timeAgo(p.ts) + '</div></div>' +
          '<div style="margin-left:auto;display:flex;gap:6px">' +
            (mine ? '<button class="btn btn-danger btn-sm" data-delpost>Delete</button>'
                   : '<button class="btn btn-ghost btn-sm" data-msg>Message</button>') +
            (!mine ? '<button class="btn btn-ghost btn-sm" data-report>Report</button>' : '') +
          '</div>' +
        '</div>' +
        '<p style="margin:8px 0 0;white-space:pre-wrap">' + U.esc(p.text) + '</p>' +
        (!mine
          ? '<div style="margin-top:8px"><button class="btn btn-primary btn-sm" data-startconv>💬 Start conversation</button></div>'
          : '');
      if (mine) {
        card.querySelector('[data-delpost]').addEventListener('click', function () {
          ui.confirmDlg('Delete this post?').then(function (ok) {
            if (ok) { S.deleteDPost(th.id, p.id); ui.toast('Post deleted.'); PC.router.refresh(); }
          });
        });
      } else {
        var goChat = function () {
          var r = S.getOrCreateThread(p.author);
          if (r.error) {
            if (r.error === 'self') ui.toast('This is your own post.');
            else ui.toast('You can\'t message this person right now.');
            return;
          }
          var opener = 'Hi ' + (author.name || 'there') + '! I enjoyed your thoughts in "' + th.title + '" — I\'d love to continue the conversation here.';
          S.setDraft(r.thread.id, opener);
          PC.router.go('/chat/' + r.thread.id);
        };
        card.querySelector('[data-msg]').addEventListener('click', goChat);
        card.querySelector('[data-startconv]').addEventListener('click', goChat);
        card.querySelector('[data-report]').addEventListener('click', function () {
          openReportModal(p.author, function () {});
        });
      }
      postsEl.appendChild(card);
    });
    wrap.appendChild(postsEl);

    var reply = document.createElement('div');
    reply.className = 'card';
    reply.style.marginTop = '12px';
    reply.innerHTML =
      '<div class="section-title">Add your reply</div>' +
      '<textarea class="textarea" id="replyText" rows="3" placeholder="Share your thoughts respectfully…"></textarea>' +
      '<div style="display:flex;justify-content:flex-end;margin-top:8px">' +
        '<button class="btn btn-primary" id="replySend">Reply</button>' +
      '</div>';
    wrap.appendChild(reply);
    el.appendChild(wrap);

    document.getElementById('replySend').addEventListener('click', function () {
      var text = document.getElementById('replyText').value.trim();
      if (!text) { ui.toast('Write something first.'); return; }
      S.addDPost(th.id, text);
      ui.toast('Reply posted.');
      PC.router.refresh();
    });
  };
})();
