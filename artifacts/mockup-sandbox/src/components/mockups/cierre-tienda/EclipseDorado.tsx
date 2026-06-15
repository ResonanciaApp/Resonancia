import React from "react";

export function EclipseDorado() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 font-sans">
      {/* 1280x720 Fixed Container */}
      <div
        style={{
          width: "1280px",
          height: "720px",
          background: "linear-gradient(180deg, #4A0C0C 0%, #27070E 50%, #1B060F 100%)",
          color: "#F4DAD5",
          position: "relative",
          overflow: "hidden",
        }}
        className="flex flex-col shadow-2xl"
      >
        {/* Eclipse Graphic */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "800px",
            height: "800px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #D4AF37 0%, #BE9650 100%)",
            opacity: 0.15,
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-15%",
            right: "-5%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #D4AF37 0%, #BE9650 100%)",
            boxShadow: "0 0 100px rgba(212, 175, 55, 0.4)",
            pointerEvents: "none",
          }}
        />
        {/* Inner Dark Circle for Eclipse effect */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "0%",
            width: "550px",
            height: "550px",
            borderRadius: "50%",
            background: "#27070E",
            pointerEvents: "none",
          }}
        />

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col justify-between h-full p-16 w-full">
          {/* Top Bar */}
          <div className="flex justify-between items-center w-full">
            <div className="tracking-[0.3em] text-sm uppercase opacity-80" style={{ color: "#D4AF37" }}>
              RESONANCIA
            </div>
            <div className="tracking-widest text-xs uppercase" style={{ color: "rgba(244,218,213,0.55)" }}>
              TRANSFORMACIÓN
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col justify-center max-w-2xl mt-12 flex-grow">
            <h1 
              className="text-6xl md:text-8xl leading-tight mb-8 font-['Playfair_Display']"
              style={{ fontWeight: 400 }}
            >
              Toda historia<br />
              tiene un final
            </h1>
            
            <p className="text-2xl mb-12 tracking-wide font-light" style={{ color: "rgba(244,218,213,0.85)" }}>
              Outlet de despedida de Casa del Cuenco
            </p>

            <div className="flex flex-col gap-6 mt-4">
              <div className="flex items-center gap-6">
                <div 
                  className="px-6 py-3 rounded-full border border-opacity-30 text-sm tracking-widest uppercase"
                  style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                >
                  Del 21 al 15 de julio
                </div>
                <div 
                  className="px-6 py-3 rounded-full text-sm tracking-widest uppercase font-semibold"
                  style={{ background: "#D4AF37", color: "#1B060F" }}
                >
                  Hasta 50% DCTO
                </div>
              </div>

              <div className="mt-8">
                <button 
                  className="group flex items-center gap-4 text-lg tracking-widest uppercase transition-all duration-300"
                  style={{ color: "#F4DAD5" }}
                >
                  <span className="border-b border-transparent group-hover:border-[#D4AF37] pb-1 transition-colors">
                    Ver más
                  </span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:translate-x-2 transition-transform">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
