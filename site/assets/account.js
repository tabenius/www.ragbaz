/* ragbaz.cc account menu + subscribe widget. Injected on every page. */
(function () {
  "use strict";

  var HEAD_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function post(url, body) {
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body || {}),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        return { ok: r.ok, status: r.status, data: d };
      });
    });
  }

  // ── account menu ──────────────────────────────────────────────────
  var state = { authed: false, email: null };
  var root, btn, menu;

  function mount() {
    root = el("div", { class: "rb-acct" });
    btn = el("button", { class: "rb-acct__btn", type: "button", "aria-label": "account", title: "account" },
      HEAD_ICON + '<span class="rb-acct__dot"></span>');
    menu = el("div", { class: "rb-acct__menu" });
    root.appendChild(btn);
    root.appendChild(menu);
    document.body.appendChild(root);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (!root.contains(e.target)) menu.classList.remove("open");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") menu.classList.remove("open");
    });
    render();
  }

  function render() {
    btn.classList.toggle("authed", state.authed);
    menu.innerHTML = state.authed ? loggedInHtml() : loggedOutHtml();
    if (state.authed) wireLoggedIn();
    else wireLoggedOut();
  }

  function loggedInHtml() {
    return (
      '<h3>account</h3>' +
      '<p class="rb-acct__email">' + escapeHtml(state.email || "") + "</p>" +
      '<button class="rb-acct__go" data-logout>log out</button>'
    );
  }

  function wireLoggedIn() {
    menu.querySelector("[data-logout]").addEventListener("click", function () {
      post("/api/logout").then(function () {
        state.authed = false; state.email = null; render();
      });
    });
  }

  function loggedOutHtml() {
    return (
      '<div class="rb-acct__tabs">' +
      '<button class="rb-acct__tab active" data-tab="login">log in</button>' +
      '<button class="rb-acct__tab" data-tab="signup">sign up</button>' +
      "</div>" +
      '<div data-pane="login">' +
      '<label>email</label><input type="email" data-login-email autocomplete="email" placeholder="you@example.com"/>' +
      '<label>password</label><input type="password" data-login-pw autocomplete="current-password"/>' +
      '<button class="rb-acct__go" data-login-go>log in</button>' +
      "</div>" +
      '<div data-pane="signup" style="display:none">' +
      '<p>Enter your email — we\'ll send a confirmation link. Confirm it, then set a password to create your account.</p>' +
      '<label>email</label><input type="email" data-signup-email autocomplete="email" placeholder="you@example.com"/>' +
      '<button class="rb-acct__go" data-signup-go>send confirmation</button>' +
      "</div>" +
      '<p class="rb-acct__msg" data-msg></p>'
    );
  }

  function wireLoggedOut() {
    var msg = menu.querySelector("[data-msg]");
    var tabs = menu.querySelectorAll(".rb-acct__tab");
    function setMsg(t, cls) { msg.textContent = t || ""; msg.className = "rb-acct__msg" + (cls ? " " + cls : ""); }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        var which = t.getAttribute("data-tab");
        menu.querySelector('[data-pane="login"]').style.display = which === "login" ? "" : "none";
        menu.querySelector('[data-pane="signup"]').style.display = which === "signup" ? "" : "none";
        setMsg("");
      });
    });

    menu.querySelector("[data-login-go]").addEventListener("click", function () {
      var email = menu.querySelector("[data-login-email]").value.trim();
      var pw = menu.querySelector("[data-login-pw]").value;
      if (!email || !pw) { setMsg("email and password required", "err"); return; }
      setMsg("signing in…");
      post("/api/login", { email: email, password: pw }).then(function (r) {
        if (r.ok && r.data.ok) { state.authed = true; state.email = r.data.email; render(); reloadIfGated(); }
        else setMsg(r.data.error || "could not sign in", "err");
      });
    });

    menu.querySelector("[data-signup-go]").addEventListener("click", function () {
      var email = menu.querySelector("[data-signup-email]").value.trim();
      if (!email) { setMsg("enter your email", "err"); return; }
      setMsg("sending…");
      post("/api/signup", { email: email }).then(function (r) {
        if (r.ok && r.data.ok) setMsg("check your email for a confirmation link.", "ok");
        else setMsg(r.data.error || "could not send", "err");
      });
    });
  }

  function reloadIfGated() {
    // If a "sign in to download" notice is present, refresh so the file serves.
    if (document.querySelector("[data-gated-notice]")) location.reload();
  }

  // ── subscribe widget (homepage) ───────────────────────────────────
  function wireSubscribe() {
    var form = document.getElementById("rb-subscribe-form");
    if (!form) return;
    var input = document.getElementById("rb-subscribe-email");
    var msg = document.getElementById("rb-subscribe-msg");
    var button = form.querySelector("button");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input.value || "").trim();
      msg.className = "rb-subscribe__msg mono";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = "enter a valid email"; msg.classList.add("err"); return;
      }
      button.disabled = true;
      msg.textContent = "sending…";
      post("/api/subscribe", { email: email }).then(function (r) {
        button.disabled = false;
        if (r.ok && r.data.ok) {
          msg.textContent = "almost there — check your email to confirm.";
          msg.classList.add("ok"); input.value = "";
        } else {
          msg.textContent = r.data.error || "could not subscribe"; msg.classList.add("err");
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function maybeOpenSignup() {
    // Arriving from a gated download redirect (/?signup=1&next=…): open the
    // menu on the sign-up tab so the user can register to unlock the download.
    var q = new URLSearchParams(location.search);
    if (q.get("signup") !== "1") return;
    menu.classList.add("open");
    var signupTab = menu.querySelector('[data-tab="signup"]');
    if (signupTab) signupTab.click();
    var msg = menu.querySelector("[data-msg]");
    if (msg) { msg.textContent = "sign in or register to download that file."; msg.className = "rb-acct__msg"; }
  }

  function init() {
    mount();
    wireSubscribe();
    maybeOpenSignup();
    fetch("/api/me", { headers: { accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.authenticated) { state.authed = true; state.email = d.email; render(); }
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
