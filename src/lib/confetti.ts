import confetti from "canvas-confetti";

const BRAND = ["#e11d48", "#f43f5e", "#f59e0b", "#fbbf24", "#fb7185", "#ffffff"];

/** Quick burst from a screen position (normalized 0..1) — used on Add-to-Cart. */
export function miniConfetti(origin?: { x: number; y: number }) {
  confetti({
    particleCount: 32,
    spread: 60,
    startVelocity: 28,
    gravity: 0.9,
    scalar: 0.72,
    ticks: 140,
    origin: origin ?? { x: 0.5, y: 0.6 },
    colors: BRAND,
    disableForReducedMotion: true,
  });
}

/** Big celebratory cannons from both sides — used for checkout success. */
export function celebrationConfetti() {
  const end = Date.now() + 900;
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: BRAND,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: BRAND,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Petal-ish rain for hero / combo completion. */
export function petalConfetti() {
  confetti({
    particleCount: 45,
    spread: 100,
    startVelocity: 22,
    gravity: 0.6,
    scalar: 0.9,
    drift: 0.6,
    ticks: 220,
    origin: { x: 0.5, y: 0.2 },
    shapes: ["circle"],
    colors: BRAND,
    disableForReducedMotion: true,
  });
}
