export default function ArchitectureCover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck-slide">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" />
          <div className="brand-name">resonancia</div>
        </div>

        <div className="side-label">Resumen</div>
        <div className="side-nav">
          <div className="side-link side-link-active">Arquitectura de la app móvil</div>
          <div className="side-link">Los motores que sostienen la experiencia</div>
          <div className="side-link">Offline-first, sincronizada y administrable</div>
        </div>

        <div className="side-foot">Casa del Cuenco · 2026</div>
      </aside>

      <main className="main">
        <div className="eyebrow">Arquitectura de la app móvil</div>
        <h1 className="cover-title">RESONANCIA</h1>
        <p className="cover-subtitle">Arquitectura de la app móvil</p>
        <p className="cover-subtitle-secondary">Resumen ejecutivo técnico de Casa del Cuenco</p>

        <div className="endpoint">
          <span className="endpoint-method">APP</span>
          <span className="endpoint-path">Expo SDK 54 / React Native</span>
        </div>

        <div className="cover-panels">
          <section className="panel">
            <div className="panel-heading">Capas principales</div>
            <div className="code-panel">
              <div><span className="code-blue">Mobile</span>: <span className="code-orange">Expo SDK 54 + React Native + Expo Router</span></div>
              <div><span className="code-blue">Backend</span>: <span className="code-orange">Express 5 detrás de Clerk</span></div>
              <div><span className="code-blue">Datos</span>: <span className="code-orange">PostgreSQL + Drizzle ORM</span></div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading-row">
              <div className="panel-heading">Contrato y operación</div>
              <div className="status"><span className="status-dot" />activo</div>
            </div>
            <div className="code-panel">
              <div><span className="code-muted">{"{"}</span></div>
              <div>&nbsp;&nbsp;<span className="code-blue">"contrato"</span>: <span className="code-green">"OpenAPI + Orval"</span>,</div>
              <div>&nbsp;&nbsp;<span className="code-blue">"archivos"</span>: <span className="code-green">"Object Storage"</span>,</div>
              <div>&nbsp;&nbsp;<span className="code-blue">"estado"</span>: <span className="code-green">"Context Providers"</span></div>
              <div><span className="code-muted">{"}"}</span></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}