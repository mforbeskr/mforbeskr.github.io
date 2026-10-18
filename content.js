/*
 * Everything on the site that changes over time lives here.
 *
 * Semester: the number (1st, 2nd, 3rd…) is calculated from studyStart.
 * Add what you're studying under the semester number each February/August.
 * If a semester has no entry yet, a neutral fallback is shown.
 *
 * Projects: add a new object to the list. Order here = order on the site.
 *   featured: true      -> shown before "Show all" in the Portfolio section (five fill the grid
 *                          neatly, since Tackly is wide)
 *   wide: true          -> takes two columns
 *   tags                -> used by the filters: personal, school, web, java, csharp, app
 *   link                -> text next to the arrow, e.g. "Visit", "GitHub", "Play"
 *   media, one of:
 *     { type: "image", src, alt, contain }                 screenshot or picture
 *     { type: "logo", src, alt, name, className }          logo on a plain tile
 *     { type: "tile", name, sub, icon, colors: [a, b] }    gradient tile with text
 *     { type: "placeholder" }                              simple </> tile
 *   da: { ... }         -> Danish versions of any of the fields above (for media, only the parts that change)
 *
 * GitHub: public repos with the topic below are added automatically under
 * "More on GitHub" in the Portfolio section (unless they're already listed here).
 * Extra topics "school", "personal" or "app" on a repo make the filters work.
 */
