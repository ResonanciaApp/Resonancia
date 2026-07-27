export default function ComoEmpezar() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(190,150,80,0.12) 0%, rgba(6,10,15,0) 50%)' }}
      />
      <div className="relative z-10 h-full flex flex-col justify-center px-[9vw]">
        <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
          El camino
        </p>
        <h2 className="font-display text-text mt-[2.5vh]" style={{ fontSize: '5vw', fontWeight: 500, lineHeight: 1.05 }}>
          ¿Cómo empezar?
        </h2>
        <div className="mt-[6vh] flex items-start gap-[3vw]">
          <div className="flex-1">
            <div className="flex items-center gap-[1.2vw]">
              <div className="w-[3.4vw] h-[3.4vw] rounded-full border border-primary/50 flex items-center justify-center shrink-0">
                <span className="font-display text-accent" style={{ fontSize: '1.8vw', fontWeight: 500 }}>1</span>
              </div>
              <div className="h-[1px] flex-1 bg-primary/25" />
            </div>
            <p className="font-body text-text/90 mt-[2.5vh] pr-[1vw]" style={{ fontSize: '1.8vw', lineHeight: 1.45 }}>
              Postula desde la propia app con el formulario de Resonador
            </p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-[1.2vw]">
              <div className="w-[3.4vw] h-[3.4vw] rounded-full border border-primary/50 flex items-center justify-center shrink-0">
                <span className="font-display text-accent" style={{ fontSize: '1.8vw', fontWeight: 500 }}>2</span>
              </div>
              <div className="h-[1px] flex-1 bg-primary/25" />
            </div>
            <p className="font-body text-text/90 mt-[2.5vh] pr-[1vw]" style={{ fontSize: '1.8vw', lineHeight: 1.45 }}>
              Incluye una muestra de audio de tu trabajo
            </p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-[1.2vw]">
              <div className="w-[3.4vw] h-[3.4vw] rounded-full border border-primary/50 flex items-center justify-center shrink-0">
                <span className="font-display text-accent" style={{ fontSize: '1.8vw', fontWeight: 500 }}>3</span>
              </div>
            </div>
            <p className="font-body text-text/90 mt-[2.5vh] pr-[1vw]" style={{ fontSize: '1.8vw', lineHeight: 1.45 }}>
              El equipo revisa cada postulación personalmente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
