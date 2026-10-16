/* \ud604\uc7a5 \uc704\ud5d8\uc131\ud3c9\uac00 \ub3c4\uc6b0\ubbf8 for \uc548\uc804\uad00\ub9ac\uc2dc\uc2a4\ud15c(safe.skons.net)
 * \uc990\uaca8\ucc3e\uae30(\ubd81\ub9c8\ud074\ub9bf)\ub85c \uc2e4\ud589\ud569\ub2c8\ub2e4. \ub4f1\ub85d\ud558\uae30/\uc800\uc7a5 \ubc84\ud2bc\uc740 \uc808\ub300 \ub204\ub974\uc9c0 \uc54a\uace0, \uce78\ub9cc \ucc44\uc6c1\ub2c8\ub2e4. */
(function () {
  "use strict";
  var SAFETY = "https://safe.skons.net";
  if (location.origin !== SAFETY) {
    alert("\uc548\uc804\uad00\ub9ac\uc2dc\uc2a4\ud15c(safe.skons.net) \ud654\uba74\uc5d0\uc11c \ub20c\ub7ec\uc8fc\uc138\uc694.");
    return;
  }
  if (window.__skoRisk) { window.__skoRisk.openPanel(); return; }

  var me = document.currentScript;
  var BASE = me && me.src ? new URL(".", me.src).href : (window.__SKO_RISK_BASE || "");
  var FORM_URL = BASE + "risk.html";
  var FORM_ORIGIN = BASE ? new URL(BASE).origin : "";
  var REG_PATH = "/safety-activity/work-registration/transmission/";
  var TBM_PATH = "/safety-activity/tbm-mobile/";
  var FRESH_MS = 12 * 60 * 60 * 1000;

  /* ---------- \uc791\uc740 \uc800\uc7a5\uc18c(IndexedDB) ---------- */
  function idb() {
    return new Promise(function (ok, no) {
      var r = indexedDB.open("skoRiskHelper", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("kv"); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { no(r.error); };
    });
  }
  function kvGet(k) {
    return idb().then(function (db) {
      return new Promise(function (ok) {
        var q = db.transaction("kv").objectStore("kv").get(k);
        q.onsuccess = function () { ok(q.result || null); };
        q.onerror = function () { ok(null); };
      });
    }).catch(function () { return mem[k] || null; });
  }
  function kvSet(k, v) {
    mem[k] = v;
    return idb().then(function (db) {
      return new Promise(function (ok) {
        var t = db.transaction("kv", "readwrite");
        t.objectStore("kv").put(v, k);
        t.oncomplete = ok; t.onerror = ok;
      });
    }).catch(function () {});
  }
  var mem = {};

  /* ---------- \ud654\uba74 \uc694\uc18c ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#skoR-panel{position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483000;background:#1f2632;color:#fff;border-radius:14px;padding:14px;box-shadow:0 8px 30px rgba(0,0,0,.4);font:14px/1.45 -apple-system,'Pretendard',sans-serif;max-width:520px;margin:0 auto}" +
    "#skoR-panel h3{margin:0 0 6px;font-size:16px;color:#f5b400}" +
    "#skoR-panel .info{font-size:12px;color:#cfd6e0;margin-bottom:10px;white-space:pre-line}" +
    "#skoR-panel button{display:block;width:100%;margin-top:8px;padding:13px;border:0;border-radius:10px;font-weight:800;font-size:15px;cursor:pointer}" +
    "#skoR-panel .p{background:#e8501e;color:#fff}#skoR-panel .s{background:#3a4556;color:#fff}#skoR-panel .c{background:transparent;color:#cfd6e0;font-weight:600;padding:8px}" +
    "#skoR-ov{position:fixed;inset:0;z-index:2147483001;background:#f8f9fa;display:flex;flex-direction:column}" +
    "#skoR-ov .bar{display:flex;align-items:center;justify-content:space-between;background:#1f2632;color:#f5b400;padding:10px 12px;font:700 15px -apple-system,sans-serif}" +
    "#skoR-ov .bar button{background:#3a4556;color:#fff;border:0;border-radius:8px;padding:8px 12px;font-weight:700}" +
    "#skoR-ov iframe{flex:1;border:0;width:100%}" +
    "#skoR-toast{position:fixed;left:10px;right:10px;top:12px;z-index:2147483002;background:#0d47a1;color:#fff;border-radius:12px;padding:12px 14px;font:600 14px/1.5 -apple-system,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.35);white-space:pre-line;max-width:520px;margin:0 auto}" +
    "#skoR-toast.warn{background:#b71c1c}";
  document.head.appendChild(css);

  function toast(msg, warn, ms) {
    var t = document.getElementById("skoR-toast");
    if (!t) { t = document.createElement("div"); t.id = "skoR-toast"; document.body.appendChild(t); t.onclick = function () { t.remove(); }; }
    t.className = warn ? "warn" : "";
    t.textContent = msg;
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.remove(); }, ms || 6000);
  }

  function fmtTime(ms) {
    var d = new Date(ms), p = function (n) { return String(n).padStart(2, "0"); };
    return (d.getMonth() + 1) + "/" + d.getDate() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function closePanel() { var p = document.getElementById("skoR-panel"); if (p) p.remove(); }

  function openPanel() {
    closePanel();
    kvGet("last").then(function (last) {
      var p = document.createElement("div");
      p.id = "skoR-panel";
      var h = "<h3>\u26d1 \ud604\uc7a5 \uc704\ud5d8\uc131\ud3c9\uac00 \ub3c4\uc6b0\ubbf8</h3>";
      if (last) {
        h += '<div class="info">\uc800\uc7a5\ub41c \ud3c9\uac00\ud45c: ' + fmtTime(last.createdAt) + "\n" +
          (last.workType || last.workTypeRaw || "") + "\n" + (last.address || "") + "</div>";
      } else {
        h += '<div class="info">\uc544\uc9c1 \uc791\uc131\ud55c \ud3c9\uac00\ud45c\uac00 \uc5c6\uc5b4\uc694.</div>';
      }
      h += '<button class="p" data-a="new">\ud83d\udcdd \ud3c9\uac00\ud45c \uc791\uc131 \u2192 \uc791\uc5c5\ub4f1\ub85d \uc790\ub3d9\uc785\ub825</button>';
      if (last) {
        h += '<button class="s" data-a="refill">\ud83d\udd01 \uc800\uc7a5\ub41c \ud3c9\uac00\ud45c\ub85c \uc791\uc5c5\ub4f1\ub85d \ub2e4\uc2dc \ucc44\uc6b0\uae30</button>';
        h += '<button class="s" data-a="attach">\ud83d\udcce TBM \uc785\uac04\ud310\uc0ac\uc9c4\uc5d0 \ud3c9\uac00\ud45c \ucca8\ubd80</button>';
      }
      h += '<button class="c" data-a="close">\ub2eb\uae30</button>';
      p.innerHTML = h;
      p.addEventListener("click", function (e) {
        var a = e.target.getAttribute && e.target.getAttribute("data-a");
        if (!a) return;
        closePanel();
        if (a === "new") openForm();
        else if (a === "refill") goRegisterAndFill(last);
        else if (a === "attach") attachNow(last, true);
      });
      document.body.appendChild(p);
    });
  }

  /* ---------- \ud3c9\uac00\ud45c(iframe) ---------- */
  function openForm() {
    if (!BASE) { toast("\ud3c9\uac00\ud45c \uc8fc\uc18c\ub97c \ucc3e\uc9c0 \ubabb\ud588\uc5b4\uc694. \uc990\uaca8\ucc3e\uae30\ub97c \ub2e4\uc2dc \uc124\uce58\ud574 \uc8fc\uc138\uc694.", true); return; }
    var ov = document.getElementById("skoR-ov");
    if (ov) { ov.style.display = "flex"; return; }
    ov = document.createElement("div");
    ov.id = "skoR-ov";
    ov.innerHTML = '<div class="bar"><span>\u26d1 \ud604\uc7a5 \uc704\ud5d8\uc131 \ud3c9\uac00\ud45c</span><button type="button">\u2715 \ub2eb\uae30</button></div>';
    var f = document.createElement("iframe");
    f.src = FORM_URL;
    f.setAttribute("allow", "geolocation; clipboard-write");
    ov.appendChild(f);
    ov.querySelector("button").onclick = function () { ov.style.display = "none"; };
    document.body.appendChild(ov);
  }

  window.addEventListener("message", function (e) {
    if (e.origin !== FORM_ORIGIN) return;
    var d = e.data;
    if (!d || d.type !== "SKO_RISK_SUBMIT" || !d.payload) return;
    var payload = d.payload;
    if (!(payload.image instanceof Blob)) { toast("\ud3c9\uac00\ud45c \uc774\ubbf8\uc9c0\ub97c \ubc1b\uc9c0 \ubabb\ud588\uc5b4\uc694. \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.", true); return; }
    payload.attachedAt = null;
    kvSet("last", payload).then(function () {
      var ov = document.getElementById("skoR-ov");
      if (ov) ov.remove();
      goRegisterAndFill(payload);
    });
  });

  /* ---------- \uacf5\ud1b5 \uc720\ud2f8 ---------- */
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function waitFor(fn, timeout) {
    var t0 = Date.now();
    while (Date.now() - t0 < (timeout || 6000)) {
      var v = fn();
      if (v) return v;
      await sleep(150);
    }
    return null;
  }
  function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }
  function fc(label) {
    var all = document.querySelectorAll(".MuiFormControl-root");
    for (var i = 0; i < all.length; i++) {
      var l = all[i].querySelector("label");
      if (l && norm(l.textContent).replace(/\s*\*$/, "").indexOf(label) === 0) return all[i];
    }
    return null;
  }
  function setNative(el, val) {
    var proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function focusEl(el) {
    el.focus();
    el.dispatchEvent(new FocusEvent("focus"));
    el.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  }
  function options() { return Array.prototype.slice.call(document.querySelectorAll('[role="listbox"] [role="option"]')); }
  function closeMenus() {
    var bd = document.querySelector(".MuiMenu-root .MuiBackdrop-root, .MuiPopover-root .MuiBackdrop-root");
    if (bd) bd.click();
  }

  async function pickSelect(label, text) {
    if (!text) return false;
    var box = fc(label);
    var s = box && box.querySelector(".MuiSelect-select");
    if (!s) return false;
    if (s.classList.contains("Mui-disabled")) {
      await waitFor(function () { return !s.classList.contains("Mui-disabled"); }, 3000);
    }
    if (norm(s.textContent) === text) return true;
    s.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
    var opt = await waitFor(function () {
      return options().filter(function (o) { return norm(o.textContent) === text; })[0];
    }, 3000);
    if (!opt) { closeMenus(); await sleep(250); return false; }
    opt.click();
    await waitFor(function () { return !document.querySelector(".MuiMenu-root"); }, 2000);
    await sleep(200);
    return norm(s.textContent) === text;
  }

  async function pickWorkType(text) {
    if (!text) return false;
    var box = fc("\uc791\uc5c5 \uc720\ud615");
    var inp = box && box.querySelector("input");
    if (!inp) return false;
    focusEl(inp);
    inp.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    setNative(inp, text.replace(/^\((C\d|S)\)\s*/, ""));
    var opt = await waitFor(function () {
      return options().filter(function (o) { return norm(o.textContent) === text; })[0];
    }, 3000);
    if (!opt) { inp.blur(); return false; }
    opt.click();
    await sleep(300);
    inp.blur();
    return norm(inp.value) === text;
  }

  async function pickAddress(addr) {
    if (!addr || /^GPS\(/.test(addr)) return false;
    var sbox = fc("\uc8fc\uc18c\u00b7\uac74\ubb3c\uba85 \uac80\uc0c9");
    if (!sbox) {
      var ob = fc("\uc791\uc5c5 \ub300\uc0c1(\uc7a5\ube44\uba85") || fc("\uc791\uc5c5 \ub300\uc0c1");
      var oi = ob && ob.querySelector("input");
      if (oi) { focusEl(oi); oi.click(); }
      sbox = await waitFor(function () { return fc("\uc8fc\uc18c\u00b7\uac74\ubb3c\uba85 \uac80\uc0c9"); }, 3000);
    }
    if (!sbox) return false;
    var inp = sbox.querySelector("input");
    var parts = addr.split(" ");
    var key = parts.slice(-2).join(" ");
    var tries = [addr];
    if (parts.length > 2) tries.push(key);
    function results() {
      return Array.prototype.slice.call(document.querySelectorAll(".MuiList-dense .MuiListItemButton-root"))
        .filter(function (e) { return norm(e.textContent); });
    }
    for (var t = 0; t < tries.length; t++) {
      focusEl(inp);
      setNative(inp, tries[t]);
      var items = await waitFor(function () { var r = results(); return r.length ? r : null; }, 8000);
      if (items) {
        var hit = items.filter(function (e) { return norm(e.textContent).indexOf(key) >= 0; });
        var pool = hit.length ? hit : (t === tries.length - 1 ? items : []);
        if (!pool.length) continue;
        var pick = pool.filter(function (e) { return /^-/.test(norm(e.textContent)); })[0] || pool[0];
        pick.click();
        await sleep(600);
        var tgt = fc("\uc791\uc5c5 \ub300\uc0c1(\uc8fc\uc18c)");
        var tv = tgt && tgt.querySelector("input");
        return !!(tv && tv.value);
      }
    }
    return false;
  }

  async function setText(label, val) {
    if (!val) return false;
    var box = fc(label);
    if (!box) return false;
    var el = box.querySelector("textarea:not([aria-hidden]), input");
    if (!el) return false;
    setNative(el, val);
    await sleep(80);
    return el.value === val;
  }

  /* ---------- \uc791\uc5c5\ub4f1\ub85d \uc790\ub3d9\uc785\ub825 ---------- */
  function routerPush(path) {
    try {
      if (window.next && window.next.router && window.next.router.push) { window.next.router.push(path); return true; }
    } catch (e) {}
    return false;
  }

  async function goRegisterAndFill(p) {
    if (location.pathname.indexOf(REG_PATH) !== 0) {
      await kvSet("pendingFill", p.createdAt);
      if (!routerPush(REG_PATH)) { location.href = REG_PATH; return; }
    }
    var ready = await waitFor(function () { return location.pathname.indexOf(REG_PATH) === 0 && fc("\uc791\uc5c5\uad6c\ubd841") && fc("\uc791\uc5c5 \uc720\ud615"); }, 10000);
    if (!ready) { toast("\uc791\uc5c5\ub4f1\ub85d \ud654\uba74\uc744 \uc5f4\uc9c0 \ubabb\ud588\uc5b4\uc694. \uba54\ub274\uc5d0\uc11c '\uc804\uc1a1 \ub4f1\ub85d'\uc73c\ub85c \ub4e4\uc5b4\uac04 \ub4a4 \ub2e4\uc2dc \ub20c\ub7ec\uc8fc\uc138\uc694.", true); return; }
    await sleep(600);
    await fillRegistration(p);
  }

  async function fillRegistration(p) {
    toast("\uc791\uc5c5\ub4f1\ub85d \uce78\uc744 \ucc44\uc6b0\ub294 \uc911\u2026", false, 20000);
    var res = [];
    function mark(name, ok) { res.push((ok ? "\u2705 " : "\u26a0\ufe0f ") + name); }
    mark("\uc601\uc5ed", await pickSelect("\uc601\uc5ed", p.area));
    mark("\uc791\uc5c5\uad6c\ubd841", await pickSelect("\uc791\uc5c5\uad6c\ubd841", p.cat1));
    mark("\uc791\uc5c5\uad6c\ubd842", await pickSelect("\uc791\uc5c5\uad6c\ubd842", p.cat2));
    mark("\uc11c\ube44\uc2a4 \uc601\ud5a5", await pickSelect("\uc11c\ube44\uc2a4 \uc601\ud5a5", p.impact));
    mark("\uc791\uc5c5\ubaa9\uc801", await pickSelect("\uc791\uc5c5\ubaa9\uc801", p.purpose));
    mark("\uc791\uc5c5 \ub300\uc0c1(\uc8fc\uc18c)", await pickAddress(p.address));
    mark("\uc791\uc5c5 \uc720\ud615", await pickWorkType(p.workType));
    mark("\uc791\uc5c5\uba85", await setText("\uc791\uc5c5\uba85", p.title));
    mark("\uc791\uc5c5 \uc0ac\uc720", await setText("\uc791\uc5c5 \uc0ac\uc720", p.reason));
    mark("\uc2dc\uc791\uc2dc\uac04", await setText("\uc791\uc5c5 \uc2dc\uc791\uc2dc\uac04", p.start));
    mark("\uc885\ub8cc\uc2dc\uac04", await setText("\uc791\uc5c5 \uc885\ub8cc\uc2dc\uac04", p.end));
    await kvSet("pendingFill", null);
    window.scrollTo(0, 0);
    var bad = res.filter(function (r) { return r.indexOf("\u26a0\ufe0f") === 0; });
    toast((bad.length ? "\uc77c\ubd80 \uce78\uc740 \uc9c1\uc811 \ud655\uc778\ud574 \uc8fc\uc138\uc694\n" + bad.join("  ") + "\n\n" : "\uc791\uc5c5\ub4f1\ub85d \uce78\uc744 \ubaa8\ub450 \ucc44\uc6e0\uc5b4\uc694.\n") +
      "\ub0b4\uc6a9 \ud655\uc778 \ud6c4 [\ub4f1\ub85d\ud558\uae30]\ub294 \uc9c1\uc811 \ub20c\ub7ec\uc8fc\uc138\uc694.\n\uadf8\ub2e4\uc74c TBM 3\ub2e8\uacc4\uc5d0 \uac00\uba74 \ud3c9\uac00\ud45c\uac00 \uc790\ub3d9\uc73c\ub85c \ucca8\ubd80\ub3fc\uc694.", bad.length > 0, 12000);
    return res;
  }

  /* ---------- TBM \uc785\uac04\ud310\uc0ac\uc9c4 \ucca8\ubd80 ---------- */
  function findSignDropzone() {
    var zones = Array.prototype.slice.call(document.querySelectorAll(".dropzone"));
    if (!zones.length) return null;
    for (var i = 0; i < zones.length; i++) {
      var el = zones[i], n = 0;
      while (el && n < 4) {
        var prev = el.previousElementSibling;
        while (prev) {
          var tx = prev.textContent || "";
          if (/\uc785\uac04\ud310/.test(tx)) return zones[i];
          if (/\uc0ac\uc9c4 \ucca8\ubd80\ud558\uae30|\uc791\uc5c5\uacc4\ud68d\uc11c|\uc791\uc5c5\uc7a5 \uc804\uacbd|\uae30\ud0c0/.test(tx)) break;
          prev = prev.previousElementSibling;
        }
        el = el.parentElement; n++;
      }
    }
    return /\uc785\uac04\ud310/.test(document.body.innerText) ? zones[0] : null;
  }

  async function attachNow(p, manual) {
    if (!p || !p.image) { if (manual) toast("\uc800\uc7a5\ub41c \ud3c9\uac00\ud45c\uac00 \uc5c6\uc5b4\uc694. \uba3c\uc800 \ud3c9\uac00\ud45c\ub97c \uc791\uc131\ud574 \uc8fc\uc138\uc694.", true); return false; }
    var dz = findSignDropzone();
    if (!dz) {
      if (manual) toast("TBM 3\ub2e8\uacc4 '1) \ud604\uc7a5\uc704\ud5d8\uc131\ud3c9\uac00 \uc785\uac04\ud310\uc0ac\uc9c4' \ud654\uba74\uc5d0\uc11c \ub20c\ub7ec\uc8fc\uc138\uc694.", true);
      return false;
    }
    var input = dz.querySelector('input[type="file"]');
    if (!input) return false;
    var file = new File([p.image], p.imageName || "\ud604\uc7a5\uc704\ud5d8\uc131\ud3c9\uac00.jpg", { type: p.image.type || "image/jpeg", lastModified: Date.now() });
    var dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    var ok = await waitFor(function () { return dz.querySelector("img"); }, 4000);
    if (ok) {
      p.attachedAt = Date.now();
      await kvSet("last", p);
      dz.scrollIntoView({ block: "center" });
      toast("\ud83d\udcce \ud3c9\uac00\ud45c\ub97c '\ud604\uc7a5\uc704\ud5d8\uc131\ud3c9\uac00 \uc785\uac04\ud310\uc0ac\uc9c4'\uc5d0 \ucca8\ubd80\ud588\uc5b4\uc694.\n\uc791\uc5c5\uc7a5 \uc804\uacbd \uc0ac\uc9c4\ub9cc \uc9c1\uc811 \ucc0d\uc5b4 \uc62c\ub824\uc8fc\uc138\uc694.");
      return true;
    }
    if (manual) toast("\ucca8\ubd80\uac00 \uc548 \ub410\uc5b4\uc694. '\uc0ac\uc9c4 \ucca8\ubd80\ud558\uae30'\ub97c \ub20c\ub7ec \uc9c1\uc811 \uc62c\ub824\uc8fc\uc138\uc694.", true);
    return false;
  }

  var watching = false;
  async function watchTick() {
    if (watching) return;
    watching = true;
    try {
      if (location.pathname.indexOf(TBM_PATH) === 0) {
        var dz = findSignDropzone();
        if (dz && !dz.querySelector("img") && !dz.getAttribute("data-sko-tried")) {
          dz.setAttribute("data-sko-tried", "1");
          var last = await kvGet("last");
          if (last && !last.attachedAt && Date.now() - last.createdAt < FRESH_MS) await attachNow(last, false);
        }
      }
    } finally { watching = false; }
  }
  var mo = new MutationObserver(function () { clearTimeout(mo._t); mo._t = setTimeout(watchTick, 400); });
  mo.observe(document.body, { childList: true, subtree: true });

  window.__skoRisk = { openPanel: openPanel, fill: fillRegistration, attach: attachNow, kvGet: kvGet, kvSet: kvSet };

  /* ---------- \uc2dc\uc791 ---------- */
  (async function start() {
    var pending = await kvGet("pendingFill");
    var last = await kvGet("last");
    if (pending && last && last.createdAt === pending && location.pathname.indexOf(REG_PATH) === 0) {
      await goRegisterAndFill(last);
      return;
    }
    if (location.pathname.indexOf(TBM_PATH) === 0 && findSignDropzone()) {
      if (await attachNow(last, false)) return;
    }
    openPanel();
  })();
})();
