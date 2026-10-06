window.PC = window.PC || {};
PC.views = PC.views || {};

/* Theme helper: applied by the profile theme toggle (and reusable by router init).
   styles.css keys dark styling off body[data-theme="dark"]. */
if (!PC.applyTheme) {
  PC.applyTheme = function (t) {
    var theme = String(t || 'light').toLowerCase();
    document.body.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark', theme === 'dark');
  };
}

/* Guarded access to build-2 store APIs (owned by another agent — may not exist
   yet). Every call checks typeof first so the view never throws. */
function pfHas(fn) { return !!(window.PC && PC.store && typeof PC.store[fn] === 'function'); }

/* ---------------- PC.views.profile ---------------- */
PC.views.profile = function (el, params) {
  var me = PC.store.me();
  var esc = PC.util.esc;
  var lists = PC.store.connectionLists();
  var msgCount = 0;
  PC.store.threads().forEach(function (t) { msgCount += (t.messages ? t.messages.length : 0); });
  var discCount = PC.store.participatedTopicIds(me.id).length;
  var theme = PC.store.settings().theme || 'light';

  /* Login streak — counted ONCE here at profile render (router does NOT call it). */
  var streak = pfHas('loginPing') ? (PC.store.loginPing() || 0) : 0;

  /* Verification status chip (new 3-step flow stores {status, steps} or null). */
  var ver = pfHas('myVerification') ? PC.store.myVerification() : null;

  var badges = '';
  if (me.verified || (ver && ver.status === 'approved')) badges += ' <span class="badge badge-verified">✓ Verified</span>';
  if (ver && ver.status === 'pending') badges += ' <span class="chip">⏳ Verification pending</span>';
  if (me.demo) badges += ' <span class="badge badge-demo">demo</span>';

  var bits = [];
  if (me.age && !(me.privacy && me.privacy.hideAge)) bits.push(esc(String(me.age)));
  if (me.country) bits.push(esc(me.country));
  if (me.city) bits.push(esc(me.city));

  /* Badge showcase: PC.seed.badgeDefs with earned (S.myBadges()) highlighted. */
  var defs = (window.PC && PC.seed && Array.isArray(PC.seed.badgeDefs)) ? PC.seed.badgeDefs : [];
  var earned = pfHas('myBadges') ? (PC.store.myBadges() || []) : [];
  var badgeHTML = '';
  if (defs.length) {
    badgeHTML = '<div class="section-title">🏅 Badges</div>' +
      '<div class="badge-grid">' +
      defs.map(function (d) {
        var id = String(d.id || d.name || '');
        var got = earned.indexOf(id) !== -1;
        return '<div class="' + (got ? 'badge-earned' : 'badge-locked') + '" title="' + esc(d.desc || d.description || '') + '">' +
          '<div style="font-size:1.5em;">' + esc(d.icon || '🏅') + '</div>' +
          '<div style="font-weight:700;font-size:.82em;">' + esc(d.name || d.title || id || 'Badge') + '</div>' +
        '</div>';
      }).join('') + '</div>';
  }

  /* Profile prompts Q&A cards. */
  var myP = pfHas('myPrompts') ? (PC.store.myPrompts() || []) : [];
  var promptsHTML = '<div class="card">' +
    '<div class="section-title">💬 About me</div>';
  if (myP.length) {
    promptsHTML += myP.map(function (p) {
      return '<div class="prompt-card">' +
        '<div class="prompt-q">' + esc(p.prompt || '') + '</div>' +
        '<div>' + esc(p.answer || '') + '</div>' +
      '</div>';
    }).join('');
  } else {
    promptsHTML += '<p style="opacity:.7;">Answer 3 fun prompts so people get to know the real you.</p>';
  }
  promptsHTML += '<button class="btn btn-ghost btn-sm" data-go="/profile/edit">' +
    (myP.length ? 'Edit prompts' : 'Add your prompts') + '</button></div>';

  /* Premium slot — wired by premium.js (document-level delegation). */
  var premHTML = (PC.views && typeof PC.views.premiumCard === 'function')
    ? PC.views.premiumCard()
    : '<div class="premium-card"><div class="section-title">✨ PakConnect Premium</div>' +
      '<p>More ways to connect — coming soon.</p></div>';

  el.innerHTML =
    '<div class="page-title">My profile</div>' +

    '<div class="card">' +
      '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">' +
        PC.util.avatarHTML(me, 'xl') +
        '<div>' +
          '<div style="font-size:1.25em;font-weight:700;">' + esc(me.name || '—') + badges + '</div>' +
          (bits.length ? '<div style="opacity:.75;margin:4px 0;">' + bits.join(' · ') + '</div>' : '') +
          (me.mode ? '<span class="chip">' + esc(me.mode) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div style="margin-top:12px;"><span class="streak-chip">🔥 ' + streak + '-day streak</span></div>' +
    '</div>' +

    (badgeHTML ? '<div class="card">' + badgeHTML + '</div>' : '') +

    promptsHTML +

    '<div class="card">' +
      '<div class="section-title">💡 A note on match scores</div>' +
      '<p>' + esc(PC.util.SCORE_NOTE) + '</p>' +
    '</div>' +

    '<div class="card">' +
      '<div class="section-title">Your activity</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<div class="stat-card" style="flex:1;min-width:90px;text-align:center;"><div style="font-size:1.4em;font-weight:700;">' + lists.connected.length + '</div><div>Connections</div></div>' +
        '<div class="stat-card" style="flex:1;min-width:90px;text-align:center;"><div style="font-size:1.4em;font-weight:700;">' + discCount + '</div><div>Discussions joined</div></div>' +
        '<div class="stat-card" style="flex:1;min-width:90px;text-align:center;"><div style="font-size:1.4em;font-weight:700;">' + msgCount + '</div><div>Messages</div></div>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="menu-row" data-go="/profile/edit"><span>✏️ Edit profile</span><span>›</span></div>' +
      '<div class="menu-row" data-go="/marriage"><span>💍 Marriage preferences</span><span>›</span></div>' +
      '<div class="menu-row" data-go="/safety"><span>🛡️ Safety &amp; privacy</span><span>›</span></div>' +
      '<div class="menu-row" data-go="/admin"><span>🛠️ Admin dashboard</span><span>›</span></div>' +
      '<label class="toggle-row"><span>🌙 Dark mode</span><input type="checkbox" id="pfTheme"' + (theme === 'dark' ? ' checked' : '') + '></label>' +
      '<div class="menu-row" id="pfReset"><span>🗑️ Reset demo data</span><span>›</span></div>' +
    '</div>' +

    premHTML;

  el.querySelectorAll('.menu-row[data-go],button[data-go]').forEach(function (row) {
    row.addEventListener('click', function () { PC.router.go(row.getAttribute('data-go')); });
  });

  el.querySelector('#pfTheme').addEventListener('change', function (e) {
    var t = e.target.checked ? 'dark' : 'light';
    PC.store.saveSettings({ theme: t });
    PC.applyTheme(t);
    PC.ui.toast(t === 'dark' ? 'Dark mode on' : 'Light mode on');
  });

  el.querySelector('#pfReset').addEventListener('click', function () {
    PC.ui.confirmDlg('Reset all demo data? Your profile and all demo content will be recreated from scratch.').then(function (ok) {
      if (!ok) return;
      PC.store.reset();
      PC.ui.toast('Demo data reset');
      PC.router.go('/');
    });
  });
};

/* ---------------- PC.views.profileEdit ---------------- */

/* Local option lists (contract defines COUNTRIES/MODES/INTENTIONS/LANGUAGES; the
   rest are view-level choices, not curriculum data). */
var PF_GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];
var PF_BACKGROUNDS = ['Pakistani', 'Pakistani diaspora', 'South Asian', 'Other'];
var PF_INTERESTS = ['Cricket', 'Poetry', 'Cooking', 'Travel', 'Reading', 'Music', 'Technology', 'Photography', 'Gardening', 'Islamic studies', 'History', 'Movies', 'Fitness', 'Art', 'Business', 'Volunteering'];
var PF_TRAITS = ['Kind', 'Honest', 'Patient', 'Ambitious', 'Funny', 'Calm', 'Organized', 'Adventurous', 'Respectful', 'Generous'];
var PF_VALUES = ['Family', 'Faith', 'Education', 'Honesty', 'Respect', 'Community', 'Career', 'Tradition', 'Compassion', 'Integrity'];

