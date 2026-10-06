window.PC = window.PC || {};
PC.views = PC.views || {};

/* PakConnect landing / marketing page.
   Full public marketing page: hero, trust chips, how-it-works, modes,
   SEO sections, stats band, safety strip, footer.
   EXT-POINT: hero-auth — swap the demo CTAs for real backend auth when available.
   EXT-POINT: analytics — page-view / CTA tracking can hook into the wired buttons.
*/
PC.views.landing = function(el, params){
  var esc = PC.util.esc;
  var go = PC.router.go;
  var toast = PC.ui.toast;

  var settings = (PC.store && PC.store.settings) ? PC.store.settings() : {};
  var onboarded = !!(settings && settings.onboarded);

  var MODES = PC.util.MODES || ["Friendship","Discussion","Networking","Relationship","Marriage"];

  /* Eight-point star motif (subtle, decorative). */
  var STAR = '<svg class="lp-star" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<polygon fill="currentColor" opacity="0.12" points="96,50 66.6,43.1 82.5,17.5 56.9,33.4 50,4 43.1,33.4 17.5,17.5 33.4,43.1 4,50 33.4,56.9 17.5,82.5 43.1,66.6 50,96 56.9,66.6 82.5,82.5 66.6,56.9"/>' +
    '</svg>';

  var modeBlurbs = {
    "Friendship": "Real friends who get your culture, wherever you live.",
    "Discussion": "Talk first, match later — ideas before introductions.",
    "Networking": "Grow your professional circle across borders.",
    "Relationship": "Something meaningful, at your own pace.",
    "Marriage": "A respectful, family-friendly path to forever."
  };

  var seoSections = [
    { h: "Pakistani dating app",
      p: [
        "PakConnect is a dating app made for Pakistanis — whether you were born in Pakistan, grew up in the diaspora, or simply share the culture. Create a profile that reflects who you are, join conversations about the topics you care about, and meet people through genuine discussion first.",
        "Dating here has no pressure and no rush. You choose your mode — from friendship to serious relationship — and every match score is shown as a suggestion only, because compatibility can't be reduced to a number. Safety comes first: PakConnect is 18+ only, never asks for your phone number or address, and our safety guidance reminds you to keep conversations on the platform until you truly trust someone."
      ] },
    { h: "Pakistani friendship app",
      p: [
        "Moving abroad can be lonely — even in a crowded city. PakConnect's friendship mode helps Pakistanis worldwide find real friends who understand your jokes, your food cravings, and your family stories. It starts in our discussion spaces, where you meet people through what you think, not just what you look like.",
        "Friendship here is low-pressure by design. There are no forced matches and no awkward cold messages — just shared interests, honest conversation, and the freedom to connect when it feels right. And with no public contact information anywhere on profiles, your privacy stays in your hands."
      ] },
    { h: "Pakistani marriage app",
      p: [
        "For those seeking marriage, PakConnect offers a respectful, intention-first space. Set your marriage preferences — age range, values, location, and what matters to your family — and meet people who are serious about the same journey. Family involvement is welcome, with family invites built in.",
        "There is no pressure here: nobody is pushed toward marriage before they're ready, and discussion-first matching means you get to know someone's character through conversation. Safety is central — PakConnect never asks for sensitive documents, and our community guidelines and moderation keep the space respectful for everyone."
      ] },
    { h: "Pakistani community worldwide",
      p: [
        "PakConnect is home to a Pakistani community that spans nine regions — from Pakistan itself to the UK, USA, Canada, the Gulf, Australia, and beyond. Each country community is a place to share news, ask questions, plan meetups, and feel a little closer to home.",
        "Community here means more than profiles. Our fifteen discussion topics — from cricket to careers, from Urdu literature to diaspora life — give everyone a way to belong and be heard. Newcomers are welcomed, moderators keep conversations kind, and everything runs on mutual respect."
      ] },
    { h: "Pakistanis abroad",
      p: [
        "Living abroad brings opportunity — and homesickness. PakConnect was built for Pakistanis abroad: students in a new city, professionals far from family, and families building a new life. Find people who miss the same street food, celebrate the same Eid, and understand the balancing act of two cultures.",
        "Start by joining discussions, then connect one-to-one when you're comfortable. There is no pressure to share anything personal — no phone numbers, no addresses — and our safety guidance helps you spot scams and keep your information private."
      ] },
    { h: "Pakistani diaspora",
      p: [
        "The Pakistani diaspora carries the culture across generations and continents. PakConnect brings together first-generation immigrants and second- or third-generation Pakistanis who want to stay connected to their roots — through language, food, music, faith, and shared stories.",
        "Whether you're rediscovering Urdu, looking for friends who understand your dual identity, or hoping to meet someone with shared values, you'll find space here. Every interaction is no-pressure, every profile is yours to control, and our 18+ community keeps the space appropriate and safe."
      ] },
    { h: "Meet Pakistanis online",
      p: [
        "Meeting Pakistanis online should feel natural, not transactional. On PakConnect, you meet people the way friendships actually form: through conversation. Our discussion-first approach shows you who participated in the same topics as you, and match scores highlight shared interests as suggestions — never as guarantees.",
        "You control every step. Browse profiles, join threads, send a message when you're ready — and block or report anyone who makes you uncomfortable, with real moderation behind every report. No contact details are ever shown publicly, so you stay in charge of your privacy."
      ] },
    { h: "Pakistani singles worldwide",
      p: [
        "Pakistani singles around the world share the same challenge: finding someone who understands their values, their ambitions, and their family. PakConnect's relationship and marriage modes are built for exactly that — with detailed preferences, intention badges, and conversation-first matching.",
        "Take it at your own pace. There is no pressure to commit, no countdown, and no expectation beyond honest conversation. Keep your personal details private, never send money to anyone you meet online, and let trust build naturally — that's the PakConnect way."
      ] },
    { h: "Pakistani matchmaking",
      p: [
        "Pakistani matchmaking has always been about family, values, and trust. PakConnect brings that tradition online with a modern, respectful twist: clear intentions, verified profiles, family invites, and preferences that cover education, career, lifestyle, and relocation — so the important conversations happen early.",
        "Unlike old-fashioned setups, you stay in control. You choose your mode, you see suggestions rather than arranged outcomes, and there is never any pressure to say yes. Combined with strict safety rules — no sensitive documents, no public contact info, active moderation — it's matchmaking you can trust."
      ] }
  ];

  /* ---------- Hero ---------- */
  var heroCta = onboarded
    ? '<button type="button" class="btn btn-primary" id="lpPrimary">Open PakConnect</button>'
    : '<button type="button" class="btn btn-primary" id="lpPrimary">Get started \u2014 it\u2019s free</button>' +
      '<button type="button" class="btn btn-ghost" id="lpDemo">Explore demo</button>';

  var hero = '<header class="hero card">' +
      '<div class="lp-star-wrap">' + STAR + STAR + STAR + '</div>' +
      '<h1 class="page-title">Connect with Pakistanis Worldwide.</h1>' +
      '<p class="lp-sub">Meet people, share ideas, build friendships, discover meaningful relationships, and explore marriage \u2014 wherever you are in the world.</p>' +
      '<div class="lp-cta">' + heroCta + '</div>' +
      '<div class="lp-chips">' +
        '<span class="chip">18+ only</span>' +
        '<span class="chip">No public contact info</span>' +
        '<span class="chip">Discussion-first</span>' +
      '</div>' +
    '</header>';

  /* ---------- How it works ---------- */
  var steps = [
    { n: "1", t: "Create profile", d: "Tell us who you are, what you value, and what you're looking for \u2014 in minutes, with zero sensitive documents." },
    { n: "2", t: "Join discussions", d: "Talk about cricket, careers, culture and more. Great connections start with great conversations." },
    { n: "3", t: "Connect", d: "Match on shared interests, chat one-to-one, and build friendships \u2014 or something more \u2014 at your own pace." }
  ];
  var howHtml = '<section><h2 class="section-title">How it works</h2><div class="grid-2">' +
    steps.map(function(s){
      return '<div class="card"><div class="lp-step-n">' + s.n + '</div>' +
        '<h3>' + esc(s.t) + '</h3><p>' + esc(s.d) + '</p></div>';
    }).join('') + '</div></section>';

  /* ---------- Modes strip ---------- */
  var modesHtml = '<section><h2 class="section-title">Five ways to connect \u2014 you choose</h2><div class="lp-modes">' +
    MODES.map(function(m){
      return '<div class="card lp-mode"><strong>' + esc(m) + '</strong>' +
        '<p>' + esc(modeBlurbs[m] || "") + '</p></div>';
    }).join('') + '</div></section>';

  /* ---------- SEO sections ---------- */
  var seoHtml = seoSections.map(function(s){
    return '<section class="seo-section card"><h2>' + esc(s.h) + '</h2>' +
      s.p.map(function(par){ return '<p>' + esc(par) + '</p>'; }).join('') + '</section>';
  }).join('');

  /* ---------- Stats band ---------- */
  var statsHtml = '<section class="lp-stats">' +
      '<span class="badge badge-demo">demo</span>' +
      '<div class="stat-card"><strong>9</strong><span>regions across the globe</span></div>' +
      '<div class="stat-card"><strong>15</strong><span>discussion topics</span></div>' +
      '<div class="stat-card"><strong>5</strong><span>modes, zero pressure</span></div>' +
    '</section>';

  /* ---------- Safety strip ---------- */
  var safetyHtml = '<section class="banner-warn" role="note">' +
      '<strong>\u26A0\uFE0F Safety first:</strong> Never send money to strangers. ' +
      'Never share your phone number, address, or sensitive documents with people you meet online. ' +
      'PakConnect will never ask you for these either. ' +
      '<button type="button" class="btn btn-sm btn-ghost" id="lpSafety">Read safety guidance</button>' +
    '</section>';

  /* ---------- Footer ---------- */
  var footHtml = '<footer class="lp-foot">' +
      '<nav class="lp-footnav">' +
        '<button type="button" data-go="/discover">Discover</button>' +
        '<button type="button" data-go="/discussions">Discussions</button>' +
        '<button type="button" data-go="/communities">Communities</button>' +
        '<button type="button" data-go="/safety">Safety</button>' +
      '</nav>' +
      '<p class="lp-demo-note">Demo experience \u2014 data stays on your device.</p>' +
    '</footer>';

  el.innerHTML = '<div class="lp-wrap">' +
    hero + howHtml + modesHtml + statsHtml + seoHtml + safetyHtml + footHtml +
    '</div>';

  /* ---------- Wire every button ---------- */
  var primary = el.querySelector("#lpPrimary");
  if (primary) primary.addEventListener("click", function(){
    go(onboarded ? "/discover" : "/onboarding");
  });

  var demo = el.querySelector("#lpDemo");
  if (demo) demo.addEventListener("click", function(){
    // One-tap demo profile so "Explore demo" works without the wizard.
    // EXT-POINT: demo-mode — replace with guest session when backend exists.
    PC.store.createMe({
      id: "me", name: "Demo Explorer", age: 28, gender: "Prefer not to say",
      country: "Worldwide", city: "Everywhere", background: "Friend of the culture",
      education: "", profession: "", languages: ["English", "Urdu"],
      interests: ["Travel", "Food", "Technology", "Books"],
      traits: ["Curious", "Friendly"], values: ["Education", "Family"],
      goals: "Exploring PakConnect.", about: "Just exploring the demo.",
      lookingFor: ["Friendship", "Discussions"], mode: "Friendship",
      favTopics: ["culture", "travel", "food"], verified: false, flagged: false,
      demo: false, privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: null
    });
    PC.store.saveSettings({ onboarded: true });
    toast("Exploring the demo \u2014 all data stays on this device.");
    go("/discover");
  });

  var safety = el.querySelector("#lpSafety");
  if (safety) safety.addEventListener("click", function(){ go("/safety"); });

  var navBtns = el.querySelectorAll("[data-go]");
  for (var i = 0; i < navBtns.length; i++) {
    (function(btn){
      btn.addEventListener("click", function(){ go(btn.getAttribute("data-go")); });
    })(navBtns[i]);
  }
};
