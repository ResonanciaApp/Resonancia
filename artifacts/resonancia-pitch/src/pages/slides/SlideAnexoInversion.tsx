function Cell({
  children,
  bold,
  highlight,
  muted,
  header,
}: {
  children: React.ReactNode;
  bold?: boolean;
  highlight?: boolean;
  muted?: boolean;
  header?: boolean;
}) {
  return (
    <div
      style={{
        padding: "2.6vh 1vw",
        boxSizing: "border-box",
        textAlign: "center",
        fontSize: bold ? "2vw" : "1.6vw",
        fontWeight: bold || header ? 700 : 400,
        color: highlight ? "#060A0F" : header ? "#BE9650" : muted ? "#7A8FA8" : "#EDE1D3",
        backgroundColor: highlight ? "#BE9650" : "transparent",
        borderRadius: highlight ? "0.6vw" : 0,
      }}
    >
      {children}
    </div>
  );
}

export default function SlideAnexoInversion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          ANEXO · ESCENARIOS DE INVERSIÓN
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Cuánto cuesta cada <span style={{ color: "#BE9650" }}>porcentaje.</span>
        </div>
      </div>

      {/* Matrix */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr",
          rowGap: "0.6vh",
          backgroundColor: "#090E17",
          borderRadius: "1vw",
          padding: "1.5vh 1.5vw",
          boxSizing: "border-box",
        }}
      >
        {/* Header row */}
        <Cell header><span style={{ fontSize: "1.3vw", color: "#7A8FA8" }}>Valoración ↓ / Monto →</span></Cell>
        <Cell header>US$ 10K</Cell>
        <Cell header>US$ 15K</Cell>
        <Cell header>US$ 20K</Cell>
        <Cell header>US$ 25K</Cell>

        {/* Row: US$ 500K */}
        <Cell muted>US$ 500K</Cell>
        <Cell>2,0%</Cell>
        <Cell>3,0%</Cell>
        <Cell>4,0%</Cell>
        <Cell>5,0%</Cell>

        {/* Row: US$ 700K */}
        <Cell muted>US$ 700K</Cell>
        <Cell>1,4%</Cell>
        <Cell>2,1%</Cell>
        <Cell>2,9%</Cell>
        <Cell>3,6%</Cell>

        {/* Row: US$ 1M */}
        <Cell muted>US$ 1M <span style={{ fontSize: "1.1vw", color: "#7A8FA8" }}>(recomendada)</span></Cell>
        <Cell>1,0%</Cell>
        <Cell>1,5%</Cell>
        <Cell>2,0%</Cell>
        <Cell highlight bold>2,5%</Cell>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.4vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.55, maxWidth: "84vw" }}>
        % cedido = monto ÷ valoración post-money. Celda destacada = escenario recomendado (US$ 25.000 por ~2,5%).
        <span style={{ color: "#7A8FA8", fontSize: "1.3vw", display: "block", marginTop: "1vh" }}>
          La valoración de US$ 1M es defendible pre-lanzamiento gracias a +1.000.000 de seguidores y 180 pistas listas al lanzar.
        </span>
      </div>
    </div>
  );
}
