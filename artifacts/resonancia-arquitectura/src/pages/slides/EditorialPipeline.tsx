export default function EditorialPipeline() {
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
          <div className="side-link side-link-active">05 Contenido editorial</div>
          <div className="side-link">06 Resiliencia</div>
        </div>

        <div className="side-foot">05 / 06</div>
      </aside>

      <main className="main slide-main">
        <div className="slide-kicker">05 / 06</div>
        <h1 className="slide-title">Del contenido editorial a la app</h1>

        <div className="architecture-list">
          <section className="architecture-row">
            <div className="card-index">01</div>
            <p className="card-copy">- Panel admin publica sesiones, sonidos, videos y perfiles</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">02</div>
            <p className="card-copy">- PostgreSQL + Drizzle conserva el catálogo editorial</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">03</div>
            <p className="card-copy">- Object Storage entrega audios, imágenes y videos</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">04</div>
            <p className="card-copy">- API Express expone el catálogo publicado</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">05</div>
            <p className="card-copy">- CatalogProvider hidrata el catálogo remoto sobre assets bundleados</p>
          </section>
        </div>
      </main>
    </div>
  );
}