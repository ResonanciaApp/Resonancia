import React from "react";

export function CuencoResonante() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 font-sans">
      <div 
        className="relative overflow-hidden flex flex-col items-center justify-center shadow-2xl"
        style={{ 
          width: "1280px", 
          height: "720px",
          background: "linear-gradient(to bottom, #4A0C0C, #27070E, #1B060F)" 
        }}
      >
        {/* Background Waves */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <svg width="1280" height="1280" viewBox="0 0 1280 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="640" cy="640" r="100" stroke="url(#gold_grad)" strokeWidth="1" opacity="0.8"/>
            <circle cx="640" cy="640" r="200" stroke="url(#gold_grad)" strokeWidth="1" opacity="0.6"/>
            <circle cx="640" cy="640" r="300" stroke="url(#gold_grad)" strokeWidth="1.5" opacity="0.4"/>
            <circle cx="640" cy="640" r="450" stroke="url(#gold_grad)" strokeWidth="1.5" opacity="0.2"/>
            <circle cx="640" cy="640" r="600" stroke="url(#gold_grad)" strokeWidth="2" opacity="0.1"/>
            
            <defs>
              <linearGradient id="gold_grad" x1="0" y1="0" x2="1280" y2="1280" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D4AF37" />
                <stop offset="0.5" stopColor="#BE9650" />
                <stop offset="1" stopColor="#D4AF37" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Content */}
        <div className="z-10 flex flex-col items-center text-center max-w-4xl px-8">
          <div 
            className="mb-12 text-[13px] tracking-[0.4em] uppercase font-light"
            style={{ color: "#BE9650" }}
          >
            Resonancia
          </div>

          <div 
            className="mb-6 text-sm tracking-[0.2em] uppercase font-medium"
            style={{ color: "rgba(244,218,213,0.55)" }}
          >
            Transformación
          </div>

          <h1 
            className="text-6xl md:text-8xl mb-8 font-serif leading-tight"
            style={{ 
              color: "#F4DAD5",
              fontFamily: "'Playfair Display', serif",
              textShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          >
            Toda historia<br/>tiene un final
          </h1>

          <p 
            className="text-xl md:text-2xl mb-12 font-light tracking-wide"
            style={{ color: "rgba(244,218,213,0.85)" }}
          >
            Outlet de despedida de Casa del Cuenco
          </p>

          <div className="flex flex-col items-center gap-6 mb-14">
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-12" style={{ backgroundColor: "rgba(212,175,55,0.3)" }}></div>
              <span 
                className="text-lg uppercase tracking-widest"
                style={{ color: "#D4AF37" }}
              >
                Del 21 al 15 de julio
              </span>
              <div className="h-[1px] w-12" style={{ backgroundColor: "rgba(212,175,55,0.3)" }}></div>
            </div>
            
            <div 
              className="text-4xl font-light tracking-wide px-8 py-3 border rounded-sm"
              style={{ 
                color: "#F4DAD5", 
                borderColor: "rgba(190,150,80,0.4)",
                backgroundColor: "rgba(0,0,0,0.2)"
              }}
            >
              Hasta 50% DCTO
            </div>
          </div>

          <button 
            className="px-12 py-4 uppercase tracking-[0.2em] text-sm transition-all duration-300 hover:scale-105"
            style={{ 
              backgroundColor: "#BE9650",
              color: "#1B060F",
              fontWeight: 600
            }}
          >
            Ver más
          </button>
        </div>
      </div>
    </div>
  );
}
