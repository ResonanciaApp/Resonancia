export default function QueBuscamos() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(190,150,80,0.14) 0%, rgba(38,28,85,0) 55%)' }}
      />
      <div className="relative z-10 h-full flex flex-col justify-center px-[9vw]">
        <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
          Brief creativo
        </p>
        <h2 className="font-display text-text mt-[2vh]" style={{ fontSize: '4.6vw', fontWeight: 500, lineHeight: 1.05 }}>
          Qué buscamos
        </h2>

        <div className="mt-[5vh] grid grid-cols-2 gap-x-[3vw] gap-y-[3.5vh]">
          <div className="flex items-start gap-[1.4vw]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2vw', height: '2vw', flexShrink: 0, marginTop: '0.4vh' }}>
              <path d="M12 3a9 9 0 1 0 9 9" />
              <path d="M12 8a4 4 0 1 0 4 4" />
              <circle cx="12" cy="12" r="0.8" fill="#F7CB6B" stroke="none" />
            </svg>
            <div>
              <p className="font-display text-accent" style={{ fontSize: '1.9vw', fontWeight: 500 }}>Atmósferas inmersivas</p>
              <p className="font-body text-text/85 mt-[0.8vh]" style={{ fontSize: '1.45vw', lineHeight: 1.45 }}>
                Paisajes sonoros envolventes para meditación, descanso y estados profundos de relajación
              </p>
            </div>
          </div>

          <div className="flex items-start gap-[1.4vw]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2vw', height: '2vw', flexShrink: 0, marginTop: '0.4vh' }}>
              <path d="M2 12h3l2-4 3 8 3-12 3 10 2-4h4" />
            </svg>
            <div>
              <p className="font-display text-accent" style={{ fontSize: '1.9vw', fontWeight: 500 }}>Frecuencias con intención</p>
              <p className="font-body text-text/85 mt-[0.8vh]" style={{ fontSize: '1.45vw', lineHeight: 1.45 }}>
                Trabajo con binaurales, drones y texturas orgánicas: cuencos, gongs, naturaleza y sintetizadores cálidos
              </p>
            </div>
          </div>

          <div className="flex items-start gap-[1.4vw]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2vw', height: '2vw', flexShrink: 0, marginTop: '0.4vh' }}>
              <path d="M12 21c-4.97-4.17-8-7.28-8-10.6C4 7.02 6.42 5 9 5c1.54 0 3 .81 3 .81S13.46 5 15 5c2.58 0 5 2.02 5 5.4 0 3.32-3.03 6.43-8 10.6z" />
            </svg>
            <div>
              <p className="font-display text-accent" style={{ fontSize: '1.9vw', fontWeight: 500 }}>Evolución suave</p>
              <p className="font-body text-text/85 mt-[0.8vh]" style={{ fontSize: '1.45vw', lineHeight: 1.45 }}>
                Progresiones lentas, sin cortes bruscos ni percusión agresiva: el oyente puede quedarse dormido con tu obra
              </p>
            </div>
          </div>

          <div className="flex items-start gap-[1.4vw]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2vw', height: '2vw', flexShrink: 0, marginTop: '0.4vh' }}>
              <path d="M9 18V6l10-2v12" />
              <circle cx="6.5" cy="18.5" r="2.5" />
              <circle cx="16.5" cy="16.5" r="2.5" />
            </svg>
            <div>
              <p className="font-display text-accent" style={{ fontSize: '1.9vw', fontWeight: 500 }}>Calidad de estudio</p>
              <p className="font-body text-text/85 mt-[0.8vh]" style={{ fontSize: '1.45vw', lineHeight: 1.45 }}>
                Mezcla y master limpios, sin clipping, listos para publicarse en AAC 256 kb
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
