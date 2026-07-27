const base = import.meta.env.BASE_URL;

const screens = [
  { src: 'perfil-1.jpg', alt: 'Perfil de Resonador — portada' },
  { src: 'perfil-2.jpg', alt: 'Perfil de Resonador — servicios y galería' },
  { src: 'perfil-3.jpg', alt: 'Perfil de Resonador — obras y formación' },
];

export default function TuPerfilDeArtista() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)' }}>
      {/* Phone mockups */}
      <div className="absolute left-0 top-0 h-full w-[52vw] flex items-center justify-center">
        <div className="flex items-center gap-[2vw]">
          {screens.map((s, i) => (
            <div
              key={s.src}
              className="rounded-[2vw] overflow-hidden shrink-0"
              style={{
                width: '13.5vw',
                aspectRatio: '480 / 1024',
                border: '2px solid rgba(247,203,107,0.55)',
                boxShadow: '0 2.2vh 5vh rgba(0,0,0,0.45)',
                transform: i === 1 ? 'translateY(-3vh)' : 'translateY(3vh)',
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
        <div className="w-[40vw]">
          <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
            Tu presencia
          </p>
          <h2 className="font-display text-text mt-[2.5vh]" style={{ fontSize: '4.4vw', fontWeight: 500, lineHeight: 1.05, textWrap: 'balance' }}>
            Tu perfil de artista
          </h2>
          <div className="mt-[5vh] flex flex-col gap-[3.6vh]">
            <div className="flex items-start gap-[1.6vw]">
              <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
              <p className="font-body text-text/90" style={{ fontSize: '1.8vw', lineHeight: 1.45 }}>
                Foto, biografía, país y catálogo completo de tus obras
              </p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
              <p className="font-body text-text/90" style={{ fontSize: '1.8vw', lineHeight: 1.45 }}>
                Los usuarios descubren una pieza, tocan tu nombre y exploran todo tu trabajo
              </p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
              <p className="font-body text-text/90" style={{ fontSize: '1.8vw', lineHeight: 1.45 }}>
                Seguidores dentro de la app: tu audiencia crece contigo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
