export default function QueTeOfrecemos() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(190,150,80,0.14) 0%, rgba(38,28,85,0) 55%)' }}
      />
      <div className="relative z-10 h-full flex flex-col justify-center px-[9vw]">
        <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
          Herramientas para tu labor
        </p>
        <h2 className="font-display text-text mt-[2.5vh]" style={{ fontSize: '5vw', fontWeight: 500, lineHeight: 1.05 }}>
          Qué te ofrecemos
        </h2>
        <div className="mt-[6vh] grid grid-cols-3 gap-[2.5vw]">
          <div className="rounded-sm px-[2vw] py-[4vh] text-center" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f9f9f9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '3.2vw', height: '3.2vw', marginBottom: '2.4vh', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
              <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
              <circle cx="12" cy="12" r="2" />
              <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
              <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
            </svg>
            <p className="font-display text-accent" style={{ fontSize: '2.4vw', fontWeight: 500, lineHeight: 1.15 }}>Encuentros en vivo</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.7vw', lineHeight: 1.45 }}>
              Transmisiones en directo dentro de la app: comparte tu práctica, responde preguntas y acerca tu trabajo a quienes desean conocerte en profundidad
            </p>
          </div>
          <div className="rounded-sm px-[2vw] py-[4vh] text-center" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f9f9f9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '3.2vw', height: '3.2vw', marginBottom: '2.4vh', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M9 15.5l2 2 4-4" />
            </svg>
            <p className="font-display text-accent" style={{ fontSize: '2.4vw', fontWeight: 500, lineHeight: 1.15 }}>Agenda online</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.7vw', lineHeight: 1.45 }}>
              Un sistema de reservas integrado para que cualquier persona agende sesiones individuales o clases online contigo, sin intermediarios
            </p>
          </div>
          <div className="rounded-sm px-[2vw] py-[4vh] text-center" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f9f9f9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '3.2vw', height: '3.2vw', marginBottom: '2.4vh', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p className="font-display text-accent" style={{ fontSize: '2.4vw', fontWeight: 500, lineHeight: 1.15 }}>Visibilidad</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.7vw', lineHeight: 1.45 }}>
              Un perfil destacado que funciona como vitrina profesional de tu obra, tus servicios y tu trayectoria ante toda la comunidad
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
