export default function SessionFlow() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck-slide">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" />
          <div className="brand-name">resonancia</div>
        </div>

        <div className="side-label">Resumen</div>
        <div className="side-nav">
          <div className="side-link">01 Capas de arquitectura</div>
          <div className="side-link">02 Motores principales</div>
          <div className="side-link">03 Offline-first</div>
          <div className="side-link side-link-active">04 Flujo de una sesión</div>
          <div className="side-link">05 Contenido editorial</div>
          <div className="side-link">06 Resiliencia</div>
        </div>

        <div className="side-foot">04 / 06</div>
      </aside>

      <main className="main slide-main">
        <div className="slide-kicker">04 / 06</div>
        <h1 className="slide-title">Flujo end-to-end de una sesión</h1>

        <div className="architecture-list">
          <section className="architecture-row">
            <div className="card-index">01</div>
            <p className="card-copy">- Usuario toca una sesión</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">02</div>
            <p className="card-copy">- PlayerContext coordina cola, progreso, favoritos y sleep timer</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">03</div>
            <p className="card-copy">- AudioBridge reserva el ownership único del audio</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">04</div>
            <p className="card-copy">- expo-audio reproduce sesiones; BpmAudioEngine ejecuta loops gapless</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">05</div>
            <p className="card-copy">- Reproducción en background alimenta estadísticas y sincronización</p>
          </section>
        </div>
      </main>
    </div>
  );
}