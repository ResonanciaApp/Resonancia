import React from "react";

const MandalaBackground = () => (
  <svg
    className="absolute -right-[8%] -top-[35%] w-[1300px] h-[1300px] pointer-events-none z-0"
    viewBox="0 0 100 100"
    fill="none"
    stroke="rgba(212, 175, 55, 0.12)"
    strokeWidth="0.1"
  >
    {/* Complex layered mandala / flower of life pattern */}
    <g transform="translate(50, 50)">
      <circle cx="0" cy="0" r="45" strokeWidth="0.15" />
      <circle cx="0" cy="0" r="44.5" strokeWidth="0.05" strokeDasharray="0.5 1" />
      <circle cx="0" cy="0" r="30" strokeWidth="0.1" />

      {/* 12-petaled structural rings */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x = Math.cos(angle) * 15;
        const y = Math.sin(angle) * 15;
        return <circle key={`inner-${i}`} cx={x} cy={y} r="15" />;
      })}

      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x = Math.cos(angle) * 30;
        const y = Math.sin(angle) * 30;
        return <circle key={`outer-${i}`} cx={x} cy={y} r="15" strokeWidth="0.05" />;
      })}

      {/* Outer rays */}
      {[...Array(24)].map((_, i) => {
        const angle = (i * 15 * Math.PI) / 180;
        const x1 = Math.cos(angle) * 30;
        const y1 = Math.sin(angle) * 30;
        const x2 = Math.cos(angle) * 45;
        const y2 = Math.sin(angle) * 45;
        return <line key={`ray-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="0.05" />;
      })}
    </g>
  </svg>
);

export function MandalaSagrada() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 font-sans">
      {/* Container - Fixed 1920x720 */}
      <div
        className="relative overflow-hidden shadow-2xl flex flex-col justify-between"
        style={{
          width: "1920px",
          height: "720px",
          background: "linear-gradient(to bottom, #4A0C0C 0%, #27070E 50%, #1B060F 100%)",
        }}
      >
        <MandalaBackground />

        {/* Header / Logo */}
        <div className="w-full pt-16 px-28 flex justify-between items-center z-10">
          <div className="text-[#BE9650] tracking-[0.45em] text-sm font-light">RESONANCIA</div>
        </div>

        {/* Main Content Column */}
        <div className="flex-1 w-full px-28 flex flex-col justify-center z-10 max-w-[1050px]">
          <div className="mb-6">
            <span className="text-[#D4AF37] tracking-[0.3em] text-sm uppercase font-semibold opacity-90">
              TRANSFORMACIÓN
            </span>
          </div>

          <h1
            className="font-serif text-[6rem] leading-[1.05] text-[#F4DAD5] font-light mb-8"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
          >
            Toda historia <br /> tiene un final
          </h1>

          <div className="flex flex-col gap-10">
            <p className="text-[rgba(244,218,213,0.7)] text-3xl font-light tracking-wide">
              Outlet de despedida de Casa del Cuenco
            </p>

            <div className="flex items-center gap-10 mt-2">
              <div className="flex flex-col border-l border-[#BE9650] border-opacity-30 pl-6 py-2">
                <span className="text-[#D4AF37] font-semibold text-2xl uppercase tracking-[0.1em] mb-1">
                  Hasta 50% DCTO
                </span>
                <span className="text-[rgba(244,218,213,0.55)] text-xl font-light tracking-wide">
                  Del 21 al 15 de julio
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button className="px-12 py-5 border border-[#BE9650] border-opacity-60 text-[#D4AF37] hover:bg-[#BE9650] hover:text-[#1B060F] transition-all duration-500 uppercase tracking-[0.25em] text-sm font-medium group">
                Ver más
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
