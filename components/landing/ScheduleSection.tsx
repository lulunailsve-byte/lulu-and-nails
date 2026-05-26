export function ScheduleSection() {
  type Item = { time: string; label: string; tag: string; color?: "pink" | "ink" };
  const items: Item[] = [
    { time: "9am – 12pm", label: "Bloque mañana", tag: "Lun – Sáb" },
    { time: "2pm – 9pm", label: "Bloque tarde y noche", tag: "Lun – Sáb" },
    { time: "7:00 PM", label: "Última cita disponible", tag: "Cierre" },
  ];

  return (
    <section id="horarios" className="px-5 py-14">
      <div className="mx-auto max-w-md">
        <div className="scroll-reveal">
          <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[.2em] text-violet-500">
            Disponibilidad
          </div>
          <h2 className="text-center font-display text-3xl font-semibold leading-tight text-ink-900">
            Nuestros <em className="font-normal italic text-violet-500">horarios</em>
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-500 to-pink-400" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {items.map((it) => (
            <div
              key={it.label}
              className="scroll-reveal rounded-2xl border border-white/80 bg-white/70 p-4 text-center backdrop-blur"
            >
              <div className="font-display text-lg font-semibold text-violet-700">
                {it.time}
              </div>
              <div className="mt-1 text-[11px] leading-tight text-ink-500">
                {it.label}
              </div>
              <span
                className={
                  "mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold " +
                  (it.color === "pink"
                    ? "bg-pink-100 text-pink-600"
                    : it.color === "ink"
                      ? "bg-ink-900 text-white"
                      : "bg-violet-100 text-violet-700")
                }
              >
                {it.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
