"use client";

import { useEffect } from "react";

// Observa todos los elementos con className "scroll-reveal" y les agrega
// "visible" cuando entran al viewport. Una sola vez por elemento (unobserve
// después del primer trigger) para evitar trabajo redundante mientras se
// scrollea pasando por encima y por debajo.
//
// rootMargin "0px 0px -80px 0px": el elemento dispara cuando le faltan 80px
// para entrar completamente al viewport — sensación de fade más natural,
// llega "antes que el ojo".
export function ScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".scroll-reveal");
    if (elements.length === 0) return;

    // Si el browser no soporta IntersectionObserver (muy raro hoy),
    // mostrar todo de una para que no quede el contenido invisible.
    if (typeof IntersectionObserver === "undefined") {
      elements.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -80px 0px" },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