function pfTextField(id, label, value, type) {
  return '<div class="field"><label class="label" for="' + id + '">' + PC.util.esc(label) + '</label>' +
    '<input class="input" type="' + (type || 'text') + '" id="' + id + '" value="' + PC.util.esc(value == null ? '' : String(value)) + '"' +
    (type === 'number' ? ' min="18"' : '') + '></div>';
}

function pfAreaField(id, label, value, rows) {
  return '<div class="field"><label class="label" for="' + id + '">' + PC.util.esc(label) + '</label>' +
    '<textarea class="textarea" id="' + id + '" rows="' + (rows || 3) + '">' + PC.util.esc(value || '') + '</textarea></div>';
}

function pfSelField(id, label, opts, current) {
  var o = opts.map(function (v) {
    return '<option value="' + PC.util.esc(v) + '"' + (v === current ? ' selected' : '') + '>' + PC.util.esc(v) + '</option>';
  }).join('');
  return '<div class="field"><label class="label" for="' + id + '">' + PC.util.esc(label) + '</label>' +
    '<select class="select" id="' + id + '">' + o + '</select></div>';
}

function pfChipGroup(id, label, opts, selected) {
  selected = selected || [];
  var chips = opts.map(function (o) {
    var v = (typeof o === 'object') ? o.value : o;
    var lab = (typeof o === 'object') ? o.label : o;
    var on = selected.indexOf(v) !== -1 ? ' chip-on' : '';
    return '<button type="button" class="chip' + on + '" data-value="' + PC.util.esc(String(v)) + '">' + PC.util.esc(lab) + '</button>';
  }).join('');
  return '<div class="field"><div class="label">' + PC.util.esc(label) + '</div><div id="' + id + '">' + chips + '</div></div>';
}

