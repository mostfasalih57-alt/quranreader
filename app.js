(() => {
  "use strict";

  const CFG = window.QURAN_CONFIG;
  const TOTAL = CFG.totalPages;
  const KEY_PAGE = "quran13.lastPage";
  const KEY_NIGHT = "quran13.night";
  const KEY_MODE = "quran13.mode";
  const ZOOMS = [1, 1.5, 2, 3, 4];

  const $ = (id) => document.getElementById(id);
  const app = $("app"), stage = $("stage"), img = $("pageImg"), embed = $("embed");
  const statusBox = $("status"), statusText = $("statusText"), statusActions = $("statusActions");
  const pageLabel = $("pageLabel"), zoomLabel = $("zoomLabel"), panBar = $("panBar");
  const prevBtn = $("prevBtn"), nextBtn = $("nextBtn"), goBtn = $("goBtn"), swapBtn = $("swapBtn");
  const panel = $("panel"), jumpInput = $("jumpInput"), jumpMsg = $("jumpMsg"), jumpValue = $("jumpValue");
  let target = 1;   // the page number chosen in the Go panel
  const nightBtn = $("nightBtn"), modeBtn = $("modeBtn"), saveNote = $("saveNote");
  $("totalLabel").textContent = TOTAL;

  /* ---------- storage (can fail or be cleared on the glasses, so everything is guarded) ---------- */
  let storageOK = true;
  try {
    localStorage.setItem("quran13.probe", "1");
    localStorage.removeItem("quran13.probe");
  } catch (e) { storageOK = false; }

  function storeGet(k) {
    if (!storageOK) return null;
    try { return localStorage.getItem(k); } catch (e) { storageOK = false; return null; }
  }
  function storeSet(k, v) {
    if (!storageOK) return;
    try { localStorage.setItem(k, String(v)); } catch (e) { storageOK = false; }
  }

  /* ---------- helpers ---------- */
  function clampPage(v) {
    if (v === null || v === undefined || v === "") return null;
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return null;
    return Math.min(TOTAL, Math.max(1, n));
  }
  function fill(tpl, n) {
    return tpl.replace("{nnnn}", String(n).padStart(4, "0")).replace("{n}", String(n));
  }
  const viewerUrl = (n) => fill(CFG.viewerUrl, n);

  // Candidate image addresses for a page. The format that worked last is tried first.
  let urlPref = 0;
  function candidates(n) {
    const list = CFG.imageUrls.map((t, i) => ({ url: fill(t, n), i }));
    return list.slice(urlPref).concat(list.slice(0, urlPref));
  }

  function readHash() {
    const m = /^#(?:p=)?(\d{1,4})$/.exec(location.hash);
    return m ? clampPage(m[1]) : null;
  }
  function syncHash() {
    try { history.replaceState(history.state, "", "#p=" + page); } catch (e) { /* ignore */ }
  }

  /* ---------- state ---------- */
  let page = clampPage(storeGet(KEY_PAGE)) || readHash() || 1;
  let zoomIdx = 0;
  let night = storeGet(KEY_NIGHT) !== "0";           // default ON
  let mode = storeGet(KEY_MODE) === "embed" ? "embed" : "image";
  let aspect = 0;                                     // natural width / height of the loaded page
  let loadToken = 0;
  let failures = 0;

  /* ---------- status (loading / error) ---------- */
  function showLoading(text) {
    statusBox.classList.remove("error");
    statusText.textContent = text;
    statusActions.hidden = true;
    statusBox.hidden = false;
  }
  function showError(text) {
    failures++;
    statusBox.classList.add("error");
    statusText.textContent = text;
    swapBtn.textContent = mode === "image" ? "Use original viewer" : "Use page images";
    statusActions.hidden = false;
    statusBox.hidden = false;
    $("retryBtn").focus();
  }
  function hideStatus() { statusBox.hidden = true; }

  /* ---------- loading a page ---------- */
  function preload(n) {
    if (n < 1 || n > TOTAL) return;
    const list = candidates(n);
    let k = 0;
    (function next() {
      if (k >= list.length) return;
      const i = new Image();
      i.referrerPolicy = "no-referrer";
      i.onerror = next;
      i.src = list[k++].url;
    })();
  }

  function loadImage() {
    const token = ++loadToken;
    const n = page;
    img.hidden = true;
    embed.hidden = true;
    embed.removeAttribute("src");
    showLoading("Loading page " + n + "…");

    const list = candidates(n);
    let k = 0;
    let done = false;

    const timer = setTimeout(fail, CFG.loadTimeoutMs);
    function fail() {
      clearTimeout(timer);
      if (done || token !== loadToken) return;
      done = true;
      let msg = "Couldn't load page " + n + ". Check the phone's internet connection, then try again.";
      if (failures >= 1) {
        msg += " If every page fails, try the original viewer.";
      }
      showError(msg);
    }
    function tryNext() {
      if (done || token !== loadToken) return;
      if (k >= list.length) { fail(); return; }
      const cand = list[k++];
      const probe = new Image();
      probe.referrerPolicy = "no-referrer";
      probe.onload = () => {
        clearTimeout(timer);
        if (done || token !== loadToken) return;
        done = true;
        urlPref = cand.i;            // remember which format worked
        aspect = probe.naturalWidth / probe.naturalHeight;
        img.alt = "Quran page " + n;
        img.src = probe.src;
        img.hidden = false;
        failures = 0;
        hideStatus();
        layout();
        // Arabic starts at the top-right: when zoomed, begin there.
        stage.scrollTop = 0;
        stage.scrollLeft = stage.scrollWidth;
        preload(n + 1);
        preload(n - 1);
      };
      probe.onerror = tryNext;       // try the next format before giving up
      probe.src = cand.url;
    }
    tryNext();
  }

  function loadEmbed() {
    const token = ++loadToken;
    const n = page;
    img.hidden = true;
    showLoading("Loading original viewer, page " + n + "…");
    embed.hidden = false;
    const timer = setTimeout(() => {
      if (token !== loadToken) return;
      showError("The original viewer didn't load. It may not allow being shown inside other sites.");
    }, CFG.loadTimeoutMs);
    embed.onload = () => {
      clearTimeout(timer);
      if (token !== loadToken) return;
      hideStatus();
    };
    embed.src = viewerUrl(n);
  }

  function render() {
    pageLabel.textContent = "Page " + page + " / " + TOTAL;
    prevBtn.setAttribute("aria-disabled", page <= 1 ? "true" : "false");
    nextBtn.setAttribute("aria-disabled", page >= TOTAL ? "true" : "false");
    document.body.classList.toggle("night", night);
    document.body.dataset.mode = mode;
    if (mode === "embed") {
      zoomLabel.textContent = "";
      panBar.hidden = true;
      loadEmbed();
    } else {
      loadImage();
    }
  }

  /* ---------- zoom & move ---------- */
  function layout() {
    if (mode !== "image") return;
    const z = ZOOMS[zoomIdx];
    panBar.hidden = z === 1;
    zoomLabel.textContent = Math.round(z * 100) + "%";
    if (!aspect) return;
    // Measure against the full stage height so "1x" always means the same size.
    const refH = stage.clientHeight + (panBar.hidden ? 0 : panBar.offsetHeight);
    const fitW = Math.min(stage.clientWidth, refH * aspect);
    img.style.width = Math.round(fitW * z) + "px";
    img.style.height = "auto";
  }

  function setZoom(idx) {
    idx = Math.max(0, Math.min(ZOOMS.length - 1, idx));
    if (idx === zoomIdx || mode !== "image") return;
    const cx = (stage.scrollLeft + stage.clientWidth / 2) / Math.max(1, stage.scrollWidth);
    const cy = (stage.scrollTop + stage.clientHeight / 2) / Math.max(1, stage.scrollHeight);
    zoomIdx = idx;
    layout();
    if (zoomIdx === 0) {
      stage.scrollLeft = 0;
      stage.scrollTop = 0;
    } else {
      stage.scrollLeft = cx * stage.scrollWidth - stage.clientWidth / 2;
      stage.scrollTop = cy * stage.scrollHeight - stage.clientHeight / 2;
    }
  }

  function pan(dx, dy) {
    stage.scrollBy({ left: dx * stage.clientWidth * 0.5, top: dy * stage.clientHeight * 0.5, behavior: "auto" });
  }

  /* ---------- navigation ---------- */
  function goTo(n) {
    const p = clampPage(n);
    if (p === null) return;
    page = p;
    storeSet(KEY_PAGE, p);
    syncHash();
    render();
  }
  function turn(d) {
    const n = page + d;
    if (n < 1 || n > TOTAL) return;
    goTo(n);
  }

  /* ---------- go-to-page panel ---------- */
  function updateOptions() {
    nightBtn.textContent = "Night colours: " + (night ? "On" : "Off");
    modeBtn.textContent = "Viewer: " + (mode === "image" ? "Page images" : "Original viewer");
    saveNote.textContent = storageOK
      ? "Your last-read page is saved on this device."
      : "This browser won't save data. Your page is kept in the web address instead.";
  }
  function openPanel() {
    if (!panel.hidden) return;
    setTarget(page);
    endTyping();
    jumpMsg.textContent = "";
    updateOptions();
    panel.hidden = false;
    app.setAttribute("inert", "");
    try { history.pushState({ panel: 1 }, ""); } catch (e) { /* ignore */ }
    $("jumpGo").focus();
  }
  function closePanel(fromPop) {
    if (panel.hidden) return;
    panel.hidden = true;
    app.removeAttribute("inert");
    if (!fromPop && history.state && history.state.panel) {
      try { history.back(); } catch (e) { /* ignore */ }
    }
    goBtn.focus();
  }
  function setTarget(n) {
    target = Math.min(TOTAL, Math.max(1, Math.round(n)));
    jumpValue.textContent = target;
  }
  // Typing is opt-in: the number is a plain display so up/down gestures never change it by accident.
  function startTyping() {
    jumpValue.hidden = true;
    jumpInput.hidden = false;
    jumpInput.value = "";
    jumpInput.placeholder = String(target);
    jumpInput.focus();
  }
  // Returns false if the typed text was not a valid page.
  function endTyping() {
    let ok = true;
    if (!jumpInput.hidden && jumpInput.value.trim() !== "") {
      const n = Number(jumpInput.value);
      if (Number.isInteger(n) && n >= 1 && n <= TOTAL) setTarget(n);
      else { jumpMsg.textContent = "Pages go from 1 to " + TOTAL + "."; ok = false; }
    }
    jumpInput.hidden = true;
    jumpValue.hidden = false;
    return ok;
  }
  function jumpGo() {
    if (!endTyping()) { $("jumpGo").focus(); return; }
    goTo(target);
    closePanel();
  }
  function step(d) {
    endTyping();
    setTarget(target + d);
    jumpMsg.textContent = "";
  }

  /* ---------- actions ---------- */
  function act(name, btn) {
    switch (name) {
      case "prev": turn(-1); break;
      case "next": turn(1); break;
      case "zoomIn": setZoom(zoomIdx + 1); break;
      case "zoomOut": setZoom(zoomIdx - 1); break;
      case "fit": setZoom(0); break;
      case "panL": pan(-1, 0); break;
      case "panR": pan(1, 0); break;
      case "panU": pan(0, -1); break;
      case "panD": pan(0, 1); break;
      case "retry": render(); break;
      case "openPanel": openPanel(); break;
      case "closePanel": closePanel(); break;
      case "step": step(Number(btn.dataset.step)); break;
      case "jumpGo": jumpGo(); break;
      case "typeNumber": jumpMsg.textContent = ""; startTyping(); break;
      case "toggleNight":
        night = !night;
        storeSet(KEY_NIGHT, night ? "1" : "0");
        document.body.classList.toggle("night", night);
        updateOptions();
        break;
      case "toggleMode":
        mode = mode === "image" ? "embed" : "image";
        storeSet(KEY_MODE, mode);
        updateOptions();
        if (!panel.hidden) closePanel();
        render();
        break;
    }
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.getAttribute("aria-disabled") === "true") return;
    act(b.dataset.act, b);
  });

  // Desktop testing shortcuts only. Arrow keys are deliberately NOT handled:
  // on the glasses (and with Tab on desktop) they move focus between buttons natively.
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target === jumpInput) {
      if (e.key === "Enter") { e.preventDefault(); jumpGo(); }
      else if (e.key === "Escape") { endTyping(); $("jumpGo").focus(); }
      return;
    }
    if (!panel.hidden) {
      if (e.key === "Escape") closePanel();
      return;
    }
    if (e.target === stage) return; // let the focused page scroll natively
    switch (e.key) {
      case "PageDown": e.preventDefault(); turn(1); break;
      case "PageUp": e.preventDefault(); turn(-1); break;
      case "+": case "=": setZoom(zoomIdx + 1); break;
      case "-": setZoom(zoomIdx - 1); break;
      case "0": setZoom(0); break;
      case "g": openPanel(); break;
    }
  });

  // Leaving the typing box (e.g. after the glasses' text composer closes) hands focus back to the buttons.
  jumpInput.addEventListener("blur", () => {
    if (jumpInput.hidden) return;
    if (endTyping()) $("jumpGo").focus();
  });

  // System Back closes the panel instead of leaving the app.
  window.addEventListener("popstate", () => {
    if (!panel.hidden && !(history.state && history.state.panel)) closePanel(true);
    syncHash();
  });

  if (typeof ResizeObserver === "function") new ResizeObserver(layout).observe(stage);
  else window.addEventListener("resize", layout);

  /* ---------- start ---------- */
  syncHash();
  updateOptions();
  render();
})();
