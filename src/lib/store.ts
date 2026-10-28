import type Lenis from "lenis";

// Mutable state shared between the DOM (GSAP/Lenis) and the WebGL scene.
// Read inside useFrame — never put this in React state.
export const scrollState = { chapter: 0, velocity: 0 };
export const pointer = { x: 0, y: 0 };
export const sceneState = { intro: 0 };
export const lenisRef: { current: Lenis | null } = { current: null };

// Fires once, when the preloader hands over to the page.
type Listener = () => void;
let introPlayed = false;
const listeners = new Set<Listener>();

export function onIntro(fn: Listener) {
  if (introPlayed) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function playIntro() {
  introPlayed = true;
  listeners.forEach((fn) => fn());
  listeners.clear();
}

export function isIntroPlayed() {
  return introPlayed;
}

export function scrollToTarget(target: string | number) {
  if (lenisRef.current) {
    lenisRef.current.scrollTo(target, { duration: 1.6 });
  } else if (typeof target === "string") {
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  } else {
    window.scrollTo({ top: target, behavior: "smooth" });
  }
}
