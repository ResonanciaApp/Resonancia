export default function OfflineFirst() {
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
          <div className="side-link">Los motores que sostienen la experiencia</div>
          <div className="side-link side-link-active">Offline-first, sincronizada y administrable</div>
        </div>

        <div className="side-foot">03 / 03</div>
      </aside>

      <main className="main slide-main">
        <div className="slide-kicker">03 / 03</div>
        <h1 className="slide-title">Offline-first, sincronizada y administrable</h1>

        <div className="sync-layout">
          <div className="sync-cards">
            <section className="sync-card">
              <div className="card-index">01</div>
              <p className="card-copy">- AsyncStorage mantiene actividad, favoritos, progreso y preferencias disponibles sin conexión</p>
            </section>

            <section className="sync-card">
              <div className="card-index">02</div>
              <p className="card-copy">- CloudSync sincroniza con Clerk: eventos append-only; primera recuperación une nube + dispositivo</p>
            </section>

            <section className="sync-card">
              <div className="card-index">03</div>
              <p className="card-copy">- Después del primer sync, el estado local es autoritativo para conservar borrados y cambios del usuario</p>
            </section>

            <section className="sync-card">
              <div className="card-index">04</div>
              <p className="card-copy">- CatalogProvider hidrata el catálogo remoto sobre los datos bundleados sin romper el fallback</p>
            </section>

            <section className="sync-card sync-card-wide">
              <div className="card-index">05</div>
              <p className="card-copy">- Panel admin comparte API/DB y aplica autorización real en servidor para catálogo, usuarios y moderación</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}