/* ===================================================================
   ChronoPrecision — logika stopiek
=================================================================== */

(() => {
  "use strict";

  // ---- DOM ----
  const display   = document.getElementById("display");
  const startBtn  = document.getElementById("startBtn");
  const lapBtn    = document.getElementById("lapBtn");
  const resetBtn  = document.getElementById("resetBtn");
  const lapsList  = document.getElementById("lapsList");
  const lapsEmpty = document.getElementById("lapsEmpty");
  const lapCount  = document.getElementById("lapCount");

  const cells = {
    m1: display.querySelector('[data-d="m1"]'),
    m2: display.querySelector('[data-d="m2"]'),
    s1: display.querySelector('[data-d="s1"]'),
    s2: display.querySelector('[data-d="s2"]'),
    c1: display.querySelector('[data-d="c1"]'),
    c2: display.querySelector('[data-d="c2"]'),
  };

  // ---- Stav ----
  let running     = false;
  let startStamp  = 0;    // performance.now() pri spustení
  let accumulated = 0;    // nazbieraný čas (ms) z predošlých behov
  let intervalId  = null;
  let laps        = [];   // [{ total, lap }]
  let lastLapTotal = 0;

  // ---- Pomocné: aktuálny uplynulý čas v ms ----
  const elapsed = () =>
    accumulated + (running ? performance.now() - startStamp : 0);

  // ---- Formátovanie MM:SS.CS ----
  function format(ms) {
    const totalCs = Math.floor(ms / 10);          // centisekundy
    const cs  = totalCs % 100;
    const totalS = Math.floor(totalCs / 100);
    const s   = totalS % 60;
    const m   = Math.floor(totalS / 60);
    const p = (n) => String(n).padStart(2, "0");
    return { m: p(m), s: p(s), cs: p(cs) };
  }

  // ---- Vykreslenie hlavného displeja ----
  function renderDisplay() {
    const { m, s, cs } = format(elapsed());
    cells.m1.textContent = m[0]; cells.m2.textContent = m[1];
    cells.s1.textContent = s[0]; cells.s2.textContent = s[1];
    cells.c1.textContent = cs[0]; cells.c2.textContent = cs[1];
  }

  // ---- Štart / Pauza (toggle) ----
  function toggle() {
    running ? pause() : start();
  }

  function start() {
    running = true;
    startStamp = performance.now();
    intervalId = setInterval(renderDisplay, 31); // ~30 fps
    document.body.classList.add("running");
    startBtn.textContent = "Pauza";
    startBtn.classList.add("is-running");
    lapBtn.disabled = false;
    resetBtn.disabled = false;
  }

  function pause() {
    running = false;
    accumulated += performance.now() - startStamp;
    clearInterval(intervalId);
    intervalId = null;
    document.body.classList.remove("running");
    startBtn.textContent = laps.length || accumulated ? "Pokračovať" : "Štart";
    startBtn.classList.remove("is-running");
    lapBtn.disabled = true;
    renderDisplay();
  }

  // ---- Zaznamenanie kola ----
  function recordLap() {
    if (!running) return;
    const total = elapsed();
    const lap = total - lastLapTotal;
    lastLapTotal = total;
    laps.push({ total, lap });
    renderLaps();
    bumpCounter();
  }

  // ---- Vykreslenie tabuľky kôl ----
  function renderLaps() {
    lapsEmpty.style.display = laps.length ? "none" : "";
    lapsList.querySelectorAll(".lap-row").forEach((r) => r.remove());

    lapCount.textContent = laps.length;

    // nájdenie najrýchlejšieho / najpomalšieho (len pri 2+ kolách)
    let fastIdx = -1, slowIdx = -1;
    if (laps.length >= 2) {
      let min = Infinity, max = -Infinity;
      laps.forEach((l, i) => {
        if (l.lap < min) { min = l.lap; fastIdx = i; }
        if (l.lap > max) { max = l.lap; slowIdx = i; }
      });
    }

    // najnovšie kolo hore
    for (let i = laps.length - 1; i >= 0; i--) {
      const { total, lap } = laps[i];
      const f = format(lap);
      const t = format(total);

      const li = document.createElement("li");
      li.className = "lap-row";
      if (i === fastIdx) li.classList.add("fastest");
      else if (i === slowIdx) li.classList.add("slowest");

      li.innerHTML =
        `<span class="lap-num">${i + 1}</span>` +
        `<span class="lap-time">${f.m}:${f.s}.${f.cs}</span>` +
        `<span class="lap-total">${t.m}:${t.s}.${t.cs}</span>`;

      lapsList.appendChild(li);
    }
  }

  function bumpCounter() {
    lapCount.classList.remove("bump");
    void lapCount.offsetWidth; // reštart animácie
    lapCount.classList.add("bump");
  }

  // ---- Reset ----
  function reset() {
    running = false;
    clearInterval(intervalId);
    intervalId = null;
    accumulated = 0;
    startStamp = 0;
    laps = [];
    lastLapTotal = 0;

    document.body.classList.remove("running");
    startBtn.textContent = "Štart";
    startBtn.classList.remove("is-running");
    lapBtn.disabled = true;
    resetBtn.disabled = true;

    renderDisplay();
    renderLaps();
  }

  // ---- Udalosti ----
  startBtn.addEventListener("click", toggle);
  lapBtn.addEventListener("click", recordLap);
  resetBtn.addEventListener("click", reset);

  // klávesové skratky
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.code === "Space") { e.preventDefault(); toggle(); }
    else if (e.key.toLowerCase() === "l") { if (running) recordLap(); }
    else if (e.key.toLowerCase() === "r") { reset(); }
  });

  // počiatočný stav
  renderDisplay();
})();