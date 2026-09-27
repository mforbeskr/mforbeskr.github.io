/*
 * Everything on the site that changes over time lives here.
 *
 * Semester: the number (1st, 2nd, 3rd…) is calculated from studyStart.
 * Add what you're studying under the semester number each February/August.
 * If a semester has no entry yet, a neutral fallback is shown.
 *
 * Projects: add a new object to the list. Order here = order on the site.
 *   featured: true      -> also shown under "Selected work" on the front page
 *   wide: true          -> takes two columns on the portfolio page
 *   tags                -> used by the filters: personal, school, web, java, csharp, app
 *   link                -> text next to the arrow, e.g. "Visit", "GitHub", "Play"
 *   media, one of:
 *     { type: "image", src, alt, contain }                 screenshot or picture
 *     { type: "logo", src, alt, name, className }          logo on a plain tile
 *     { type: "tile", name, sub, icon, colors: [a, b] }    gradient tile with text
 *     { type: "placeholder" }                              simple </> tile
 */
window.SITE = {
  studyStart: "2025-08-01",
  semesters: 7,

  studying: {
    3: {
      short: "C# & .NET, building a CPU in DigiSim, and algorithms & complexity",
      long: "learning C# and .NET, building a CPU from logic gates in DigiSim, and digging into algorithms and time complexity",
    },
  },

  studyingFallback: {
    short: "Software Engineering at VIA University College",
    long: "studying Software Engineering at VIA University College",
  },

  projects: [
    {
      title: "Tackly",
      url: "https://www.tackly.dk/",
      tags: ["personal", "app", "web"],
      featured: true,
      wide: true,
      badge: "Coming soon to Google Play",
      desc: "A Danish peer-to-peer marketplace for equestrian equipment. I'm building it together with a friend: a mobile app in Expo / React Native on Supabase, plus a separate React admin panel for moderation, support and role-based access. It will be published on Google Play under our developer name, NorthFrame.",
      chips: ["React Native", "TypeScript", "Supabase"],
      link: "Visit",
      media: { type: "logo", src: "assets/tackly.png", alt: "Tackly logo", name: "Tackly", className: "tile-tackly" },
    },
    {
      title: "Hos Qilej",
      url: "https://www.hosqilej.dk/",
      tags: ["personal", "web"],
      featured: true,
      desc: "Website for a barbershop in Roskilde — services, prices, opening hours and integrated online booking.",
      chips: ["HTML", "CSS", "Freelance"],
      link: "Visit",
      media: { type: "logo", src: "assets/hosqilej.png", alt: "Hos Qilej logo", className: "tile-qilej" },
    },
    {
      title: "LearnHub",
      url: "https://github.com/mforbeskr/SEP2-Project-LearnHub",
      tags: ["school", "java", "web"],
      featured: true,
      badge: "Product Owner",
      desc: "A learning platform with courses, modules, lessons and enrollments — a Spring Boot REST API on PostgreSQL with a React frontend, covered by unit and integration tests. Built in a team of four, with me as Product Owner.",
      chips: ["Spring Boot", "React", "PostgreSQL"],
      link: "GitHub",
      media: {
        type: "tile",
        className: "tile-learnhub",
        name: "LearnHub",
        sub: "2nd semester project",
        icon: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
      },
    },
    {
      title: "Smart Parking Lot",
      url: "https://github.com/mforbeskr/NEC_Exam_2026_Project",
      tags: ["school", "java"],
      desc: "Exam project on networking and concurrency, built with a classmate. A socket server exchanges JSON messages with JavaFX sensor, light and display clients, using producer–consumer and heartbeats.",
      chips: ["Java", "Sockets", "Concurrency"],
      link: "GitHub",
      media: {
        type: "tile",
        name: "ParkingLot",
        sub: "client ⇄ server",
        colors: ["#3b6fd6", "#1e3a7a"],
        icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
      },
    },
    {
      title: "Stock Trading Game",
      url: "https://github.com/mforbeskr/StockTradingGame",
      tags: ["school", "java"],
      desc: "A stock market simulator in JavaFX. Stock behaviour is driven by the State pattern, trading fees by the Strategy pattern, and data is saved to files with a Unit of Work.",
      chips: ["Java", "JavaFX", "Design patterns"],
      link: "GitHub",
      media: {
        type: "tile",
        name: "StockSim",
        sub: "2nd semester",
        colors: ["#4a7c59", "#24402d"],
        icon: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
      },
    },
    {
      title: "DNP Forum",
      url: "https://github.com/mforbeskr/DNPproject",
      tags: ["school", "csharp"],
      badge: "In progress",
      desc: "A Reddit-inspired forum application in C# and .NET — a 3rd-semester project built up assignment by assignment: entities and repositories, a CLI and file persistence so far.",
      chips: ["C#", ".NET"],
      link: "GitHub",
      media: {
        type: "tile",
        name: "Forum",
        sub: "C# · .NET",
        colors: ["#7c4dff", "#512bd4"],
        icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      },
    },
    {
      title: "Traceability Service",
      url: "https://github.com/mforbeskr/DSY_Project",
      tags: ["school", "java"],
      badge: "In progress",
      desc: "A 3rd-semester distributed systems project: a Java gRPC service backed by PostgreSQL that traces products and their parts back to their origin.",
      chips: ["Java", "gRPC", "PostgreSQL"],
      link: "GitHub",
      media: {
        type: "tile",
        name: "Traceability",
        sub: "gRPC service",
        colors: ["#2b8a8a", "#164a4f"],
        icon: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5 10.8 16M16 7.5 13.2 16M8.5 6h7"/>',
      },
    },
    {
      title: "Kattis Solutions",
      url: "https://github.com/mforbeskr/kattis",
      tags: ["personal", "java"],
      desc: "My solutions to algorithmic programming problems from Kattis — practising problem-solving in Java.",
      chips: ["Java", "Algorithms"],
      link: "GitHub",
      media: { type: "tile", className: "tile-kattis", name: ">_ kattis", sub: "accepted ✓" },
    },
    {
      title: "Kløverly Application",
      url: "https://github.com/mforbeskr/SEP1-Application-Kloeverly",
      tags: ["school", "java"],
      desc: "1st semester project — a JavaFX desktop app that keeps track of residents, tasks and points.",
      chips: ["Java", "JavaFX"],
      link: "GitHub",
      media: { type: "image", src: "https://i.ibb.co/JwMp3TbK/Sk-rmbillede-2025-12-17-121902.png", alt: "Screenshot of the Kløverly JavaFX application" },
    },
    {
      title: "Kløverly Website",
      url: "https://mforbeskr.github.io/SEP1-Website-Kloeverly/",
      tags: ["school", "web"],
      desc: "The companion website for the Kløverly semester project, built from scratch with HTML and CSS.",
      chips: ["HTML", "CSS"],
      link: "Visit",
      media: { type: "image", src: "https://i.ibb.co/4gFJVHp1/KLOIN.png", alt: "Screenshot of the Kløverly website" },
    },
    {
      title: "Whack-A-Jan",
      url: "https://mforbeskr.github.io/Browsergame-WhackAJan/",
      tags: ["personal", "web"],
      desc: "A whack-a-mole style browser game written in plain JavaScript with DOM interaction.",
      chips: ["JavaScript", "Game"],
      link: "Play",
      media: { type: "image", src: "https://i.ibb.co/RpL7VmxK/g5-WU5-Ydi-400x400-removebg-preview.webp", alt: "Whack-A-Jan game character", contain: true },
    },
    {
      title: "Monster Match",
      url: "https://mforbeskr.github.io/Monster-Match/",
      tags: ["personal", "web"],
      desc: "A sign-up form for a custom dating-app concept, built with HTML and CSS.",
      chips: ["HTML", "CSS"],
      link: "Visit",
      media: { type: "image", src: "https://i.ibb.co/zTHB9qn4/monstermatch5.png", alt: "Screenshot of the Monster Match sign-up page" },
    },
    {
      title: "My First Website",
      url: "https://mforbeskr.github.io/MinSideTest/",
      tags: ["personal", "web"],
      desc: "Where it all started — a small school task that became my first web playground.",
      chips: ["HTML", "Playground"],
      link: "Visit",
      media: { type: "placeholder" },
    },
  ],
};
