import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Diamond, Moon, Sparkles, Star } from "lucide-react";

const premiumBenefits = [
  "Acceso ilimitado a todas las sesiones",
  "Sonidos y música",
  "Programas de bienestar",
];

const plusBenefits = [
  "Experiencias avanzadas",
  "Prácticas de transformación",
  "Contenido exclusivo",
];

export function AmethystNight() {
  const [openPlan, setOpenPlan] = useState<"premium" | "plus" | null>("premium");

  const togglePlan = (plan: "premium" | "plus") => {
    setOpenPlan((current) => (current === plan ? null : plan));
  };

  return (
    <main
      className="min-h-[100dvh] w-full overflow-hidden bg-[#111021] px-5 py-8 text-[#f1ecf7]"
      style={{
        fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
        backgroundImage:
          "radial-gradient(circle at 83% 11%, rgba(126,87,177,.20), transparent 30%), radial-gradient(circle at 4% 88%, rgba(207,157,73,.08), transparent 28%), linear-gradient(155deg, #17152b 0%, #100f1e 65%, #141226 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[390px]">
        <header className="mb-7 flex items-center justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a49bb8]">
              Resonancia · perfil
            </p>
            <h1
              className="text-[29px] font-light tracking-[-0.04em] text-[#f7f0f3]"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Tu membresía
            </h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c99b4a]/25 bg-[#c99b4a]/[0.07] text-[#d8ad63]">
            <Moon size={16} strokeWidth={1.5} />
          </div>
        </header>

        <div className="mb-4 h-px bg-gradient-to-r from-[#c99b4a]/70 via-[#8661a9]/30 to-transparent" />
        <p className="mb-5 max-w-[270px] text-[12px] leading-5 text-[#a8a1b5]">
          Un espacio para sostener tu práctica, al ritmo que pide tu interior.
        </p>

        <section className="space-y-3" aria-label="Planes de membresía">
          <MembershipModule
            plan="premium"
            title="Premium"
            eyebrow="Tu práctica, sin límites"
            icon={<Star size={23} fill="currentColor" strokeWidth={1.5} />}
            benefits={premiumBenefits}
            open={openPlan === "premium"}
            onToggle={() => togglePlan("premium")}
          />
          <MembershipModule
            plan="plus"
            title="Premium Plus"
            eyebrow="Lleva tu experiencia al siguiente nivel"
            icon={<Diamond size={23} fill="currentColor" strokeWidth={1.25} />}
            benefits={plusBenefits}
            open={openPlan === "plus"}
            onToggle={() => togglePlan("plus")}
          />
        </section>

        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#8e79ad]/20 bg-[#29233d]/35 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c99b4a]/10 text-[#d5a956]">
            <Sparkles size={15} strokeWidth={1.5} />
          </div>
          <p className="text-[11px] leading-4 text-[#aaa2b7]">
            Tu membresía acompaña cada pausa, cada noche y cada regreso.
          </p>
        </div>
      </div>
    </main>
  );
}

function MembershipModule({
  plan,
  title,
  eyebrow,
  icon,
  benefits,
  open,
  onToggle,
}: {
  plan: "premium" | "plus";
  title: string;
  eyebrow: string;
  icon: ReactNode;
  benefits: string[];
  open: boolean;
  onToggle: () => void;
}) {
  const [managed, setManaged] = useState(false);
  const isPremium = plan === "premium";
  const shell = isPremium
    ? "border-[#c99b4a]/65 bg-[#272333]/85 shadow-[0_12px_35px_rgba(4,3,12,.28)]"
    : "border-[#9064c6]/65 bg-[#302447]/88 shadow-[0_12px_35px_rgba(8,4,21,.32)]";
  const accent = isPremium ? "text-[#e0b35d]" : "text-[#c99cf3]";
  const muted = isPremium ? "text-[#c1b9c5]" : "text-[#c5b9d5]";
  const iconShell = isPremium
    ? "border-[#d8a951]/70 bg-[#c99b4a]/[0.12] shadow-[0_0_26px_rgba(211,164,73,.16)]"
    : "border-[#a77bd4]/75 bg-[#9a6bd0]/[0.13] shadow-[0_0_28px_rgba(165,112,229,.22)]";

  return (
    <div className={`overflow-hidden rounded-[22px] border transition-[background-color,border-color] duration-300 ${shell}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${plan}-details`}
        onClick={onToggle}
        className="group flex w-full items-center gap-4 px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#e1bb72] focus-visible:ring-inset"
      >
        <span className={`relative flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border ${iconShell} ${accent}`}>
          <span className="absolute inset-1 rounded-full border border-current/20" />
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.19em] text-[#b0a6bd]">
            {isPremium ? "Activo ahora" : "Una práctica más profunda"}
          </span>
          <span className={`block text-[20px] font-semibold tracking-[-0.03em] ${accent}`}>{title}</span>
          <span className={`mt-0.5 block text-[11px] ${muted}`}>{eyebrow}</span>
        </span>
        <ChevronDown
          size={19}
          className={`shrink-0 text-[#aaa0b8] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <div
        id={`${plan}-details`}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mx-4 border-t border-current/10 pb-4 pt-3">
            <ul className="space-y-2.5" aria-label={`Beneficios de ${title}`}>
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-[12px] leading-5 text-[#d1c9d6]">
                  <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${isPremium ? "bg-[#d4a64f]" : "bg-[#bd8ded]"}`} />
                  {benefit}
                </li>
              ))}
            </ul>
            {isPremium && (
              <button
                type="button"
                aria-pressed={managed}
                onClick={() => setManaged(true)}
                className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#886326]/80 text-[12px] font-semibold text-[#f5d58f] transition-colors hover:bg-[#9a742e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c978]"
              >
                {managed ? "Premium gestionado" : "Gestionar Premium"}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}