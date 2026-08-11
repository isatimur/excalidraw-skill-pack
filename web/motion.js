(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  function revealStatic() {
    document.documentElement.classList.remove("has-motion");
    document.querySelectorAll("[data-motion-text], [data-reveal], [data-reveal-item], [data-image-reveal]").forEach((el) => {
      el.style.visibility = "visible";
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.filter = "none";
      el.style.clipPath = "none";
    });
  }

  if (reduceMotion || typeof gsap === "undefined") {
    revealStatic();
    return;
  }

  document.documentElement.classList.add("has-motion");
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out", duration: 0.85 });

  let lenis;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      anchors: true
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  function splitWords(element) {
    if (element.dataset.motionSplit === "true") return;
    const text = element.textContent || "";
    const parts = text.split(/(\s+)/);
    element.textContent = "";
    element.setAttribute("aria-label", text.trim());
    let index = 0;
    parts.forEach((part) => {
      if (!part.trim()) {
        element.appendChild(document.createTextNode(part));
        return;
      }
      const mask = document.createElement("span");
      const word = document.createElement("span");
      mask.className = "motion-word-mask";
      mask.setAttribute("aria-hidden", "true");
      word.className = "motion-word";
      word.textContent = part;
      word.style.setProperty("--word-index", String(index));
      mask.appendChild(word);
      element.appendChild(mask);
      index += 1;
    });
    element.dataset.motionSplit = "true";
  }

  document.querySelectorAll("[data-motion-text='words']").forEach((element) => {
    splitWords(element);
    const words = element.querySelectorAll(".motion-word");
    gsap.set(element, { autoAlpha: 1 });
    gsap.fromTo(
      words,
      { yPercent: 110, autoAlpha: 0, filter: "blur(8px)" },
      {
        yPercent: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.055,
        scrollTrigger: { trigger: element, start: "top 82%", once: true }
      }
    );
  });

  document.querySelectorAll("[data-motion-text='lines']").forEach((element) => {
    const lines = element.querySelectorAll(".motion-line");
    const targets = lines.length ? lines : element.children;
    gsap.set(element, { autoAlpha: 1 });
    gsap.fromTo(
      targets,
      { yPercent: 100, autoAlpha: 0, filter: "blur(8px)" },
      {
        yPercent: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 1,
        ease: "power4.out",
        stagger: 0.11,
        scrollTrigger: { trigger: element, start: "top 84%", once: true }
      }
    );
  });

  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    const items = group.querySelectorAll("[data-reveal-item]");
    gsap.set(group, { autoAlpha: 1 });
    gsap.fromTo(
      items,
      { y: 36, autoAlpha: 0, filter: "blur(8px)" },
      {
        y: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.95,
        ease: "power4.out",
        stagger: 0.075,
        scrollTrigger: { trigger: group, start: "top 82%", once: true }
      }
    );
  });

  document.querySelectorAll("[data-reveal]:not([data-reveal-item])").forEach((element) => {
    gsap.set(element, { autoAlpha: 1 });
    gsap.fromTo(
      element,
      { y: 32, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: "power4.out",
        delay: Number(element.dataset.revealDelay || 0),
        scrollTrigger: { trigger: element, start: "top 84%", once: true }
      }
    );
  });

  document.querySelectorAll("[data-image-reveal]").forEach((figure) => {
    const image = figure.querySelector("img, [data-parallax-image]");
    gsap.set(figure, { autoAlpha: 1 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: figure, start: "top 82%", once: true }
    });
    tl.fromTo(
      figure,
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "power4.out" }
    );
    if (image) {
      tl.fromTo(
        image,
        { scale: 1.08, autoAlpha: 0.75 },
        { scale: 1, autoAlpha: 1, duration: 1.2, ease: "power4.out" },
        0
      );
    }
  });

  document.querySelectorAll("[data-parallax-image]").forEach((layer) => {
    const speed = Number(layer.dataset.parallaxSpeed || 0.12);
    const section = layer.closest("[data-parallax-section]") || layer;
    gsap.to(layer, {
      y: () => window.innerHeight * speed * -1,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
        invalidateOnRefresh: true
      }
    });
  });

  if (!coarse) {
    document.querySelectorAll("[data-magnetic]").forEach((element) => {
      const strength = Number(element.dataset.magnetic || 0.18);
      const xTo = gsap.quickTo(element, "x", { duration: 0.45, ease: "power3.out" });
      const yTo = gsap.quickTo(element, "y", { duration: 0.45, ease: "power3.out" });
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * strength;
        const y = (event.clientY - rect.top - rect.height / 2) * strength;
        xTo(x);
        yTo(y);
      });
      element.addEventListener("pointerleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });
})();
