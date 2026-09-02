export default function ResiliencePrinciples() {
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
          <div className="side-link">04 Flujo de una sesión</div>
          <div className="side-link">05 Contenido editorial</div>
          <div className="side-link side-link-active">06 Resiliencia</div>
        </div>

        <div className="side-foot">06 / 06</div>
      </aside>

      <main className="main slide-main">
        <div className="slide-kicker">06 / 06</div>
        <h1 className="slide-title">Principios de resiliencia</h1>

        <div className="engine-grid">
          <section className="engine-card engine-card-feature">
            <div className="engine-index">01</div>
            <p className="engine-copy"><strong>Offline-first:</strong> la app sigue funcionando sin conexión</p>
          </section>

          <section className="engine-card">
            <div className="engine-index">02</div>
            <p className="engine-copy"><strong>AudioBridge:</strong> ownership único para evitar reproducciones simultáneas</p>
          </section>

          <section className="engine-card">
            <div className="engine-index">03</div>
            <p className="engine-copy"><strong>Fallback local:</strong> el catálogo bundleado sostiene la experiencia cuando la API no está disponible</p>
          </section>

          <section className="engine-card engine-card-feature">
            <div className="engine-index">04</div>
            <p className="engine-copy"><strong>Sleep timer:</strong> control de reproducción en background</p>
          </section>

          <section className="engine-card">
            <div className="engine-index">05</div>
            <p className="engine-copy"><strong>Autorización server-side:</strong> las funciones administrativas se protegen en el servidor</p>
          </section>
        </div>
      </main>
    </div>
  );
}