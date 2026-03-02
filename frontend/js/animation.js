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

  // --- VIDEO-BASED HERO SECTION (NEW FLOW) ---
  const videoContainer = document.querySelector(".hero-video-container");
  const heroOverlay = document.querySelector(".hero-overlay-content");
  const heroVideos = document.querySelectorAll(".hero-video");
  const scrollIndicator = document.querySelector(".scroll-indicator");

  if (!videoContainer) {
    console.warn("Hero video container not found");
    return;
  }

  let activeVideo = null;
  let activeVideoReverse = null;
  let videoDuration = 0;
  let listenersBound = false;

  function selectActiveVideo() {
    const isDesktop = window.innerWidth > 768;
    activeVideo = Array.from(heroVideos).find((video) => {
      if (isDesktop) {
        return video.classList.contains("hero-video-desktop");
      }

      return video.classList.contains("hero-video-mobile");
    });

    // Select corresponding reverse video
    activeVideoReverse = Array.from(heroVideos).find((video) => {
      if (isDesktop) {
        return video.classList.contains("hero-video-desktop-reverse");
      }

      return video.classList.contains("hero-video-mobile-reverse");
    });

    videoDuration =
      activeVideo && Number.isFinite(activeVideo.duration)
        ? activeVideo.duration
        : 0;
  }

  function resetHeroToStartFrame() {
    heroVideos.forEach((video) => {
      video.pause();
      video.playbackRate = 1; // Reset to normal speed
      video.classList.remove("playing");
      video.currentTime = 0;
    });

    if (heroOverlay) {
      heroOverlay.style.opacity = "1";
      heroOverlay.style.pointerEvents = "all";
    }

    if (scrollIndicator) {
      scrollIndicator.style.opacity = "0.8";
      scrollIndicator.style.pointerEvents = "all";
    }
  }

  // Setup video - do NOT autoplay initially
  heroVideos.forEach((video) => {
    video.setAttribute("preload", "auto");
    video.setAttribute("webkit-playsinline", "true");
    video.removeAttribute("autoplay"); // Remove autoplay
    video.pause(); // Ensure video is paused

    // Handle video loaded event
    video.addEventListener("loadeddata", () => {
      videoContainer.classList.add("loaded");
      // Set to first frame
      video.currentTime = 0;
    });

    video.addEventListener("loadedmetadata", () => {
      if (video === activeVideo) {
        videoDuration = video.duration;
      }
      console.log(
        `Video loaded: ${video.className}, duration: ${videoDuration}s`,
      );
    });
  });

  selectActiveVideo();
  resetHeroToStartFrame();

  // Animation state tracking
  let animationState = "initial"; // 'initial', 'playing', 'ended'
  let isAnimating = false;

  // Scroll-triggered animation with controlled flow
  const trigger = ScrollTrigger.create({
    trigger: videoContainer,
    start: "top top",
    end: "+=300%", // Extended pin duration for video playback
    pin: true,
    pinSpacing: true,
    scrub: false, // Disable scrub for manual control
    onEnter: () => {
      bindScrollListeners();
    },
    onLeave: () => {
      unbindScrollListeners();
      animationState = "ended";
    },
    onEnterBack: () => {
      bindScrollListeners();
    },
    onLeaveBack: () => {
      unbindScrollListeners();
      animationState = "initial";
      resetHeroToStartFrame();
    },
  });

  // Bind/unbind scroll listeners
  function bindScrollListeners() {
    if (listenersBound) return;

    window.addEventListener("wheel", handleScrollIntent, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    listenersBound = true;
  }

  function unbindScrollListeners() {
    if (!listenersBound) return;

    window.removeEventListener("wheel", handleScrollIntent);
    window.removeEventListener("touchstart", handleTouchStart);
    window.removeEventListener("touchmove", handleTouchMove);
    listenersBound = false;
  }

  let touchStartY = 0;
  function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchMove(e) {
    if (isAnimating) {
      e.preventDefault();
      return;
    }
    const touchEndY = e.touches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    handleIntent(deltaY, e);
  }

  function handleScrollIntent(e) {
    if (isAnimating) {
      e.preventDefault();
      return;
    }
    handleIntent(e.deltaY, e);
  }

  function handleIntent(deltaY, e) {
    if (Math.abs(deltaY) < 10) return;

    // Scrolling down from initial state
    if (deltaY > 0 && animationState === "initial") {
      e.preventDefault();
      playForwardAnimation();
    }
    // Scrolling up from ended state
    else if (deltaY < 0 && animationState === "ended") {
      e.preventDefault();
      playBackwardAnimation();
    }
  }

  // Forward animation: Fade out content → Play video → Stop at end
  function playForwardAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    animationState = "playing";

    // Fade out content and scroll indicator
    if (heroOverlay) heroOverlay.style.opacity = "0";
    if (scrollIndicator) scrollIndicator.style.opacity = "0";
    if (heroOverlay) heroOverlay.style.pointerEvents = "none";

    if (activeVideo && videoDuration > 0) {
      activeVideo.classList.add("playing");
      activeVideo.currentTime = 0;
      activeVideo.playbackRate = 1; // Normal speed forward
      activeVideo
        .play()
        .then(() => {
          // Video is playing
        })
        .catch((e) => console.warn("Video play failed:", e));

      // Wait for video to finish naturally
      const onVideoEnd = () => {
        activeVideo.removeEventListener("ended", onVideoEnd);
        activeVideo.classList.remove("playing");
        isAnimating = false;
        animationState = "ended";
      };

      activeVideo.addEventListener("ended", onVideoEnd);
    } else {
      // Fallback
      setTimeout(() => {
        isAnimating = false;
        animationState = "ended";
      }, 2000);
    }
  }

  // Backward animation: Play reversed video → Fade in content
  function playBackwardAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    animationState = "playing";

    if (activeVideoReverse && videoDuration > 0) {
      // Use opacity instead of display for smooth transition
      if (activeVideo) activeVideo.style.opacity = "0";
      if (activeVideoReverse) {
        activeVideoReverse.classList.add("active");
        activeVideoReverse.currentTime = 0;
        activeVideoReverse.playbackRate = 1; // Normal speed, but it's already reversed
        activeVideoReverse
          .play()
          .catch((e) => console.warn("Reverse video play failed:", e));

        const onReverseEnd = () => {
          activeVideoReverse.removeEventListener("ended", onReverseEnd);

          // Switch back to forward video and reset to start frame
          activeVideoReverse.classList.remove("active");
          if (activeVideo) {
            activeVideo.currentTime = 0; // Reset to first frame
            activeVideo.style.opacity = "1";
          }

          // Fade in content
          if (heroOverlay) heroOverlay.style.opacity = "1";
          if (scrollIndicator) scrollIndicator.style.opacity = "0.8";
          if (heroOverlay) heroOverlay.style.pointerEvents = "all";

          isAnimating = false;
          animationState = "initial";
        };

        activeVideoReverse.addEventListener("ended", onReverseEnd);
      }
    } else {
      // Fallback if reverse video not available - simple fade in
      setTimeout(() => {
        if (heroOverlay) heroOverlay.style.opacity = "1";
        if (scrollIndicator) scrollIndicator.style.opacity = "0.8";
        if (heroOverlay) heroOverlay.style.pointerEvents = "all";

        isAnimating = false;
        animationState = "initial";
      }, 500);
    }
  }

  // Scroll indicator click handler - triggers the forward animation
  if (scrollIndicator) {
    scrollIndicator.addEventListener("click", () => {
      if (animationState === "initial" && !isAnimating) {
        playForwardAnimation();
      }
    });
  }

  // Handle window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      selectActiveVideo();
      if (animationState !== "ended") {
        resetHeroToStartFrame();
      }
      ScrollTrigger.refresh();
    }, 250);
  });
});
