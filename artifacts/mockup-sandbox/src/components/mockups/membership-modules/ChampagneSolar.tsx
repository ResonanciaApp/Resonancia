import { useState } from "react";
import {
  Check,
  ChevronDown,
  Diamond,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
} from "lucide-react";

type Plan = {
  name: string;
  eyebrow: string;
  description: string;
  benefits: string[];
  tone: "gold" | "violet";
};

const plans: Plan[] = [
  {
    name: "Premium",
    eyebrow: "Tu práctica, sin límites",
    description: "Una base luminosa para volver a ti cada día.",
    benefits: [
      "Acceso ilimitado a todas las sesiones",
      "Sonidos y música",
      "Programas de bienestar",
    ],
    tone: "gold",
  },
  {
    name: "Premium Plus",
    eyebrow: "Lleva tu experiencia al siguiente nivel",
    description: "Capas más profundas para sostener tu transformación.",
    benefits: [
      "Experiencias avanzadas",
      "Prácticas de transformación",
      "Contenido exclusivo",
    ],
    tone: "violet",
  },
];

export function ChampagneSolar() {
  const [openPlan, setOpenPlan] = useState("Premium");

  return (
    <main className="min-h-[100dvh] w-full overflow-hidden bg-[#f6efdf] px-4 py-7 text-[#332b28] sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-90px] top-[-100px] h-[280px] w-[280px] rounded-full bg-[#f5cf78]/35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-120px] right-[-90px] h-[280px] w-[280px] rounded-full bg-[#d9c4ed]/45 blur-3xl"
      />

      <section className="relative mx-auto max-w-[390px]">
        <header className="mb-7 flex items-start justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#877569]">
              <span className="h-px w-7 bg-[#d7ac55]" />
              Resonancia
            </div>
            <h1 className="font-['Playfair_Display'] text-[31px] leading-[1.05] tracking-[-0.03em] text-[#45342c]">
              Tu membresía
            </h1>
            <p className="mt-2 max-w-[270px] text-[13px] leading-5 text-[#88786f]">
              Elige el espacio que acompañará tus momentos de pausa.
            </p>
          </div>
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-[#ead8ae] bg-[#fffaf0]/75 text-[#c58f35] shadow-[0_5px_20px_rgba(162,119,57,0.12)]">
            <SunMedium size={19} strokeWidth={1.7} />
          </div>
        </header>

        <div className="space-y-3">
          {plans.map((plan) => {
            const isOpen = openPlan === plan.name;
            const gold = plan.tone === "gold";
            return (
              <article
                key={plan.name}
                className={[
                  "overflow-hidden rounded-[24px] border transition-[background-color,border-color,box-shadow] duration-300",
                  gold
                    ? isOpen
                      ? "border-[#d6ab58] bg-[#fff9e9] shadow-[0_16px_35px_rgba(174,128,49,0.16)]"
                      : "border-[#e9d8ac] bg-[#fffaf1]/75"
                    : isOpen
                      ? "border-[#9f7ac7] bg-[#fbf6ff] shadow-[0_16px_35px_rgba(111,72,152,0.13)]"
                      : "border-[#d9c8e7] bg-[#f8f1ff]/75",
                ].join(" ")}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${plan.name.replace(/\s/g, "-").toLowerCase()}-details`}
                  onClick={() => setOpenPlan(isOpen ? "" : plan.name)}
                  className="group flex w-full items-center gap-4 px-5 py-4 text-left outline-none transition-transform duration-200 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-[#b68a48] focus-visible:ring-inset"
                >
                  <span
                    className={[
                      "relative flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[19px] border shadow-inner",
                      gold
                        ? "border-[#e8c66f] bg-[linear-gradient(145deg,#ffe8a7,#dfad4e)] text-[#fff7df] shadow-[inset_0_2px_8px_rgba(255,255,255,0.65),0_5px_15px_rgba(182,132,45,0.2)]"
                        : "border-[#b99bd7] bg-[linear-gradient(145deg,#d9baf0,#9470bb)] text-[#fffaff] shadow-[inset_0_2px_8px_rgba(255,255,255,0.48),0_5px_15px_rgba(111,72,152,0.18)]",
                    ].join(" ")}
                  >
                    <span className="absolute inset-[6px] rounded-[14px] border border-white/30" />
                    {gold ? <Star size={26} fill="currentColor" strokeWidth={1.25} /> : <Diamond size={27} fill="currentColor" strokeWidth={1.25} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a88a68]">
                      {gold ? "Activo · recomendado" : "Para ir más profundo"}
                    </span>
                    <span className={["block font-['Playfair_Display'] text-[24px] leading-none", gold ? "text-[#a96f1f]" : "text-[#76519c]"].join(" ")}>
                      {plan.name}
                    </span>
                    <span className="mt-1 block truncate text-[12px] text-[#8b7972]">{plan.eyebrow}</span>
                  </span>
                  <ChevronDown
                    size={20}
                    strokeWidth={1.8}
                    className={["shrink-0 transition-transform duration-300", isOpen ? "rotate-180" : "", gold ? "text-[#b47d2b]" : "text-[#8056a6]"].join(" ")}
                  />
                </button>

                <div
                  id={`${plan.name.replace(/\s/g, "-").toLowerCase()}-details`}
                  className={["grid transition-[grid-template-rows,opacity] duration-300 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"].join(" ")}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="px-5 pb-5 pl-[98px]">
                      <p className="mb-3 text-[12px] leading-5 text-[#897872]">{plan.description}</p>
                      <ul className="space-y-2.5">
                        {plan.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2.5 text-[13px] leading-[1.2] text-[#554942]">
                            <span className={["mt-[-1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full", gold ? "bg-[#f4dfab] text-[#9b6d22]" : "bg-[#e4d5f2] text-[#7a519f]"].join(" ")}>
                              <Check size={10} strokeWidth={3} />
                            </span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                      {gold && (
                        <button
                          type="button"
                          onClick={() => window.alert("Demo: aquí gestionarías tu membresía.")}
                          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[13px] bg-[#c8943b] text-[13px] font-semibold text-[#fff8e8] shadow-[0_8px_16px_rgba(172,124,42,0.2)] transition-transform duration-200 hover:bg-[#b9842d] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9d6b1f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff9e9]"
                        >
                          Gestionar Premium
                          <Sparkles size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-[#9a887d]">
          <ShieldCheck size={15} strokeWidth={1.6} className="text-[#c18d3a]" />
          Un espacio seguro para tu práctica personal
        </div>
      </section>
    </main>
  );
}