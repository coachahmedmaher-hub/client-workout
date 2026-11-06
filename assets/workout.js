/* Draws a client's workout, lets them log kg / reps per set, and keeps their history on this device. */
(function () {
  const t = (k, v) => window.I18N.t(k, v), mu = m => window.I18N.mus(m);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isNaN(n) ? null : n; };
  const yt = e => e.video || ("https://www.youtube.com/results?search_query=" + encodeURIComponent(e.name + " exercise proper form"));
  const restSec = r => { const m = String(r || "").match(/(\d+(?:\.\d+)?)\s*(min|m\b)?/i); if (!m) return 60; return m[2] ? Math.round(+m[1] * 60) : +m[1]; };
  const slug = n => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const photosOf = e => (e.photo ? [].concat(e.photo) : ((window.PHOTOS || {})[slug(e.name)] || [])).map(f => /^https?:|\//.test(f) ? f : "images/" + f);
  function lightbox(srcs, title) {
    let box = document.getElementById("lightbox");
    if (!box) { box = document.createElement("div"); box.id = "lightbox"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); document.body.appendChild(box);
      box.addEventListener("click", e => { if (e.target === box || e.target.closest(".lbclose")) box.hidden = true; });
      document.addEventListener("keydown", e => { if (e.key === "Escape") box.hidden = true; }); }
    box.innerHTML = `<div class="lbin"><div class="lbhead"><b dir="ltr">${esc(title)}</b><button type="button" class="lbclose" aria-label="Close">✕</button></div>
      <div class="lbimgs">${srcs.map(s => `<img src="${esc(s)}" alt="${esc(title)}" loading="lazy" draggable="false">`).join("")}</div></div>`;
    box.hidden = false; box.querySelector(".lbclose").focus();
  }
  const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const store = {
    get(id) { try { return JSON.parse(localStorage.getItem("amw-log:" + id)) || { sessions: [], draft: {} }; } catch (e) { return { sessions: [], draft: {} }; } },
    put(id, v) { try { localStorage.setItem("amw-log:" + id, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  const bestSet = sets => (sets || []).reduce((b, s) => { const k = num(s[0]) || 0, r = num(s[1]) || 0, sc = (k || 1) * r; return sc > b.sc ? { sc, k, r } : b; }, { sc: 0, k: 0, r: 0 });

  let timer = null;
  function restTimer(sec) {
    const pill = document.getElementById("restpill");
    clearInterval(timer);
    let left = sec;
    const draw = () => { pill.querySelector("b").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
      pill.style.setProperty("--p", (1 - left / sec) * 100 + "%"); };
    pill.hidden = false; draw();
    timer = setInterval(() => { left--; draw(); if (left <= 0) { clearInterval(timer); pill.classList.add("ding"); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
      setTimeout(() => { pill.hidden = true; pill.classList.remove("ding"); }, 2200); } }, 1000);
    pill.querySelector("button").onclick = () => { clearInterval(timer); pill.hidden = true; };
  }

  function renderDay(root, W, id, gender, onBack, tabs) {
    const log = store.get(id);
    const td = today(), tail = log.sessions[log.sessions.length - 1];
    const todaySess = tail && tail.d === td ? tail : null;
    const last = [...log.sessions].reverse().find(x => x.d !== td) || null;
    const pick = e => { const v = e.alt && e.alt[gender]; if (!v || !v.name) return e; const o = { ...e };
      for (const k of ["name", "video", "reps", "note", "muscles"]) if (v[k] && (!Array.isArray(v[k]) || v[k].length)) o[k] = v[k]; return o; };
    const list = [...W.exercises.map(pick).map((e, i) => ({ ...e, key: "ex" + i + "|" + e.name, n: i + 1 })), ...(W.core ? [{ ...W.core, key: "core|" + W.core.name, isCore: true }] : [])];
    const allMus = [...new Set(list.flatMap(e => e.muscles || []))];
    const totalSets = list.reduce((s, e) => s + (+e.sets || 0), 0) + (W.cardio ? 1 : 0);
    const draft = log.draft && log.draft.d === td ? log.draft
      : todaySess ? { d: td, ex: Object.fromEntries(Object.entries(todaySess.ex).map(([k, a]) => [k, a.map(x => [x[0], x[1], x[0] !== "" || x[1] !== ""])])), cardio: !!todaySess.cardio }
      : { d: td, ex: {}, cardio: false };
    const first = (W.client || "").split(" ")[0];

    const card = e => {
      const prev = last && last.ex[e.key];
      const rows = Array.from({ length: +e.sets || 0 }, (_, s) => {
        const d = (draft.ex[e.key] || [])[s] || ["", "", false], p = prev && prev[s], pl = e.plan && e.plan[s];
        return `<div class="srow${d[2] ? " done" : ""}" data-s="${s}" dir="ltr">
          <span class="sn">${s + 1}</span>
          <label class="fld"><input inputmode="decimal" class="kg" value="${esc(d[0])}" placeholder="${p && p[0] !== "" && p[0] != null ? esc(p[0]) : pl && pl[0] ? esc(pl[0]) : "—"}" aria-label="${t("set")} ${s + 1} ${t("kg")}"><em>${t("kg")}</em></label>
          <span class="x">×</span>
          <label class="fld"><input inputmode="numeric" class="rp" value="${esc(d[1])}" placeholder="${p && p[1] ? esc(p[1]) : pl && pl[1] ? esc(pl[1]) : esc(String(e.reps).split(/[–-]/)[0])}" aria-label="${t("set")} ${s + 1} ${t("rp")}"><em>${t("rp")}</em></label>
          <button type="button" class="tick" aria-pressed="${!!d[2]}" aria-label="${t("set")} ${s + 1} done"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></button>
        </div>`; }).join("");
      const lastTxt = prev ? prev.filter(x => x && (x[0] !== "" || x[1] !== "")).map(x => `${x[0] || "BW"}×${x[1] || "–"}`).join("  ·  ") : "";
      return `<article class="ex${e.isCore ? " corecard" : ""}" data-key="${esc(e.key)}">
        <div class="exhead">
          <span class="exnum" aria-hidden="true">${e.isCore ? "C" : String(e.n).padStart(2, "0")}</span>
          <div class="exttl"><span class="exkind">${e.isCore ? t("core") : t("exN", { n: e.n })}</span><h3 dir="ltr">${esc(e.name)}</h3>
            <div class="chips">${(e.muscles || []).map(m => `<span class="mchip">${esc(mu(m))}</span>`).join("")}</div></div>
          <div class="exfig">${Anatomy.pair(e.muscles, gender, "sm")}</div>
        </div>
        <div class="badges">
          <span class="bd"><b>${esc(e.sets)}</b>${t("sets")}</span>
          <span class="bd"><b dir="ltr">${esc(e.reps)}</b>${t("reps")}${e.perSide ? ` · ${t("perSide")}` : ""}</span>
          <span class="bd"><b dir="ltr">${esc(e.rest || "60 sec")}</b>${t("rest")}</span>
          ${photosOf(e).length ? `<button type="button" class="vid pho" data-ph="${esc(JSON.stringify(photosOf(e)))}" data-tt="${esc(e.name)}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 8"/></svg>${t("photo")}</button>` : ""}
          <a class="vid" href="${esc(yt(e))}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="#ff0033"/><path d="M10 9v6l5-3z" fill="#fff"/></svg>${t("video")}</a>
        </div>
        ${e.note ? `<p class="cue" dir="ltr">${esc(e.note)}</p>` : ""}
        ${e.plan && e.plan.length ? `<p class="planline"><span>${t("plan")}:</span> <b dir="ltr">${esc(e.plan.map(x => `${x[0] || "BW"}×${x[1]}`).join("  ·  "))}</b></p>` : ""}
        <p class="lastline">${prev ? `<span>${t("last")}:</span> <b dir="ltr">${esc(lastTxt)}</b>` : `<span>${t("firstTime")}</span>`}</p>
        <div class="sets">${rows}</div>
        <div class="exfoot"><button type="button" class="restbtn" data-sec="${restSec(e.rest)}">⏱ ${t("restBtn", { s: restSec(e.rest) })}</button><span class="cmp" aria-live="polite"></span></div>
      </article>`;
    };

    const hist = log.sessions.slice(-6).reverse();
    root.innerHTML = `
      <div class="wwrap">
        <div class="wtop"><button type="button" class="ghost" id="wback">${t("back")}</button></div>
        <section class="whero">
          <div class="whero-txt">
            <span class="eyebrow">${esc(t("hi", { name: first }))}</span>
            <h1 dir="ltr">${esc(W.title || "Workout")}</h1>
            ${W.subtitle ? `<p class="wsub" dir="ltr">${esc(W.subtitle)}</p>` : ""}
            <div class="tg"><span>${t("targets")}</span><div class="chips">${allMus.map(m => `<span class="mchip">${esc(mu(m))}</span>`).join("")}</div></div>
          </div>
          <div class="whero-fig">${Anatomy.figure("back", allMus, gender, { cls: "lg" })}${Anatomy.figure("front", allMus, gender, { cls: "lg" })}</div>
        </section>
        ${tabs || ""}
        <div class="prog" id="prog"><div class="bar"><i id="pbar"></i></div><span id="ptxt"></span></div>
        <article class="warm"><span class="wic" aria-hidden="true">🔥</span><div><h3>${t("warmup")}</h3><p dir="${W.warmup ? "ltr" : "auto"}">${esc(W.warmup || t("warmupDef"))}</p></div></article>
        <div class="exlist">${list.map(card).join("")}</div>
        ${W.cardio ? `<article class="cardio${draft.cardio ? " done" : ""}" id="cardio">
          <div class="cdhead"><div><span class="exkind">${t("cardio")}</span><h3 dir="ltr">${esc(W.cardio.machine || "Treadmill")}</h3></div>
            <button type="button" class="tick big" id="cdtick" aria-pressed="${!!draft.cardio}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></button></div>
          <div class="cdstats">
            <div><b>${esc(W.cardio.minutes)}</b><span>${t("min")}</span><em>${t("time")}</em></div>
            ${W.cardio.speed != null && W.cardio.speed !== "" ? `<div><b>${esc(W.cardio.speed)}</b><span>${t("kmh")}</span><em>${t("speed")}</em></div>` : ""}
            ${W.cardio.incline != null && W.cardio.incline !== "" ? `<div><b>${esc(W.cardio.incline)}</b><span>%</span><em>${t("incline")}</em></div>` : ""}
          </div>
          <svg class="tread" viewBox="0 0 220 70" aria-hidden="true"><path d="M10 58 L190 40" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><path d="M178 40 L196 6" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M188 8 h22" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><circle cx="20" cy="60" r="6" fill="currentColor"/><circle cx="180" cy="44" r="6" fill="currentColor"/></svg>
        </article>` : ""}
        ${W.notes && W.notes.length ? `<article class="cnotes" dir="ltr"><h3>${t("notes")}</h3><ul>${W.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul></article>` : ""}
        <div class="savebar"><button type="button" class="savebtn" id="wsave">${t("save")}</button><p class="smsg" id="smsg" role="status" aria-live="polite">${tail ? t("savedOn", { d: esc(tail.d) }) : ""}</p></div>
        <p class="devnote">${t("device")}</p>
        <article class="hist"><h3>${t("history")}</h3>${hist.length ? `<ul>${hist.map(s => { const v = Object.values(s.ex).flat().reduce((a, x) => a + (num(x && x[0]) || 0) * (num(x && x[1]) || 0), 0);
          return `<li><span>${esc(s.d)}</span><b dir="ltr">${Math.round(v).toLocaleString("en-US")} kg</b></li>`; }).join("")}</ul>` : `<p>${t("noHistory")}</p>`}</article>
      </div>`;

    const saveDraft = () => { log.draft = draft; store.put(id, log); };
    const progress = () => {
      let d = 0; list.forEach(e => (draft.ex[e.key] || []).forEach(x => { if (x && x[2]) d++; })); if (draft.cardio) d++;
      root.querySelector("#pbar").style.width = (totalSets ? d / totalSets * 100 : 0) + "%";
      root.querySelector("#ptxt").textContent = d >= totalSets ? t("allDone") : t("progress", { d, t: totalSets });
      root.querySelector("#prog").classList.toggle("full", d >= totalSets);
    };
    root.querySelectorAll(".ex").forEach(cardEl => {
      const key = cardEl.dataset.key;
      cardEl.querySelectorAll(".srow").forEach(row => {
        const s = +row.dataset.s, kg = row.querySelector(".kg"), rp = row.querySelector(".rp"), tk = row.querySelector(".tick");
        const sync = mark => { const arr = draft.ex[key] = draft.ex[key] || []; const cur = arr[s] || ["", "", false];
          const done = mark === undefined ? (cur[2] || rp.value !== "") : mark;
          arr[s] = [kg.value.trim(), rp.value.trim(), done]; row.classList.toggle("done", done); tk.setAttribute("aria-pressed", String(done)); saveDraft(); progress(); };
        kg.addEventListener("input", () => sync());
        rp.addEventListener("input", () => sync());
        tk.addEventListener("click", () => { const now = tk.getAttribute("aria-pressed") !== "true";
          if (now && !rp.value && rp.placeholder && rp.placeholder !== "—") rp.value = rp.placeholder;
          if (now && !kg.value && kg.placeholder && kg.placeholder !== "—") kg.value = kg.placeholder;
          sync(now); if (now) restTimer(+cardEl.querySelector(".restbtn").dataset.sec); });
      });
      cardEl.querySelector(".restbtn").addEventListener("click", e => restTimer(+e.currentTarget.dataset.sec));
      const ph = cardEl.querySelector(".pho"); if (ph) ph.addEventListener("click", () => lightbox(JSON.parse(ph.dataset.ph), ph.dataset.tt));
    });
    const cdt = root.querySelector("#cdtick");
    if (cdt) cdt.addEventListener("click", () => { draft.cardio = !draft.cardio; cdt.setAttribute("aria-pressed", String(draft.cardio)); root.querySelector("#cardio").classList.toggle("done", draft.cardio); saveDraft(); progress(); });
    root.querySelector("#wback").addEventListener("click", onBack);
    root.querySelector("#wsave").addEventListener("click", () => {
      const ex = {}; list.forEach(e => { const a = (draft.ex[e.key] || []).filter(Boolean); if (a.some(x => x[0] !== "" || x[1] !== "")) ex[e.key] = (draft.ex[e.key] || []).map(x => x ? [x[0], x[1]] : ["", ""]); });
      if (!Object.keys(ex).length) return;
      const sess = { d: td, ex, cardio: !!draft.cardio }, tl = log.sessions[log.sessions.length - 1];
      if (tl && tl.d === td) log.sessions[log.sessions.length - 1] = sess; else log.sessions.push(sess);
      log.draft = draft; const ok = store.put(id, log);
      root.querySelectorAll(".ex").forEach(cardEl => { const k = cardEl.dataset.key, now = ex[k], before = last && last.ex[k], c = cardEl.querySelector(".cmp");
        if (!now || !before) { c.textContent = ""; return; } const a = bestSet(now), b = bestSet(before);
        c.className = "cmp " + (a.sc > b.sc ? "up" : a.sc < b.sc ? "down" : "eq"); c.textContent = a.sc > b.sc ? t("better") : a.sc < b.sc ? t("lower") : t("same"); });
      const m = root.querySelector("#smsg"); m.textContent = ok ? t("saved") : "⚠"; m.classList.add("ok");
      document.body.classList.add("party"); setTimeout(() => document.body.classList.remove("party"), 1600);
    });
    progress();
  }
  function render(root, W, id, gender, onBack) {
    if (!W.days || !W.days.length) return renderDay(root, W, id, gender, onBack, "");
    let idx = 0;
    try { idx = +localStorage.getItem("amw-day:" + id) || 0; } catch (e) {}
    if (idx >= W.days.length) idx = 0;
    const go = (i, jump) => {
      try { localStorage.setItem("amw-day:" + id, String(i)); } catch (e) {}
      const D = W.days[i];
      const merged = { ...W, exercises: D.exercises || [], core: D.core || null, cardio: D.cardio || null, warmup: D.warmup || W.warmup,
        title: D.name || W.title, subtitle: D.subtitle || "", notes: [...(D.notes || []), ...(W.notes || [])] };
      const tabs = `<nav class="daytabs" aria-label="${t("days")}">${W.days.map((d, j) => `<button type="button" class="dtab${j === i ? " on" : ""}" data-day="${j}" aria-pressed="${j === i}"><b>${t("dayN", { n: j + 1 })}</b><small dir="ltr">${esc(d.name || "")}</small></button>`).join("")}</nav>${W.restNote ? `<p class="restnote" dir="ltr">${esc(W.restNote)}</p>` : ""}`;
      renderDay(root, merged, id + ":d" + i, gender, onBack, tabs);
      root.querySelectorAll(".dtab").forEach(b => b.addEventListener("click", () => go(+b.dataset.day, true)));
      if (jump) { const n = root.querySelector(".daytabs"); n && n.scrollIntoView({ block: "start" }); }
    };
    go(idx, false);
  }
  window.Workout = { render };
})();
