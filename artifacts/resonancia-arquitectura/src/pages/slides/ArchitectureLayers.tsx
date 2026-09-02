export default function ArchitectureLayers() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck-slide">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" />
          <div className="brand-name">resonancia</div>
        </div>

        <div className="side-label">Resumen</div>
        <div className="side-nav">
          <div className="side-link side-link-active">Una arquitectura móvil por capas</div>
          <div className="side-link">Los motores que sostienen la experiencia</div>
          <div className="side-link">Offline-first, sincronizada y administrable</div>
        </div>

        <div className="side-foot">01 / 03</div>
      </aside>

      <main className="main slide-main">
        <div className="slide-kicker">01 / 03</div>
        <h1 className="slide-title">Una arquitectura móvil por capas</h1>

        <div className="architecture-list">
          <section className="architecture-row">
            <div className="card-index">01</div>
            <p className="card-copy">- Mobile: Expo SDK 54 + React Native + Expo Router</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">02</div>
            <p className="card-copy">- Estado de producto: Context Providers para catálogo, auth, player, mixer y experiencia visual</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">03</div>
            <p className="card-copy">- Backend: Express 5 detrás de Clerk, con rutas de catálogo, actividad, comunidad y administración</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">04</div>
            <p className="card-copy">- Datos: PostgreSQL + Drizzle ORM; contrato OpenAPI y clientes/hooks generados con Orval</p>
          </section>

          <section className="architecture-row">
            <div className="card-index">05</div>
            <p className="card-copy">- Archivos: Object Storage para audios, imágenes y videos; assets bundleados para lo esencial</p>
          </section>
        </div>
      </main>
    </div>
  );
}