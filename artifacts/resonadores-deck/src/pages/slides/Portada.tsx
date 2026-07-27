const base = import.meta.env.BASE_URL;

export default function Portada() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #340866 0%, #5B249D 28%, #45147F 55%, #2D0A5E 78%, #23044D 100%)' }}>
      <img
        src={`${base}hero.jpg`}
        crossOrigin="anonymous"
        alt="Ondas doradas de sonido"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(35,4,77,0.55) 0%, rgba(35,4,77,0.25) 45%, rgba(35,4,77,0.82) 100%)' }}
      />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-[10vw]">
        <p className="font-body text-primary uppercase" style={{ fontSize: '1.6vw', letterSpacing: '0.55em', fontWeight: 600 }}>
          Comunidad de Resonadores
        </p>
        <h1 className="font-display text-text mt-[3vh]" style={{ fontSize: '9vw', fontWeight: 500, letterSpacing: '0.14em', lineHeight: 1 }}>
          RESONANCIA
        </h1>
        <div className="mt-[4vh] h-[1px] w-[16vw]" style={{ background: 'linear-gradient(90deg, transparent, #be9650, transparent)' }} />
        <p className="font-display italic text-accent mt-[4vh]" style={{ fontSize: '2.6vw', fontWeight: 400 }}>
          Donde el sonido se convierte en medicina
        </p>
        <p className="font-body text-text/75 mt-[2.5vh]" style={{ fontSize: '1.7vw', fontWeight: 400, textWrap: 'balance' }}>
          Invitación a formar parte de nuestra comunidad de Resonadores
        </p>
      </div>
    </div>
  );
}
