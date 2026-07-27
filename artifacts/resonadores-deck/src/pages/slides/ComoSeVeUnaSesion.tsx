const base = import.meta.env.BASE_URL;

const screens = [
  { src: 'sesion-1.jpg', alt: 'Ficha de sesión — Gong al Atardecer' },
  { src: 'sesion-2.jpg', alt: 'Reproductor a pantalla completa' },
];

export default function ComoSeVeUnaSesion() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)' }}>
      {/* Phone mockups */}
      <div className="absolute left-0 top-0 h-full w-[48vw] flex items-center justify-center">
        <div className="flex items-center gap-[2.5vw]">
          {screens.map((s, i) => (
            <div
              key={s.src}
              className="rounded-[2vw] overflow-hidden shrink-0"
              style={{
                width: '15vw',
                aspectRatio: '480 / 1024',
                border: '2px solid rgba(247,203,107,0.55)',
                boxShadow: '0 2.2vh 5vh rgba(0,0,0,0.45)',
                transform: i === 0 ? 'translateY(-2.5vh)' : 'translateY(2.5vh)',
                background: '#1F255A',
              }}
            >
              <img
                src={`${base}${s.src}`}
                crossOrigin="anonymous"
                alt={s.alt}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 h-full flex items-center justify-end px-[6vw]">
        <div className="w-[42vw]">
          <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
            Tu obra en escena
          </p>
          <h2 className="font-display text-text mt-[2.5vh]" style={{ fontSize: '4.4vw', fontWeight: 500, lineHeight: 1.05, textWrap: 'balance' }}>
            ¿Cómo se ve una sesión?
          </h2>
          <p className="font-body text-text/90 mt-[4.5vh]" style={{ fontSize: '2vw', lineHeight: 1.55 }}>
            Tu música en una plataforma diseñada para el reconocimiento del artista, en formato AAC 256 kb y en una hermosa interfaz.
          </p>
        </div>
      </div>
    </div>
  );
}
