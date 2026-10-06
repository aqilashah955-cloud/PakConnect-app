window.PC = window.PC || {};
PC.views = PC.views || {};

/* PakConnect onboarding wizard.
   Step 0: 18+ age gate (+ display name + gender) — under-18 gets a kind
   refusal screen and cannot proceed (no bypass).
   Steps 1–7: location, cultural connection, interests, discussion topics,
   values, intentions + preferred mode, hopes + meeting preferences.
   On finish: PC.store.createMe(...) → toast → /discover.
   EXT-POINT: photo-uploads — add profile photos here when supported.
   EXT-POINT: backend-auth — replace localStorage profile with real account creation.
   HARD CONSTRAINT: no phone / CNIC / exact-address / password fields anywhere.
*/
PC.views.onboarding = function(el, params){
  var esc = PC.util.esc;
  var go = PC.router.go;
  var toast = PC.ui.toast;

  var COUNTRIES = PC.util.COUNTRIES || ["Pakistan","UK","USA","Canada","UAE","Saudi Arabia","Australia","Europe","Worldwide"];
  var MODES = PC.util.MODES || ["Friendship","Discussion","Networking","Relationship","Marriage"];
  var INTENTIONS = PC.util.INTENTIONS || ["Friendship","Discussions","Networking","Serious relationship","Marriage"];
  var TOPIC_NAMES = (PC.seed && PC.seed.topics)
    ? PC.seed.topics.map(function(t){ return t.title; })
    : ["Pakistani Cuisine","Career & Jobs","Study Abroad","Travel to Pakistan","Urdu Literature","Cricket","Marriage & Family","Technology","Diaspora Life","Health & Wellness","Art & Music","Parenting","Business & Startups","Culture & Heritage","Current Affairs"];

  var INTERESTS = ["Reading","Travel","Cooking","Cricket","Music","Movies","Photography","Fitness & Sports","Technology","Business","Urdu Poetry","Gardening","Volunteering","Fashion"];
  var VALUES = ["Family","Faith","Honesty","Education","Ambition","Kindness","Adventure","Tradition","Independence","Community"];
  var BACKGROUNDS = ["Born in Pakistan","Pakistani heritage","Spouse/family connection","Friend of the culture","Professional interest","Other"];
  var GENDERS = ["Woman","Man","Non-binary","Prefer not to say"];

  /* Draft selections, one screen per step. */
  var draft = {
    name: "", dob: "", gender: "",
    country: "", city: "",
    background: "", backgroundDetail: "",
    interests: [], favTopics: [], values: [],
    lookingFor: [], mode: "",
    hopes: "", ageMin: "", ageMax: "", openTo: ""
  };

  var step = 0;      /* 0 = age gate + basics, 1..7 = wizard steps */
  var refused = false;
  var TOTAL = 7;

  var STEP_TITLES = [
    "",
    "Where do you live?",
    "Your connection to Pakistan",
    "Your interests",
    "Discussion topics you enjoy",
    "Your values",
    "What are you looking for?",
    "Who would you like to meet?"
  ];

  /* ---------- helpers ---------- */
  function calcAge(dobStr){
    var d = new Date(dobStr + "T00:00:00");
    if (isNaN(d.getTime())) return -1;
    var t = new Date();
    var a = t.getFullYear() - d.getFullYear();
    var m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
    return a;
  }

  function optionList(opts){
    return opts.map(function(o){ return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('');
  }

  function ageOptions(selected){
    var html = "";
    for (var a = 18; a <= 80; a++) {
      html += '<option value="' + a + '"' + (String(a) === String(selected) ? " selected" : "") + ">" + a + "</option>";
    }
    return html;
  }

  function toggleIn(arr, val){
    var i = arr.indexOf(val);
    if (i > -1) arr.splice(i, 1); else arr.push(val);
  }

  function renderChips(container, options, selectedArr){
    options.forEach(function(opt){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (selectedArr.indexOf(opt) > -1 ? " chip-on" : "");
      b.textContent = opt;
      b.addEventListener("click", function(){
        toggleIn(selectedArr, opt);
        b.classList.toggle("chip-on");
      });
      container.appendChild(b);
    });
  }

  function readInputs(){
    /* Sync visible inputs into the draft before validation / navigation. */
    var q = function(sel){ return el.querySelector(sel); };
    var v = function(sel){ var n = q(sel); return n ? n.value : ""; };
    var t = function(sel){ var n = q(sel); return n ? n.value.trim() : ""; };
    if (step === 0) { draft.name = t("#obName"); draft.dob = v("#obDob"); draft.gender = v("#obGender"); }
    if (step === 1) { draft.country = v("#obCountry"); draft.city = t("#obCity"); }
    if (step === 2) { draft.background = v("#obBg"); draft.backgroundDetail = t("#obBgDetail"); }
    if (step === 6) { draft.mode = v("#obMode"); }
    if (step === 7) {
      draft.hopes = t("#obHopes"); draft.ageMin = v("#obAgeMin");
      draft.ageMax = v("#obAgeMax"); draft.openTo = t("#obOpenTo");
    }
  }

  function showRefusal(){
    refused = true;
    el.innerHTML =
      '<div class="card">' +
        '<h1 class="page-title">Thanks for your honesty</h1>' +
        '<p>PakConnect is strictly for adults aged 18 and over. This keeps our community safe and appropriate for everyone.</p>' +
        '<p>We\u2019d love to welcome you when you turn 18 \u2014 come back then and we\u2019ll get you set up.</p>' +
        '<button type="button" class="btn btn-primary" id="obRefHome">Back to home</button>' +
      '</div>';
    el.querySelector("#obRefHome").addEventListener("click", function(){ go("/"); });
  }

  /* ---------- validation per step ---------- */
  function validate(){
    if (step === 0) {
      if (!draft.name) { toast("Please enter a display name."); return false; }
      if (!draft.dob) { toast("Please enter your date of birth."); return false; }
      var age = calcAge(draft.dob);
      if (age < 0) { toast("That date of birth doesn\u2019t look right."); return false; }
      if (age < 18) { showRefusal(); return false; }
      if (!draft.gender) { toast("Please select how you\u2019d like to be listed."); return false; }
      draft.age = age;
      return true;
    }
    if (step === 1) {
      if (!draft.country) { toast("Please choose the country you live in."); return false; }
      if (!draft.city) { toast("Please enter your city or region."); return false; }
      return true;
    }
    if (step === 2) {
      if (!draft.background) { toast("Please choose your connection to Pakistan."); return false; }
      return true;
    }
    if (step === 3) {
      if (!draft.interests.length) { toast("Pick at least one interest."); return false; }
      return true;
    }
    if (step === 4) {
      if (!draft.favTopics.length) { toast("Pick at least one discussion topic."); return false; }
      return true;
    }
    if (step === 5) {
      if (!draft.values.length) { toast("Pick at least one value."); return false; }
      return true;
    }
    if (step === 6) {
      if (!draft.lookingFor.length) { toast("Tell us what you\u2019re looking for (at least one)."); return false; }
      if (!draft.mode) { toast("Please choose your preferred mode."); return false; }
      return true;
    }
    if (step === 7) {
      var lo = parseInt(draft.ageMin, 10), hi = parseInt(draft.ageMax, 10);
      if (isNaN(lo) || isNaN(hi)) { toast("Please choose a preferred age range."); return false; }
      if (lo > hi) { toast("Minimum age can\u2019t be higher than maximum age."); return false; }
      return true;
    }
    return true;
  }

  /* ---------- step bodies ---------- */
  function bodyFor(s){
    if (s === 0) {
      return '<p class="lp-hint">PakConnect is an adults-only community (18+). We ask for your date of birth first \u2014 nothing else.</p>' +
        '<div class="field"><label class="label" for="obName">Display name</label>' +
        '<input class="input" id="obName" type="text" maxlength="40" placeholder="e.g. Ayesha K." value="' + esc(draft.name) + '"></div>' +
        '<div class="field"><label class="label" for="obDob">Date of birth</label>' +
        '<input class="input" id="obDob" type="date" max="' + new Date().toISOString().slice(0,10) + '" value="' + esc(draft.dob) + '"></div>' +
        '<div class="field"><label class="label" for="obGender">Gender</label>' +
        '<select class="select" id="obGender"><option value="">Select\u2026</option>' +
        GENDERS.map(function(g){ return '<option value="' + esc(g) + '"' + (draft.gender === g ? " selected" : "") + ">" + esc(g) + "</option>"; }).join('') +
        '</select></div>';
    }
    if (s === 1) {
      return '<div class="field"><label class="label" for="obCountry">Country</label>' +
        '<select class="select" id="obCountry"><option value="">Select\u2026</option>' +
        COUNTRIES.map(function(c){ return '<option value="' + esc(c) + '"' + (draft.country === c ? " selected" : "") + ">" + esc(c) + "</option>"; }).join('') +
        '</select></div>' +
        '<div class="field"><label class="label" for="obCity">City/region (never your exact address)</label>' +
        '<input class="input" id="obCity" type="text" maxlength="60" placeholder="e.g. Lahore, London, Dubai" value="' + esc(draft.city) + '">' +
        '<p class="lp-hint">A city or region is plenty \u2014 never share your street address.</p></div>';
    }
    if (s === 2) {
      return '<div class="field"><label class="label" for="obBg">How are you connected to Pakistan?</label>' +
        '<select class="select" id="obBg"><option value="">Select\u2026</option>' +
        BACKGROUNDS.map(function(b){ return '<option value="' + esc(b) + '"' + (draft.background === b ? " selected" : "") + ">" + esc(b) + "</option>"; }).join('') +
        '</select></div>' +
        '<div class="field"><label class="label" for="obBgDetail">Anything you\u2019d like to add? (optional)</label>' +
        '<input class="input" id="obBgDetail" type="text" maxlength="120" placeholder="A sentence about your connection" value="' + esc(draft.backgroundDetail) + '"></div>';
    }
    if (s === 3) {
      return '<p class="lp-hint">Tap to select \u2014 pick at least one.</p><div class="lp-chips" id="obInterests"></div>';
    }
    if (s === 4) {
      return '<p class="lp-hint">You\u2019ll see discussions on these topics first. Pick at least one.</p><div class="lp-chips" id="obTopics"></div>';
    }
    if (s === 5) {
      return '<p class="lp-hint">What matters most to you? Pick at least one.</p><div class="lp-chips" id="obValues"></div>';
    }
    if (s === 6) {
      return '<p class="lp-hint">You can choose more than one \u2014 there\u2019s no pressure to decide everything now.</p>' +
        '<div class="lp-chips" id="obIntentions" style="margin-bottom:1rem"></div>' +
        '<div class="field"><label class="label" for="obMode">Preferred mode</label>' +
        '<select class="select" id="obMode"><option value="">Select\u2026</option>' +
        MODES.map(function(m){ return '<option value="' + esc(m) + '"' + (draft.mode === m ? " selected" : "") + ">" + esc(m) + "</option>"; }).join('') +
        '</select></div>';
    }
    if (s === 7) {
      var dMin = draft.ageMin || Math.max(18, (draft.age || 25) - 10);
      var dMax = draft.ageMax || Math.min(80, (draft.age || 25) + 10);
      return '<div class="field"><label class="label" for="obHopes">Your hopes \u2014 what would you love to find here?</label>' +
        '<textarea class="textarea" id="obHopes" rows="3" maxlength="500" placeholder="A few honest lines\u2026">' + esc(draft.hopes) + '</textarea></div>' +
        '<div class="field"><span class="label">Preferred age range</span>' +
        '<div class="grid-2"><select class="select" id="obAgeMin">' + ageOptions(dMin) + '</select>' +
        '<select class="select" id="obAgeMax">' + ageOptions(dMax) + '</select></div></div>' +
        '<div class="field"><label class="label" for="obOpenTo">Open to meeting people in (optional)</label>' +
        '<input class="input" id="obOpenTo" type="text" maxlength="120" placeholder="e.g. UK, Canada, Pakistan" value="' + esc(draft.openTo) + '">' +
        '<p class="lp-hint">Just countries or regions \u2014 never exact locations.</p></div>';
    }
    return "";
  }

  /* ---------- finish: build the user object and hand it to the store ---------- */
  function finish(){
    var seriousModes = draft.mode === "Relationship" || draft.mode === "Marriage" ||
      draft.lookingFor.indexOf("Serious relationship") > -1 ||
      draft.lookingFor.indexOf("Marriage") > -1;

    var about = draft.hopes;
    if (draft.openTo) {
      about += (about ? " " : "") + "Open to meeting people in: " + draft.openTo + ".";
    }
    if (draft.backgroundDetail) {
      about += (about ? " " : "") + draft.backgroundDetail;
    }

    var profile = {
      id: PC.util.uid("u"),
      isMe: true,
      demo: false,
      name: draft.name,
      age: draft.age,
      gender: draft.gender,
      country: draft.country,
      city: draft.city,
      background: draft.background,
      education: "",
      profession: "",
      languages: [],
      interests: draft.interests.slice(),
      traits: [],
      values: draft.values.slice(),
      goals: "",
      about: about,
      lookingFor: draft.lookingFor.slice(),
      mode: draft.mode,
      favTopics: draft.favTopics.slice(),
      verified: false,
      flagged: false,
      privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: seriousModes ? {
        intentions: draft.lookingFor.slice(),
        ageMin: parseInt(draft.ageMin, 10),
        ageMax: parseInt(draft.ageMax, 10),
        location: draft.openTo || draft.country,
        education: "",
        career: "",
        values: [],
        lifestyle: "",
        family: "",
        relocation: ""
      } : null
    };

    PC.store.createMe(profile);
    if (PC.store.saveSettings) PC.store.saveSettings({ onboarded: true });
    toast("Welcome to PakConnect \u2014 your profile is ready!");
    go("/discover");
  }

  /* ---------- render ---------- */
  function render(){
    if (refused) return;
    var isGate = (step === 0);
    var pct = isGate ? 0 : Math.round((step / TOTAL) * 100);
    var heading = isGate ? "Welcome to PakConnect" : ("Step " + step + " of " + TOTAL + " \u2014 " + STEP_TITLES[step]);

    el.innerHTML =
      '<div class="card">' +
        '<div class="scorebar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
          '<div class="scorebar-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<h1 class="page-title">' + esc(heading) + '</h1>' +
        '<div id="obBody">' + bodyFor(step) + '</div>' +
        '<div class="lp-nav">' +
          (step > 0 ? '<button type="button" class="btn btn-ghost" id="obBack">Back</button>' : "") +
          '<button type="button" class="btn btn-primary" id="obNext">' + (step === TOTAL ? "Create my profile" : "Next") + '</button>' +
        '</div>' +
      '</div>';

    /* wire chip groups */
    var chipMounts = {
      3: ["obInterests", INTERESTS, "interests"],
      4: ["obTopics", TOPIC_NAMES, "favTopics"],
      5: ["obValues", VALUES, "values"],
      6: ["obIntentions", INTENTIONS, "lookingFor"]
    };
    if (chipMounts[step]) {
      var m = chipMounts[step];
      var mount = el.querySelector("#" + m[0]);
      if (mount) renderChips(mount, m[1], draft[m[2]]);
    }

    var back = el.querySelector("#obBack");
    if (back) back.addEventListener("click", function(){
      readInputs();
      step--;
      render();
    });

    el.querySelector("#obNext").addEventListener("click", function(){
      readInputs();
      if (!validate()) return;   /* under-18 → showRefusal() runs inside */
      if (refused) return;
      if (step === TOTAL) { finish(); return; }
      step++;
      render();
    });
  }

  render();
};
