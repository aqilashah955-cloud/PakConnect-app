window.PC = window.PC || {};
PC.views = PC.views || {};

/* PakConnect — Premium (build 2). Demo-only checkout: no real payment is ever
   processed. Premium state lives in localStorage and resets with "Reset demo data".
   Store API (guarded — another build-2 agent owns the store):
     S.premiumTier() -> 'free'|'premium', S.setPremium(tier), S.isPremium(),
     S.isBoost(), S.setBoost(b), S.isIncognito(), S.setIncognito(b)
   Seed: PC.seed.premiumTiers (array of perk strings or {title} objects). */

/* EXT-POINT: real-checkout — replace the demo Pay/Cancel handlers in
   PC.views.premium with a real payment provider (Paddle/Lemon Squeezy) when a
   backend exists. Entitlements (Connects/day, Interested/day) are enforced
   against S.premiumTier() in the store; this file only flips the demo tier. */

(function () {
  'use strict';

  function S() { return (window.PC && PC.store) ? PC.store : {}; }
  function has(fn) { var s = S(); return typeof s[fn] === 'function'; }

  function tier() {
    return has('premiumTier') ? S().premiumTier() : 'free';
  }
  function isPremium() {
    return has('isPremium') ? S().isPremium() : tier() === 'premium';
  }
  function perkStrings() {
    var raw = (window.PC && PC.seed && PC.seed.premiumTiers) ? PC.seed.premiumTiers : null;
    if (Array.isArray(raw) && raw.length) {
      return raw.map(function (p) {
        if (typeof p === 'string') return p;
        return (p && (p.title || p.name)) || '';
      }).filter(function (p) { return !!p; });
    }
    /* Fallback so the UI never renders an empty perks card when seed hasn't landed. */
    return ['Unlimited Connects', "See who's Interested in you", 'Profile Boost in Discover',
            'Incognito browsing', 'Priority placement in search'];
  }

  function esc(s) { return (window.PC && PC.util) ? PC.util.esc(s) : String(s == null ? '' : s); }

  /* HTML string for the profile page premium slot. Buttons/toggles are wired
     through document-level delegation registered once below (data attributes). */
  PC.views.premiumCard = function () {
    var perks = perkStrings();
    if (isPremium()) {
      var boost = has('isBoost') ? !!S().isBoost() : false;
      var incog = has('isIncognito') ? !!S().isIncognito() : false;
      return '<div class="premium-card">' +
        '<div class="section-title">✨ Premium active</div>' +
        '<p>You have PakConnect Premium — thank you for supporting the community.</p>' +
        '<label class="toggle-row"><span>🚀 Profile Boost <small style="opacity:.7">appear higher in Discover</small></span>' +
          '<input type="checkbox" data-boost-toggle' + (boost ? ' checked' : '') + '></label>' +
        '<label class="toggle-row"><span>🕵️ Incognito <small style="opacity:.7">browse without showing up in visits</small></span>' +
          '<input type="checkbox" data-incognito-toggle' + (incog ? ' checked' : '') + '></label>' +
        '<button class="btn btn-ghost" data-pc-premium="manage">Manage premium</button>' +
      '</div>';
    }
    return '<div class="premium-card">' +
      '<div class="section-title">✨ PakConnect Premium</div>' +
      '<div class="grid-2" style="margin-bottom:12px;">' +
        '<div class="card" style="margin:0;"><b>Free</b><ul style="margin:8px 0;padding-left:18px;">' +
          '<li>10 Connects/day</li><li>20 Interested/day</li>' +
        '</ul></div>' +
        '<div class="card" style="margin:0;border-color:var(--teal);"><b>Premium</b><div style="font-weight:700;">PKR 499/mo</div>' +
          '<ul style="margin:8px 0;padding-left:18px;">' +
          perks.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') +
          '</ul></div>' +
      '</div>' +
      '<button class="btn btn-primary" data-pc-premium="subscribe">Subscribe (demo checkout)</button>' +
    '</div>';
  };

  /* Demo checkout page. */
  PC.views.premium = function (el, params) {
    var perks = perkStrings();
    var active = isPremium();
    el.innerHTML =
      '<div class="page-title">✨ Premium</div>' +
      '<div class="banner-warn" style="margin-bottom:14px;">🧪 <b>Demo checkout</b> — no real payment is processed. ' +
      'Tapping Pay simply flips your demo tier in local storage.</div>' +
      '<div class="card">' +
        '<div class="section-title">PakConnect Premium — PKR 499/month</div>' +
        '<ul>' + perks.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
        (active
          ? '<p><span class="badge badge-verified">✓ Active</span></p>' +
            '<button class="btn btn-ghost" data-pc-premium="cancel">Cancel Premium</button>'
          : '<button class="btn btn-primary" data-pc-premium="pay">Pay PKR 499</button>') +
        ' <button class="btn btn-ghost" data-pc-premium="back">Back to profile</button>' +
      '</div>';

    el.querySelectorAll('[data-pc-premium]').forEach(function (b) {
      b.addEventListener('click', function () { pcPremiumAction(b.getAttribute('data-pc-premium')); });
    });
  };

  function pcPremiumAction(action) {
    var s = S(), ui = (window.PC && PC.ui) ? PC.ui : null;
    var say = function (m) { if (ui && ui.toast) ui.toast(m); };
    if (action === 'subscribe' || action === 'manage') { PC.router.go('/premium'); return; }
    if (action === 'back') { PC.router.go('/profile'); return; }
    if (action === 'pay') {
      if (typeof s.setPremium === 'function') s.setPremium('premium');
      say('Welcome to Premium (demo)');
      PC.router.go('/profile');
      return;
    }
    if (action === 'cancel') {
      if (typeof s.setPremium === 'function') s.setPremium('free');
      say('Premium cancelled — back to Free (demo)');
      PC.router.refresh();
    }
  }

  /* Document-level delegation for the profile-page card (PC.views.premiumCard
     returns a bare HTML string, so the card can't wire its own listeners). The
     checkout page wires its own buttons directly and only uses pay/cancel/back
     actions, so this handler only reacts to the card's subscribe/manage actions. */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-pc-premium]') : null;
    if (!b) return;
    var action = b.getAttribute('data-pc-premium');
    if (action === 'subscribe' || action === 'manage') pcPremiumAction(action);
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var s = S(), ui = (window.PC && PC.ui) ? PC.ui : null;
    var say = function (m) { if (ui && ui.toast) ui.toast(m); };
    if (t.hasAttribute('data-boost-toggle')) {
      if (typeof s.setBoost === 'function') s.setBoost(t.checked);
      say(t.checked ? 'Profile Boost on — you\'ll appear higher in Discover' : 'Profile Boost off');
    } else if (t.hasAttribute('data-incognito-toggle')) {
      if (typeof s.setIncognito === 'function') s.setIncognito(t.checked);
      say(t.checked ? 'Incognito on — your browsing stays private' : 'Incognito off');
    }
  });
})();
