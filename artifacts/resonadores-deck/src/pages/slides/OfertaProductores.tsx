export default function OfertaProductores() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(190,150,80,0.14) 0%, rgba(38,28,85,0) 55%)' }}
      />
      <div className="relative z-10 h-full flex flex-col justify-center px-[9vw]">
        <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
          Trabajemos juntos
        </p>
        <h2 className="font-display text-text mt-[2vh]" style={{ fontSize: '4.6vw', fontWeight: 500, lineHeight: 1.05 }}>
          Oferta para productores
        </h2>

        <div className="mt-[5vh] grid grid-cols-2 gap-[2.5vw]">
          {/* Ambient */}
          <div className="rounded-sm px-[2.5vw] py-[4vh] text-center" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f9f9f9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2.8vw', height: '2.8vw', margin: '0 auto 2vh' }}>
              <path d="M2 12h2l2-5 3 10 3-14 3 12 2-6 2 3h3" />
            </svg>
            <p className="font-display text-accent" style={{ fontSize: '2.3vw', fontWeight: 500 }}>Ambient</p>
            <p className="font-display text-text mt-[1.5vh]" style={{ fontSize: '3vw', fontWeight: 600 }}>$60.000</p>
            <p className="font-body text-text/70" style={{ fontSize: '1.3vw' }}>por tema</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.5vw', lineHeight: 1.4 }}>
              Duración de 8 a 12 minutos
            </p>
          </div>

          {/* Psytrance */}
          <div className="rounded-sm px-[2.5vw] py-[4vh] text-center" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f9f9f9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2.8vw', height: '2.8vw', margin: '0 auto 2vh' }}>
              <circle cx="6.5" cy="17.5" r="2.5" />
              <circle cx="17.5" cy="15.5" r="2.5" />
              <path d="M9 17.5V5l11-2v12.5" />
            </svg>
            <p className="font-display text-accent" style={{ fontSize: '2.3vw', fontWeight: 500 }}>Psytrance</p>
            <p className="font-display text-text mt-[1.5vh]" style={{ fontSize: '3vw', fontWeight: 600 }}>$100.000</p>
            <p className="font-body text-text/70" style={{ fontSize: '1.3vw' }}>por tema</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.5vw', lineHeight: 1.4 }}>
              Duración de 6 a 8 minutos
            </p>
          </div>
        </div>

        {/* Condiciones */}
        <div className="mt-[3.5vh] flex items-center gap-[1.5vw] rounded-sm px-[2.5vw] py-[2.8vh]" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2.2vw', height: '2.2vw', flexShrink: 0 }}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <p className="font-body text-text/90" style={{ fontSize: '1.5vw', lineHeight: 1.45 }}>
            Ideal partir con un <span className="text-accent" style={{ fontWeight: 600 }}>EP de 4 temas</span>: se paga el 50% cuando estén listos los primeros 2 temas y el saldo al completar los 4.
          </p>
        </div>
      </div>
    </div>
  );
}
