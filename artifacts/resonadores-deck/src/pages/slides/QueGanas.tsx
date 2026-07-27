export default function QueGanas() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #340866 0%, #5B249D 28%, #45147F 55%, #2D0A5E 78%, #23044D 100%)' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(190,150,80,0.14) 0%, rgba(35,4,77,0) 55%)' }}
      />
      <div className="relative z-10 h-full flex flex-col justify-center px-[9vw]">
        <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
          El valor para ti
        </p>
        <h2 className="font-display text-text mt-[2.5vh]" style={{ fontSize: '5vw', fontWeight: 500, lineHeight: 1.05 }}>
          ¿Qué ganas como Resonador?
        </h2>
        <div className="mt-[6vh] grid grid-cols-3 gap-[2.5vw]">
          <div className="rounded-sm px-[2vw] py-[4vh]" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <p className="font-display text-accent" style={{ fontSize: '2.4vw', fontWeight: 500, lineHeight: 1.15 }}>Distribución</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.7vw', lineHeight: 1.45 }}>
              Tu música llega a una audiencia de bienestar en español
            </p>
          </div>
          <div className="rounded-sm px-[2vw] py-[4vh]" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <p className="font-display text-accent" style={{ fontSize: '2.4vw', fontWeight: 500, lineHeight: 1.15 }}>Comunidad</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.7vw', lineHeight: 1.45 }}>
              Perfil profesional verificado y herramientas de comunidad
            </p>
          </div>
          <div className="rounded-sm px-[2vw] py-[4vh]" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <p className="font-display text-accent" style={{ fontSize: '2.4vw', fontWeight: 500, lineHeight: 1.15 }}>Ingresos</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.7vw', lineHeight: 1.45 }}>
              A futuro: reparto de ingresos con las suscripciones Premium
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
