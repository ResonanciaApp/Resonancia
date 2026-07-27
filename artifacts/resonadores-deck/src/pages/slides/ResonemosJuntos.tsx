export default function ResonemosJuntos() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(190,150,80,0.16) 0%, rgba(38,28,85,0) 60%)' }}
      />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-[12vw]">
        <div className="h-[1px] w-[12vw]" style={{ background: 'linear-gradient(90deg, transparent, #be9650, transparent)' }} />
        <h2 className="font-display text-text mt-[5vh]" style={{ fontSize: '6.5vw', fontWeight: 500, lineHeight: 1.05 }}>
          Resonemos juntos
        </h2>
        <p className="font-body text-text/85 mt-[4vh] max-w-[52vw]" style={{ fontSize: '2vw', lineHeight: 1.5, textWrap: 'balance' }}>
          Conversemos sobre tu música y tu lugar en RESONANCIA
        </p>
        <p className="font-body text-muted mt-[5vh]" style={{ fontSize: '1.6vw', letterSpacing: '0.08em' }}>
          [Contacto: correo / Instagram / WhatsApp]
        </p>
        <div className="mt-[6vh] h-[1px] w-[12vw]" style={{ background: 'linear-gradient(90deg, transparent, #be9650, transparent)' }} />
      </div>
    </div>
  );
}
