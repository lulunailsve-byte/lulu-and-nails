"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Observa todos los elementos con className "scroll-reveal" y les agrega
// "visible" cuando entran al viewport (fade-in). Una vez por elemento.
//
// IMPORTANTE: este componente vive en el layout (persiste entre navegaciones).
// En el App Router, navegar client-side (o "volver atrás") re-monta el
// contenido de la página con elementos .scroll-reveal NUEVOS. Por eso:
//   1. El efecto se re-ejecuta en cada cambio de ruta (dep: pathname) y
//      re-observa los elementos de la página recién montada.
//   2. Un MutationObserver captura cualquier .scroll-reveal que se agregue
//      al DOM después (failsafe contra contenido renderizado tarde).
// Sin esto, al volver a la home las secciones se quedaban invisibles.
//
// rootMargin "0px 0px -80px 0px": dispara cuando faltan 80px para entrar al
// viewport — el fade "llega antes que el ojo".
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // Sin soporte de IntersectionObserver (muy raro): mostrar todo de una.
    if (typeof IntersectionObserver === "undefined") {
      document
        .querySelectorAll<HTMLElement>(".scroll-reveal")
        .forEach((el) => el.classList.add("visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -80px 0px" },
    );

    const observeAll = () => {
      document
        .querySelectorAll<HTMLElement>(".scroll-reveal:not(.visible)")
        .forEach((el) => io.observe(el));
    };

    observeAll();

    // Captura elementos .scroll-reveal agregados al DOM después de este efecto.
    const mo = new MutationObserver(() => observeAll());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
