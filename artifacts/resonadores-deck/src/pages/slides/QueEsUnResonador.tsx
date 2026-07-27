export default function QueEsUnResonador() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #340866 0%, #5B249D 28%, #45147F 55%, #2D0A5E 78%, #23044D 100%)' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(190,150,80,0.12) 0%, rgba(35,4,77,0) 50%)' }}
      />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-[12vw]">
        <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
          El corazón de la comunidad
        </p>
        <h2 className="font-display text-text mt-[2.5vh]" style={{ fontSize: '5vw', fontWeight: 500, lineHeight: 1.05 }}>
          ¿Qué es un Resonador?
        </h2>
        <div className="mt-[3.5vh] h-[1px] w-[10vw]" style={{ background: 'linear-gradient(90deg, transparent, #be9650, transparent)' }} />
        <div className="mt-[5vh] flex flex-col gap-[3.4vh] max-w-[62vw]">
          <p className="font-body text-text/90" style={{ fontSize: '2.1vw', lineHeight: 1.45, textWrap: 'balance' }}>
            El creador oficial de la plataforma: productor ambient, voz guía o sonoterapeuta
          </p>
          <p className="font-body text-text/90" style={{ fontSize: '2.1vw', lineHeight: 1.45, textWrap: 'balance' }}>
            Perfil verificado con el sello <span className="text-accent">"Verificado por Resonancia"</span>
          </p>
          <p className="font-body text-text/90" style={{ fontSize: '2.1vw', lineHeight: 1.45, textWrap: 'balance' }}>
            Tu especialidad, tus servicios y tu obra, en un solo lugar
          </p>
        </div>
      </div>
    </div>
  );
}
