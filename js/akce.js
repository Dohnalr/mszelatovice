/* =========================================================
   Akce MŠ Želatovice — načítání ze Sanity (sanity.io)
   Akce se spravují v administraci https://mszelatovice.sanity.studio
   ========================================================= */
(function (global) {
  "use strict";

  var PROJECT_ID = "dsss8o0a";
  var DATASET = "production";
  var API_VERSION = "v2025-02-19";

  var QUERY =
    '*[_type == "akce" && !(_id in path("drafts.**"))]' +
    "{_id, nazev, poznamka, mesic, datum, poradi, skolniRok}";

  /* Pořadí měsíců ve školním roce: září … srpen */
  var ORDER = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];

  var NAMES = {
    1: "Leden", 2: "Únor", 3: "Březen", 4: "Duben", 5: "Květen", 6: "Červen",
    7: "Červenec", 8: "Srpen", 9: "Září", 10: "Říjen", 11: "Listopad", 12: "Prosinec"
  };
  /* 6. pád pro věty „V září nás čeká…“ */
  var NAMES_LOC = {
    1: "lednu", 2: "únoru", 3: "březnu", 4: "dubnu", 5: "květnu", 6: "červnu",
    7: "červenci", 8: "srpnu", 9: "září", 10: "říjnu", 11: "listopadu", 12: "prosinci"
  };

  function currentSchoolYear(d) {
    d = d || new Date();
    var y = d.getFullYear();
    return d.getMonth() + 1 >= 9 ? y + "/" + (y + 1) : (y - 1) + "/" + y;
  }

  function plural(n, one, few, many) {
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few;
    return many;
  }

  /* "2026-09-15" -> "15. 9." */
  function shortDate(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    return parseInt(p[2], 10) + ". " + parseInt(p[1], 10) + ".";
  }

  function sortEvents(a, b) {
    var ma = ORDER.indexOf(a.mesic), mb = ORDER.indexOf(b.mesic);
    if (ma !== mb) return ma - mb;
    /* akce s datem podle data, ostatní za nimi podle pořadí a názvu */
    if (a.datum && b.datum && a.datum !== b.datum) return a.datum < b.datum ? -1 : 1;
    if (a.datum && !b.datum) return -1;
    if (!a.datum && b.datum) return 1;
    var pa = a.poradi == null ? 9999 : a.poradi;
    var pb = b.poradi == null ? 9999 : b.poradi;
    if (pa !== pb) return pa - pb;
    return (a.nazev || "").localeCompare(b.nazev || "", "cs");
  }

  /**
   * Načte akce. Vrací Promise s:
   *   { year: "2026/2027", isCurrent: true|false, events: [...], months: [{mesic, events}] }
   * Zobrazuje se letošní školní rok; když v něm zatím nic není,
   * použije se nejnovější rok, který v Sanity existuje.
   */
  function load() {
    var url =
      "https://" + PROJECT_ID + ".apicdn.sanity.io/" + API_VERSION +
      "/data/query/" + DATASET + "?query=" + encodeURIComponent(QUERY);

    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("Sanity HTTP " + r.status);
        return r.json();
      })
      .then(function (json) {
        var all = (json && json.result) || [];
        var current = currentSchoolYear();
        var years = all
          .map(function (e) { return e.skolniRok; })
          .filter(function (y, i, arr) { return y && arr.indexOf(y) === i; })
          .sort()
          .reverse();

        var year = years.indexOf(current) !== -1 ? current : (years[0] || current);
        var events = all
          .filter(function (e) { return e.skolniRok === year && NAMES[e.mesic]; })
          .sort(sortEvents);

        var months = [];
        events.forEach(function (e) {
          var last = months[months.length - 1];
          if (!last || last.mesic !== e.mesic) {
            last = { mesic: e.mesic, events: [] };
            months.push(last);
          }
          last.events.push(e);
        });

        return { year: year, isCurrent: year === current, events: events, months: months };
      });
  }

  global.MSAkce = {
    load: load,
    ORDER: ORDER,
    NAMES: NAMES,
    NAMES_LOC: NAMES_LOC,
    plural: plural,
    shortDate: shortDate,
    currentSchoolYear: currentSchoolYear
  };
})(window);
