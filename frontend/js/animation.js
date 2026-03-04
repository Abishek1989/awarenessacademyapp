// Register GSAP Plugins
if (
  typeof ScrollTrigger !== "undefined" &&
  typeof ScrollToPlugin !== "undefined"
) {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

document.addEventListener("DOMContentLoaded", () => {
  // --- LENIS SMOOTH SCROLL INIT ---
  let lenis;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  // Hero section animations have been removed to allow standard natural scrolling
  // with the new 3D particle text implementation.
});
