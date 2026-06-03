// Mecanismo simple y desacoplado para abrir el modal de Press-On desde
// cualquier parte de la página (sección visible, tarjeta de servicio, etc.).
// El PressOnLauncher escucha este evento y abre el formulario.

export const OPEN_PRESS_ON_EVENT = "lulu:open-press-on";

export function openPressOnModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_PRESS_ON_EVENT));
  }
}
