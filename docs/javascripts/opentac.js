// Clips.
//
// Loops: <video data-loop muted loop playsinline preload="none" ...> play while
// at least a quarter of them is on screen and pause otherwise, so a page full of
// clips only decodes what is visible and loads nothing until it scrolls into
// view. With "reduce motion" set they stay paused, with controls.
//
// Posters: a clip below the first screen names its still as data-poster="..."
// rather than poster="...", because browsers fetch every poster at page load
// (preload="none" does not cover posters). The still is set here once the clip
// comes within about a screen and a half of the viewport. Clips in the first
// screen keep a plain poster, which is also what a reader without JavaScript
// sees; below that, without JavaScript, a clip is a dark frame (it could not
// play without JavaScript either).
//
// Both start after the page's load event, so on a slow connection the clips
// and stills do not compete with the hero photo and the page's own files.
(function () {
  "use strict";

  function setPoster(v) {
    var src = v.getAttribute("data-poster");
    if (src) {
      v.setAttribute("poster", src);
      v.removeAttribute("data-poster");
    }
  }

  function posters() {
    var lazy = document.querySelectorAll("video[data-poster]");
    if (!lazy.length) return;
    if (!("IntersectionObserver" in window)) {
      lazy.forEach(setPoster);
      return;
    }
    var near = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setPoster(entry.target);
          near.unobserve(entry.target);
        }
      });
    }, { rootMargin: "150% 0px 150% 0px" });
    lazy.forEach(function (v) { near.observe(v); });
  }

  function loops() {
    var videos = document.querySelectorAll("video[data-loop]");
    if (!videos.length) return;

    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      videos.forEach(function (v) { v.controls = true; });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          setPoster(v);
          if (v.preload === "none") v.preload = "auto";
          var p = v.play();
          // A missing or unplayable file must not leave an error in the console
          // loop; show the controls so the poster still reads as a video.
          if (p && p.catch) p.catch(function () { v.controls = true; });
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.25 });

    videos.forEach(function (v) {
      v.muted = true;  // required for autoplay; the attribute alone is not always honoured
      observer.observe(v);
    });
  }

  function setup() {
    posters();
    loops();
  }

  if (document.readyState === "complete") {
    setup();
  } else {
    window.addEventListener("load", setup, { once: true });
  }
})();
