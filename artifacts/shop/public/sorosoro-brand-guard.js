(function () {
  "use strict";

  var patterns = [
    [/ALL\s*따옴/g, "seoulmono"],
    [/올\s*따옴/g, "seoulmono"],
    [/지구쇼핑몰/g, "seoulmono"]
  ];

  var watchedAttrs = ["alt", "title", "placeholder", "aria-label"];

  function normalize(value) {
    return patterns.reduce(function (text, entry) {
      return text.replace(entry[0], entry[1]);
    }, value || "");
  }

  function fixAttrs(element) {
    if (!element || element.nodeType !== 1) return;
    watchedAttrs.forEach(function (name) {
      var value = element.getAttribute && element.getAttribute(name);
      if (value) {
        var next = normalize(value);
        if (next !== value) element.setAttribute(name, next);
      }
    });
  }

  function scan(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      var next = normalize(root.nodeValue);
      if (next !== root.nodeValue) root.nodeValue = next;
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    fixAttrs(root);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (node.parentElement && !/^(SCRIPT|STYLE|TEXTAREA)$/i.test(node.parentElement.tagName)) scan(node);
    });
    var elements = root.querySelectorAll ? root.querySelectorAll("[alt],[title],[placeholder],[aria-label]") : [];
    elements.forEach(fixAttrs);
  }

  function start() {
    scan(document.body);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "characterData") scan(mutation.target);
        else if (mutation.type === "attributes") fixAttrs(mutation.target);
        mutation.addedNodes.forEach(scan);
      });
    }).observe(document.documentElement, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: watchedAttrs
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
