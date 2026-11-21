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
 * gets English). The navbar toggle saves a choice, and ?lang=da or ?lang=en in a link overrides both.
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
    "skip": "Spring til indhold",
    "nav.aria": "Hovedmenu",
    "nav.home": "Portfolio",
    "nav.resume": "CV",
    "lang.toggle": "Read in English",
    "theme.toLight": "Skift til lyst tema",
    "theme.toDark": "Skift til mørkt tema",
    "rail.aria": "Afsnit på siden",
    "footer.email": "E-mail",
    "portrait.alt": "Portræt af Magnus Forbes Kjær-Rasmussen",
    "link.Visit": "Besøg",
    "link.Play": "Spil",
    "link.Private repo": "Privat repo",
    "github.noDesc": "Ingen beskrivelse endnu.",
    "github.updated": "Opdateret",
    "showAll": "Vis alle {n} projekter",
    "showFewer": "Vis færre",

    "home.title": "Magnus Forbes Kjær-Rasmussen · Softwareingeniør-trainee",
    "home.desc": "Magnus Forbes Kjær-Rasmussen, softwareingeniør-trainee på VIA University College, bosat i Hedehusene. Full-stack-, Java- og webudvikling.",
    "rail.intro": "Intro",
    "rail.about": "Om mig",
    "rail.portfolio": "Portfolio",
    "rail.hobbies": "Hobbyer",
    "rail.contact": "Kontakt",
    "home.status": '<span class="status-dot" aria-hidden="true"></span>Åben for en traineestilling · ca. 2 dage om ugen',
    "home.h1": "Jeg trives i rummet mellem koden og de mennesker, den er bygget til.",
    "home.lead":
      'Softwareingeniørstuderende på <span data-semester="ordinal">3.</span> semester på VIA University Colleges ' +
      "fleksible traineeuddannelse. Jeg er glad for full-stack-udvikling og softwarearkitektur, men allermest " +
      "brænder jeg for at bygge software, der løser reelle behov.",
    "home.seeWork": "Se mit arbejde",
    "home.readCv": "Læs mit CV",
    "home.badge": "Softwareingeniør",
    "facts.aria": "Hurtige fakta",
    "facts.fullstack": "Database, API og brugerflade, fra plan til release",
    "facts.po": "Styrede krav og leverancer på LearnHub",
    "facts.freelance": "Hjemmesider til kunder og Tackly, live i begge app-butikker",

    "about.title": "Nysgerrig og praktisk.",
    "about.p1":
      "Jeg har altid villet vide, <em>hvorfor</em> ting virker, og bagefter, om de kunne virke bedre. " +
      "Software er stedet, hvor den nysgerrighed får lov at bygge noget.",
    "about.semester":
      'Jeg er på mit <span data-semester="ordinal">3.</span> semester nu og ' +
      '<span data-studying="long">lærer C# og .NET, bygger en CPU af logiske gates i DigiSim og dykker ned i ' +
      "algoritmer og tidskompleksitet</span>.",
    "about.projects":
      "Uden for undervisningen er jeg gået fra en enkel one-pager til min gode vens barbershop, " +
      '<a class="brand-word brand-qilej" href="https://www.hosqilej.dk/" target="_blank" rel="noopener">Hos Qilej</a>, ' +
      'til <a class="brand-word brand-tackly" href="https://tackly.dk/" target="_blank" rel="noopener">Tackly</a>, ' +
      "en komplet markedspladsapp til rideudstyr, live i " +
      '<a href="https://apps.apple.com/dk/app/tackly-k%C3%B8b-s%C3%A6lg-rideudstyr/id6827721554?l=da" target="_blank" rel="noopener">App Store</a> og på ' +
      '<a href="https://play.google.com/store/apps/details?id=dk.equilo.app" target="_blank" rel="noopener">Google Play</a> ' +
      "under mit eget firma.",
    "about.cta":
      '<p class="about-cta-ask">Har du brug for en hjemmeside eller en lille app?</p>' +
      '<p class="about-cta-go">Jeg hjælper gerne, så bare ' +
      '<a class="reach-out" href="mailto:mforbeskr@outlook.dk">skriv til mig!</a></p>',
    "about.po":
      "På vores projekt på 2. semester, " +
      '<a class="brand-word brand-learnhub" href="https://github.com/mforbeskr/SEP2-Project-LearnHub" target="_blank" rel="noopener">LearnHub</a>, ' +
      "var jeg Product Owner og holdt styr på kravene og fremdriften. Jeg elskede det, og det er en retning, " +
      "jeg gerne vil blive ved med at udvikle mig i.",
    "about.quote": "Jeg bygger bro mellem kode og mennesker.",

    "filter.aria": "Filtrér projekter",
    "filter.all": "Alle",
    "filter.personal": "Freelance &amp; personlige",
    "filter.school": "Skole",

    "hobbies.eyebrow": "Hobbyer",
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
    "hobby.gamingTag": "Strategi og teamwork",
    "hobby.gaming":
      "En hobby gennem mange år, som har formet min måde at tænke strategi og teamwork på. I tre år drev jeg " +
      "en World of Warcraft-guild og koordinerede dens raidhold på 25 spillere, hvilket gav mig meget øvelse " +
      "i at få en stor gruppe til at arbejde mod det samme mål.",
    "hobby.ballTag": "Fokus, energi og balance",
    "hobby.ball":
      "Basketball og træning holder mig sund og rydder hovedet, især i travle perioder med studier eller arbejde.",

    "contact.text":
      "Er du interesseret i et samarbejde, feedback, eller vil du bare vende en idé? Jeg er altid ivrig " +
      "efter at lære, bidrage og vokse gennem praktiske udfordringer fra den virkelige verden.",
    "contact.email": "Send mig en mail",
    "contact.linkedin": "Forbind på LinkedIn",
    "home.footer": "Softwareingeniør-trainee på VIA University College · Hedehusene, Danmark ·",

    "cv.title": "CV · Magnus Forbes Kjær-Rasmussen",
    "cv.desc": "CV for Magnus Forbes Kjær-Rasmussen, softwareingeniørstuderende på VIA University College. Kompetencer, uddannelse og erfaring.",
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
    "cv.h1": "Softwareingeniørstuderende",
    "cv.pdf": "Download CV som PDF",
    "cv.pdfHref": "assets/Magnus-Forbes-Kjaer-Rasmussen-CV-da.pdf",
    "rail.profile": "Profil",
    "rail.skills": "Kompetencer",
    "rail.strengths": "Styrker",
    "rail.experience": "Erfaring",
    "rail.education": "Uddannelse",
    "rail.before": "Før tech",
    "cv.profile": "Profil",
    "cv.profile1":
      "Ved siden af studiet udvikler jeg forskellig software gennem mit eget lille firma og har indtil videre bygget " +
      "en marketplace-app der er live i App Store og på Google Play, et mobilspil i Unity og en hjemmeside for en kunde. " +
      "Jeg arbejder full-stack, fra databasedesign og REST API'er i Spring Boot og .NET til " +
      "React-frontends, og jeg er bedst, hvor tekniske beslutninger møder det brugerne faktisk har brug for.",
    "cv.profile2":
      "Jeg nyder den menneskelige side af software lige så meget: at omsætte ønsker til klare krav og " +
      "holde et team på vej i samme retning, som jeg gjorde som Product Owner på LearnHub.",
    "cv.skills": "Tekniske kompetencer",
    "cv.skillLangs": "Kodesprog",
    "cv.skillWeb": "Web &amp; frameworks",
    "cv.skillDb": "Databaser &amp; værktøjer",
    "cv.skillAi": "AI-værktøjer",
    "cv.skillMethods": "Metoder &amp; roller",
    "cv.skillIde": "IDE'er &amp; editors",
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
      "god stemning. Det øvede jeg først ved at koordinere et hold på 25 personer i et onlinespil, og det er det, " +
      "der gjorde Product Owner-rollen naturlig for mig. Jeg slipper ikke noget, der har mit navn på, før " +
      "jeg er tilfreds, heller ikke selvom det er mig, der skal bære det tunge læs. En perfektionist, vil " +
      "nogle måske sige!",
    "cv.s3Title": "Formidler",
    "cv.s3":
      "Jeg kan oversætte tekniske problemer til et sprog, alle interessenter forstår, en evne, jeg har " +
      "skærpet i supporten af PayPals internationale kunder og i min hverdag.",
    "cv.s4Title": "Rolig under pres",
    "cv.s4":
      "Uddannet redningsspecialist, så et fejlende build eller en stram deadline slår mig ikke ud. Jeg " +
      "tager ejerskab og bevarer det kolde hoved for at få det bedste ud af situationen.",
    "cv.experience": "Erfaring",
    "cv.tacklyRole": "Stifter &amp; full-stack-udvikler",
    "cv.tacklyOrg": 'Egen virksomhed · <a href="https://4bestudio.com/" target="_blank" rel="noopener">4bestudio</a>',
    "cv.tacklyWhen": "2026 til nu",
    "cv.tackly1":
      '<a href="https://tackly.dk/" target="_blank" rel="noopener">Tackly</a>: bygger en peer-to-peer-markedsplads for rideudstyr, en mobilapp i Expo / React Native.',
    "cv.tackly2": "Har bygget et separat adminpanel i React til moderation, support og rollebaseret adgang.",
    "cv.tackly3":
      'Lanceret i <a href="https://apps.apple.com/dk/app/id6827721554" target="_blank" rel="noopener">App Store</a> og på ' +
      '<a href="https://play.google.com/store/apps/details?id=dk.equilo.app" target="_blank" rel="noopener">Google Play</a>!',
    "cv.jumpo1": "Jumpo: et klatrespil til mobilen i Unity og C#, under udvikling og ikke udgivet endnu.",
    "cv.qilej1":
      '<a href="https://www.hosqilej.dk/" target="_blank" rel="noopener">Hos Qilej</a>: en kundehjemmeside til en barbershop i Roskilde ' +
      "med ydelser, priser, åbningstider og integreret onlinebooking.",
    "cv.kinRole": "Udvikler",
    "cv.kinOrg": '<a href="https://github.com/emilTejnRasmussen/TS-SEP3-A26-Projekt" target="_blank" rel="noopener">KIN</a> · VIA University College, 3. semester',
    "cv.kinWhen": "Efterår 2026, i gang",
    "cv.kin1":
      "Bygger en eventplatform i et team på fire: en Blazor-frontend, en brugerservice i ASP.NET Core med JWT-login " +
      "og en eventservice i Spring Boot over gRPC, hver med sin egen PostgreSQL-database.",
    "cv.kin2": "Satte Blazor-frontenden op.",
    "cv.learnhubOrg":
      '<a href="https://github.com/mforbeskr/SEP2-Project-LearnHub" target="_blank" rel="noopener">LearnHub</a> ' +
      "· VIA University College, 2. semester",
    "cv.learnhubWhen": "Forår 2026",
    "cv.learnhub1": "Havde ansvaret for backlog, krav og fremdrift i et team på fire, der byggede en læringsplatform i Spring Boot og React.",
    "cv.learnhub2": "Fik rigtig god feedback fra medstuderende og undervisere.",
    "cv.education": "Uddannelse",
    "cv.degree": "Professionsbachelor som softwareingeniør (ingeniørtrainee)",
    "cv.degreeOrg": "VIA University College · online / fleksibel model",
    "cv.degreeWhen": "2025 til nu",
    "cv.degree1": "Fokus: full-stack-udvikling, objektorienteret programmering, databaser, softwarearkitektur og agile metoder.",
    "cv.degree2":
      'Lige nu på <span data-semester="ordinal">3.</span> semester: ' +
      '<span data-studying="short">C# &amp; .NET, en CPU i DigiSim samt algoritmer &amp; kompleksitet</span>.',
    "cv.degree3":
      "Traineemodel: Online undervisning gør, at jeg kan arbejde omkring to dage om ugen i en virksomhed og " +
      "skrive mine semester- og bachelorprojekter i dens teknologier.",
    "cv.eduDtuRole": "Fysik B",
    "cv.eduDtuOrg": "DTU Adgangskursus · Ballerup Campus",
    "cv.eduDtuWhen": "aug. 2024 til dec. 2024",
    "cv.eduKvucRole": "Matematik A",
    "cv.eduKvucWhen": "feb. 2023 til maj 2023",
    "cv.eduBrockRole": "Kemi C",
    "cv.eduBrockWhen": "sep. 2022 til dec. 2022",
    "cv.eduLogisticsRole": "Lager &amp; logistik",
    "cv.eduLogisticsOrg": "Roskilde Tekniske Skole",
    "cv.eduLogisticsWhen": "jan. 2020 til jun. 2020",
    "cv.eduJoinerRole": "Møbelsnedker, grundforløb",
    "cv.eduJoinerOrg": "Roskilde Tekniske Skole",
    "cv.eduJoinerWhen": "jan. 2019 til jun. 2019",
    "cv.eduStxRole": "STX, sproglig linje: Spansk A, Engelsk A, Psykologi C",
    "cv.eduStxWhen": "2014 til 2017",
    "cv.before": "Før tech",
    "cv.rescueRole": "Brandmand &amp; redningsspecialist (værnepligt)",
    "cv.rescueOrg": "Beredskabsstyrelsen",
    "cv.rescueWhen": "feb. 2024 til okt. 2024",
    "cv.supportRole": "Teknisk kundeservicemedarbejder",
    "cv.supportWhen": "nov. 2019 til feb. 2020",
    "cv.jobMoverRole": "Flyttemand, deltid",
    "cv.jobMoverWhen": "apr. 2025 til sep. 2025",
    "cv.jobHomecareRole": "Plejehjælper, tilkaldevikar &amp; hjemmehjælper",
    "cv.jobHomecareOrg": "Roskilde Kommune Hjemmepleje",
    "cv.jobHomecareWhen": "2021, 2023 og 2025",
    "cv.jobForkliftRole": "Truckfører, pluk &amp; pak",
    "cv.jobForkliftWhen": "nov. 2024 til mar. 2025",
    "cv.jobHospitalRole": "Serviceassistent, plejeassistent &amp; dataregistrant",
    "cv.jobHospitalOrg": "Roskilde Sygehus · tre afdelinger",
    "cv.jobHospitalWhen": "aug. 2022 til jun. 2024",
    "cv.jobLifeguardRole": "Livredder, sommervikar",
    "cv.jobLifeguardWhen": "apr. 2022 til maj 2022",
    "cv.jobPaRole": "Handicaphjælper, fastansat",
    "cv.jobPaOrg": "DUOS · brugerstyret personlig assistance",
    "cv.jobPaWhen": "mar. 2021 til maj 2021",
    "cv.jobLimacasaRole": "Rengøringsassistent &amp; chauffør",
    "cv.jobLimacasaWhen": "jul. 2018 til feb. 2021",
    "cv.jobTentsRole": "Teltopsætning &amp; pakning",
    "cv.jobTentsOrg": "Pleje &amp; Lejevikar · Sjælland",
    "cv.jobTentsWhen": "jan. 2018 til jun. 2018",
    "cv.jobWarehouseRole": "Lagermedarbejder",
    "cv.jobClean0Role": "Rengøringsassistent",
    "cv.jobClean0When": "2013 til 2015",
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
