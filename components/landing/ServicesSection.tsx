import Image from "next/image";
import { SERVICES, PEDICURE, RETIROS, RETIROS_NOTA } from "@/lib/services";

export function ServicesSection() {
  return (
    <section id="servicios" className="px-5 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[.2em] text-violet-500">
          Nuestros servicios
        </div>
        <h2 className="text-center font-display text-3xl font-semibold leading-tight text-ink-900">
          Lo que hacemos <em className="font-normal italic text-violet-500">por ti</em>
        </h2>
        <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-500 to-pink-400" />
        <p className="mt-4 text-center text-sm leading-relaxed text-ink-500">
          Cada servicio es un ritual de cuidado. Precios base en dólares —
          el monto en bolívares se confirma el día de tu cita.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3">
          {SERVICES.map((s) => (
            <article
              key={s.id}
              className="relative overflow-hidden rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              {s.premium && (
                <span className="absolute right-3 top-3 rounded-full bg-ink-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Premium
                </span>
              )}
              {s.popular && !s.premium && (
                <span className="absolute right-3 top-3 rounded-full bg-pink-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-600">
                  Popular
                </span>
              )}
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 overflow-hidden rounded-2xl">
                  <Image
                    src={s.icon}
                    alt=""
                    width={206}
                    height={206}
                    className="h-12 w-12"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-semibold leading-tight text-ink-900">
                    {s.name}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet-500">
                    {s.duration} min · desde ${s.price}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                    {s.description}
                  </p>
                </div>
              </div>
            </article>
          ))}

          {/* Pedicure */}
          <article className="relative overflow-hidden rounded-2xl border border-pink-100 bg-pink-50/40 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 overflow-hidden rounded-2xl">
                <Image
                  src={PEDICURE.icon}
                  alt=""
                  width={206}
                  height={206}
                  className="h-12 w-12"
                />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-semibold leading-tight text-ink-900">
                  {PEDICURE.name}
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-pink-600">
                  {PEDICURE.duration} min · ${PEDICURE.price} · add-on opcional
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                  {PEDICURE.description}
                </p>
              </div>
            </div>
          </article>
        </div>

        {/* Retiros / extras */}
        <details className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-violet-700">
            <span>Retiros y restauraciones</span>
            <span className="text-violet-500">+</span>
          </summary>

          {/* Nota: aplica a todos los retiros */}
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
            <span aria-hidden="true">⚠️ </span>
            <strong>Nota:</strong> {RETIROS_NOTA}
          </div>

          <ul className="mt-3 space-y-2">
            {RETIROS.map((r) => (
              <li
                key={r.id}
                className="flex items-start gap-3 rounded-xl bg-white/70 p-3"
              >
                <span className="flex-shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={r.icon}
                    alt=""
                    width={206}
                    height={206}
                    className="h-10 w-10"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-ink-900">
                      {r.name}
                    </span>
                    <span className="whitespace-nowrap text-xs font-semibold text-violet-700">
                      desde ${r.price}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                    {r.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </details>

        <p className="mt-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50 p-4 text-center text-xs leading-relaxed text-ink-700">
          💱 <strong>El monto en bolívares</strong> se consulta el día del pago según la tasa.
          Los diseños y decoraciones especiales se cotizan aparte. 🎨
        </p>
      </div>
    </section>
  );
}
