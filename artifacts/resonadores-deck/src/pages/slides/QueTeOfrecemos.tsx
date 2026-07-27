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
          <div className="rounded-sm px-[2vw] py-[4vh]" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <p className="font-display text-accent" style={{ fontSize: '2.4vw', fontWeight: 500, lineHeight: 1.15 }}>Encuentros en vivo</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.7vw', lineHeight: 1.45 }}>
              Streaming en vivo para la comunidad que quiera aprender más sobre ti
            </p>
          </div>
          <div className="rounded-sm px-[2vw] py-[4vh]" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <p className="font-display text-accent" style={{ fontSize: '2.4vw', fontWeight: 500, lineHeight: 1.15 }}>Agenda online</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.7vw', lineHeight: 1.45 }}>
              Las personas podrán agendar horas y clases online contigo
            </p>
          </div>
          <div className="rounded-sm px-[2vw] py-[4vh]" style={{ backgroundColor: 'rgba(190,150,80,0.07)', border: '1px solid rgba(190,150,80,0.22)' }}>
            <p className="font-display text-accent" style={{ fontSize: '2.4vw', fontWeight: 500, lineHeight: 1.15 }}>Visibilidad</p>
            <p className="font-body text-text/85 mt-[2vh]" style={{ fontSize: '1.7vw', lineHeight: 1.45 }}>
              Perfil destacado como vitrina de todos tus servicios
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
