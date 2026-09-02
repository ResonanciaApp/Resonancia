export default function AudioEngines() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck-slide">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" />
          <div className="brand-name">resonancia</div>
        </div>

        <div className="side-label">Resumen</div>
        <div className="side-nav">
          <div className="side-link">Una arquitectura móvil por capas</div>
          <div className="side-link side-link-active">Los motores que sostienen la experiencia</div>
          <div className="side-link">Offline-first, sincronizada y administrable</div>
        </div>

        <div className="side-foot">02 / 03</div>
      </aside>

      <main className="main slide-main">
        <div className="slide-kicker">02 / 03</div>
        <h1 className="slide-title">Los motores que sostienen la experiencia</h1>

        <div className="engine-grid">
          <section className="engine-card engine-card-feature">
            <div className="engine-index">01</div>
            <p className="engine-copy"><strong>PlayerContext:</strong> reproducción de sesiones, colas, progreso, favoritos, estadísticas y sleep timer</p>
          </section>

          <section className="engine-card">
            <div className="engine-index">02</div>
            <p className="engine-copy"><strong>BpmAudioEngine:</strong> loops rítmicos gapless, sincronizados por tempo y con caché de buffers</p>
          </section>

          <section className="engine-card">
            <div className="engine-index">03</div>
            <p className="engine-copy"><strong>MixerContext:</strong> hasta 10 capas, volúmenes, presets, crossfade y reactivación instantánea</p>
          </section>

          <section className="engine-card engine-card-feature">
            <div className="engine-index">04</div>
            <p className="engine-copy"><strong>AudioBridge:</strong> ownership único del audio para evitar sesiones, mezclas y chat sonando a la vez</p>
          </section>

          <section className="engine-card">
            <div className="engine-index">05</div>
            <p className="engine-copy"><strong>SceneThemeProvider + Geometrix:</strong> identidad visual, escenas y composiciones interactivas</p>
          </section>
        </div>
      </main>
    </div>
  );
}