const base = import.meta.env.BASE_URL;

export default function TuPerfilDeArtista() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)' }}>
      <div className="absolute inset-0 flex">
        <div className="w-[44vw] h-full relative">
          <img
            src={`${base}sonoterapeuta.jpg`}
            crossOrigin="anonymous"
            alt="Sonoterapeuta con cuencos tibetanos"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, rgba(38,28,85,0.1) 0%, rgba(38,28,85,0) 60%, #1F2A62 100%)' }}
          />
        </div>
      </div>
      <div className="relative z-10 h-full flex items-center justify-end px-[7vw]">
        <div className="w-[46vw]">
          <p className="font-body text-primary uppercase" style={{ fontSize: '1.2vw', letterSpacing: '0.4em', fontWeight: 600 }}>
            Tu presencia
          </p>
          <h2 className="font-display text-text mt-[2.5vh]" style={{ fontSize: '4.8vw', fontWeight: 500, lineHeight: 1.05, textWrap: 'balance' }}>
            Tu perfil de artista
          </h2>
          <div className="mt-[5vh] flex flex-col gap-[3.6vh]">
            <div className="flex items-start gap-[1.6vw]">
              <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
              <p className="font-body text-text/90" style={{ fontSize: '2vw', lineHeight: 1.45 }}>
                Foto, biografía, país y catálogo completo de tus obras
              </p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
              <p className="font-body text-text/90" style={{ fontSize: '2vw', lineHeight: 1.45 }}>
                Los usuarios descubren una pieza, tocan tu nombre y exploran todo tu trabajo
              </p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <div className="mt-[1.2vh] w-[0.55vw] h-[0.55vw] rotate-45 bg-primary shrink-0" />
              <p className="font-body text-text/90" style={{ fontSize: '2vw', lineHeight: 1.45 }}>
                Seguidores dentro de la app: tu audiencia crece contigo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
