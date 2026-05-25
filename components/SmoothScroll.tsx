"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Wraps Lenis (https://lenis.darkroom.engineering/) — provee smooth scroll
// con curva ease-out sobre toda la página. Reemplaza el scroll nativo del
// wheel/anchor con interpolación por requestAnimationFrame.
//
// Decisiones:
//   - duration: 1.2s — sensación suave pero responsiva (no se siente lenta)
//   - easing: ease-out expo — desacelera al final del scroll ("se va frenando")
//   - smoothWheel: true — habilita el efecto en desktop (objetivo principal)
//   - smoothTouch: false — mobile ya tiene momentum/deceleration nativos;
//     activarlo puede romper scroll en inputs, modales y el sticky checkout.
//     Si más adelante hace falta, se cambia a true.
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expoOut
      smoothWheel: true,
      touchMultiplier: 2,
      wheelMultiplier: 1,
    });

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
