/* =========================================================
   Akce MŠ Želatovice — načítání z Google Tabulky
   Tabulka: Kalendář akcí MŠ Želatovice (účet mszelatovice@gmail.com)
   Sloupce: Měsíc | Datum | Název akce | Poznámka
   Web čte list „Akce“ zveřejněný jako CSV (Soubor → Sdílet → Publikovat na webu).
   ========================================================= */
(function (global) {
  "use strict";

  var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRQjoVIkTH2O4KwXYNXChXVrcZtZH4NYx7yIJ77b1xz4rwH2rACGigdOxfJFbRHlJ8AngZfRrueK8Df/pub?gid=221388667&single=true&output=csv";

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

  /* ---- CSV (RFC 4180: uvozovky, čárky a zalomení uvnitř buněk) ---- */
  function parseCSV(text) {
    var rows = [], row = [], field = "", i = 0, q = false, c;
    text = text.replace(/^﻿/, "");
    while (i < text.length) {
      c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { q = false; }
        } else field += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
      i++;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function fold(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  }

  /* „listopad“, „Listopad“, „11“ … -> 11 */
  var MONTH_KEYS = {
    "zar": 9, "rij": 10, "lis": 11, "pro": 12, "led": 1, "uno": 2,
    "bre": 3, "dub": 4, "kve": 5, "cervenec": 7, "cervence": 7, "cerven": 6, "srp": 8
  };
  function parseMonth(s) {
    var f = fold(s);
    if (!f) return null;
    if (/^\d{1,2}\.?$/.test(f)) {
      var n = parseInt(f, 10);
      return n >= 1 && n <= 12 ? n : null;
    }
    for (var k in MONTH_KEYS) {
      if (f.indexOf(k) === 0) return MONTH_KEYS[k];
    }
    return null;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* Vrací ISO datum "2026-11-05" nebo null.
     Zvládne „5. 11. 2026“, „5.11.2026“, „5. 11.“ (rok se doplní podle školního roku),
     „2026-11-05“ i americké „11/5/2026“. */
  function parseDate(s, schoolYear) {
    var t = String(s || "").trim();
    if (!t) return null;
    var y, m, d, r;
    if ((r = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) { y = +r[1]; m = +r[2]; d = +r[3]; }
    else if ((r = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) { m = +r[1]; d = +r[2]; y = +r[3]; }
    else if ((r = t.match(/^(\d{1,2})\s*\.\s*(\d{1,2})\s*\.?\s*(\d{4})?$/))) {
      d = +r[1]; m = +r[2];
      if (r[3]) y = +r[3];
      else {
        var start = parseInt(schoolYear, 10);
        y = m >= 9 ? start : start + 1;
      }
    } else return null;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return y + "-" + pad(m) + "-" + pad(d);
  }

  function inSchoolYear(iso, schoolYear) {
    var start = parseInt(schoolYear, 10);
    return iso >= start + "-09-01" && iso <= (start + 1) + "-08-31";
  }

  function sortEvents(a, b) {
    var ma = ORDER.indexOf(a.mesic), mb = ORDER.indexOf(b.mesic);
    if (ma !== mb) return ma - mb;
    /* akce s datem podle data, ostatní za nimi v pořadí řádků tabulky */
    if (a.datum && b.datum && a.datum !== b.datum) return a.datum < b.datum ? -1 : 1;
    if (a.datum && !b.datum) return -1;
    if (!a.datum && b.datum) return 1;
    return a.poradi - b.poradi;
  }

  /* Najde sloupce podle nadpisů, aby nevadilo jejich přeházení. */
  function columnIndex(header) {
    var idx = { mesic: 0, datum: 1, nazev: 2, poznamka: 3 };
    header.forEach(function (h, i) {
      var f = fold(h);
      if (f.indexOf("mesic") === 0) idx.mesic = i;
      else if (f.indexOf("datum") === 0) idx.datum = i;
      else if (f.indexOf("nazev") === 0) idx.nazev = i;
      else if (f.indexOf("poznam") === 0) idx.poznamka = i;
    });
    return idx;
  }

  /**
   * Načte akce. Vrací Promise s:
   *   { year: "2026/2027", isCurrent: true, events: [...], months: [{mesic, events}] }
   * Akce s datem z jiného školního roku se nezobrazí (zapomenuté loňské řádky).
   */
  function load() {
    var year = currentSchoolYear();
    var url = SHEET_CSV_URL + (SHEET_CSV_URL.indexOf("?") === -1 ? "?" : "&") +
      "t=" + Math.floor(Date.now() / 60000);   /* obejde mezipaměť prohlížeče, max. 1× za minutu */

    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("Tabulka HTTP " + r.status);
        return r.text();
      })
      .then(function (text) {
        if (/^\s*</.test(text)) throw new Error("Tabulka nevrátila CSV (není zveřejněná?)");
        var rows = parseCSV(text);
        if (!rows.length) return [];
        var col = columnIndex(rows[0]);
        var events = [];
        rows.slice(1).forEach(function (r, i) {
          var nazev = (r[col.nazev] || "").trim();
          if (!nazev) return;
          var datum = parseDate(r[col.datum], year);
          if (datum && !inSchoolYear(datum, year)) return;
          var mesic = datum ? parseInt(datum.slice(5, 7), 10) : parseMonth(r[col.mesic]);
          if (!mesic) return;
          events.push({
            nazev: nazev,
            poznamka: (r[col.poznamka] || "").trim() || null,
            mesic: mesic,
            datum: datum,
            poradi: i
          });
        });
        return events;
      })
      .then(function (events) {
        events.sort(sortEvents);
        var months = [];
        events.forEach(function (e) {
          var last = months[months.length - 1];
          if (!last || last.mesic !== e.mesic) {
            last = { mesic: e.mesic, events: [] };
            months.push(last);
          }
          last.events.push(e);
        });
        return { year: year, isCurrent: true, events: events, months: months };
      });
  }

  global.MSAkce = {
    load: load,
    ORDER: ORDER,
    NAMES: NAMES,
    NAMES_LOC: NAMES_LOC,
    plural: plural,
    shortDate: shortDate,
    currentSchoolYear: currentSchoolYear,
    _parseCSV: parseCSV,
    _parseDate: parseDate,
    _parseMonth: parseMonth
  };
})(window);
