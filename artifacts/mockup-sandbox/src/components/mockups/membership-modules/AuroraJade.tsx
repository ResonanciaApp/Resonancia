import { useState } from "react";
import { Check, ChevronDown, Diamond, Star, Waves } from "lucide-react";

const plans = [
  {
    id: "premium",
    name: "Premium",
    eyebrow: "Tu práctica, sin límites",
    icon: Star,
    accent: "#e7b95c",
    soft: "#fff1bf",
    border: "rgba(231,185,92,.55)",
    glow: "rgba(231,185,92,.18)",
    benefits: [
      "Acceso ilimitado a todas las sesiones",
      "Sonidos y música",
      "Programas de bienestar",
    ],
  },
  {
    id: "plus",
    name: "Premium Plus",
    eyebrow: "Lleva tu experiencia al siguiente nivel",
    icon: Diamond,
    accent: "#c9a6ff",
    soft: "#eadcff",
    border: "rgba(183,132,255,.7)",
    glow: "rgba(133,83,218,.22)",
    benefits: [
      "Experiencias avanzadas",
      "Prácticas de transformación",
      "Contenido exclusivo",
    ],
  },
] as const;

export function AuroraJade() {
  const [expanded, setExpanded] = useState("premium");
  const [managed, setManaged] = useState(false);

  return (
    <main
      className="min-h-[100dvh] w-full overflow-hidden px-5 py-7 text-[#f7f2e8]"
      style={{
        background:
          "radial-gradient(circle at 83% 9%, rgba(29,166,145,.28), transparent 26%), radial-gradient(circle at 15% 48%, rgba(13,103,98,.27), transparent 34%), #111b2b",
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes aurora-rise { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes breathe { 0%,100% { transform: scale(1); opacity:.65 } 50% { transform: scale(1.08); opacity:1 } }
        .aurora-panel { animation: aurora-rise .42s ease-out both; }
        .breathe { animation: breathe 5s ease-in-out infinite; }
      `}</style>

      <section className="mx-auto max-w-[410px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[#91d2c7]">
              Resonancia
            </p>
            <h1
              className="text-[28px] font-semibold tracking-[-0.04em]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Tu membresía
            </h1>
          </div>
          <div className="breathe relative flex h-11 w-11 items-center justify-center rounded-full border border-[#6dcfc0]/40 bg-[#173b43]/70 text-[#a8eee0]">
            <Waves size={19} strokeWidth={1.5} />
            <span className="absolute inset-[-5px] rounded-full border border-[#64baa9]/10" />
          </div>
        </div>

        <p className="mb-5 max-w-[315px] text-[13px] leading-5 text-[#aab9be]">
          Un espacio para volver a ti, con prácticas que acompañan cada momento.
        </p>

        <div className="space-y-3">
          {plans.map((plan) => {
            const isOpen = expanded === plan.id;
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className="relative overflow-hidden rounded-[22px] transition-all duration-300"
                style={{
                  border: `1px solid ${isOpen ? plan.border : "rgba(145,177,180,.23)"}`,
                  background: isOpen
                    ? `linear-gradient(145deg, ${plan.glow}, rgba(22,35,51,.82) 62%)`
                    : "rgba(20,31,46,.72)",
                  boxShadow: isOpen ? `0 12px 34px ${plan.glow}` : "0 8px 20px rgba(3,11,20,.16)",
                }}
              >
                {plan.id === "premium" && (
                  <div className="absolute right-4 top-3 rounded-full border border-[#e7b95c]/35 bg-[#e7b95c]/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f1cd78]">
                    Activo
                  </div>
                )}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${plan.id}-benefits`}
                  onClick={() => setExpanded(isOpen ? "" : plan.id)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#7ed9ca] focus-visible:ring-inset"
                >
                  <span
                    className="relative flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full"
                    style={{
                      color: plan.accent,
                      border: `1px solid ${plan.border}`,
                      background: `radial-gradient(circle, ${plan.glow}, rgba(13,24,39,.55) 72%)`,
                      boxShadow: `0 0 24px ${plan.glow}`,
                    }}
                  >
                    <Icon size={27} strokeWidth={1.5} fill={plan.id === "premium" ? "currentColor" : "none"} />
                  </span>
                  <span className="min-w-0 flex-1 pr-1">
                    <span className="block text-[20px] font-medium tracking-[-0.03em]" style={{ color: plan.soft }}>
                      {plan.name}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-4 text-[#b0bec1]">{plan.eyebrow}</span>
                  </span>
                  <ChevronDown
                    size={19}
                    className="shrink-0 transition-transform duration-300"
                    style={{ color: plan.accent, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>

                <div
                  id={`${plan.id}-benefits`}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="mx-4 border-t border-white/10 pb-4 pt-3">
                      <ul className="space-y-2.5">
                        {plan.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2.5 text-[13px] leading-5 text-[#d4ddda]">
                            <Check size={15} className="mt-0.5 shrink-0" style={{ color: plan.accent }} />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                      {plan.id === "premium" && (
                        <button
                          type="button"
                          onClick={() => setManaged((value) => !value)}
                          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl text-[13px] font-semibold transition-transform active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1cd78]"
                          style={{
                            color: "#152132",
                            background: "linear-gradient(105deg, #d9a940, #f2d581 52%, #c88e2b)",
                          }}
                        >
                          {managed ? "Gestión abierta" : "Gestionar Premium"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-center text-[11px] leading-4 text-[#71868a]">
          Elige el nivel que acompañe tu práctica de hoy.
        </p>
      </section>
    </main>
  );
}