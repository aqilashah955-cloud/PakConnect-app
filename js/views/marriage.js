window.PC = window.PC || {};
PC.views = PC.views || {};

var MG_LOCATIONS = ['Same city', 'Same country', 'Anywhere in Pakistan', 'Abroad OK', 'No preference'];
var MG_RELOCATION = ['Open', 'Maybe', 'No'];

PC.views.marriage = function (el, params) {
  var me = PC.store.me();
  var esc = PC.util.esc;
  var mp = me.marriagePrefs || {};

  function text(id, label, value) {
    return '<div class="field"><label class="label" for="' + id + '">' + esc(label) + '</label>' +
      '<input class="input" type="text" id="' + id + '" value="' + esc(value || '') + '"></div>';
  }
  function area(id, label, value) {
    return '<div class="field"><label class="label" for="' + id + '">' + esc(label) + '</label>' +
      '<textarea class="textarea" id="' + id + '" rows="3">' + esc(value || '') + '</textarea></div>';
  }
  function sel(id, label, opts, current) {
    var o = opts.map(function (v) {
      return '<option value="' + esc(v) + '"' + (v === current ? ' selected' : '') + '>' + esc(v) + '</option>';
    }).join('');
    return '<div class="field"><label class="label" for="' + id + '">' + esc(label) + '</label>' +
      '<select class="select" id="' + id + '">' + o + '</select></div>';
  }

  var html =
    '<div class="page-title">💍 Marriage preferences</div>' +

    '<div class="card">' +
      '<p><b>Marriage Mode is optional — there is no pressure here.</b> ' +
      'Share what matters to you at your own pace, change your answers anytime, ' +
      'and stay in whatever connection mode feels right. These preferences are only ' +
      'used to suggest compatible profiles — <b>never shared without your consent</b>.</p>' +
    '</div>';

  if (me.mode !== 'Marriage') {
    html += '<div class="banner-warn">' +
      'You are currently in <b>' + esc(me.mode || '—') + '</b> mode. ' +
      'Marriage preferences work best in Marriage Mode. ' +
      '<button class="btn btn-primary btn-sm" id="mgSwitch" style="margin-left:8px;">Switch to Marriage Mode</button>' +
    '</div>';
  }

  html +=
    '<div class="card">' +
      '<div class="section-title">Your preferences</div>' +
      area('m_intentions', 'Intentions (in your own words)', mp.intentions) +
      '<div class="grid-2">' +
        '<div class="field"><label class="label" for="m_ageMin">Preferred age — from</label>' +
          '<input class="input" type="number" id="m_ageMin" min="18" value="' + esc(mp.ageMin == null ? '' : String(mp.ageMin)) + '"></div>' +
        '<div class="field"><label class="label" for="m_ageMax">Preferred age — to</label>' +
          '<input class="input" type="number" id="m_ageMax" min="18" value="' + esc(mp.ageMax == null ? '' : String(mp.ageMax)) + '"></div>' +
      '</div>' +
      sel('m_location', 'Location preference', MG_LOCATIONS, mp.location) +
      '<div class="grid-2">' +
        text('m_education', 'Education preferences', mp.education) +
        text('m_career', 'Career preferences', mp.career) +
      '</div>' +
      text('m_values', 'Values that matter most', mp.values) +
      text('m_lifestyle', 'Lifestyle', mp.lifestyle) +
      area('m_family', 'Family expectations', mp.family) +
      sel('m_relocation', 'Open to relocation', MG_RELOCATION, mp.relocation) +
      '<button class="btn btn-primary" id="mgSave">Save preferences</button>' +
    '</div>';

  var invites = PC.store.familyInvites() || [];
  html +=
    '<div class="card">' +
      '<div class="section-title">👨‍👩‍👧 Invite a family member</div>' +
      '<p>A parent or trusted elder can view your marriage preferences and help guide the process — ' +
      '<b>only with your explicit consent</b>. Nothing is shared until you tick the consent box below.</p>' +
      (invites.length
        ? invites.map(function (i) {
            return '<div class="list-row"><span>' + esc(i.name) + ' · ' + esc(i.relation) + '</span><span class="chip">invited</span></div>';
          }).join('')
        : '<div class="empty">No family invites yet.</div>') +
      text('fi_name', 'Family member’s name', '') +
      text('fi_relation', 'Relationship (e.g. Mother, Uncle)', '') +
      '<label class="toggle-row"><span>I have this person’s consent to invite them</span><input type="checkbox" id="fi_consent"></label>' +
      '<button class="btn" id="mgInvite">Send invitation</button>' +
      '<p style="opacity:.7;font-size:.9em;margin-top:8px;">Note: invitations are simulated in this demo — no real message is sent.</p>' +
    '</div>';

  el.innerHTML = html;

  var sw = el.querySelector('#mgSwitch');
  if (sw) {
    sw.addEventListener('click', function () {
      PC.store.saveSettings({ mode: 'Marriage' });
      PC.store.updateMe({ mode: 'Marriage' });
      PC.ui.toast('Marriage Mode on');
      PC.router.refresh();
    });
  }

  el.querySelector('#mgSave').addEventListener('click', function () {
    var ageMin = parseInt(el.querySelector('#m_ageMin').value, 10);
    var ageMax = parseInt(el.querySelector('#m_ageMax').value, 10);
    PC.store.updateMe({
      marriagePrefs: {
        intentions: el.querySelector('#m_intentions').value.trim(),
        ageMin: isNaN(ageMin) ? null : ageMin,
        ageMax: isNaN(ageMax) ? null : ageMax,
        location: el.querySelector('#m_location').value,
        education: el.querySelector('#m_education').value.trim(),
        career: el.querySelector('#m_career').value.trim(),
        values: el.querySelector('#m_values').value.trim(),
        lifestyle: el.querySelector('#m_lifestyle').value.trim(),
        family: el.querySelector('#m_family').value.trim(),
        relocation: el.querySelector('#m_relocation').value
      }
    });
    PC.ui.toast('Marriage preferences saved');
  });

  el.querySelector('#mgInvite').addEventListener('click', function () {
    var name = el.querySelector('#fi_name').value.trim();
    var relation = el.querySelector('#fi_relation').value.trim();
    var consent = el.querySelector('#fi_consent').checked;
    if (!name || !relation) { PC.ui.toast('Please enter a name and relationship'); return; }
    if (!consent) { PC.ui.toast('Please confirm you have their consent first'); return; }
    PC.store.addFamilyInvite({ name: name, relation: relation });
    PC.ui.toast('Invitation sent (simulated)');
    PC.router.refresh();
  });
};
