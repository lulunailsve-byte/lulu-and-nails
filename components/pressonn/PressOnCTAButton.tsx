"use client";

import { openPressOnModal } from "./pressOnModal";

// Botón reutilizable que abre el modal de Press-On. Se usa desde la sección
// visible y desde la tarjeta de servicio (ambos en server components).
export function PressOnCTAButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={openPressOnModal} className={className}>
      {children}
    </button>
  );
}
