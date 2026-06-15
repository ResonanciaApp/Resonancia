import React from 'react';

export function MarcoRitual() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950">
      <div
        style={{
          width: '1920px',
          height: '720px',
          background: 'linear-gradient(180deg, #4A0C0C 0%, #27070E 50%, #1B060F 100%)',
          color: '#F4DAD5',
        }}
        className="relative overflow-hidden flex flex-col items-center justify-center p-12"
      >
        {/* Marco Perimetral */}
        <div
          className="absolute inset-8 pointer-events-none"
          style={{ border: '1px solid rgba(190, 150, 80, 0.3)' }}
        >
          {/* Esquina Superior Izquierda */}
          <svg className="absolute -top-2 -left-2 w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H48V1H1V48H0V0Z" fill="#D4AF37" />
            <path d="M4 4H16V5H5V16H4V4Z" fill="#BE9650" />
            <circle cx="10" cy="10" r="1.5" fill="#D4AF37" />
          </svg>

          {/* Esquina Superior Derecha */}
          <svg className="absolute -top-2 -right-2 w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(90deg)' }}>
            <path d="M0 0H48V1H1V48H0V0Z" fill="#D4AF37" />
            <path d="M4 4H16V5H5V16H4V4Z" fill="#BE9650" />
            <circle cx="10" cy="10" r="1.5" fill="#D4AF37" />
          </svg>

          {/* Esquina Inferior Derecha */}
          <svg className="absolute -bottom-2 -right-2 w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}>
            <path d="M0 0H48V1H1V48H0V0Z" fill="#D4AF37" />
            <path d="M4 4H16V5H5V16H4V4Z" fill="#BE9650" />
            <circle cx="10" cy="10" r="1.5" fill="#D4AF37" />
          </svg>

          {/* Esquina Inferior Izquierda */}
          <svg className="absolute -bottom-2 -left-2 w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(270deg)' }}>
            <path d="M0 0H48V1H1V48H0V0Z" fill="#D4AF37" />
            <path d="M4 4H16V5H5V16H4V4Z" fill="#BE9650" />
            <circle cx="10" cy="10" r="1.5" fill="#D4AF37" />
          </svg>
        </div>

        {/* Inner Frame */}
        <div
          className="absolute inset-10 pointer-events-none"
          style={{ border: '1px solid rgba(190, 150, 80, 0.1)' }}
        ></div>

        {/* Top Logo */}
        <div className="absolute top-16 left-0 right-0 flex justify-center">
          <span className="tracking-[0.5em] text-sm uppercase opacity-70" style={{ color: '#BE9650' }}>
            RESONANCIA
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center justify-center text-center z-10 w-full max-w-6xl space-y-10 mt-12">
          {/* Overline */}
          <div className="flex flex-col items-center space-y-4">
            <span className="uppercase tracking-[0.4em] text-sm font-medium" style={{ color: '#BE9650' }}>
              TRANSFORMACIÓN
            </span>
            <div className="w-12 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #BE9650, transparent)' }}></div>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-6">
            <h1
              className="text-7xl font-light font-['Playfair_Display',serif] leading-tight whitespace-nowrap"
              style={{ color: '#F4DAD5', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            >
              Toda historia tiene un final
            </h1>
            <p className="text-xl font-light tracking-wide" style={{ color: 'rgba(244,218,213,0.8)' }}>
              Outlet de despedida de Casa del Cuenco
            </p>
          </div>

          {/* Dates & Discount Area */}
          <div className="flex items-center space-x-12 py-8">
            <div className="text-right">
              <p className="uppercase tracking-[0.2em] text-xs mb-1" style={{ color: 'rgba(244,218,213,0.55)' }}>Fechas</p>
              <p className="text-lg tracking-wider" style={{ color: '#D4AF37' }}>Del 21 al 15 de julio</p>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-16" style={{ background: 'rgba(190, 150, 80, 0.3)' }}></div>

            <div className="text-left">
              <p className="uppercase tracking-[0.2em] text-xs mb-1" style={{ color: 'rgba(244,218,213,0.55)' }}>Descuento especial</p>
              <p className="text-2xl tracking-wider font-['Playfair_Display',serif] font-medium" style={{ color: '#D4AF37' }}>Hasta 50% DCTO</p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            className="mt-4 px-12 py-4 uppercase tracking-[0.3em] text-sm transition-all duration-300 hover:scale-105"
            style={{
              border: '1px solid #BE9650',
              color: '#F4DAD5',
              background: 'linear-gradient(180deg, rgba(190,150,80,0.05) 0%, rgba(190,150,80,0.15) 100%)',
              boxShadow: '0 0 20px rgba(190,150,80,0.1)',
            }}
          >
            Ver más
          </button>
        </div>

        {/* Bottom subtle element */}
        <div className="absolute bottom-16 left-0 right-0 flex justify-center opacity-40">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13 11L22 12L13 13L12 22L11 13L2 12L11 11L12 2Z" fill="#BE9650" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default MarcoRitual;
