/*
 * Language: the English copy is written in the HTML; the Danish copy lives here and replaces it on load.
 *
 *   data-i18n="key"                  -> the element's contents are swapped for DA[key] (HTML allowed)
 *   data-i18n-attr="attr:key ..."    -> each listed attribute is swapped for DA[key]
 *   I18N.t("key", "English")         -> for text written by scripts
 *
 * Project texts and "what I'm studying" are translated next to the English in content.js (the da: fields).
 *
 * First visit: the first of the browser's languages that is Danish or English wins (anything else
 * gets English). The navbar toggle saves a choice, and ?lang=da or ?lang=en in a link overrides both,
 * handy for sending a Danish CV link.
 */
(function () {
  "use strict";

  var LANGS = ["en", "da"];
  var KEY = "lang";

  function saved(value) {
    try {
      if (value === undefined) return localStorage.getItem(KEY);
      localStorage.setItem(KEY, value);
    } catch (e) {
      return null;
    }
  }

  function fromBrowser() {
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).toLowerCase().split("-")[0];
      if (LANGS.indexOf(code) !== -1) return code;
    }
    return "en";
  }

  var param = new URLSearchParams(location.search).get("lang");
  var lang;
  if (LANGS.indexOf(param) !== -1) {
    lang = param;
    saved(lang);
  } else {
    lang = saved();
    if (LANGS.indexOf(lang) === -1) lang = fromBrowser();
  }
  document.documentElement.lang = lang;

  var DA = {
    // Shared
    "skip": "Spring til indhold",
    "nav.aria": "Hovedmenu",
    "nav.home": "Forside",
    "nav.resume": "CV",
    "lang.toggle": "Read in English",
    "theme.toLight": "Skift til lyst tema",
    "theme.toDark": "Skift til mørkt tema",
    "rail.aria": "Afsnit på siden",
    "footer.email": "E-mail",
    "portrait.alt": "Portræt af Magnus Forbes Kjær-Rasmussen",
    "link.Visit": "Besøg",
    "link.Play": "Spil",
    "github.noDesc": "Ingen beskrivelse endnu.",
    "github.updated": "Opdateret",
    "showAll": "Vis alle {n} projekter",
    "showFewer": "Vis færre",

    // Home
    "home.title": "Magnus Forbes Kjær-Rasmussen · Softwareingeniør-trainee",
    "home.desc": "Magnus Forbes Kjær-Rasmussen — softwareingeniør-trainee på VIA University College, bosat i Hedehusene. Full-stack-, Java- og webudvikling.",
    "rail.intro": "Intro",
    "rail.about": "Om mig",
    "rail.portfolio": "Portfolio",
    "rail.hobbies": "Hobbyer",
    "rail.contact": "Kontakt",
    "home.status": '<span class="status-dot" aria-hidden="true"></span>Åben for en traineestilling · ca. 2 dage om ugen',
    "home.h1": 'Hej, jeg er Magnus.<br/>Jeg bygger bro mellem <span class="accent">kode</span> og mennesker.',
    "home.lead":
      'Softwareingeniørstuderende på <span data-semester="ordinal">3.</span> semester på VIA University Colleges ' +
      "fleksible traineeuddannelse. Jeg er glad for full-stack-udvikling og softwarearkitektur — men allermest " +
      "for at omsætte det, folk faktisk har brug for, til software, der virker.",
    "home.seeWork": "Se mit arbejde",
    "home.readCv": "Læs mit CV",
    "home.badge": "Softwareingeniør",
    "facts.aria": "Hurtige fakta",
    "facts.po": "elskede at være Product Owner på LearnHub — en rolle, jeg gerne vil udforske mere",
    "facts.freelance": "en hjemmeside til en rigtig kunde og Tackly — live på Google Play, App Store er det næste",
    "facts.balance": "familieliv i Hedehusene, gaming, basketball og klaver derhjemme",

    "about.eyebrow": "Om mig",
    "about.title": "Nysgerrig, praktisk og rolig under pres.",
    "about.p1":
      "Jeg har altid villet vide, <em>hvorfor</em> ting virker — og når jeg først ved det, kan jeg ikke lade " +
      "være med at spørge mig selv, om de kunne virke bedre. Er det her virkelig det bedste, det kan blive? " +
      "Hvor er flaskehalsen? Hvad ville gøre det nemmere for alle, der bruger det? Software er stedet, hvor " +
      "den nysgerrighed og kreativitet endelig får lov at bygge noget. Jeg kan godt lide at grave i de " +
      "bagvedliggende årsager, og vanen går langt tilbage: Jeg har brugt flere timer, end jeg har lyst til at " +
      "indrømme, på at theorycrafte gear og builds i spil, bare for at presse lidt mere skade ud. For mig har " +
      "enhver teknisk udfordring en forklaring, og jagten på den er det, der driver min nysgerrighed som udvikler.",
    "about.semester":
      'Jeg er på mit <span data-semester="ordinal">3.</span> semester nu og ' +
      '<span data-studying="long">lærer C# og .NET, bygger en CPU af logiske gates i DigiSim og dykker ned i ' +
      "algoritmer og tidskompleksitet</span>.",
    "about.projects":
      "Hvert semester giver mig nye værktøjer, og jeg kan ikke lade være med også at bruge dem uden for " +
      "undervisningen. Det har ført mig fra en enkel one-pager til min gode vens barbershop i Roskilde, " +
      '<a class="brand-word brand-qilej" href="https://www.hosqilej.dk/" target="_blank" rel="noopener">Hos Qilej</a>, ' +
      'hele vejen til <a class="brand-word brand-tackly" href="https://tackly.dk/" target="_blank" rel="noopener">Tackly</a> ' +
      "— en komplet markedspladsapp til rideudstyr, som jeg nu driver som min egen virksomhed. Den er netop " +
      'lanceret på <a href="https://play.google.com/store/apps/details?id=dk.equilo.app" target="_blank" rel="noopener">Google Play</a>, ' +
      "og App Store er det næste. Hjemmesider, apps og alt derimellem — jeg elsker variationen. " +
      '<mark class="callout">Har du brug for en hjemmeside eller en lille app? Du er velkommen til at ' +
      '<a class="reach-out" href="mailto:mforbeskr@outlook.dk">skrive til mig!</a></mark>',
    "about.po":
      "På vores projekt på 2. semester, " +
      '<a class="brand-word brand-learnhub" href="https://github.com/mforbeskr/SEP2-Project-LearnHub" target="_blank" rel="noopener">LearnHub</a>, ' +
      "var jeg Product Owner og holdt styr på overblikket, kravene og fremdriften. At organisere folk var " +
      "ikke helt nyt for mig (et par år med at lede raid-aftener for 25 personer gør sit), men det var første " +
      "gang, jeg fik lov at gøre det med kode, og jeg elskede det. Det er en retning, jeg gerne vil blive ved " +
      "med at udvikle mig i.",
    "about.quote": "Jeg trives i rummet mellem koden og de mennesker, den er bygget til.",
    "about.calm":
      "Uddannelsen som redningsspecialist og international teknisk support har lært mig at bevare roen, " +
      "tage ejerskab og forklare komplekse ting, så alle kan følge med. Jeg arbejder lige så godt på engelsk " +
      'som på dansk, hvilket gør <strong class="callout">et internationalt team</strong> til et naturligt match.',
    "about.personalTitle": "Lidt mere personligt",
    "about.personal":
      "Jeg bor i Hedehusene med min kæreste gennem mange år og vores lille søn. Jeg går meget op i at " +
      "balancere ambitioner med de mennesker, der betyder noget — " +
      '<a href="#hobbies">her er, hvad jeg laver, når jeg ikke sidder på skolebænken</a>.',

    "work.title": "Ting, jeg har bygget",
    "work.lead":
      "Fra en markedspladsapp live på Google Play og en freelance-hjemmeside til en rigtig kunde til " +
      "semesterprojekter i Java, C# og React — plus masser af små eksperimenter undervejs. Brug filtrene " +
      "til at skifte mellem personlige projekter og skoleprojekter.",
    "filter.aria": "Filtrér projekter",
    "filter.all": "Alle",
    "filter.personal": "Freelance &amp; personlige",
    "filter.school": "Skole",
    "github.eyebrow": "Direkte fra GitHub",
    "github.title": "Mere på GitHub",

    "approach.eyebrow": "Sådan arbejder jeg",
    "approach.title": "Jeg lærer ved at bygge",
    "approach.lead":
      "Projekterne viser forskellige trin på min læringsrejse. Hvert af dem har lært mig noget nyt — og jeg " +
      "vender jævnligt tilbage til ældre projekter for at forfine dem, efterhånden som mine evner udvikler sig.",
    "approach.f1Title": "Fra idé til færdigt produkt",
    "approach.f1":
      "Jeg kan godt lide små, fokuserede projekter, hvor jeg kan tage en idé hele vejen — planlægge " +
      "strukturen, designe enkle brugerflader og forfine funktionaliteten gennem test og iteration.",
    "approach.f2Title": "Front-end og meget mere",
    "approach.f2":
      "Fra responsive layouts i HTML, CSS og JavaScript til applikationslogik i Java og JavaFX. Selv i små " +
      "projekter lægger jeg vægt på læsbarhed, struktur og vedligeholdelse.",
    "approach.f3Title": "Full-stack i praksis",
    "approach.f3":
      "Jeg kan godt lide at eje en feature fra ende til anden — database, sikkerhedsregler, API og " +
      "brugerflade. Jeg er åben for små opgaver, prototyper og proof-of-concepts for startups, mindre " +
      "virksomheder og privatkunder.",

    "hobbies.eyebrow": "Hobbyer",
    "hobbies.title": "Livet uden for koden",
    "hobbies.lead":
      "Når jeg ikke studerer eller arbejder med software, bruger jeg tiden på ting, der holder mig både " +
      "kreativ og jordbunden. Interesser uden for teknologien betyder noget — ikke kun for balancen, men " +
      "også for inspiration og motivation på lang sigt.",
    "hobby.musicTitle": "Musik",
    "hobby.musicTag": "At lytte og at skabe",
    "hobby.music":
      "Et kreativt frirum, der er en god kontrast til programmeringens strukturerede natur, og en stor del " +
      "af, hvordan jeg slapper af og lader op.",
    "hobby.familyTitle": "Familie &amp; venner",
    "hobby.familyTag": "De mennesker, der betyder mest",
    "hobby.family":
      "Jeg bor med min kæreste og vores lille søn, som har givet hverdagen en ny og meningsfuld dimension. " +
      "At balancere familie, hobbyer og faglig udvikling er noget, jeg går meget op i.",
    "hobby.gamingTag": "Strategi, teamwork og lederskab",
    "hobby.gaming":
      "En hobby gennem mange år, som har formet min måde at tænke strategi og teamwork på. I tre år drev jeg " +
      "en World of Warcraft-guild og ledte dens raidhold på 25 spillere på den højeste sværhedsgrad — en " +
      "rolle, jeg voksede ind i, fordi jeg nød at få en stor gruppe til at fungere godt sammen.",
    "hobby.ballTag": "Fokus, energi og balance",
    "hobby.ball":
      "Basketball og træning holder mig sund og rydder hovedet — især i travle perioder med studier eller arbejde.",

    "contact.eyebrow": "Kontakt mig",
    "contact.title": "Lad os bygge noget sammen",
    "contact.text":
      "Er du interesseret i et samarbejde, feedback, eller vil du bare vende en idé? Jeg er altid ivrig " +
      "efter at lære, bidrage og vokse gennem praktiske udfordringer fra den virkelige verden.",
    "contact.email": "Send mig en mail",
    "home.footer": "Softwareingeniør-trainee på VIA University College · Hedehusene, Danmark ·",

    // CV
    "cv.title": "CV · Magnus Forbes Kjær-Rasmussen",
    "cv.desc": "CV for Magnus Forbes Kjær-Rasmussen — softwareingeniørstuderende på VIA University College. Kompetencer, uddannelse og erfaring.",
    "cv.sideAria": "Personlige oplysninger",
    "cv.role": "Softwareingeniør · VIA UC",
    "cv.address": "Adresse",
    "cv.location": "Hedehusene, Danmark",
    "cv.languages": "Sprog",
    "cv.danish": "Dansk",
    "cv.english": "Engelsk",
    "cv.spanish": "Spansk",
    "cv.norwegian": "Norsk",
    "cv.german": "Tysk",
    "cv.native": "Modersmål",
    "cv.fluent": "Flydende i skrift og tale",
    "cv.good": "Godt",
    "cv.basic": "Grundlæggende forståelse",
    "cv.eyebrow": "CV",
    "cv.h1": "Softwareingeniørstuderende",
    "cv.lead":
      "Læser til softwareingeniør på VIA University College — og har allerede en markedspladsapp, " +
      "hjemmesider for kunder og teamprojekter ude ved siden af.",
    "cv.pdf": "Download som PDF",
    "cv.pdfHref": "assets/Magnus-Forbes-Kjaer-Rasmussen-CV-da.pdf",
    "rail.profile": "Profil",
    "rail.skills": "Kompetencer",
    "rail.strengths": "Styrker",
    "rail.experience": "Erfaring",
    "rail.education": "Uddannelse",
    "rail.before": "Før tech",
    "cv.profile": "Profil",
    "cv.profile1":
      "Full-stack-udvikler og stifter af Tackly, en markedspladsapp bygget i React Native på Supabase. Jeg " +
      "har arbejdet i hele stakken — fra databasedesign og REST API'er i Spring Boot og .NET til " +
      "React-frontends — og jeg er bedst, hvor tekniske beslutninger møder det, brugerne faktisk har brug for.",
    "cv.profile2":
      "Jeg nyder den menneskelige side af software lige så meget — at omsætte ønsker til klare krav og " +
      "holde et team på vej i samme retning, som jeg gjorde som Product Owner på LearnHub.",
    "cv.skills": "Tekniske kompetencer",
    "cv.skillLangs": "Programmeringssprog",
    "cv.skillWeb": "Web &amp; frameworks",
    "cv.skillDb": "Databaser &amp; værktøjer",
    "cv.skillMethods": "Metoder &amp; roller",
    "cv.teamLead": "Teamledelse",
    "cv.stakeholders": "Interessentkommunikation",
    "cv.strengths": "Personlige styrker",
    "cv.s1Title": "Lærer hurtigt",
    "cv.s1":
      "Jeg gik fra HTML-one-pagers til en full-stack mobilapp og lærte React Native og Supabase undervejs. " +
      "»Learning by doing« er den sande filosofi.",
    "cv.s2Title": "Organisator &amp; holdspiller",
    "cv.s2":
      "Jeg kan godt lide at hjælpe en gruppe med at fungere godt sammen: en klar plan, klare roller og en " +
      "god stemning. Meget af det lærte jeg ved at organisere raid-aftener for 25 personer, og det er det, " +
      "der gjorde Product Owner-rollen naturlig for mig. Jeg slipper ikke noget, der har mit navn på, før " +
      "jeg er tilfreds — heller ikke selvom det er mig, der skal bære det tunge læs. En perfektionist, vil " +
      "nogle måske sige!",
    "cv.s3Title": "Formidler",
    "cv.s3":
      "Jeg kan oversætte tekniske problemer til et sprog, alle interessenter forstår — en evne, jeg har " +
      "skærpet i supporten af PayPals internationale kunder og i min hverdag.",
    "cv.s4Title": "Rolig under pres",
    "cv.s4":
      "Uddannet redningsspecialist, så et fejlende build eller en stram deadline slår mig ikke ud. Jeg " +
      "tager ejerskab og bevarer det kolde hoved for at få det bedste ud af situationen.",
    "cv.experience": "Erfaring",
    "cv.tacklyRole": "Stifter &amp; full-stack-udvikler",
    "cv.tacklyOrg": 'Egen virksomhed · <a href="https://tackly.dk/" target="_blank" rel="noopener">Tackly</a>',
    "cv.tacklyWhen": "2026 – nu",
    "cv.tackly1": "Bygger en peer-to-peer-markedsplads for rideudstyr: en mobilapp i Expo / React Native.",
    "cv.tackly2": "Har bygget et separat adminpanel i React til moderation, support og rollebaseret adgang.",
    "cv.tackly3":
      'Allerede lanceret på <a href="https://play.google.com/store/apps/details?id=dk.equilo.app" target="_blank" rel="noopener">Google Play</a> ' +
      "— App Store er det næste!",
    "cv.qilejRole": "Freelance-webudvikler",
    "cv.qilejOrg": '<a href="https://www.hosqilej.dk/" target="_blank" rel="noopener">Hos Qilej</a> · barbershop i Roskilde',
    "cv.qilejWhen": "Kundeprojekt",
    "cv.qilej1": "Designede og byggede butikkens hjemmeside: ydelser, priser, åbningstider og integreret onlinebooking.",
    "cv.learnhubOrg":
      '<a href="https://github.com/mforbeskr/SEP2-Project-LearnHub" target="_blank" rel="noopener">LearnHub</a> ' +
      "· VIA University College, 2. semester",
    "cv.learnhubWhen": "Forår 2026",
    "cv.learnhub1": "Havde ansvaret for backlog, krav og fremdrift i et team på fire, der byggede en læringsplatform i Spring Boot og React.",
    "cv.learnhub2": "Fik rigtig god feedback fra medstuderende og undervisere.",
    "cv.education": "Uddannelse",
    "cv.degree": "Professionsbachelor som softwareingeniør (ingeniørtrainee)",
    "cv.degreeOrg": "VIA University College · online / fleksibel model",
    "cv.degreeWhen": "2025 – nu",
    "cv.degree1": "Fokus: full-stack-udvikling, objektorienteret programmering, databaser, softwarearkitektur og agile metoder.",
    "cv.degree2":
      'Lige nu på <span data-semester="ordinal">3.</span> semester: ' +
      '<span data-studying="short">C# &amp; .NET, en CPU i DigiSim samt algoritmer &amp; kompleksitet</span>.',
    "cv.degree3":
      "Traineemodel: Online undervisning gør, at jeg kan arbejde omkring to dage om ugen i en virksomhed og " +
      "skrive mine semester- og bachelorprojekter i dens teknologier.",
    "cv.before": "Før tech",
    "cv.rescueRole": "Brandmand &amp; redningsspecialist (værnepligt)",
    "cv.rescueOrg": "Beredskabsstyrelsen",
    "cv.rescueWhen": "feb. 2024 – okt. 2024",
    "cv.careRole": "Sundhed &amp; service",
    "cv.careOrg": "Roskilde Sygehus, Roskilde Kommune m.fl.",
    "cv.supportRole": "Teknisk kundeservicemedarbejder",
    "cv.supportWhen": "nov. 2019 – feb. 2020",
    "cv.footer": "Softwareingeniørstuderende på VIA University College · Hedehusene, Danmark ·",
  };

  window.I18N = {
    lang: lang,

    t: function (key, english) {
      return lang === "da" && key in DA ? DA[key] : english;
    },

    // Swaps the marked HTML into Danish. render.js calls this before anything else reads the page.
    apply: function () {
      if (lang !== "da") return;
      document.querySelectorAll("[data-i18n]").forEach(function (el) {
        if (el.dataset.i18n in DA) el.innerHTML = DA[el.dataset.i18n];
      });
      document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
        el.dataset.i18nAttr.split(" ").forEach(function (pair) {
          var at = pair.indexOf(":");
          var key = pair.slice(at + 1);
          if (key in DA) el.setAttribute(pair.slice(0, at), DA[key]);
        });
      });
    },

    // Saves the choice and reloads; a ?lang= in the address would otherwise win again.
    set: function (next) {
      saved(next);
      var url = new URL(location.href);
      url.searchParams.delete("lang");
      history.replaceState(history.state, "", url);
      location.reload();
    },
  };
})();
