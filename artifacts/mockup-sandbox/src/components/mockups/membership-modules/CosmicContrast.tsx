import { useState } from "react";
import { Check, ChevronDown, Gem, ShieldCheck, Star, Waves } from "lucide-react";

type MembershipModuleProps = {
  name: string;
  eyebrow: string;
  description: string;
  benefits: string[];
  tone: "gold" | "violet";
  icon: "star" | "gem";
  expanded: boolean;
  onToggle: () => void;
};

function MembershipModule({
  name,
  eyebrow,
  description,
  benefits,
  tone,
  icon,
  expanded,
  onToggle,
}: MembershipModuleProps) {
  const isGold = tone === "gold";
  const accent = isGold ? "#F3C77B" : "#CF9AFF";
  const accentSoft = isGold ? "#8A5D32" : "#6B3F92";
  const border = isGold ? "rgba(235, 177, 87, .72)" : "rgba(181, 113, 241, .7)";
  const background = isGold
    ? "linear-gradient(145deg, rgba(91, 58, 35, .62), rgba(23, 20, 35, .96) 62%)"
    : "linear-gradient(145deg, rgba(65, 33, 93, .7), rgba(22, 18, 43, .98) 65%)";
  const Icon = icon === "star" ? Star : Gem;

  return (
    <div
      className="overflow-hidden rounded-[26px] transition-[box-shadow,transform] duration-300"
      style={{
        background,
        border: `1px solid ${border}`,
        boxShadow: expanded
          ? `0 18px 46px ${isGold ? "rgba(221, 145, 47, .18)" : "rgba(139, 77, 218, .2)"}`
          : "0 10px 28px rgba(0,0,0,.18)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="group flex w-full items-center gap-4 px-5 py-5 text-left outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090b18]"
        style={{ ["--tw-ring-color" as string]: accent }}
      >
        <div
          className="relative flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full"
          style={{
            background: `radial-gradient(circle, ${accentSoft} 0%, rgba(14, 14, 31, .2) 68%)`,
            border: `1px solid ${accent}`,
            boxShadow: `0 0 24px ${isGold ? "rgba(243,199,123,.2)" : "rgba(207,154,255,.25)"}`,
          }}
        >
          <Icon size={27} strokeWidth={1.65} color={accent} />
        </div>
        <span className="min-w-0 flex-1">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-[.2em]" style={{ color: accent }}>
            {eyebrow}
          </span>
          <span className="block font-['DM_Sans'] text-[22px] font-semibold tracking-[-.03em] text-[#f8f2ed]">
            {name}
          </span>
          <span className="mt-1 block text-[13px] leading-snug text-[#beb9ca]">{description}</span>
        </span>
        <ChevronDown
          size={21}
          aria-hidden="true"
          className="shrink-0 transition-transform duration-300 ease-out"
          style={{ color: accent, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr", opacity: expanded ? 1 : 0 }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mx-5 border-t border-white/10 pb-5 pt-4">
            <ul className="space-y-3" aria-label={`Beneficios de ${name}`}>
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-[14px] leading-snug text-[#eee9e9]">
                  <span
                    className="mt-0.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${accent}22` }}
                  >
                    <Check size={11} strokeWidth={2.8} color={accent} />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            {isGold && (
              <button
                type="button"
                onClick={() => undefined}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-transform duration-200 active:scale-[.98]"
                style={{ background: "linear-gradient(90deg, #72502c, #9f7035)", color: "#fff0d0" }}
              >
                Gestionar Premium
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CosmicContrast() {
  const [openPlan, setOpenPlan] = useState<"premium" | "plus">("premium");

  return (
    <main className="min-h-[100dvh] w-full bg-[#080a17] px-4 py-5 text-[#f8f2ed] sm:flex sm:justify-center">
      <div className="relative w-full max-w-[390px] overflow-hidden rounded-[30px] bg-[#0c0e20] px-5 pb-8 pt-7 shadow-[0_24px_80px_rgba(0,0,0,.34)] sm:min-h-[760px]">
        <div className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full bg-[#52226e]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#9a4a48]/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[.07]" style={{ backgroundImage: "radial-gradient(#fff 0.7px, transparent 0.7px)", backgroundSize: "18px 18px" }} />

        <div className="relative">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[.25em] text-[#a9a2bd]">
                <Waves size={13} className="text-[#d69bba]" />
                Resonancia
              </p>
              <h1 className="font-['DM_Sans'] text-[30px] font-semibold tracking-[-.055em]">Tu membresía</h1>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[.04]">
              <ShieldCheck size={17} className="text-[#c8a5c9]" />
            </div>
          </div>

          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#b27b8f]/60 to-transparent" />
            <p className="text-center text-[11px] uppercase tracking-[.18em] text-[#a9a2bd]">elige tu portal</p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#b27b8f]/60 to-transparent" />
          </div>

          <div className="relative space-y-3">
            <MembershipModule
              name="Premium"
              eyebrow="Activo · práctica sin límites"
              description="Tu práctica, sostenida cada día"
              benefits={["Acceso ilimitado a todas las sesiones", "Sonidos y música", "Programas de bienestar"]}
              tone="gold"
              icon="star"
              expanded={openPlan === "premium"}
              onToggle={() => setOpenPlan(openPlan === "premium" ? "plus" : "premium")}
            />
            <MembershipModule
              name="Premium Plus"
              eyebrow="Una experiencia más profunda"
              description="Abre una nueva dimensión de Resonancia"
              benefits={["Experiencias avanzadas", "Prácticas de transformación", "Contenido exclusivo"]}
              tone="violet"
              icon="gem"
              expanded={openPlan === "plus"}
              onToggle={() => setOpenPlan(openPlan === "plus" ? "premium" : "plus")}
            />
          </div>

          <p className="mt-7 text-center text-[11px] leading-relaxed text-[#87839b]">
            Tu espacio para volver a ti. Cambia de nivel cuando tu práctica lo pida.
          </p>
        </div>
      </div>
    </main>
  );
}