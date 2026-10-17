/* FishBowl v2 — motion systems (Wyze-inspired, hand-rolled) */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  /* ---------- magnetic buttons ---------- */
  if (!reduceMotion) {
    document.querySelectorAll(".btn--magnet").forEach(function (btn) {
      var strength = 14;
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        btn.style.setProperty("--mx", (x / r.width * strength * 2).toFixed(1) + "px");
        btn.style.setProperty("--my", (y / r.height * strength * 2).toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.setProperty("--mx", "0px");
        btn.style.setProperty("--my", "0px");
      });
    });
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var menu = document.getElementById("mobile-menu");
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      menuBtn.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      menu.hidden = open;
      document.body.style.overflow = open ? "" : "hidden";
    });
    var closeBtn = menu.querySelector(".mnav__close");
    if (closeBtn) closeBtn.addEventListener("click", function () { menuBtn.click(); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.hidden = true;
        menuBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        menu.hidden = true;
        menuBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        menuBtn.focus();
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- scroll-scrubbed letter reveal ---------- */
  document.querySelectorAll("[data-letter-reveal]").forEach(function (p) {
    var text = p.textContent;
    p.setAttribute("aria-label", text);
    p.textContent = "";
    var chars = [];
    text.split("").forEach(function (c) {
      var s = document.createElement("span");
      s.className = "ch" + (c === " " ? " sp" : "");
      s.textContent = c === " " ? "\u00A0" : c;
      s.setAttribute("aria-hidden", "true");
      p.appendChild(s);
      chars.push(s);
    });
    if (reduceMotion) { chars.forEach(function (c) { c.classList.add("lit"); }); return; }
    var lit = -1;
    function scrub() {
      var r = p.getBoundingClientRect();
      var vh = window.innerHeight;
      var t = (vh * 0.85 - r.top) / (vh * 0.7 + r.height);
      t = Math.max(0, Math.min(1, t));
      var n = Math.floor(t * chars.length);
      if (n !== lit) {
        for (var i = 0; i < chars.length; i++) chars[i].classList.toggle("lit", i < n);
        lit = n;
      }
    }
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(function () { scrub(); ticking = false; }); ticking = true; }
    }, { passive: true });
    scrub();
  });

  /* ---------- count-up stats ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function fmt(n) { return n >= 1000 ? n.toLocaleString("en-US") : String(n); }
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = fmt(target) + suffix; return; }
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(target * eased)) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ---------- FAQ single-open ---------- */
  var faq = document.querySelector("[data-faq]");
  if (faq) {
    faq.querySelectorAll("details").forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (d.open) {
          faq.querySelectorAll("details").forEach(function (o) { if (o !== d) o.open = false; });
        }
      });
    });
  }

  /* ---------- hero video sound toggle ---------- */
  var heroVideo = document.querySelector(".browser-frame__screen video");
  var soundButton = document.querySelector("[data-video-sound]");
  if (heroVideo && soundButton) {
    var soundIcon = soundButton.querySelector(".video-sound__icon");
    var soundLabel = soundButton.querySelector(".video-sound__label");
    function syncSoundButton() {
      var soundIsOn = !heroVideo.muted && heroVideo.volume > 0;
      soundButton.setAttribute("aria-pressed", String(soundIsOn));
      soundButton.setAttribute("aria-label", soundIsOn ? "Mute video" : "Turn video sound on");
      soundIcon.textContent = soundIsOn ? "🔊" : "🔇";
      soundLabel.textContent = soundIsOn ? "Mute" : "Sound on";
    }
    soundButton.addEventListener("click", function () {
      heroVideo.muted = !heroVideo.muted;
      if (!heroVideo.muted) {
        heroVideo.volume = 1;
        var playPromise = heroVideo.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            heroVideo.muted = true;
            syncSoundButton();
          });
        }
      }
      syncSoundButton();
    });
    heroVideo.addEventListener("volumechange", syncSoundButton);
    syncSoundButton();
  }

  /* ---------- analytics hooks (data-track) ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-track]");
    if (!el) return;
    var name = el.getAttribute("data-track");
    if (window.dataLayer) window.dataLayer.push({ event: name });
    if (typeof window.gtag === "function") window.gtag("event", name);
  });

  /* ---------- header shadow on scroll ---------- */
  var header = document.getElementById("site-header");
  function headShadow() {
    header.style.boxShadow = window.scrollY > 8 ? "0 4px 18px rgba(37,30,33,.12)" : "none";
  }
  window.addEventListener("scroll", headShadow, { passive: true });
  headShadow();
})();
