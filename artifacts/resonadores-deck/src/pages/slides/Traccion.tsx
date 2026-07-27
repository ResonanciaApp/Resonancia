export default function Traccion() {
  const milestones = [
    {
      title: 'App iOS y Android',
      desc: 'Producto funcional con reproductor, mezclador y comunidad',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2.4vw', height: '2.4vw' }}>
          <rect x="7" y="2" width="10" height="20" rx="2.5" />
          <line x1="11" y1="18.5" x2="13" y2="18.5" />
        </svg>
      ),
    },
    {
      title: 'Catálogo curado',
      desc: 'Sesiones de música, meditación y descanso en crecimiento constante',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2.4vw', height: '2.4vw' }}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      ),
    },
    {
      title: 'Lanzamiento en tiendas',
      desc: 'Publicación en App Store y Google Play en preparación',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '2.4vw', height: '2.4vw' }}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-body flex flex-col justify-center"
      style={{
        background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)',
        color: '#F4F4F4',
        padding: '0 7vw',
        boxSizing: 'border-box',
      }}
    >
      <p className="font-display text-accent" style={{ fontSize: '1.15vw', fontWeight: 600, letterSpacing: '0.22em' }}>
        UNA COMUNIDAD QUE YA ESTÁ SONANDO
      </p>
      <h1 className="font-display text-text" style={{ fontSize: '3.6vw', fontWeight: 500, lineHeight: 1.1, marginTop: '1.6vh' }}>
        El momento de RESONANCIA
      </h1>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: '3.5vw', marginTop: '6vh' }}>
        {/* Hero metric */}
        <div
          style={{
            flexBasis: '34%',
            backgroundColor: 'rgba(190,150,80,0.07)',
            border: '1px solid rgba(190,150,80,0.22)',
            borderRadius: '1.1vw',
            padding: '5vh 2.5vw',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <p className="font-display text-accent" style={{ fontSize: '5.6vw', fontWeight: 600, lineHeight: 1 }}>3.600</p>
          <p className="font-display text-text" style={{ fontSize: '1.7vw', fontWeight: 500, marginTop: '1.6vh' }}>usuarios registrados</p>
          <p className="font-body text-text/60" style={{ fontSize: '1.2vw', lineHeight: 1.5, marginTop: '1.4vh' }}>
            antes del lanzamiento oficial en tiendas
          </p>
        </div>

        {/* Milestones */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3.4vh' }}>
          {milestones.map((m) => (
            <div key={m.title} style={{ display: 'flex', alignItems: 'center', gap: '1.6vw' }}>
              <div style={{ flexShrink: 0 }}>{m.icon}</div>
              <div>
                <p className="font-display text-text" style={{ fontSize: '1.75vw', fontWeight: 500, lineHeight: 1.2 }}>{m.title}</p>
                <p className="font-body text-text/70" style={{ fontSize: '1.35vw', lineHeight: 1.45, marginTop: '0.6vh' }}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="font-body text-text/60" style={{ fontSize: '1.25vw', lineHeight: 1.5, marginTop: '6vh' }}>
        Tu música llega a una comunidad real desde el primer día — y crece junto con la app.
      </p>
    </div>
  );
}