window.SITE = {
  studyStart: "2025-08-01",
  semesters: 7,

  github: { user: "mforbeskr", topic: "portfolio" },

  studying: {
    3: {
      short: "C# & .NET, building a CPU in DigiSim, and algorithms & complexity",
      long: "learning C# and .NET, building a CPU from logic gates in DigiSim, and digging into algorithms and time complexity",
      da: {
        short: "C# & .NET, at bygge en CPU i DigiSim og algoritmer & kompleksitet",
        long: "lærer C# og .NET, bygger en CPU af logiske gates i DigiSim og dykker ned i algoritmer og tidskompleksitet",
      },
    },
  },

  studyingFallback: {
    short: "Software Engineering at VIA University College",
    long: "studying Software Engineering at VIA University College",
    da: {
      short: "Softwareingeniør på VIA University College",
      long: "læser til softwareingeniør på VIA University College",
    },
  },

  projects: [
    {
      title: "Tackly",
      url: "https://tackly.dk/",
      tags: ["personal", "app", "web"],
      featured: true,
      wide: true,
      badge: "Live on Google Play · App Store next",
      desc: "A Danish peer-to-peer marketplace for equestrian equipment; a mobile app in Expo / React Native on Supabase, plus a separate React admin panel for moderation, support and role-based access. It's live on Google Play, with the App Store as the next step.",
      chips: ["React Native", "TypeScript", "Supabase"],
      link: "Visit",
      media: { type: "image", src: "assets/tackly-feature.jpg", alt: "Tackly: Giv dit rideudstyr nye eventyr", width: 1024, height: 500 },
      da: {
        badge: "Live på Google Play · App Store er næste skridt",
        desc: "En dansk peer-to-peer-markedsplads for rideudstyr: en mobilapp i Expo / React Native på Supabase plus et separat adminpanel i React til moderation, support og rollebaseret adgang. Den er live på Google Play, og App Store er næste skridt.",
      },
    },
    {
      title: "Hos Qilej",
      url: "https://www.hosqilej.dk/",
      tags: ["personal", "web"],
      featured: true,
      badge: "Barbershop · Roskilde",
      desc: "Website for a barbershop in Roskilde: services, prices, opening hours and integrated online booking.",
      chips: ["HTML", "CSS", "Freelance"],
      link: "Visit",
      media: { type: "logo", src: "assets/hosqilej.png", alt: "Hos Qilej logo", className: "tile-qilej" },
      da: {
        desc: "Hjemmeside for en barbershop i Roskilde: ydelser, priser, åbningstider og integreret onlinebooking.",
        media: { alt: "Hos Qilejs logo" },
      },
    },
    {
      title: "LearnHub",
      url: "https://github.com/mforbeskr/SEP2-Project-LearnHub",
      tags: ["school", "java", "web"],
      featured: true,
      badge: "Product Owner",
      desc: "A learning platform with courses, modules, lessons and enrollments: a Spring Boot REST API on PostgreSQL with a React frontend, covered by unit and integration tests. Built in a team of four, with me as Product Owner.",
      chips: ["Spring Boot", "React", "PostgreSQL"],
      link: "GitHub",
      media: {
        type: "tile",
        className: "tile-learnhub",
        name: "LearnHub",
        sub: "2nd semester project",
        icon: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
      },
      da: {
        desc: "En læringsplatform med kurser, moduler, lektioner og tilmeldinger: et REST API i Spring Boot på PostgreSQL med en React-frontend, dækket af unit- og integrationstests. Bygget i et team på fire med mig som Product Owner.",
        media: { sub: "Projekt på 2. semester" },
      },
    },
    {
      title: "Smart Parking Lot",
      url: "https://github.com/mforbeskr/NEC_Exam_2026_Project",
      tags: ["school", "java"],
      featured: true,
      desc: "Exam project on networking and concurrency, built with a classmate. A socket server exchanges JSON messages with JavaFX sensor, light and display clients, using producer-consumer and heartbeats.",
      chips: ["Java", "Sockets", "Concurrency"],
      link: "GitHub",
      media: {
        type: "tile",
        name: "ParkingLot",
        sub: "client ⇄ server",
        colors: ["#3b6fd6", "#1e3a7a"],
        icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
      },
      da: {
        desc: "Eksamensprojekt i netværk og samtidighed, bygget sammen med en medstuderende. En socket-server udveksler JSON-beskeder med JavaFX-klienter til sensorer, lys og skærme ved hjælp af producer-consumer og heartbeats.",
        chips: ["Java", "Sockets", "Samtidighed"],
        media: { sub: "klient ⇄ server" },
      },
    },
    {
      title: "Stock Trading Game",
      url: "https://github.com/mforbeskr/StockTradingGame",
      tags: ["school", "java"],
      featured: true,
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
      da: {
        desc: "En aktiemarkedssimulator i JavaFX. Aktiernes adfærd styres af State-mønsteret, handelsgebyrerne af Strategy-mønsteret, og data gemmes i filer med en Unit of Work.",
        chips: ["Java", "JavaFX", "Designmønstre"],
        media: { sub: "2. semester" },
      },
    },
    {
      title: ".NET Forum",
      url: "https://github.com/mforbeskr/DNPproject",
      tags: ["school", "csharp"],
      badge: "In progress",
      desc: "A Reddit-inspired forum application in C# and .NET, a 3rd-semester project built up assignment by assignment: entities and repositories, a CLI and file persistence so far.",
      chips: ["C#", ".NET"],
      link: "GitHub",
      media: {
        type: "tile",
        name: ".NET Forum",
        sub: "C# · .NET",
        colors: ["#7c4dff", "#512bd4"],
        icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      },
      da: {
        badge: "I gang",
        desc: "En Reddit-inspireret forumapplikation i C# og .NET, et projekt på 3. semester, der bygges op opgave for opgave: entiteter og repositories, en CLI og lagring i filer indtil videre.",
      },
    },
    {
      title: "Distributed Systems - Slaughterhouse",
      url: "https://github.com/mforbeskr/DSY_Project",
      tags: ["school", "java"],
      badge: "In progress",
      desc: "A 3rd-semester distributed systems project: a Java gRPC service backed by PostgreSQL that traces products and their parts back to their origin.",
      chips: ["Java", "gRPC", "PostgreSQL"],
      link: "GitHub",
      media: {
        type: "tile",
        name: "Distributed Systems",
        sub: "gRPC service",
        colors: ["#2b8a8a", "#164a4f"],
        icon: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5 10.8 16M16 7.5 13.2 16M8.5 6h7"/>',
      },
      da: {
        badge: "I gang",
        desc: "Et projekt i distribuerede systemer på 3. semester: en gRPC-service i Java med PostgreSQL bagved, der sporer produkter og deres dele tilbage til deres oprindelse.",
        media: { sub: "gRPC-service" },
      },
    },
    {
      title: "Kattis Solutions",
      url: "https://github.com/mforbeskr/kattis",
      tags: ["personal", "java"],
      desc: "My solutions to algorithmic programming problems from Kattis, practising problem-solving in Java.",
      chips: ["Java", "Algorithms"],
      link: "GitHub",
      media: { type: "tile", className: "tile-kattis", name: ">_ kattis", sub: "accepted ✓" },
      da: {
        desc: "Mine løsninger på algoritmiske programmeringsopgaver fra Kattis, som træning i problemløsning i Java.",
        chips: ["Java", "Algoritmer"],
      },
    },
    {
      title: "Kløverly Application",
      url: "https://github.com/mforbeskr/SEP1-Application-Kloeverly",
      tags: ["school", "java"],
      desc: "1st semester project: a JavaFX desktop app that keeps track of residents, tasks and points.",
      chips: ["Java", "JavaFX"],
      link: "GitHub",
      media: { type: "image", src: "https://i.ibb.co/JwMp3TbK/Sk-rmbillede-2025-12-17-121902.png", alt: "Screenshot of the Kløverly JavaFX application" },
      da: {
        desc: "Projekt på 1. semester: en JavaFX-desktopapp, der holder styr på beboere, opgaver og point.",
        media: { alt: "Skærmbillede af Kløverly-applikationen i JavaFX" },
      },
    },
    {
      title: "Kløverly Website",
      url: "https://mforbeskr.github.io/SEP1-Website-Kloeverly/",
      tags: ["school", "web"],
      desc: "The companion website for the Kløverly semester project, built from scratch with HTML and CSS.",
      chips: ["HTML", "CSS"],
      link: "Visit",
      media: { type: "image", src: "https://i.ibb.co/4gFJVHp1/KLOIN.png", alt: "Screenshot of the Kløverly website" },
      da: {
        desc: "Den tilhørende hjemmeside til Kløverly-semesterprojektet, bygget fra bunden i HTML og CSS.",
        media: { alt: "Skærmbillede af Kløverlys hjemmeside" },
      },
    },
    {
      title: "Whack-A-Jan",
      url: "https://mforbeskr.github.io/Browsergame-WhackAJan/",
      tags: ["personal", "web"],
      desc: "A whack-a-mole style browser game written in plain JavaScript with DOM interaction.",
      chips: ["JavaScript", "Game"],
      link: "Play",
      media: { type: "image", src: "https://i.ibb.co/RpL7VmxK/g5-WU5-Ydi-400x400-removebg-preview.webp", alt: "Whack-A-Jan game character", contain: true },
      da: {
        desc: "Et whack-a-mole-agtigt browserspil skrevet i ren JavaScript med DOM-interaktion.",
        chips: ["JavaScript", "Spil"],
        media: { alt: "Figuren fra spillet Whack-A-Jan" },
      },
    },
    {
      title: "Monster Match",
      url: "https://mforbeskr.github.io/Monster-Match/",
      tags: ["personal", "web"],
      desc: "A sign-up form for a custom dating-app concept, built with HTML and CSS.",
      chips: ["HTML", "CSS"],
      link: "Visit",
      media: { type: "image", src: "https://i.ibb.co/zTHB9qn4/monstermatch5.png", alt: "Screenshot of the Monster Match sign-up page" },
      da: {
        desc: "En tilmeldingsformular til mit eget koncept for en datingapp, bygget i HTML og CSS.",
        media: { alt: "Skærmbillede af tilmeldingssiden på Monster Match" },
      },
    },
    {
      title: "My First Website",
      url: "https://mforbeskr.github.io/MinSideTest/",
      tags: ["personal", "web"],
      desc: "My first proper website, a small school task that became my web playground.",
      chips: ["HTML", "Playground"],
      link: "Visit",
      media: { type: "placeholder" },
      da: {
        title: "Min første hjemmeside",
        desc: "Min første rigtige hjemmeside, en lille skoleopgave, der blev min web-legeplads.",
        chips: ["HTML", "Legeplads"],
      },
    },
  ],
};
