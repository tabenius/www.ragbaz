(function () {
  "use strict";

  if (location.protocol !== "file:") return;

  var normalized = location.pathname.replace(/\\/g, "/");
  var marker = "/site/";
  var idx = normalized.lastIndexOf(marker);
  if (idx === -1) return;

  var relFile = normalized.slice(idx + marker.length);
  var relDir = relFile.replace(/[^/]*$/, "");
  var depth = relDir.split("/").filter(Boolean).length;
  var prefix = depth ? "../".repeat(depth) : "./";

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
      if (path === "/tractatus") return prefix + "tractatus.html" + query + hash;
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
    true,
  );
})();
