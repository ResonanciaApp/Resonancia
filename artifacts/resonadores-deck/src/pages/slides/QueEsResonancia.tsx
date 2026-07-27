const base = import.meta.env.BASE_URL;

export default function QueEsResonancia() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #340866 0%, #5B249D 28%, #45147F 55%, #2D0A5E 78%, #23044D 100%)' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 78% 55%, rgba(190,150,80,0.14) 0%, rgba(35,4,77,0) 55%)' }}
      />
      <div className="relative z-10 h-full flex items-center px-[7vw] gap-[5vw]">
        <div className="flex-1">
          <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
            La plataforma
          </p>
          <h2 className="font-display text-text mt-[2.5vh]" style={{ fontSize: '5vw', fontWeight: 500, lineHeight: 1.05, textWrap: 'balance' }}>
            ¿Qué es RESONANCIA?
          </h2>
          <div className="mt-[5vh] flex flex-col gap-[3.6vh]">
            <div className="flex items-start gap-[1.6vw]">
              <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
              <p className="font-body text-text/90" style={{ fontSize: '2vw', lineHeight: 1.45 }}>
                App móvil de meditación, sueño y bienestar en español
              </p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
              <p className="font-body text-text/90" style={{ fontSize: '2vw', lineHeight: 1.45 }}>
                Música ambient, frecuencias binaurales, voces guía y geometría sagrada
              </p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
              <p className="font-body text-text/90" style={{ fontSize: '2vw', lineHeight: 1.45 }}>
                Una experiencia sonora curada, no un catálogo masivo
              </p>
            </div>
          </div>
        </div>
        <div className="w-[32vw] flex items-center justify-center">
          <div
            className="overflow-hidden"
            style={{
              height: '80vh',
              borderRadius: '3.2vh',
              border: '0.45vh solid rgba(247,203,107,0.55)',
              boxShadow: '0 2vh 7vh rgba(0,0,0,0.55), 0 0 5vh rgba(247,203,107,0.18)',
            }}
          >
            <img
              src={`${base}app-screen.jpg`}
              crossOrigin="anonymous"
              alt="Pantalla de inicio de la app RESONANCIA"
              className="h-full w-auto object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
