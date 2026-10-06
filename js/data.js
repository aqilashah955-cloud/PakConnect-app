/* PakConnect seed data — static demo profiles, topics, discussions, and content.
   Plain script (no modules) so the app runs from file:// with zero network. */
window.PC = window.PC || {};

/* EXT-POINT: seed-packs — locale or region-specific seed packs can merge into PC.seed */

PC.seed = {

  /* ------------------------------ users ------------------------------ */
  users: [
    {
      id: "u1", name: "Ayesha Khan", age: 26, gender: "F",
      country: "Pakistan", city: "Lahore",
      background: "Born and raised in Lahore",
      education: "Master's in Education", profession: "School teacher",
      languages: ["English", "Urdu", "Punjabi"],
      interests: ["reading", "teaching", "poetry", "hiking", "chai", "calligraphy", "volunteering"],
      traits: ["warm", "patient", "organized", "curious"],
      values: ["education", "family", "honesty", "community", "kindness"],
      goals: "Help her students fall in love with reading",
      about: "I'm a primary school teacher in Lahore who believes every child deserves a story that makes them feel seen. Outside the classroom you'll find me hiking with friends or hunting down the perfect cup of chai.",
      lookingFor: ["Friendship", "Discussions"],
      mode: "Friendship",
      favTopics: ["education", "books", "pakistani-culture"],
      verified: true, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: null
    },
    {
      id: "u2", name: "Bilal Ahmed", age: 31, gender: "M",
      country: "UK", city: "London",
      background: "Moved to London for work, roots in Karachi",
      education: "BS Computer Science", profession: "Software engineer",
      languages: ["English", "Urdu"],
      interests: ["coding", "startups", "football", "travel", "podcasts", "chai", "mentoring"],
      traits: ["ambitious", "analytical", "friendly", "pragmatic"],
      values: ["growth", "honesty", "family", "education", "hard work"],
      goals: "Build a startup that hires talent back home",
      about: "Software engineer in London by day, mentor to junior developers by night. I grew up in Karachi and miss the street food dearly. Always up for a conversation about tech, careers, or where to find the best biryani in London.",
      lookingFor: ["Networking", "Discussions"],
      mode: "Networking",
      favTopics: ["technology", "career", "entrepreneurship"],
      verified: false, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: null
    },
    {
      id: "u3", name: "Fatima Noor", age: 24, gender: "F",
      country: "USA", city: "Houston",
      background: "Second-generation Pakistani-American",
      education: "Medical student", profession: "Medical student",
      languages: ["English", "Urdu"],
      interests: ["medicine", "reading", "volunteering", "music", "photography", "chai", "yoga"],
      traits: ["compassionate", "curious", "disciplined", "thoughtful"],
      values: ["service", "education", "honesty", "family"],
      goals: "Finish medical school and serve underserved communities",
      about: "Medical student in Houston who grew up balancing two cultures and loving both. I volunteer at a free clinic on weekends and recharge with Urdu poetry and long walks.",
      lookingFor: ["Discussions", "Friendship"],
      mode: "Discussion",
      favTopics: ["books", "society", "life-abroad"],
      verified: false, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: null
    },
    {
      id: "u4", name: "Usman Tariq", age: 35, gender: "M",
      country: "Canada", city: "Toronto",
      background: "Immigrated to Canada a decade ago, from Lahore",
      education: "MBA", profession: "Entrepreneur",
      languages: ["English", "Urdu", "Punjabi"],
      interests: ["startups", "finance", "cricket", "travel", "mentoring", "podcasts"],
      traits: ["driven", "outgoing", "pragmatic", "generous"],
      values: ["hard work", "family", "community", "growth"],
      goals: "Scale his business and invest back in Pakistan",
      about: "I run a small logistics business in Toronto and love talking shop. I believe the diaspora has a lot to offer Pakistan, and I'm always looking for honest, ambitious people to build with.",
      lookingFor: ["Networking"],
      mode: "Networking",
      favTopics: ["entrepreneurship", "career", "pakistan-diaspora"],
      verified: false, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "connections", hideAge: false, restrictUnknown: false },
      marriagePrefs: null
    },
    {
      id: "u5", name: "Zara Sheikh", age: 28, gender: "F",
      country: "UAE", city: "Dubai",
      background: "Grew up in Islamabad, now living in Dubai",
      education: "BBA Marketing", profession: "Marketing manager",
      languages: ["English", "Urdu", "Arabic"],
      interests: ["travel", "photography", "food", "design", "movies", "fitness", "social media"],
      traits: ["creative", "sociable", "energetic", "adaptable"],
      values: ["creativity", "friendship", "family", "balance"],
      goals: "Launch her own branding studio one day",
      about: "Marketing manager in Dubai with a camera always in hand. I left Islamabad for work but carry it with me everywhere — especially the food. Love meeting new people and swapping travel stories.",
      lookingFor: ["Friendship"],
      mode: "Friendship",
      favTopics: ["travel", "food", "arts"],
      verified: false, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: null
    },
    {
      id: "u6", name: "Imran Malik", age: 42, gender: "M",
      country: "Saudi Arabia", city: "Riyadh",
      background: "Working in the Gulf for 15 years, originally from Lahore",
      education: "BSc Civil Engineering", profession: "Civil engineer",
      languages: ["English", "Urdu", "Arabic", "Punjabi"],
      interests: ["history", "reading", "cricket", "gardening", "documentaries", "mentoring"],
      traits: ["wise", "patient", "principled", "calm"],
      values: ["integrity", "family", "education", "community"],
      goals: "Mentor young engineers starting out back home",
      about: "Civil engineer in Riyadh with fifteen years of Gulf experience. I've watched skylines rise and still get excited about a well-built bridge. Happy to share what I've learned with anyone starting out.",
      lookingFor: ["Discussions", "Networking"],
      mode: "Discussion",
      favTopics: ["education", "career", "society"],
      verified: false, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "everyone", hideAge: true, restrictUnknown: false },
      marriagePrefs: null
    },
    {
      id: "u7", name: "Hira Shah", age: 22, gender: "F",
      country: "Australia", city: "Sydney",
      background: "Born in Pakistan, raised in Sydney",
      education: "Bachelor's in Design", profession: "Graphic designer",
      languages: ["English", "Urdu"],
      interests: ["design", "art", "music", "photography", "travel", "calligraphy", "movies"],
      traits: ["creative", "cheerful", "open-minded", "dreamer"],
      values: ["creativity", "kindness", "family", "authenticity"],
      goals: "Illustrate a children's book in Urdu and English",
      about: "Graphic designer in Sydney who grew up on stories from her nani's kitchen. I love blending Pakistani patterns with modern design. Always sketching, always curious.",
      lookingFor: ["Friendship"],
      mode: "Friendship",
      favTopics: ["arts", "pakistani-culture", "food"],
      verified: false, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: null
    },
    {
      id: "u8", name: "Daniyal Raza", age: 29, gender: "M",
      country: "UK", city: "Birmingham",
      background: "British-Pakistani, family from Gujranwala",
      education: "MSc Data Science", profession: "Data analyst",
      languages: ["English", "Urdu", "Punjabi"],
      interests: ["football", "data", "cooking", "travel", "board games", "podcasts", "fitness"],
      traits: ["thoughtful", "loyal", "funny", "down-to-earth"],
      values: ["honesty", "family", "loyalty", "growth"],
      goals: "Find a meaningful connection and settle down",
      about: "Data analyst in Birmingham who believes spreadsheets can solve almost anything — except where to eat. I cook a decent daal, love a good football debate, and I'm here hoping to meet someone special.",
      lookingFor: ["Serious relationship"],
      mode: "Relationship",
      favTopics: ["relationships-marriage", "food", "travel"],
      verified: false, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: null
    },
    {
      id: "u9", name: "Mahnoor Ali", age: 27, gender: "F",
      country: "Pakistan", city: "Karachi",
      background: "Born and raised in Karachi",
      education: "Master's in Journalism", profession: "Journalist",
      languages: ["English", "Urdu", "Sindhi"],
      interests: ["writing", "politics", "documentaries", "books", "travel", "social issues", "chai"],
      traits: ["fearless", "articulate", "empathetic", "principled"],
      values: ["truth", "justice", "education", "equality"],
      goals: "Report stories that change lives",
      about: "Journalist in Karachi covering stories that matter. I believe in asking hard questions with a kind heart. When I'm not reporting, I'm reading — or arguing about which city has better food (Karachi, obviously).",
      lookingFor: ["Discussions", "Networking"],
      mode: "Discussion",
      favTopics: ["current-social-issues", "society", "books"],
      verified: true, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: null
    },
    {
      id: "u10", name: "Ahmed Farooq", age: 33, gender: "M",
      country: "USA", city: "New York",
      background: "Moved to New York for finance, originally from Lahore",
      education: "MBA Finance", profession: "Finance professional",
      languages: ["English", "Urdu"],
      interests: ["finance", "investing", "travel", "reading", "cricket", "history", "mentoring"],
      traits: ["ambitious", "reliable", "respectful", "family-oriented"],
      values: ["family", "integrity", "education", "faith", "hard work"],
      goals: "Build a stable, loving family",
      about: "Finance professional in New York, originally from Lahore. I've built my career and now I'm ready to build a family. I value honesty, kindness, and a good sense of humor — and I make a mean breakfast on weekends.",
      lookingFor: ["Marriage"],
      mode: "Marriage",
      favTopics: ["relationships-marriage", "career", "family"],
      verified: false, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: {
        intentions: "Marriage",
        ageMin: 27, ageMax: 35,
        location: "USA preferred, open to relocation",
        education: "Graduate degree",
        career: "Established professional",
        values: "Family-oriented, honest, kind",
        lifestyle: "Balanced modern-traditional",
        family: "Close to family",
        relocation: "Open to discuss"
      }
    },
    {
      id: "u11", name: "Sana Iqbal", age: 30, gender: "F",
      country: "Canada", city: "Vancouver",
      background: "Immigrated to Canada as a teen, originally from Islamabad",
      education: "MD", profession: "Doctor",
      languages: ["English", "Urdu"],
      interests: ["medicine", "hiking", "reading", "volunteering", "cooking", "travel", "yoga"],
      traits: ["caring", "intelligent", "balanced", "warm"],
      values: ["compassion", "family", "education", "honesty"],
      goals: "Find a life partner who shares her values",
      about: "Doctor in Vancouver who spends her days caring for others and her evenings on mountain trails. I grew up in Islamabad and still miss the monsoon rains. Looking for a genuine connection built on mutual respect.",
      lookingFor: ["Marriage"],
      mode: "Marriage",
      favTopics: ["relationships-marriage", "family", "life-abroad"],
      verified: false, flagged: false, flagNote: "", demo: true,
      privacy: { visibility: "everyone", hideAge: false, restrictUnknown: false },
      marriagePrefs: {
        intentions: "Marriage",
        ageMin: 28, ageMax: 38,
        location: "Canada or USA",
        education: "Graduate degree preferred",
        career: "Professional",
        values: "Kind, honest, family-oriented",
        lifestyle: "Active and balanced",
        family: "Family is important",
        relocation: "Open to discuss"
      }
    },
    {
      id: "u12", name: "Kamran Hussain", age: 38, gender: "M",
      country: "Europe", city: "Berlin",
      background: "Living in Berlin for work",
      education: "BBA", profession: "Business consultant",
      languages: ["English", "Urdu"],
      interests: ["startups", "finance", "travel", "networking"],
      traits: ["outgoing", "persuasive", "confident"],
      values: ["ambition", "success", "growth"],
      goals: "Grow his consulting network",
      about: "Business consultant based in Berlin, working with clients across Europe. I enjoy meeting new people and exploring new opportunities.",
      lookingFor: ["Networking"],
      mode: "Networking",
      favTopics: ["entrepreneurship", "career"],
      verified: false, flagged: true,
      flagNote: "Several users reported requests for money — under review",
      demo: true,
      privacy: { visibility: "nobody", hideAge: false, restrictUnknown: true },
      marriagePrefs: null
    }
  ],

  /* ------------------------------ topics ------------------------------ */
  topics: [
    { id: "pakistani-culture", title: "Pakistani culture", desc: "Traditions, festivals, languages, and everyday life.", icon: "🎭" },
    { id: "education", title: "Education", desc: "Schools, universities, learning, and teaching.", icon: "📚" },
    { id: "career", title: "Career", desc: "Jobs, growth, freelancing, and work life.", icon: "💼" },
    { id: "books", title: "Books", desc: "What we're reading and why we love it.", icon: "📖" },
    { id: "technology", title: "Technology", desc: "AI, apps, gadgets, and the digital world.", icon: "💻" },
    { id: "travel", title: "Travel", desc: "Places to see in Pakistan and beyond.", icon: "✈️" },
    { id: "food", title: "Food", desc: "Recipes, restaurants, and delicious debates.", icon: "🍛" },
    { id: "arts", title: "Arts", desc: "Art, design, music, film, and creativity.", icon: "🎨" },
    { id: "entrepreneurship", title: "Entrepreneurship", desc: "Startups, business ideas, and building things.", icon: "🚀" },
    { id: "society", title: "Society", desc: "How we live together and treat each other.", icon: "🏛️" },
    { id: "family", title: "Family", desc: "Family life, parenting, and generations.", icon: "👨‍👩‍👧‍👦" },
    { id: "life-abroad", title: "Life abroad", desc: "Living outside Pakistan: joys and challenges.", icon: "🌍" },
    { id: "pakistan-diaspora", title: "Pakistan and the diaspora", desc: "Bridging home and the world.", icon: "🤝" },
    { id: "relationships-marriage", title: "Relationships and marriage", desc: "Thoughtful conversations about love and commitment.", icon: "💍" },
    { id: "current-social-issues", title: "Current social issues", desc: "The issues shaping our cities and country.", icon: "📰" }
  ],

  /* ------------------------- discussion threads ------------------------ */
  discussionThreads: [
    {
      id: "dt1", topicId: "pakistani-culture", title: "What Pakistani tradition would you never give up?",
      authorId: "u1", ts: Date.now() - 30 * 36e5,
      posts: [
        { id: "dt1p1", authorId: "u1", ts: Date.now() - 30 * 36e5, text: "For me it's Eid mornings at my grandmother's house — everyone piling into one room, sheer khurma, and the chaos of kids collecting Eidi. What's the tradition you'd protect at all costs?" },
        { id: "dt1p2", authorId: "u5", ts: Date.now() - 27 * 36e5, text: "The dawat culture! Back home, nobody ever 'just drops by' — there's always a full meal. In Dubai I try to recreate it, but it's not the same without the whole mohalla." },
        { id: "dt1p3", authorId: "u7", ts: Date.now() - 22 * 36e5, text: "Chai as a love language. My mum can tell my whole mood from how I hold my cup. Nobody in Sydney gets it." },
        { id: "dt1p4", authorId: "u3", ts: Date.now() - 18 * 36e5, text: "Truck art and rickshaw poetry. It's art for everyone, not locked in a gallery. I want it everywhere." }
      ]
    },
    {
      id: "dt2", topicId: "education", title: "Should schools teach AI literacy from primary level?",
      authorId: "u6", ts: Date.now() - 26 * 36e5,
      posts: [
        { id: "dt2p1", authorId: "u6", ts: Date.now() - 26 * 36e5, text: "I work with young engineers who struggle with the basics of AI tools. Shouldn't we start teaching AI literacy in primary school, the way we teach computers?" },
        { id: "dt2p2", authorId: "u1", ts: Date.now() - 24 * 36e5, text: "As a teacher, I say yes — but carefully. Kids should learn to think with AI, not let it think for them. Critical thinking first, tools second." },
        { id: "dt2p3", authorId: "u2", ts: Date.now() - 20 * 36e5, text: "Absolutely. My younger cousins in Pakistan use AI better than some of my colleagues. The gap is access, not ability." }
      ]
    },
    {
      id: "dt3", topicId: "career", title: "Pakistan or abroad: where is career growth better right now?",
      authorId: "u2", ts: Date.now() - 25 * 36e5,
      posts: [
        { id: "dt3p1", authorId: "u2", ts: Date.now() - 25 * 36e5, text: "Honest question. London pays well but the cost of living eats it all. Friends in Lahore and Karachi say remote work changed everything. Where would you bet on your career today?" },
        { id: "dt3p2", authorId: "u10", ts: Date.now() - 23 * 36e5, text: "New York gave me the career, but I watch friends back home building startups with a fraction of the budget. Growth is where the problems are — and Pakistan has plenty of problems to solve." },
        { id: "dt3p3", authorId: "u8", ts: Date.now() - 21 * 36e5, text: "Data roles are everywhere now. The real question is lifestyle: abroad you get stability, at home you get family. Pick your priority." },
        { id: "dt3p4", authorId: "u4", ts: Date.now() - 19 * 36e5, text: "Toronto taught me systems; Pakistan taught me hustle. The winners I know combine both — earn globally, build locally." }
      ]
    },
    {
      id: "dt4", topicId: "books", title: "Which Pakistani author should everyone read at least once?",
      authorId: "u3", ts: Date.now() - 24 * 36e5,
      posts: [
        { id: "dt4p1", authorId: "u3", ts: Date.now() - 24 * 36e5, text: "I'll start: Bano Qudsia. Raja Gidh rearranged my brain in the best way. Who's your pick?" },
        { id: "dt4p2", authorId: "u9", ts: Date.now() - 22 * 36e5, text: "Intizar Hussain, for how he writes about memory and migration. Every Karachiite should read him." },
        { id: "dt4p3", authorId: "u1", ts: Date.now() - 17 * 36e5, text: "For my students: the translations of classic stories that make our tales travel. A good story in any language still feels like home." }
      ]
    },
    {
      id: "dt5", topicId: "technology", title: "What's one tech skill every Pakistani should learn in 2026?",
      authorId: "u10", ts: Date.now() - 23 * 36e5,
      posts: [
        { id: "dt5p1", authorId: "u10", ts: Date.now() - 23 * 36e5, text: "Finance is being eaten by automation. My vote: learn to work with AI tools in your own field, whatever it is. The skill isn't coding — it's adapting." },
        { id: "dt5p2", authorId: "u2", ts: Date.now() - 21 * 36e5, text: "Plus one. I'd add: learn to sell your work online. A freelancer in Multan can out-earn an office worker in London now." },
        { id: "dt5p3", authorId: "u6", ts: Date.now() - 16 * 36e5, text: "And learn the basics of staying safe online while you're at it. Everyone's connected now; not everyone is careful." }
      ]
    },
    {
      id: "dt6", topicId: "travel", title: "Top 3 places in Pakistan every Pakistani should visit once",
      authorId: "u7", ts: Date.now() - 22 * 36e5,
      posts: [
        { id: "dt6p1", authorId: "u7", ts: Date.now() - 22 * 36e5, text: "My list: Hunza in autumn, the Badshahi Mosque at sunset, and the Makran coast. Fight me." },
        { id: "dt6p2", authorId: "u1", ts: Date.now() - 20 * 36e5, text: "Replacing Makran with Lahore Fort's Sheesh Mahal — biased, I know. And adding the desert fort at Derawar for pure drama." },
        { id: "dt6p3", authorId: "u5", ts: Date.now() - 15 * 36e5, text: "Mohenjo-daro! We walk past 5,000 years of history and call it a school trip. It deserves better." }
      ]
    },
    {
      id: "dt7", topicId: "food", title: "The biryani debate: Karachi, Lahore, or Hyderabad — who wins?",
      authorId: "u9", ts: Date.now() - 21 * 36e5,
      posts: [
        { id: "dt7p1", authorId: "u9", ts: Date.now() - 21 * 36e5, text: "Okay, settling this once and for all. Karachi biryani is the undisputed champion and I will not be taking questions. (Okay, I'll take questions.)" },
        { id: "dt7p2", authorId: "u1", ts: Date.now() - 20 * 36e5, text: "Lahore biryani walked so Karachi biryani could run. Ours has soul. And potatoes done RIGHT." },
        { id: "dt7p3", authorId: "u4", ts: Date.now() - 19 * 36e5, text: "From Toronto, where I pay a fortune for a box that disappoints me weekly: you're all winning and you don't even know it." },
        { id: "dt7p4", authorId: "u7", ts: Date.now() - 18 * 36e5, text: "Hyderabadi biryani entered the chat. The dum, the mirchi ka salan... Karachi and Lahore can fight for second place." },
        { id: "dt7p5", authorId: "u2", ts: Date.now() - 17 * 36e5, text: "Plot twist: the best biryani is whichever one your mother makes. This debate is rigged and we all know it." },
        { id: "dt7p6", authorId: "u9", ts: Date.now() - 16 * 36e5, text: "Okay, 'mother's biryani' wins by unanimous vote. But among restaurants — Karachi. Final answer." }
      ]
    },
    {
      id: "dt8", topicId: "arts", title: "Why is there so little Pakistani animated content for kids?",
      authorId: "u1", ts: Date.now() - 20 * 36e5,
      posts: [
        { id: "dt8p1", authorId: "u1", ts: Date.now() - 20 * 36e5, text: "My students watch cartoons from everywhere except Pakistan. We have the stories, the artists, the kids — what's missing?" },
        { id: "dt8p2", authorId: "u7", ts: Date.now() - 18 * 36e5, text: "As a designer: funding and distribution. A short film costs real money, and platforms reward volume over quality. But the talent is absolutely here." },
        { id: "dt8p3", authorId: "u3", ts: Date.now() - 14 * 36e5, text: "And language! My little cousins in the US would love cartoons in Urdu. There's a whole diaspora audience waiting." }
      ]
    },
    {
      id: "dt9", topicId: "entrepreneurship", title: "If you had Rs 1 million, what business would you start?",
      authorId: "u4", ts: Date.now() - 19 * 36e5,
      posts: [
        { id: "dt9p1", authorId: "u4", ts: Date.now() - 19 * 36e5, text: "I'll go first: a cloud kitchen for healthy desi meal prep in Toronto. The diaspora would fund it in a day. What's your million-rupee idea?" },
        { id: "dt9p2", authorId: "u8", ts: Date.now() - 17 * 36e5, text: "A data consultancy for small Pakistani exporters — help them find buyers abroad with actual numbers instead of guesswork." },
        { id: "dt9p3", authorId: "u2", ts: Date.now() - 13 * 36e5, text: "I'd build a platform connecting Pakistani freelancers with clients in the Gulf. The talent is there; the trust layer isn't." }
      ]
    },
    {
      id: "dt10", topicId: "society", title: "How do we get more women into the workforce?",
      authorId: "u9", ts: Date.now() - 18 * 36e5,
      posts: [
        { id: "dt10p1", authorId: "u9", ts: Date.now() - 18 * 36e5, text: "Pakistan has one of the lowest female workforce participation rates in the region. It's not about talent — our women top every exam. What's actually holding us back, and what would fix it?" },
        { id: "dt10p2", authorId: "u11", ts: Date.now() - 16 * 36e5, text: "From the medical world: safe transport and flexible hours change everything. Half my brilliant classmates quit after starting families because the system wouldn't bend an inch." },
        { id: "dt10p3", authorId: "u1", ts: Date.now() - 12 * 36e5, text: "And childcare! As a teacher I see mothers who want to work but can't afford to leave their kids anywhere safe. Solve transport and childcare, and watch the numbers move." }
      ]
    },
    {
      id: "dt11", topicId: "family", title: "Joint family or nuclear — what's your honest take?",
      authorId: "u10", ts: Date.now() - 17 * 36e5,
      posts: [
        { id: "dt11p1", authorId: "u10", ts: Date.now() - 17 * 36e5, text: "Growing up in a joint family meant never being lonely and never being alone — both blessings. As I think about my own family, I'm torn. Honest takes only." },
        { id: "dt11p2", authorId: "u11", ts: Date.now() - 15 * 36e5, text: "Joint family gives you built-in support; nuclear gives you breathing room. I think the answer is joint family with boundaries — love plus a locked door." },
        { id: "dt11p3", authorId: "u6", ts: Date.now() - 11 * 36e5, text: "After years abroad, I'd trade a lot for the noise of a full house at dinner. You don't miss it until it's quiet." }
      ]
    },
    {
      id: "dt12", topicId: "life-abroad", title: "How do you stay connected to Pakistan while living abroad?",
      authorId: "u2", ts: Date.now() - 16 * 36e5,
      posts: [
        { id: "dt12p1", authorId: "u2", ts: Date.now() - 16 * 36e5, text: "London is great, but some days I feel like a tourist in my own culture. What keeps you connected — food, music, community, calls home?" },
        { id: "dt12p2", authorId: "u5", ts: Date.now() - 14 * 36e5, text: "Dubai makes it easier — there's a Pakistani restaurant on every corner. But honestly, it's the family group chat that keeps me grounded. Hundreds of messages a day, zero regrets." },
        { id: "dt12p3", authorId: "u11", ts: Date.now() - 12 * 36e5, text: "I cook my mother's recipes on Sundays and call her while the daal simmers so she can correct me in real time. Technology meets tradition." },
        { id: "dt12p4", authorId: "u8", ts: Date.now() - 10 * 36e5, text: "Birmingham has a huge Pakistani community, so I cheat. Cricket screenings, Eid festivals, the works. The homesickness still hits late at night though." }
      ]
    },
    {
      id: "dt13", topicId: "pakistan-diaspora", title: "Should the diaspora invest more back home?",
      authorId: "u4", ts: Date.now() - 15 * 36e5,
      posts: [
        { id: "dt13p1", authorId: "u4", ts: Date.now() - 15 * 36e5, text: "Remittances keep the economy afloat, but what about real investment — businesses, startups, skills? Or is the risk just too high?" },
        { id: "dt13p2", authorId: "u10", ts: Date.now() - 13 * 36e5, text: "I'd invest in people, not just projects. Mentor a founder, fund a student's education. Money sent with guidance goes further." },
        { id: "dt13p3", authorId: "u3", ts: Date.now() - 9 * 36e5, text: "The diaspora also brings ideas back. My cousin returned from the US and opened a clinic in a village that had none. That's investment too." }
      ]
    },
    {
      id: "dt14", topicId: "relationships-marriage", title: "How much should families be involved in choosing a life partner?",
      authorId: "u11", ts: Date.now() - 14 * 36e5,
      posts: [
        { id: "dt14p1", authorId: "u11", ts: Date.now() - 14 * 36e5, text: "In our culture, marriage joins families, not just individuals. But where's the line between guidance and pressure? Curious how others see it." },
        { id: "dt14p2", authorId: "u10", ts: Date.now() - 11 * 36e5, text: "I want my family's wisdom but my own decision. They know me, but I have to live the choice. Respectful involvement, not a veto." },
        { id: "dt14p3", authorId: "u1", ts: Date.now() - 8 * 36e5, text: "The best marriages I know had families who advised honestly and then stepped back. The worst had families who never stepped back." }
      ]
    },
    {
      id: "dt15", topicId: "current-social-issues", title: "What's the one city problem you'd fix first?",
      authorId: "u9", ts: Date.now() - 13 * 36e5,
      posts: [
        { id: "dt15p1", authorId: "u9", ts: Date.now() - 13 * 36e5, text: "Traffic, water, waste, transport — pick your fighter. If you had a magic wand for one city problem, what gets fixed first and why?" },
        { id: "dt15p2", authorId: "u6", ts: Date.now() - 10 * 36e5, text: "Public transport, no contest. Fix that and you fix job access, pollution, and half the traffic in one move." },
        { id: "dt15p3", authorId: "u2", ts: Date.now() - 7 * 36e5, text: "Waste management. We normalize piles of garbage like it's weather. Clean streets change how a city feels about itself." }
      ]
    }
  ],

  /* ------------------------------ reports ------------------------------ */
  reports: [
    {
      id: "r1", reporterId: "u3", targetId: "u12",
      reason: "Scam / money request",
      detail: "He messaged me and two friends about a 'guaranteed returns' investment scheme and asked us to send money. It felt wrong, so I'm reporting it here.",
      ts: Date.now() - 2 * 864e5, status: "open"
    },
    {
      id: "r2", reporterId: "u2", targetId: "u4",
      reason: "Inappropriate content",
      detail: "His post in the career discussion thread used insulting language toward other members who disagreed with him.",
      ts: Date.now() - 1 * 864e5, status: "open"
    }
  ],

  /* ------------------------- conversation helpers ---------------------- */
  starters: [
    "What's a tradition from home you still follow wherever you live?",
    "If you could have chai with any Pakistani personality, who would it be?",
    "What's the best piece of advice your parents ever gave you?",
    "Which city — in Pakistan or abroad — feels most like home to you?",
    "What's something new you're learning right now?",
    "What's your favorite Pakistani dish to cook (or eat)?"
  ],

  replyIdeas: [
    "That's so interesting — tell me more!",
    "I completely agree. What got you into that?",
    "Same here! What else do you enjoy doing?",
    "I'd love to hear your take on this.",
    "That's a great point — I hadn't thought of it that way.",
    "What do you like to do on weekends?"
  ],

  /* ------------------------------ community ---------------------------- */
  communityBase: {
    "Pakistan": 1240,
    "UK": 860,
    "USA": 720,
    "Canada": 540,
    "UAE": 480,
    "Saudi Arabia": 310,
    "Australia": 260,
    "Europe": 390,
    "Worldwide": 150
  },

  /* ------------------------------ guidelines --------------------------- */
  guidelines: [
    { title: "18+ only", text: "PakConnect is strictly for adults aged 18 and over. If you're under 18, this app isn't for you yet." },
    { title: "Be respectful", text: "Treat everyone with kindness. No hate speech, harassment, bullying, or personal attacks — ever." },
    { title: "No money requests", text: "Never ask for money, and never send money to someone you met here. Report anyone who asks." },
    { title: "Protect your privacy", text: "Never share phone numbers, home addresses, CNIC details, or passwords with anyone on the app." },
    { title: "Be honest", text: "Be yourself. Fake profiles, impersonation, and misleading information are not allowed." },
    { title: "Keep discussions genuine", text: "Use discussions for real conversation. No spam, advertising, or repeated self-promotion." },
    { title: "Report concerns", text: "See something that feels wrong? Report it. Every report is reviewed by our team." },
    { title: "Stay safe", text: "Take your time getting to know people. If you ever meet in person, meet in a public place and tell someone you trust." }
  ],

  /* --------------------------- premium upsell -------------------------- */
  premiumFeatures: [
    "Verified badge",
    "Unlimited connections",
    "Advanced filters",
    "Video calls (coming)",
    "Events access"
  ]
};