/* ---- 3-step verification flow (simulated demo): liveness hold → ID check →
       optional social link. No phone/CNIC/address/password fields anywhere. */
function pfVerificationFlow() {
  var esc = PC.util.esc;
  var close = PC.ui.modal('<div id="pcVerFlow"></div>');
  var card = document.querySelector('#modal-root .modal-card:last-child');
  if (!card) { close(); return; }
  var social = '';

  function step1() {
    card.innerHTML =
      '<div class="section-title">Step 1 of 3 — Liveness (simulated)</div>' +
      '<p>Press and <b>hold</b> the button for 2 seconds to confirm you\'re a real person. ' +
      'Demo only — no camera is used.</p>' +
      '<button type="button" class="btn btn-primary" id="vHold" style="position:relative;overflow:hidden;width:100%;">' +
        '<span id="vHoldFill" style="position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,.35);"></span>' +
        '<span style="position:relative;">Hold me</span></button>' +
      '<div style="text-align:right;margin-top:12px;"><button type="button" class="btn btn-ghost" id="vCancel">Cancel</button></div>';
    var hold = card.querySelector('#vHold');
    var fill = card.querySelector('#vHoldFill');
    var timer = null, iv = null, start = 0;
    function stop(ok) {
      if (timer) { clearTimeout(timer); timer = null; }
      if (iv) { clearInterval(iv); iv = null; }
      if (!ok && fill) fill.style.width = '0';
    }
    hold.addEventListener('pointerdown', function () {
      start = Date.now();
      iv = setInterval(function () {
        fill.style.width = Math.min(100, (Date.now() - start) / 20) + '%';
      }, 50);
      timer = setTimeout(function () { stop(true); step2(); }, 2000);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      hold.addEventListener(ev, function () {
        if (timer) { stop(false); PC.ui.toast('Keep holding for the full 2 seconds'); }
      });
    });
    card.querySelector('#vCancel').addEventListener('click', close);
  }

  function step2() {
    card.innerHTML =
      '<div class="section-title">Step 2 of 3 — ID check (simulated)</div>' +
      '<p>In the live app you\'d photograph an ID document here. This demo skips real ' +
      'documents entirely — <b>nothing is uploaded</b>.</p>' +
      '<button type="button" class="btn btn-primary" id="vIdBtn">Verify ID (demo)</button>' +
      '<div class="poll-bar" id="vIdBar" style="display:none;margin-top:12px;"><div class="poll-fill" id="vIdFill"></div></div>' +
      '<div style="text-align:right;margin-top:12px;">' +
        '<button type="button" class="btn btn-ghost" id="vBack1">Back</button> ' +
        '<button type="button" class="btn btn-ghost" id="vCancel2">Cancel</button></div>';
    card.querySelector('#vIdBtn').addEventListener('click', function () {
      var bar = card.querySelector('#vIdBar');
      var fill = card.querySelector('#vIdFill');
      bar.style.display = 'block';
      var p = 0;
      var iv = setInterval(function () {
        p += 12;
        if (p >= 100) { clearInterval(iv); step3(); return; }
        fill.style.width = p + '%';
      }, 150);
    });
    card.querySelector('#vBack1').addEventListener('click', step1);
    card.querySelector('#vCancel2').addEventListener('click', close);
  }

  function step3() {
    card.innerHTML =
      '<div class="section-title">Step 3 of 3 — Social profile (optional)</div>' +
      '<p>Paste a link to a public social profile so reviewers can confirm you\'re real. ' +
      '<b>Optional</b> — and never share passwords.</p>' +
      '<div class="field"><label class="label" for="vSocial">Social profile link</label>' +
      '<input class="input" type="url" id="vSocial" placeholder="https://…" value="' + esc(social) + '"></div>' +
      '<div style="text-align:right;margin-top:12px;">' +
        '<button type="button" class="btn btn-ghost" id="vBack2">Back</button> ' +
        '<button type="button" class="btn btn-primary" id="vSubmit">Submit for review</button></div>';
    var input = card.querySelector('#vSocial');
    input.addEventListener('input', function () { social = input.value.trim(); });
    card.querySelector('#vBack2').addEventListener('click', step2);
    card.querySelector('#vSubmit').addEventListener('click', function () {
      if (pfHas('submitVerificationSteps')) {
        PC.store.submitVerificationSteps({ liveness: true, id: true, social: social || '' });
      }
      close();
      PC.ui.toast('Submitted for review (demo)');
      PC.router.refresh();
    });
  }

  step1();
}

