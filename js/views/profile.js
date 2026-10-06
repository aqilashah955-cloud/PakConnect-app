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

/* ---------------- PC.views.profile ---------------- */
PC.views.profile = function (el, params) {
  var me = PC.store.me();
  var esc = PC.util.esc;
  var lists = PC.store.connectionLists();
  var msgCount = 0;
  PC.store.threads().forEach(function (t) { msgCount += (t.messages ? t.messages.length : 0); });
  var discCount = PC.store.participatedTopicIds(me.id).length;
  var theme = PC.store.settings().theme || 'light';

  var badges = '';
  if (me.verified) badges += ' <span class="badge badge-verified">✓ Verified</span>';
  if (me.demo) badges += ' <span class="badge badge-demo">demo</span>';

  var bits = [];
  if (me.age && !(me.privacy && me.privacy.hideAge)) bits.push(esc(String(me.age)));
  if (me.country) bits.push(esc(me.country));
  if (me.city) bits.push(esc(me.city));

  var premium = PC.seed.premiumFeatures || [];

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
    '</div>' +

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

    '<div class="premium-card">' +
      '<div class="section-title">✨ PakConnect Premium</div>' +
      '<p>More ways to connect — coming soon.</p>' +
      (premium.length
        ? '<ul>' + premium.map(function (f) {
            return '<li>' + esc(typeof f === 'string' ? f : (f.title || f.name || '')) + '</li>';
          }).join('') + '</ul>'
        : '') +
      '<button class="btn btn-primary" id="pfPremium">Notify me — coming soon</button>' +
    '</div>';

  el.querySelectorAll('.menu-row[data-go]').forEach(function (row) {
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

  el.querySelector('#pfPremium').addEventListener('click', function () {
    PC.ui.toast('PakConnect Premium is coming soon');
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

PC.views.profileEdit = function (el, params) {
  var me = PC.store.me();
  var esc = PC.util.esc;
  var topics = (PC.store.topics() || []).map(function (t) {
    return { value: t.id, label: (t.icon ? t.icon + ' ' : '') + t.title };
  });

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
      '<button class="btn btn-ghost" id="pfVerify">✓ Request verification</button>' +
      ' <span style="opacity:.7;font-size:.9em;">Simulated in this demo.</span>' +
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

  /* Chip multi-select toggling */
  el.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest('.chip') : null;
    if (c && c.parentElement && c.parentElement.id.indexOf('f_') === 0) c.classList.toggle('chip-on');
  });

  function readChips(id) {
    var vals = [];
    el.querySelectorAll('#' + id + ' .chip-on').forEach(function (c) { vals.push(c.getAttribute('data-value')); });
    return vals;
  }

  /* EXT-POINT: real-verification — replace the simulated requestVerification()
     call in the #pfVerify handler below with an ID/document review flow when a
     backend exists. */
  el.querySelector('#pfVerify').addEventListener('click', function () {
    PC.store.requestVerification();
    PC.ui.toast('Verification request sent (simulated)');
  });

  el.querySelector('#pfCancel').addEventListener('click', function () { PC.router.go('/profile'); });

  el.querySelector('#pfSave').addEventListener('click', function () {
    var name = el.querySelector('#f_name').value.trim();
    var age = parseInt(el.querySelector('#f_age').value, 10);
    if (!name) { PC.ui.toast('Please enter your name'); return; }
    if (!age || age < 18) { PC.ui.toast('You must be 18 or older to use PakConnect'); return; }
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
