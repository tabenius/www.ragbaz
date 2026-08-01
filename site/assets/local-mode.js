(function () {
  "use strict";

  var isLocalFile = location.protocol === "file:";
  var normalized = location.pathname.replace(/\\/g, "/");
  var marker = "/site/";
  var idx = normalized.lastIndexOf(marker);
  var relFile = idx === -1 ? "" : normalized.slice(idx + marker.length);
  var relDir = relFile.replace(/[^/]*$/, "");
  var depth = relDir.split("/").filter(Boolean).length;
  var prefix = depth ? "../".repeat(depth) : "./";

  function assetPath(path) {
    return isLocalFile && idx !== -1 ? prefix + path : "/" + path;
  }

  function installDetCordonStyles() {
    if (document.getElementById("detcordon-brand-styles")) return;

    var style = document.createElement("style");
    style.id = "detcordon-brand-styles";
    style.textContent = [
      ".detcordon-featured .featured-panel{background:linear-gradient(180deg,rgba(0,31,50,.98),rgba(0,18,31,.99));border-color:rgba(228,87,61,.42)}",
      ".detcordon-featured .featured-panel-icon{width:5.4rem;height:5.4rem;padding:0;overflow:hidden;border-color:rgba(228,87,61,.42);background:#001c2e;box-shadow:none}",
      ".detcordon-featured .featured-panel-icon img{display:block;width:100%;height:100%;object-fit:cover}",
      ".detcordon-featured .featured-panel .label,.detcordon-featured .featured-panel li::before,.detcordon-featured .featured-panel .link{color:#e4573d}",
      ".detcordon-product{position:relative;overflow:hidden;border-color:rgba(228,87,61,.38)!important;background:linear-gradient(120deg,rgba(0,31,50,.76),rgba(18,18,18,.98) 62%)!important}",
      ".detcordon-product::after{content:\"\";position:absolute;right:-2.5rem;bottom:-3.2rem;width:15rem;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(228,87,61,.12),transparent 68%);pointer-events:none}",
      ".detcordon-product>.hd,.detcordon-product>.desc,.detcordon-product>details,.detcordon-product>.flow{position:relative;z-index:1}",
      ".detcordon-product .hd{align-items:center;justify-content:flex-start;gap:.7rem}",
      ".detcordon-product .hd h3{margin-right:auto;color:#e4573d}",
      ".detcordon-card-mark{display:block;width:2.8rem;height:2.8rem;object-fit:cover;border:1px solid rgba(228,87,61,.38);border-radius:7px;background:#001c2e}",
      ".detcordon-card-link{display:inline-flex;flex:none;border-radius:7px}",
      ".detcordon-card-link:focus-visible{outline:2px solid #e4573d;outline-offset:3px}",
      ".detcordon-prospect-head{grid-template-columns:minmax(0,1fr) minmax(250px,420px);align-items:center;gap:clamp(1.5rem,5vw,4rem);padding:clamp(1.2rem,3vw,2rem);margin-bottom:1.5rem;border:1px solid rgba(228,87,61,.4);border-radius:12px;background:linear-gradient(120deg,rgba(0,31,50,.98),rgba(0,18,31,.99));overflow:hidden}",
      ".detcordon-prospect-head>.kicker,.detcordon-prospect-head>.hero-title,.detcordon-prospect-head>.hero-copy,.detcordon-prospect-head>.hero-chips{grid-column:1}",
      ".detcordon-prospect-head>.hero-title{color:#f2e7df}",
      ".detcordon-prospect-head>.kicker,.detcordon-prospect-head .chip{color:#e4573d}",
      ".detcordon-prospect-head .chip{border-color:rgba(228,87,61,.38);background:rgba(0,18,31,.76)}",
      ".detcordon-prospect-visual{grid-column:2;grid-row:1/5;display:block;align-self:stretch;min-height:300px;border-left:1px solid rgba(228,87,61,.22)}",
      ".detcordon-prospect-visual img{display:block;width:100%;height:100%;object-fit:contain}",
      ".detcordon-prospect-visual:focus-visible{outline:2px solid #e4573d;outline-offset:-4px}",
      "@media(max-width:760px){.detcordon-prospect-head{grid-template-columns:1fr}.detcordon-prospect-head>.kicker,.detcordon-prospect-head>.hero-title,.detcordon-prospect-head>.hero-copy,.detcordon-prospect-head>.hero-chips,.detcordon-prospect-visual{grid-column:1}.detcordon-prospect-visual{grid-row:auto;min-height:0;max-width:430px;width:100%;margin:.5rem auto 0;border-left:0;border-top:1px solid rgba(228,87,61,.22)}}",
      "@media(max-width:540px){.detcordon-featured .featured-panel-icon{width:4.5rem;height:4.5rem}.detcordon-card-mark{width:2.35rem;height:2.35rem}}"
    ].join("");
    document.head.appendChild(style);
  }

  function createBrandImage(src, className, alt) {
    var image = document.createElement("img");
    image.src = src;
    image.className = className;
    image.alt = alt || "";
    image.decoding = "async";
    return image;
  }

  function applyDetCordonBranding() {
    installDetCordonStyles();

    var markSrc = assetPath("assets/detcordon-mark.svg");
    var lockupSrc = assetPath("assets/detcordon-lockup.svg");

    Array.prototype.forEach.call(document.querySelectorAll("[data-featured-slide]"), function (slide) {
      var kicker = slide.querySelector(".featured-kicker");
      if (!kicker || kicker.textContent.toLowerCase().indexOf("detcordon") === -1) return;
      slide.classList.add("detcordon-featured");
      var icon = slide.querySelector(".featured-panel-icon");
      if (!icon || icon.querySelector("img")) return;
      icon.textContent = "";
      icon.appendChild(createBrandImage(markSrc, "", ""));
    });

    var product = document.getElementById("p-detcordon");
    if (product) {
      product.classList.add("detcordon-product");
      var heading = product.querySelector(".hd");
      if (heading && !heading.querySelector(".detcordon-card-mark")) {
        var link = document.createElement("a");
        link.className = "detcordon-card-link";
        link.href = isLocalFile && idx !== -1 ? prefix + "prospects/detcordon.html" : "/prospects/detcordon";
        link.setAttribute("aria-label", "Open the DetCordon prospect");
        link.appendChild(createBrandImage(markSrc, "detcordon-card-mark", ""));
        heading.insertBefore(link, heading.firstChild);
      }
    }

    var heroTitle = document.querySelector(".prospect-head .hero-title");
    var prospectHead = heroTitle && heroTitle.textContent.trim().toLowerCase() === "detcordon"
      ? heroTitle.closest(".prospect-head")
      : null;
    if (prospectHead && !prospectHead.querySelector(".detcordon-prospect-visual")) {
      prospectHead.classList.add("detcordon-prospect-head");
      var visual = document.createElement("a");
      visual.className = "detcordon-prospect-visual";
      visual.href = isLocalFile && idx !== -1 ? prefix + "index.html#p-detcordon" : "/#p-detcordon";
      visual.setAttribute("aria-label", "DetCordon product line on RAGBAZ");
      visual.appendChild(createBrandImage(lockupSrc, "", "DetCordon cryptographic containment seal"));
      prospectHead.appendChild(visual);
    }
  }

  applyDetCordonBranding();

  if (!isLocalFile || idx === -1) return;

  function hasExtension(path) {
    return /\.[a-z0-9]+$/i.test(path);
  }

  function rewritePath(raw) {
    if (!raw || /^([a-z]+:)?\/\//i.test(raw) || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
      return raw;
    }

    var hash = "";
    var query = "";
    var path = raw;

    var hashIdx = path.indexOf("#");
    if (hashIdx >= 0) {
      hash = path.slice(hashIdx);
      path = path.slice(0, hashIdx);
    }

    var queryIdx = path.indexOf("?");
    if (queryIdx >= 0) {
      query = path.slice(queryIdx);
      path = path.slice(0, queryIdx);
    }

    if (!path) return raw;

    if (path.startsWith("/")) {
      if (path === "/doc" || path.startsWith("/doc/")) {
        return "https://ragbaz.cc" + path + query + hash;
      }
      if (path === "/") return prefix + "index.html" + query + hash;
      if (path === "/pricing") return prefix + "pricing.html" + query + hash;
      if (path === "/tractatus" || path === "/konsonans-ai-governance") {
        return prefix + "konsonans-ai-governance.html" + query + hash;
      }
      if (path === "/school" || path === "/school/") return prefix + "school/index.html" + query + hash;
      if (path === "/school/cellular" || path === "/school/cellular/") return prefix + "school/cellular/index.html" + query + hash;
      if (path === "/school/forensics" || path === "/school/forensics/") return prefix + "school/forensics/index.html" + query + hash;
      if (path === "/colors_and_type.css" || path.startsWith("/assets/") || path.startsWith("/school/forensics/assets/")) {
        return prefix + path.slice(1) + query + hash;
      }
      if (path.startsWith("/school/")) {
        var schoolPath = path.slice(1);
        return prefix + schoolPath + (hasExtension(schoolPath) ? "" : ".html") + query + hash;
      }
      return prefix + path.slice(1) + (hasExtension(path) ? "" : ".html") + query + hash;
    }

    return raw;
  }

  function patchAttr(selector, attr) {
    document.querySelectorAll(selector).forEach(function (node) {
      var current = node.getAttribute(attr);
      var next = rewritePath(current);
      if (next && next !== current) node.setAttribute(attr, next);
    });
  }

  patchAttr('link[href^="/"]', "href");
  patchAttr('img[src^="/"]', "src");
  patchAttr('script[src^="/"]', "src");
  patchAttr('a[href^="/"]', "href");

  document.addEventListener(
    "click",
    function (event) {
      var anchor = event.target.closest && event.target.closest("a[href]");
      if (!anchor) return;
      var raw = anchor.getAttribute("href");
      var next = rewritePath(raw);
      if (!next || next === raw) return;
      event.preventDefault();
      location.href = next;
    },
    true
  );
})();
