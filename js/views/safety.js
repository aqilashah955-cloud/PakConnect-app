window.PC = window.PC || {};
PC.views = PC.views || {};

/* EXT-POINT: moderation-ai — hook automated scam/abuse detection into reports and
   chat here (flag suspicious messages, auto-escalate repeat offenders). */

PC.views.safety = function (el, params) {
  var esc = PC.util.esc;
  var guidelines = PC.seed.guidelines || [];
  var blocked = PC.store.blockedUsers() || [];

  var gHtml = guidelines.map(function (g) {
    if (typeof g === 'string') return '<div class="card"><p>' + esc(g) + '</p></div>';
    return '<div class="card"><div class="section-title">' + esc(g.title || g.heading || 'Stay safe') + '</div>' +
      '<p>' + esc(g.text || g.desc || g.body || '') + '</p></div>';
  }).join('');

  el.innerHTML =
    '<div class="page-title">🛡️ Safety &amp; privacy</div>' +

    '<div class="banner-warn">⚠️ <b>Never send money to strangers.</b> ' +
      'Real members will never ask you for money, gift cards, or bank details. ' +
      'PakConnect staff will never ask for your password.</div>' +

    '<div class="section-title">How to stay safe</div>' +
    (gHtml || '<div class="empty">Safety tips coming soon.</div>') +

    '<div class="card">' +
      '<div class="section-title">🚫 How to block or report someone</div>' +
      '<ol>' +
        '<li>Open the person’s profile or your chat with them.</li>' +
        '<li>Tap <b>Block</b> to stop all contact instantly — they are not notified.</li>' +
        '<li>Tap <b>Report</b>, choose a reason and add a few details. Every report is reviewed.</li>' +
        '<li>You can unblock someone anytime from the list below.</li>' +
      '</ol>' +
    '</div>' +

    '<div class="card">' +
      '<div class="section-title">✓ Verification</div>' +
      '<p>Verified members carry a ✓ badge on their profile. Requesting verification is free and simulated in this demo.</p>' +
      '<button class="btn btn-primary" id="sfVerify">Request verification</button>' +
    '</div>' +

    '<div class="card">' +
      '<div class="menu-row" data-go="/profile/edit"><span>🔒 Privacy controls</span><span>›</span></div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="section-title">Your blocked users</div>' +
      (blocked.length
        ? blocked.map(function (u) {
            return '<div class="list-row">' +
              '<span style="display:flex;align-items:center;gap:8px;">' + PC.util.avatarHTML(u, 'sm') + esc(u.name || '—') + '</span>' +
              '<button class="btn btn-ghost btn-sm" data-unblock="' + esc(u.id) + '">Unblock</button>' +
            '</div>';
          }).join('')
        : '<div class="empty">No blocked users.</div>') +
    '</div>' +

    '<div class="card">' +
      '<p>🆘 <b>In an emergency, contact your local authorities first</b> (police, or your country’s emergency number) — then report the user here so we can act.</p>' +
    '</div>';

  el.querySelectorAll('.menu-row[data-go]').forEach(function (row) {
    row.addEventListener('click', function () { PC.router.go(row.getAttribute('data-go')); });
  });

  el.querySelector('#sfVerify').addEventListener('click', function () {
    /* EXT-POINT: real-verification — swap the simulated requestVerification()
       for a real document review flow when a backend exists. */
    PC.store.requestVerification();
    PC.ui.toast('Verification request sent (simulated)');
  });

  el.querySelectorAll('[data-unblock]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      PC.store.unblockUser(btn.getAttribute('data-unblock'));
      PC.ui.toast('User unblocked');
      PC.router.refresh();
    });
  });
};
