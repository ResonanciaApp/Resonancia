export default function Curaduria() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 15% 85%, rgba(190,150,80,0.12) 0%, rgba(6,10,15,0) 50%)' }}
      />
      <div className="relative z-10 h-full flex flex-col justify-center px-[9vw]">
        <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
          Nuestro compromiso
        </p>
        <h2 className="font-display text-text mt-[2.5vh]" style={{ fontSize: '5vw', fontWeight: 500, lineHeight: 1.05 }}>
          Curaduría, no algoritmo
        </h2>
        <div className="mt-[6vh] grid grid-cols-3 gap-[3vw]">
          <div className="border-t border-primary/40 pt-[3vh]">
            <p className="font-display text-accent" style={{ fontSize: '3vw', fontWeight: 500, lineHeight: 1 }}>01</p>
            <p className="font-body text-text/90 mt-[2vh]" style={{ fontSize: '1.8vw', lineHeight: 1.45 }}>
              Tu contenido pasa por revisión del equipo antes de publicarse
            </p>
          </div>
          <div className="border-t border-primary/40 pt-[3vh]">
            <p className="font-display text-accent" style={{ fontSize: '3vw', fontWeight: 500, lineHeight: 1 }}>02</p>
            <p className="font-body text-text/90 mt-[2vh]" style={{ fontSize: '1.8vw', lineHeight: 1.45 }}>
              Garantiza calidad y coherencia sonora en todo el catálogo
            </p>
          </div>
          <div className="border-t border-primary/40 pt-[3vh]">
            <p className="font-display text-accent" style={{ fontSize: '3vw', fontWeight: 500, lineHeight: 1 }}>03</p>
            <p className="font-body text-text/90 mt-[2vh]" style={{ fontSize: '1.8vw', lineHeight: 1.45 }}>
              Tu obra convive solo con contenido al mismo nivel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
