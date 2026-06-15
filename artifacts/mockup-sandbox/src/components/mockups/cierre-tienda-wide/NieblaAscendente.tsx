import React from "react";

export function NieblaAscendente() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatUp {
          0% { transform: translateY(10%) scale(1); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-100%) scale(1.5); opacity: 0; }
        }
        .fog-column {
          position: absolute;
          bottom: -20%;
          width: 320px;
          height: 800px;
          background: radial-gradient(ellipse at center, rgba(190, 150, 80, 0.15) 0%, rgba(190, 150, 80, 0) 70%);
          filter: blur(40px);
          animation: floatUp 15s infinite linear;
          pointer-events: none;
        }
        .fog-column:nth-child(1) { left: 8%; animation-duration: 18s; animation-delay: 0s; }
        .fog-column:nth-child(2) { left: 30%; animation-duration: 22s; animation-delay: -5s; width: 420px; background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0) 70%); }
        .fog-column:nth-child(3) { left: 55%; animation-duration: 20s; animation-delay: -10s; }
        .fog-column:nth-child(4) { left: 78%; animation-duration: 24s; animation-delay: -3s; width: 360px; background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.10) 0%, rgba(212, 175, 55, 0) 70%); }
      `}} />

      <div
        style={{ width: "1920px", height: "720px" }}
        className="relative overflow-hidden flex flex-col justify-between"
      >
        {/* Base Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#4A0C0C] via-[#27070E] to-[#1B060F]" />

        {/* Animated Fog */}
        <div className="absolute inset-0 z-10 overflow-hidden mix-blend-screen">
          <div className="fog-column" />
          <div className="fog-column" />
          <div className="fog-column" />
          <div className="fog-column" />

          {/* Static glowing orbs for base warmth */}
          <div className="absolute bottom-0 left-1/4 w-[700px] h-[400px] bg-[#BE9650] opacity-20 blur-[100px] rounded-full translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-[#D4AF37] opacity-15 blur-[120px] rounded-full translate-y-1/3" />
        </div>

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-24 text-center">
          <div className="mb-12">
            <span className="text-[rgba(244,218,213,0.55)] tracking-[0.4em] text-sm uppercase font-light">
              Transformación
            </span>
          </div>

          <h1 className="text-[#F4DAD5] font-['Playfair_Display'] text-7xl md:text-[7rem] font-medium tracking-wide mb-6 drop-shadow-lg">
            Toda historia tiene un final
          </h1>

          <p className="text-[#BE9650] text-2xl font-light tracking-widest mb-16">
            Outlet de despedida de Casa del Cuenco
          </p>

          <div className="flex flex-col items-center gap-8 mt-4">
            <div className="flex items-center gap-12 text-[#F4DAD5]">
              <div className="flex flex-col items-center">
                <span className="text-[rgba(244,218,213,0.55)] text-xs uppercase tracking-[0.2em] mb-2">Fechas</span>
                <span className="text-xl font-light tracking-wider">Del 21 al 15 de julio</span>
              </div>
              <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-[#BE9650]/50 to-transparent" />
              <div className="flex flex-col items-center">
                <span className="text-[rgba(244,218,213,0.55)] text-xs uppercase tracking-[0.2em] mb-2">Beneficio</span>
                <span className="text-xl font-light tracking-wider text-[#D4AF37]">Hasta 50% DCTO</span>
              </div>
            </div>

            <button className="mt-8 px-12 py-4 border border-[#BE9650]/40 text-[#F4DAD5] uppercase tracking-[0.2em] text-sm transition-all duration-500 hover:bg-[#BE9650]/10 hover:border-[#BE9650] hover:shadow-[0_0_20px_rgba(190,150,80,0.2)] backdrop-blur-sm">
              Ver más
            </button>
          </div>
        </div>

        {/* Top & Bottom decorative borders / Branding */}
        <div className="absolute top-8 left-0 right-0 flex justify-center z-20">
          <div className="w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#BE9650]/30 to-transparent" />
        </div>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20">
          <span className="text-[#BE9650] text-xs tracking-[0.8em] opacity-60">RESONANCIA</span>
        </div>
      </div>
    </div>
  );
}
