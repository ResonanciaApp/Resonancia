export default function DerechosDeTuMusica() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(190,150,80,0.14) 0%, rgba(38,28,85,0) 55%)' }}
      />
      <div className="relative z-10 h-full flex flex-col justify-center px-[9vw]">
        <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
          Claridad y confianza
        </p>
        <h2 className="font-display text-text mt-[2vh]" style={{ fontSize: '4.6vw', fontWeight: 500, lineHeight: 1.05 }}>
          Los derechos de tu música
        </h2>

        <div className="mt-[5vh] grid grid-cols-3 gap-[2.5vw]">
          <div className="rounded-sm px-[2vw] py-[4vh] text-center" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f9f9f9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2.8vw', height: '2.8vw', margin: '0 auto 2vh' }}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
            </svg>
            <p className="font-display text-accent" style={{ fontSize: '2vw', fontWeight: 500, lineHeight: 1.15 }}>La autoría es tuya</p>
            <p className="font-body text-text/85 mt-[1.8vh]" style={{ fontSize: '1.45vw', lineHeight: 1.45 }}>
              Cada obra se publica con tu nombre y tu perfil de artista: el crédito siempre es para ti
            </p>
          </div>

          <div className="rounded-sm px-[2vw] py-[4vh] text-center" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f9f9f9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2.8vw', height: '2.8vw', margin: '0 auto 2vh' }}>
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <p className="font-display text-accent" style={{ fontSize: '2vw', fontWeight: 500, lineHeight: 1.15 }}>Licencia para la app</p>
            <p className="font-body text-text/85 mt-[1.8vh]" style={{ fontSize: '1.45vw', lineHeight: 1.45 }}>
              RESONANCIA obtiene la licencia exclusiva para reproducir la obra encargada dentro de la plataforma
            </p>
          </div>

          <div className="rounded-sm px-[2vw] py-[4vh] text-center" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f9f9f9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2.8vw', height: '2.8vw', margin: '0 auto 2vh' }}>
              <path d="M14 3h7v7" />
              <path d="M21 3l-9 9" />
              <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
            </svg>
            <p className="font-display text-accent" style={{ fontSize: '2vw', fontWeight: 500, lineHeight: 1.15 }}>Tu carrera sigue libre</p>
            <p className="font-body text-text/85 mt-[1.8vh]" style={{ fontSize: '1.45vw', lineHeight: 1.45 }}>
              El resto de tu catálogo y tus proyectos personales no quedan comprometidos: solo la obra encargada
            </p>
          </div>
        </div>

        <p className="font-body text-text/60 mt-[3.5vh]" style={{ fontSize: '1.2vw', lineHeight: 1.4 }}>
          Los términos específicos se formalizan por escrito con cada artista antes de comenzar el encargo.
        </p>
      </div>
    </div>
  );
}
