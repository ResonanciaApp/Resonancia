import React from "react";

export function ConstelacionFinal() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 font-sans">
      {/* Container fijo 1280x720 para exportar */}
      <div
        className="relative overflow-hidden flex"
        style={{
          width: "1280px",
          height: "720px",
          background: "linear-gradient(180deg, #4A0C0C 0%, #27070E 50%, #1B060F 100%)",
          color: "#F4DAD5",
        }}
      >
        {/* Constelaciones / Estrellas SVG Background */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1280 720" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Puntos y líneas finas doradas simulando constelaciones */}
            <g stroke="#BE9650" strokeWidth="0.5" strokeOpacity="0.3">
              <line x1="800" y1="150" x2="950" y2="250" />
              <line x1="950" y1="250" x2="1050" y2="180" />
              <line x1="950" y1="250" x2="1020" y2="380" />
              <line x1="1020" y1="380" x2="1150" y2="420" />
              <line x1="1020" y1="380" x2="980" y2="550" />
              <line x1="980" y1="550" x2="820" y2="600" />
              <line x1="820" y1="600" x2="800" y2="150" />
              <line x1="820" y1="600" x2="700" y2="480" />
              <line x1="700" y1="480" x2="800" y2="150" />
            </g>
            
            <g fill="#D4AF37" opacity="0.6">
              <circle cx="800" cy="150" r="2" />
              <circle cx="950" cy="250" r="3" />
              <circle cx="1050" cy="180" r="1.5" />
              <circle cx="1020" cy="380" r="2.5" />
              <circle cx="1150" cy="420" r="1" />
              <circle cx="980" cy="550" r="2" />
              <circle cx="820" cy="600" r="3" />
              <circle cx="700" cy="480" r="1.5" />
            </g>
            
            {/* Estrellas dispersas */}
            <g fill="#F4DAD5" opacity="0.4">
              <circle cx="200" cy="100" r="1" />
              <circle cx="450" cy="80" r="1.5" />
              <circle cx="150" cy="300" r="1" />
              <circle cx="300" cy="500" r="2" />
              <circle cx="500" cy="650" r="1" />
              <circle cx="1200" cy="100" r="1.5" />
              <circle cx="1100" cy="650" r="1" />
              <circle cx="600" cy="200" r="1" />
            </g>

            {/* Resplandor sutil (Nebulosa) */}
            <circle cx="950" cy="350" r="300" fill="url(#glow)" opacity="0.4" />
            
            <defs>
              <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#BE9650" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#BE9650" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Content Layout */}
        <div className="relative z-10 w-full h-full p-20 flex flex-col">
          
          {/* Logo / Marca */}
          <div className="flex-none">
            <span className="text-[11px] tracking-[0.4em] text-[#D4AF37] uppercase font-light">
              RESONANCIA
            </span>
          </div>

          {/* Columna de Texto */}
          <div className="flex-grow flex flex-col justify-center max-w-[650px] pr-10">
            
            <p className="text-[13px] tracking-[0.3em] uppercase mb-6" style={{ color: "rgba(244,218,213,0.55)" }}>
              TRANSFORMACIÓN
            </p>
            
            <h1 className="text-[72px] leading-[1.1] mb-6 font-['Playfair_Display'] font-medium text-[#F4DAD5]">
              Toda historia tiene un final
            </h1>
            
            <h2 className="text-[24px] font-light mb-12 font-['Playfair_Display'] italic" style={{ color: "rgba(244,218,213,0.8)" }}>
              Outlet de despedida de Casa del Cuenco
            </h2>

            {/* Datos */}
            <div className="flex flex-col gap-6 pl-6 border-l pointer-events-none" style={{ borderColor: "rgba(190,150,80,0.3)" }}>
              <div>
                <p className="text-[12px] uppercase tracking-widest mb-1" style={{ color: "rgba(244,218,213,0.55)" }}>
                  Cuándo
                </p>
                <p className="text-[18px] tracking-wide text-[#BE9650] font-light">
                  Del 21 al 15 de julio
                </p>
              </div>

              <div>
                <p className="text-[12px] uppercase tracking-widest mb-1" style={{ color: "rgba(244,218,213,0.55)" }}>
                  Especial
                </p>
                <p className="text-[24px] tracking-wider text-[#D4AF37] font-medium">
                  Hasta 50% DCTO
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-14">
              <button 
                className="px-10 py-4 uppercase text-[12px] tracking-[0.2em] transition-all duration-300"
                style={{ 
                  background: "transparent",
                  color: "#F4DAD5",
                  border: "1px solid rgba(212,175,55,0.4)",
                  backdropFilter: "blur(10px)"
                }}
              >
                Ver más
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