/* EXT-POINT: real-verification — replace the simulated pfVerificationFlow()
   call in the #pfVerify handler below with an ID/document review flow when a
   backend exists. */

PC.views.profileEdit = function (el, params) {
  var me = PC.store.me();
  var esc = PC.util.esc;
  var topics = (PC.store.topics() || []).map(function (t) {
    return { value: t.id, label: (t.icon ? t.icon + ' ' : '') + t.title };
  });

  /* ---- Prompts section (build 2): pick 3 prompts from seed, answer each. ---- */
  var seedPrompts = (window.PC && PC.seed && Array.isArray(PC.seed.prompts)) ? PC.seed.prompts : [];
  var hasPrompts = seedPrompts.length > 0;
  var savedPrompts = pfHas('myPrompts') ? (PC.store.myPrompts() || []) : [];
  var selPrompts = [];
  var promptAnswers = {};
  savedPrompts.forEach(function (p) {
    if (p && p.prompt && seedPrompts.indexOf(p.prompt) !== -1 && selPrompts.indexOf(p.prompt) === -1) {
      selPrompts.push(p.prompt);
      promptAnswers[p.prompt] = p.answer || '';
    }
  });

  var promptsCard = '';
  if (hasPrompts) {
    promptsCard =
      '<div class="card">' +
        '<div class="section-title">💬 Profile prompts — pick 3</div>' +
        '<p style="opacity:.75;">Choose up to 3 prompts and answer each one. They show on your profile.</p>' +
        '<div id="pfPromptChips" style="display:flex;gap:8px;flex-wrap:wrap;">' +
          seedPrompts.map(function (pr, i) {
            var on = selPrompts.indexOf(pr) !== -1 ? ' chip-on' : '';
            return '<button type="button" class="chip' + on + '" data-pidx="' + i + '">' + esc(pr) + '</button>';
          }).join('') +
        '</div>' +
        '<div id="pfPromptAnswers" style="margin-top:12px;"></div>' +
      '</div>';
  }

  function renderPromptAnswers() {
    var box = el.querySelector('#pfPromptAnswers');
    if (!box) return;
    box.innerHTML = selPrompts.map(function (pr) {
      return '<div class="field"><label class="label">' + esc(pr) + '</label>' +
        '<textarea class="textarea" rows="2" data-answer-for="' + esc(pr) + '" placeholder="Your answer…">' +
        esc(promptAnswers[pr] || '') + '</textarea></div>';
    }).join('');
  }

  /* ---- Verification status chip ---- */
  var ver = pfHas('myVerification') ? PC.store.myVerification() : null;
  var verStatus = '';
  if (ver && ver.status === 'pending') verStatus = ' <span class="chip">⏳ Under review (demo)</span>';
  else if (ver && ver.status === 'approved') verStatus = ' <span class="badge badge-verified">✓ Verified</span>';

  el.innerHTML =
    '<div class="page-title">Edit profile</div>' +

    '<div class="card">' +
      '<div class="section-title">Basics</div>' +
      pfTextField('f_name', 'Full name', me.name) +
      pfTextField('f_age', 'Age (must be 18+)', me.age, 'number') +
      '<div class="grid-2">' +
        pfSelField('f_gender', 'Gender', PF_GENDERS, me.gender) +
        pfSelField('f_country', 'Country', PC.util.COUNTRIES, me.country) +
      '</div>' +
      pfTextField('f_city', 'City/region — never your exact address', me.city) +
      '<div class="grid-2">' +
        pfSelField('f_bg', 'Background', PF_BACKGROUNDS, me.background) +
        pfTextField('f_bgdetail', 'Background detail (optional)', me.backgroundDetail) +
      '</div>' +
      pfTextField('f_edu', 'Education', me.education) +
      pfTextField('f_prof', 'Profession', me.profession) +
    '</div>' +

    '<div class="card">' +
      '<div class="section-title">Languages, interests & values</div>' +
      '<p style="opacity:.75;">Tap to select — these power your match score and discovery.</p>' +
      pfChipGroup('f_langs', 'Languages', PC.util.LANGUAGES, me.languages) +
      pfChipGroup('f_interests', 'Interests', PF_INTERESTS, me.interests) +
      pfChipGroup('f_traits', 'Traits', PF_TRAITS, me.traits) +
      pfChipGroup('f_values', 'Values', PF_VALUES, me.values) +
    '</div>' +

    promptsCard +

    '<div class="card">' +
      '<div class="section-title">About you</div>' +
      pfTextField('f_goals', 'Goals', me.goals) +
      pfAreaField('f_about', 'About me', me.about, 4) +
      pfChipGroup('f_looking', 'Looking for', PC.util.INTENTIONS, me.lookingFor) +
      pfSelField('f_mode', 'Connection mode', PC.util.MODES, me.mode) +
      pfChipGroup('f_topics', 'Favourite discussion topics', topics, me.favTopics) +
    '</div>' +

    '<div class="card">' +
      '<div class="section-title">🔒 Privacy</div>' +
      pfSelField('f_vis', 'Who can see my profile',
        [{ v: 'everyone', l: 'Everyone' }, { v: 'connections', l: 'Connections only' }, { v: 'nobody', l: 'Nobody' }].map(function (o) { return o.v; }),
        (me.privacy && me.privacy.visibility) || 'everyone') +
      '<label class="toggle-row"><span>Hide my age</span><input type="checkbox" id="f_hideage"' + (me.privacy && me.privacy.hideAge ? ' checked' : '') + '></label>' +
      '<label class="toggle-row"><span>Only connections can message me</span><input type="checkbox" id="f_restrict"' + (me.privacy && me.privacy.restrictUnknown ? ' checked' : '') + '></label>' +
      '<button class="btn btn-ghost" id="pfVerify">✓ Get verified</button>' + verStatus +
      '<div style="opacity:.7;font-size:.85em;margin-top:6px;">3-step simulated check (liveness, ID, optional social link). No real documents are uploaded.</div>' +
    '</div>' +

    '<div style="display:flex;gap:8px;margin-bottom:24px;">' +
      '<button class="btn btn-primary" id="pfSave">Save profile</button>' +
      '<button class="btn btn-ghost" id="pfCancel">Cancel</button>' +
    '</div>';

  /* Fix the visibility select labels (pfSelField renders values; relabel nicely). */
  var visSel = el.querySelector('#f_vis');
  var visLabels = { everyone: 'Everyone', connections: 'Connections only', nobody: 'Nobody' };
  Array.prototype.forEach.call(visSel.options, function (opt) {
    opt.textContent = visLabels[opt.value] || opt.value;
  });

  /* Prompt chips: dedicated toggling with a max of 3 (container id does NOT
     start with "f_" so the generic chip handler below ignores these). */
  renderPromptAnswers();
  if (hasPrompts) {
    el.querySelector('#pfPromptChips').addEventListener('click', function (e) {
      var c = e.target.closest ? e.target.closest('.chip') : null;
      if (!c) return;
      var pr = seedPrompts[parseInt(c.getAttribute('data-pidx'), 10)];
      var ix = selPrompts.indexOf(pr);
      if (ix !== -1) {
        selPrompts.splice(ix, 1);
        delete promptAnswers[pr];
      } else {
        if (selPrompts.length >= 3) { PC.ui.toast('Pick up to 3 prompts'); return; }
        selPrompts.push(pr);
      }
      c.classList.toggle('chip-on');
      renderPromptAnswers();
    });
    /* Keep typed answers across re-renders. */
    el.addEventListener('input', function (e) {
      var t = e.target;
      if (t && t.hasAttribute && t.hasAttribute('data-answer-for')) {
        promptAnswers[t.getAttribute('data-answer-for')] = t.value;
      }
    });
  }

  /* Chip multi-select toggling (standard f_ groups only). */
  el.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest('.chip') : null;
    if (c && c.parentElement && c.parentElement.id.indexOf('f_') === 0) c.classList.toggle('chip-on');
  });

  function readChips(id) {
    var vals = [];
    el.querySelectorAll('#' + id + ' .chip-on').forEach(function (c) { vals.push(c.getAttribute('data-value')); });
    return vals;
  }

  el.querySelector('#pfVerify').addEventListener('click', pfVerificationFlow);

  el.querySelector('#pfCancel').addEventListener('click', function () { PC.router.go('/profile'); });

  el.querySelector('#pfSave').addEventListener('click', function () {
    var name = el.querySelector('#f_name').value.trim();
    var age = parseInt(el.querySelector('#f_age').value, 10);
    if (!name) { PC.ui.toast('Please enter your name'); return; }
    if (!age || age < 18) { PC.ui.toast('You must be 18 or older to use PakConnect'); return; }
    /* Prompts: exactly 3 selected with non-empty answers. */
    if (hasPrompts) {
      var promptList = selPrompts.map(function (pr) {
        return { prompt: pr, answer: (promptAnswers[pr] || '').trim() };
      });
      if (promptList.length !== 3 || promptList.some(function (p) { return !p.answer; })) {
        PC.ui.toast('Pick exactly 3 prompts and answer each one');
        return;
      }
      if (pfHas('saveMyPrompts')) PC.store.saveMyPrompts(promptList);
    }
    var mode = el.querySelector('#f_mode').value;
    PC.store.updateMe({
      name: name,
      age: age,
      gender: el.querySelector('#f_gender').value,
      country: el.querySelector('#f_country').value,
      city: el.querySelector('#f_city').value.trim(),
      background: el.querySelector('#f_bg').value,
      backgroundDetail: el.querySelector('#f_bgdetail').value.trim(),
      education: el.querySelector('#f_edu').value.trim(),
      profession: el.querySelector('#f_prof').value.trim(),
      languages: readChips('f_langs'),
      interests: readChips('f_interests'),
      traits: readChips('f_traits'),
      values: readChips('f_values'),
      goals: el.querySelector('#f_goals').value.trim(),
      about: el.querySelector('#f_about').value.trim(),
      lookingFor: readChips('f_looking'),
      mode: mode,
      favTopics: readChips('f_topics'),
      privacy: {
        visibility: visSel.value,
        hideAge: el.querySelector('#f_hideage').checked,
        restrictUnknown: el.querySelector('#f_restrict').checked
      }
    });
    PC.store.saveSettings({ mode: mode }); /* keep the topbar mode selector in sync */
    PC.ui.toast('Profile saved');
    PC.router.go('/profile');
  });
};
