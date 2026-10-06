window.PC = window.PC || {};
PC.views = PC.views || {};

/* EXT-POINT: moderation-ai — plug automated report triage/scoring into the Reports
   tab (priority ranking, duplicate clustering) when a backend exists. */
/* EXT-POINT: real-verification — replace the simulated approve/reject flow with a
   document review queue when a backend exists. */

var adTab = 'users';
var adQuery = '';

function adUName(v) {
  if (v == null || v === '') return '—';
  var u = null;
  try { u = PC.store.getUser(v); } catch (e) { u = null; }
  return PC.util.esc(u ? u.name : String(v));
}

function adUserStatus(u) {
  if (u.removed) return 'Removed';
  if (u.suspended) return 'Suspended';
  if (u.verified) return '✓ Verified';
  return 'Active';
}

/* ---- Users tab ---- */
function adUserRows() {
  var esc = PC.util.esc;
  var meId = PC.store.me().id;
  var q = adQuery.trim().toLowerCase();
  var rows = '';
  (PC.store.allUsers() || []).forEach(function (u) {
    if (q && (u.name || '').toLowerCase().indexOf(q) === -1 && (u.country || '').toLowerCase().indexOf(q) === -1) return;
    var isMe = u.isMe || u.id === meId;
    var actions = isMe
      ? '<span style="opacity:.6;">you</span>'
      : '<button class="btn btn-ghost btn-sm" data-verify="' + esc(u.id) + '">' + (u.verified ? 'Unverify' : 'Verify') + '</button> ' +
        (u.suspended
          ? '<button class="btn btn-ghost btn-sm" data-unsuspend="' + esc(u.id) + '">Unsuspend</button>'
          : '<button class="btn btn-ghost btn-sm" data-suspend="' + esc(u.id) + '">Suspend</button>') + ' ' +
        '<button class="btn btn-danger btn-sm" data-remove="' + esc(u.id) + '">Remove</button>';
    rows += '<tr>' +
      '<td><span style="display:inline-flex;align-items:center;gap:6px;">' + PC.util.avatarHTML(u, 'sm') + esc(u.name || '—') + '</span></td>' +
      '<td>' + esc(u.country || '—') + '</td>' +
      '<td>' + esc(u.mode || '—') + '</td>' +
      '<td>' + esc(adUserStatus(u)) + '</td>' +
      '<td>' + actions + '</td>' +
    '</tr>';
  });
  return rows || '<tr><td colspan="5"><div class="empty">No users found.</div></td></tr>';
}

function adUsersHTML() {
  return '<div class="filter-bar"><input class="input" id="adSearch" placeholder="Search users…" value="' + PC.util.esc(adQuery) + '"></div>' +
    '<div class="table-wrap"><table class="data"><thead><tr>' +
    '<th>Name</th><th>Country</th><th>Mode</th><th>Status</th><th>Actions</th>' +
    '</tr></thead><tbody id="adUsersBody">' + adUserRows() + '</tbody></table></div>';
}

/* ---- Reports tab ---- */
function adReportsHTML() {
  var esc = PC.util.esc;
  var reports = PC.store.reports() || [];
  var open = reports.filter(function (r) { return !r.status || r.status === 'open'; });
  var done = reports.filter(function (r) { return r.status && r.status !== 'open'; });

  function card(r) {
    var isOpen = !r.status || r.status === 'open';
    var h = '<div class="card">' +
      '<div><b>Reporter:</b> ' + adUName(r.reporter) + ' &nbsp; <b>Target:</b> ' + adUName(r.target) +
      (isOpen ? '' : ' &nbsp;<span class="chip">' + esc(r.status) + '</span>') + '</div>' +
      '<div><b>Reason:</b> ' + esc(r.reason || '—') + '</div>' +
      (r.detail ? '<p>' + esc(r.detail) + '</p>' : '') +
      '<div style="opacity:.7;font-size:.9em;">' + esc(PC.util.timeAgo(r.ts || r.time || Date.now())) + '</div>';
    if (isOpen) {
      h += '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn btn-ghost btn-sm" data-resolve="dismissed" data-rid="' + esc(r.id) + '">Dismiss</button>' +
        '<button class="btn btn-ghost btn-sm" data-resolve="warned" data-rid="' + esc(r.id) + '">Warn</button>' +
        '<button class="btn btn-ghost btn-sm" data-resolve="suspended" data-rid="' + esc(r.id) + '">Suspend user</button>' +
        '<button class="btn btn-danger btn-sm" data-resolve="removed" data-rid="' + esc(r.id) + '">Remove user</button>' +
      '</div>';
    }
    return h + '</div>';
  }

  return '<div class="section-title">Open (' + open.length + ')</div>' +
    (open.length ? open.map(card).join('') : '<div class="empty">No open reports.</div>') +
    '<div class="section-title">Resolved (' + done.length + ')</div>' +
    (done.length ? done.map(card).join('') : '<div class="empty">No resolved reports.</div>');
}

