import { useState } from "react";
import { Check, ChevronDown, Diamond, ShieldCheck, Star } from "lucide-react";

type MembershipModuleProps = {
  name: string;
  subtitle: string;
  benefits: string[];
  tone: "gold" | "violet";
  expanded: boolean;
  onToggle: () => void;
};

function MembershipModule({
  name,
  subtitle,
  benefits,
  tone,
  expanded,
  onToggle,
}: MembershipModuleProps) {
  const gold = tone === "gold";
  const Icon = gold ? Star : Diamond;
  const colors = gold
    ? {
        border: "rgba(191, 151, 69, .72)",
        borderSoft: "rgba(191, 151, 69, .26)",
        icon: "#d3aa58",
        iconBg: "rgba(157, 117, 41, .18)",
        text: "#e3bd6b",
        sub: "#c8bda7",
        wash: "rgba(153, 112, 40, .12)",
        rule: "rgba(210, 170, 91, .24)",
      }
    : {
        border: "rgba(151, 113, 203, .66)",
        borderSoft: "rgba(151, 113, 203, .22)",
        icon: "#b89be8",
        iconBg: "rgba(114, 71, 166, .2)",
        text: "#c3a5ed",
        sub: "#bbb0c9",
        wash: "rgba(92, 58, 139, .14)",
        rule: "rgba(176, 136, 222, .2)",
      };

  return (
    <div
      className="overflow-hidden rounded-[22px] transition-[border-color,background-color] duration-500"
      style={{
        border: `1px solid ${expanded ? colors.border : colors.borderSoft}`,
        background: expanded
          ? `linear-gradient(145deg, ${colors.wash}, rgba(15, 22, 39, .74) 72%)`
          : "rgba(20, 27, 45, .6)",
        boxShadow: expanded
          ? `inset 0 1px 0 rgba(255,255,255,.06), 0 14px 34px ${gold ? "rgba(120,87,29,.12)" : "rgba(85,52,135,.12)"}`
          : "inset 0 1px 0 rgba(255,255,255,.035)",
      }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`${name.toLowerCase().replaceAll(" ", "-")}-benefits`}
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left outline-none transition-transform duration-200 active:scale-[.985] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10182d]"
        style={{ color: colors.text, ["--tw-ring-color" as string]: colors.icon }}
      >
        <span
          className="relative flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full"
          style={{
            color: colors.icon,
            background: colors.iconBg,
            border: `1px solid ${colors.border}`,
            boxShadow: `0 0 0 7px ${colors.iconBg}, inset 0 1px 1px rgba(255,255,255,.13)`,
          }}
        >
          <Icon size={gold ? 27 : 28} strokeWidth={gold ? 1.45 : 1.65} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className="mb-1 block font-['DM_Sans'] text-[10px] font-medium uppercase tracking-[.22em]"
            style={{ color: colors.sub }}
          >
            {subtitle}
          </span>
          <span className="block font-['Playfair_Display'] text-[25px] leading-none" style={{ color: colors.text }}>
            {name}
          </span>
        </span>
        <ChevronDown
          size={20}
          strokeWidth={1.5}
          className="shrink-0 transition-transform duration-500"
          style={{ color: colors.icon, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        />
      </button>

      <div
        id={`${name.toLowerCase().replaceAll(" ", "-")}-benefits`}
        className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr", opacity: expanded ? 1 : 0 }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mx-5 mb-5 border-t pt-4" style={{ borderColor: colors.rule }}>
            <ul className="space-y-3" aria-label={`Beneficios de ${name}`}>
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 font-['DM_Sans'] text-[13px] leading-[1.35]" style={{ color: colors.sub }}>
                  <Check className="mt-[1px] shrink-0" size={15} strokeWidth={2} style={{ color: colors.icon }} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            {gold && (
              <button
                type="button"
                onClick={() => undefined}
                className="mt-5 flex w-full items-center justify-center rounded-xl py-3 font-['DM_Sans'] text-[13px] font-medium transition-colors hover:bg-[#c69d4e]/20 focus-visible:outline-none focus-visible:ring-2"
                style={{ color: "#e7c777", background: "rgba(165, 121, 43, .3)", ["--tw-ring-color" as string]: colors.icon }}
              >
                Gestionar Premium
                <span className="ml-2 text-[18px] leading-none">›</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DoradoEditorial() {
  const [open, setOpen] = useState<"premium" | "plus">("premium");

  return (
    <main
      className="min-h-[100dvh] w-full overflow-x-hidden px-5 py-8 text-[#f3eee4]"
      style={{
        background:
          "radial-gradient(circle at 18% 4%, rgba(121, 88, 40, .18), transparent 30%), radial-gradient(circle at 94% 46%, rgba(74, 50, 116, .16), transparent 34%), #0d1528",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div className="mx-auto w-full max-w-[390px]">
        <header className="mb-8">
          <div className="mb-5 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[.28em] text-[#948d86]">
            <span className="h-px w-8 bg-[#a8874d]" />
            Resonancia
          </div>
          <div className="flex items-end justify-between">
            <h1 className="font-['Playfair_Display'] text-[34px] leading-[.96] tracking-[-.02em] text-[#f1eadc]">
              Tu<br />membresía
            </h1>
            <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#a89f93]">
              <ShieldCheck size={15} strokeWidth={1.3} className="text-[#c7a45a]" />
              Tu práctica
            </div>
          </div>
          <p className="mt-5 max-w-[290px] font-['DM_Sans'] text-[13px] leading-relaxed text-[#aaa59d]">
            Un espacio reservado para continuar escuchándote.
          </p>
        </header>

        <section className="space-y-3" aria-label="Opciones de membresía">
          <MembershipModule
            name="Premium"
            subtitle="Tu práctica, sin límites"
            tone="gold"
            expanded={open === "premium"}
            onToggle={() => setOpen(open === "premium" ? "plus" : "premium")}
            benefits={["Acceso ilimitado a todas las sesiones", "Sonidos y música", "Programas de bienestar"]}
          />
          <MembershipModule
            name="Premium Plus"
            subtitle="Lleva tu experiencia al siguiente nivel"
            tone="violet"
            expanded={open === "plus"}
            onToggle={() => setOpen(open === "plus" ? "premium" : "plus")}
            benefits={["Experiencias avanzadas", "Prácticas de transformación", "Contenido exclusivo"]}
          />
        </section>

        <footer className="mt-8 flex items-center justify-center gap-2 text-center font-['DM_Sans'] text-[10px] uppercase tracking-[.17em] text-[#746f70]">
          <span className="h-px w-5 bg-[#514c50]" />
          Presencia · pausa · resonancia
          <span className="h-px w-5 bg-[#514c50]" />
        </footer>
      </div>
    </main>
  );
}