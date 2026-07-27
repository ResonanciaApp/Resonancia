export default function EncuentrosEnVivo() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(190,150,80,0.13) 0%, rgba(38,28,85,0) 50%)' }}
      />
      <div className="relative z-10 h-full flex flex-col justify-center px-[9vw]">
        <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
          Comunidad
        </p>
        <h2 className="font-display text-text mt-[2.5vh]" style={{ fontSize: '5vw', fontWeight: 500, lineHeight: 1.05 }}>
          Encuentros en vivo
        </h2>
        <div className="mt-[6vh] flex flex-col gap-[3.8vh] max-w-[58vw]">
          <div className="flex items-start gap-[1.6vw]">
            <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
            <p className="font-body text-text/90" style={{ fontSize: '2.1vw', lineHeight: 1.45 }}>
              Eventos y sesiones en vivo con la comunidad
            </p>
          </div>
          <div className="flex items-start gap-[1.6vw]">
            <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
            <p className="font-body text-text/90" style={{ fontSize: '2.1vw', lineHeight: 1.45 }}>
              Inscripción y recordatorios de calendario dentro de la app
            </p>
          </div>
          <div className="flex items-start gap-[1.6vw]">
            <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
            <p className="font-body text-text/90" style={{ fontSize: '2.1vw', lineHeight: 1.45 }}>
              Visibilidad directa con una audiencia enfocada en bienestar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