/* ---- Verification tab ---- */
function adVerificationHTML() {
  var esc = PC.util.esc;
  var list = PC.store.verifications() || [];
  if (!list.length) return '<div class="empty">No pending verification requests.</div>';
  return list.map(function (v) {
    var id = v.userId || v.id;
    var u = null;
    try { u = PC.store.getUser(id); } catch (e) { u = null; }
    return '<div class="list-row">' +
      '<span style="display:flex;align-items:center;gap:8px;">' + (u ? PC.util.avatarHTML(u, 'sm') : '') + esc(u ? u.name : String(id)) +
      ' <span style="opacity:.6;font-size:.85em;">requested ' + esc(PC.util.timeAgo(v.ts || v.time || Date.now())) + '</span></span>' +
      '<span><button class="btn btn-primary btn-sm" data-approve="' + esc(id) + '">Approve</button> ' +
      '<button class="btn btn-ghost btn-sm" data-reject="' + esc(id) + '">Reject</button></span>' +
    '</div>';
  }).join('');
}

/* ---- Suspicious tab ---- */
function adSuspiciousHTML() {
  var esc = PC.util.esc;
  var list = PC.store.suspiciousUsers() || [];
  if (!list.length) return '<div class="empty">No suspicious users flagged.</div>';
  return list.map(function (u) {
    return '<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">' +
      '<div><b>' + esc(u.name || '—') + '</b>' +
      '<p>' + esc(u.flagNote || 'Flagged by the system.') + '</p></div>' +
      (u.suspended
        ? '<span class="chip">suspended</span>'
        : '<button class="btn btn-ghost btn-sm" data-sus-suspend="' + esc(u.id) + '">Suspend</button>') +
    '</div></div>';
  }).join('');
}

/* ---- Discussions tab ---- */
function adDiscussionsHTML() {
  var esc = PC.util.esc;
  var topics = PC.store.topics() || [];
  var html = '';
  topics.forEach(function (t) {
    var threads = PC.store.threadsForTopic(t.id) || [];
    html += '<div class="section-title">' + esc((t.icon ? t.icon + ' ' : '') + t.title) + ' (' + threads.length + ')</div>';
    if (!threads.length) { html += '<div class="empty">No threads.</div>'; return; }
    html += threads.map(function (th) {
      var author = null;
      try { author = PC.store.getUser(th.authorId || th.author); } catch (e) { author = null; }
      return '<div class="list-row">' +
        '<span><b>' + esc(th.title) + '</b><br>' +
        '<span style="opacity:.7;font-size:.9em;">by ' + esc(author ? author.name : (th.author || '—')) +
        ' · ' + (th.postCount || 0) + ' posts · ' + esc(PC.util.timeAgo(th.lastTs || th.ts || Date.now())) + '</span></span>' +
        '<button class="btn btn-danger btn-sm" data-delthread="' + esc(th.id) + '">Delete</button>' +
      '</div>';
    }).join('');
  });
  return html || '<div class="empty">No discussions.</div>';
}

/* ---- Analytics tab ---- */
function adAnalyticsHTML() {
  var statCards = '';
  function stat(n, label) {
    return '<div class="stat-card" style="text-align:center;"><div style="font-size:1.5em;font-weight:700;">' + n + '</div><div>' + label + '</div></div>';
  }
  var all = PC.store.allUsers() || [];
  var connected = PC.store.connectionLists().connected.length;
  var threadCount = 0;
  (PC.store.topics() || []).forEach(function (t) { threadCount += (PC.store.threadsForTopic(t.id) || []).length; });
  var msgCount = 0;
  (PC.store.threads() || []).forEach(function (t) { msgCount += (t.messages || []).length; });
  var openReports = (PC.store.reports() || []).filter(function (r) { return !r.status || r.status === 'open'; }).length;
  var pendingVer = (PC.store.verifications() || []).length;

  statCards =
    '<div class="section-title">Overview</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">' +
    stat(all.length, 'Total users') +
    stat(connected, 'Connections') +
    stat(threadCount, 'Threads') +
    stat(msgCount, 'Messages') +
    stat(openReports, 'Open reports') +
    stat(pendingVer, 'Verifications pending') +
    '</div>';

  var countries = PC.store.communityStats() || [];
  var max = 1;
  countries.forEach(function (c) { if (c.count > max) max = c.count; });
  var bars = '<div class="section-title">Members by country</div>' + countries.map(function (c) {
    var pct = Math.max(2, Math.round((c.count / max) * 100));
    return '<div class="kv"><span>' + PC.util.esc(c.country) + '</span><span>' + c.count + '</span></div>' +
      '<div class="scorebar" style="margin-bottom:10px;"><div class="scorebar-fill" style="width:' + pct + '%;"></div></div>';
  }).join('');

  return statCards + bars;
}

