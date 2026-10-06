window.PC = window.PC || {};
PC.views = PC.views || {};
/* PakConnect — community events: list, country filter, RSVP, create event.
   Route wired by another agent: 'events' (#/events). */

(function () {
  'use strict';
  var U = PC.util, S = PC.store, ui = PC.ui;

  var activeCountry = 'All';

  function userOf(id) {
    try { return S.getUser(id); } catch (e) { return null; }
  }

  function dateParts(ts) {
    var d = new Date(Number(ts));
    if (isNaN(d.getTime())) return { day: '—', month: '', full: '' };
    return {
      day: String(d.getDate()),
      month: d.toLocaleString(undefined, { month: 'short' }),
      full: d.toLocaleString()
    };
  }

  function rsvpOf(ev, meId) {
    if (meId && ev.attendees && ev.attendees.indexOf(meId) >= 0) return 'going';
    if (meId && ev.interested && ev.interested.indexOf(meId) >= 0) return 'interested';
    return null;
  }

  function eventCard(ev, meId) {
    var card = document.createElement('div');
    card.className = 'card';
    var dp = dateParts(ev.date);
    var host = userOf(ev.hostId);
    var hostName = (host && host.name) || 'A member';
    var myRsvp = rsvpOf(ev, meId);
    var goingN = ev.attendees ? ev.attendees.length : 0;
    var intN = ev.interested ? ev.interested.length : 0;
    var avatars = (ev.attendees || []).slice(0, 5).map(function (aid) {
      return U.avatarHTML(userOf(aid), 'sm');
    }).join('');

    card.innerHTML =
      '<div style="display:flex;gap:12px">' +
        '<div style="flex:0 0 52px;text-align:center;border:1px solid var(--line,#ddd);border-radius:8px;padding:6px 0;align-self:flex-start">' +
          '<div style="font-size:1.3em;font-weight:700;line-height:1.1">' + U.esc(dp.day) + '</div>' +
          '<div style="font-size:.8em;color:var(--muted,#666)">' + U.esc(dp.month) + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:600;font-size:1.05em">' + U.esc(ev.title) + '</div>' +
          '<div style="font-size:.88em;color:var(--muted,#666);margin:4px 0">📍 ' + U.esc(ev.city) +
            ' · <span class="chip">' + U.esc(ev.country) + '</span>' +
            ' · 🕒 ' + U.esc(dp.full) + '</div>' +
          (ev.desc ? '<div style="margin:6px 0">' + U.esc(ev.desc) + '</div>' : '') +
          '<div style="font-size:.85em;color:var(--muted,#666);margin:6px 0">Hosted by ' + U.esc(hostName) + '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;margin:6px 0">' + avatars +
            '<span style="font-size:.85em;color:var(--muted,#666)"> ' + goingN + ' going · ' + intN + ' interested</span></div>' +
          '<div style="display:flex;gap:8px;margin-top:8px">' +
            '<button class="btn btn-sm ' + (myRsvp === 'going' ? 'btn-primary' : '') + '" data-going>' + (myRsvp === 'going' ? '✓ Going' : 'Going') + '</button>' +
            '<button class="btn btn-sm ' + (myRsvp === 'interested' ? 'btn-primary' : '') + '" data-interested>' + (myRsvp === 'interested' ? '✓ Interested' : 'Interested') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    function rsvp(choice) {
      S.rsvpEvent(ev.id, rsvpOf(S.getEvent(ev.id) || ev, meId) === choice ? null : choice);
      ui.toast(choice === 'going' ? 'You\'re on the guest list.' : 'Marked as interested.');
      PC.router.refresh();
    }
    card.querySelector('[data-going]').addEventListener('click', function () { rsvp('going'); });
    card.querySelector('[data-interested]').addEventListener('click', function () { rsvp('interested'); });
    return card;
  }

  function openCreateEvent() {
    var body =
      '<div class="section-title">＋ Create event</div>' +
      '<div class="field"><label class="label">Title</label>' +
      '<input class="input" id="evTitle" maxlength="120" placeholder="e.g. Chai & chat meetup"></div>' +
      '<div class="field"><label class="label">City</label>' +
      '<input class="input" id="evCity" maxlength="80" placeholder="e.g. Lahore"></div>' +
      '<div class="field"><label class="label">Country</label>' +
      '<select class="select" id="evCountry">' +
        U.COUNTRIES.map(function (c) { return '<option>' + U.esc(c) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label class="label">Date & time</label>' +
      '<input class="input" type="datetime-local" id="evDate"></div>' +
      '<div class="field"><label class="label">Description (optional)</label>' +
      '<textarea class="textarea" id="evDesc" rows="3" maxlength="500" placeholder="What\'s the plan?"></textarea></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">' +
        '<button class="btn btn-ghost" id="evCancel">Cancel</button>' +
        '<button class="btn btn-primary" id="evSave">Create event</button>' +
      '</div>';
    var close = ui.modal(body);
    document.getElementById('evCancel').addEventListener('click', close);
    document.getElementById('evSave').addEventListener('click', function () {
      var title = document.getElementById('evTitle').value.trim();
      var city = document.getElementById('evCity').value.trim();
      var country = document.getElementById('evCountry').value;
      var dateVal = document.getElementById('evDate').value;
      var desc = document.getElementById('evDesc').value.trim();
      if (!title) { ui.toast('Please add a title.'); return; }
      if (!city) { ui.toast('Please add a city.'); return; }
      if (!dateVal) { ui.toast('Please pick a date and time.'); return; }
      var ts = new Date(dateVal).getTime();
      if (isNaN(ts)) { ui.toast('That date doesn\'t look right.'); return; }
      if (ts <= Date.now()) { ui.toast('Please pick a date in the future.'); return; }
      S.createEvent({ title: title, city: city, country: country, date: ts, desc: desc });
      close();
      ui.toast('Event created.');
      PC.router.refresh();
    });
  }

  PC.views.events = function (el) {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
        '<div class="page-title" style="margin:0">📅 Community events</div>' +
        '<button class="btn btn-primary btn-sm" data-create>＋ Create event</button>' +
      '</div>' +
      '<p style="color:var(--muted,#666);margin:8px 0">Meetups, talks, and hangouts hosted by the community. <span class="badge badge-demo">demo</span></p>' +
      '<div class="filter-bar" data-filters></div>' +
      '<div data-list></div>';

    wrap.querySelector('[data-create]').addEventListener('click', openCreateEvent);

    var filterBar = wrap.querySelector('[data-filters]');
    var listBox = wrap.querySelector('[data-list]');

    ['All'].concat(U.COUNTRIES).forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chip' + (c === activeCountry ? ' chip-on' : '');
      b.textContent = c;
      b.addEventListener('click', function () {
        activeCountry = c;
        PC.router.refresh();
      });
      filterBar.appendChild(b);
    });

    function renderList() {
      listBox.innerHTML = '';
      var events = S.eventsList();
      if (activeCountry !== 'All') {
        events = events.filter(function (e) { return e.country === activeCountry; });
      }
      if (!events.length) {
        listBox.innerHTML = '<div class="empty">No events' +
          (activeCountry === 'All' ? '' : ' in ' + U.esc(activeCountry)) +
          ' yet. Why not start one?</div>';
        return;
      }
      var me = S.me();
      var meId = me && me.id;
      events.forEach(function (e) { listBox.appendChild(eventCard(e, meId)); });
    }

    renderList();
    el.appendChild(wrap);
  };
})();
