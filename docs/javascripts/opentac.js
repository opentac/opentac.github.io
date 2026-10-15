// Loops: <video data-loop muted loop playsinline preload="none" poster=...>
// play while at least a quarter of them is on screen and pause otherwise, so a
// page full of clips only decodes what is visible and loads nothing until it
// scrolls into view. With "reduce motion" set they stay paused, with controls.
(function () {
  "use strict";

  function setup() {
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