/* ---- Tab dispatch + wiring ---- */
function adTabHTML() {
  if (adTab === 'users') return adUsersHTML();
  if (adTab === 'reports') return adReportsHTML();
  if (adTab === 'verification') return adVerificationHTML();
  if (adTab === 'suspicious') return adSuspiciousHTML();
  if (adTab === 'discussions') return adDiscussionsHTML();
  return adAnalyticsHTML();
}

function adWireTab(el) {
  var content = el.querySelector('#adContent');

  if (adTab === 'users') {
    var search = el.querySelector('#adSearch');
    if (search) {
      search.addEventListener('input', function () {
        adQuery = search.value;
        el.querySelector('#adUsersBody').innerHTML = adUserRows();
      });
    }
  }

  content.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;

    function attr(name) { return btn.getAttribute(name); }

    if (attr('data-verify')) {
      var u = null;
      try { u = PC.store.getUser(attr('data-verify')); } catch (err) { u = null; }
      if (u) {
        u.verified = !u.verified;
        PC.store.save(); /* persist the flag change on the stored user record */
        PC.ui.toast(u.verified ? 'User verified' : 'Verification removed');
        PC.router.refresh();
      }
    } else if (attr('data-suspend')) {
      PC.store.suspendUser(attr('data-suspend'));
      PC.ui.toast('User suspended');
      PC.router.refresh();
    } else if (attr('data-unsuspend')) {
      PC.store.unsuspendUser(attr('data-unsuspend'));
      PC.ui.toast('User unsuspended');
      PC.router.refresh();
    } else if (attr('data-remove')) {
      var rid = attr('data-remove');
      PC.ui.confirmDlg('Remove this user permanently from the demo?').then(function (ok) {
        if (!ok) return;
        PC.store.removeUser(rid);
        PC.ui.toast('User removed');
        PC.router.refresh();
      });
    } else if (attr('data-sus-suspend')) {
      PC.store.suspendUser(attr('data-sus-suspend'));
      PC.ui.toast('User suspended');
      PC.router.refresh();
    } else if (attr('data-resolve')) {
      PC.store.resolveReport(attr('data-rid'), attr('data-resolve'));
      PC.ui.toast('Report ' + attr('data-resolve'));
      PC.router.refresh();
    } else if (attr('data-approve')) {
      PC.store.approveVerification(attr('data-approve'));
      PC.ui.toast('Verification approved');
      PC.router.refresh();
    } else if (attr('data-reject')) {
      PC.store.rejectVerification(attr('data-reject'));
      PC.ui.toast('Verification rejected');
      PC.router.refresh();
    } else if (attr('data-delthread')) {
      var tid = attr('data-delthread');
      PC.ui.confirmDlg('Delete this discussion thread and all its posts?').then(function (ok) {
        if (!ok) return;
        PC.store.deleteDThread(tid);
        PC.ui.toast('Thread deleted');
        PC.router.refresh();
      });
    }
  });
}

PC.views.admin = function (el, params) {
  var tabs = [
    ['users', 'Users'],
    ['reports', 'Reports'],
    ['verification', 'Verification'],
    ['suspicious', 'Suspicious'],
    ['discussions', 'Discussions'],
    ['analytics', 'Analytics']
  ];

  el.innerHTML =
    '<div class="page-title">🛠️ Admin dashboard</div>' +
    '<div class="card"><p><b>Demo moderation tools.</b> Actions apply to the local demo data on this device only.</p></div>' +
    '<div class="tabs">' + tabs.map(function (t) {
      return '<button class="tab' + (adTab === t[0] ? ' tab-on' : '') + '" data-atab="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>' +
    '<div id="adContent">' + adTabHTML() + '</div>';

  el.querySelectorAll('[data-atab]').forEach(function (b) {
    b.addEventListener('click', function () {
      adTab = b.getAttribute('data-atab');
      PC.router.refresh();
    });
  });

  adWireTab(el);
};
