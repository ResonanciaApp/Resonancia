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
        color: highlight ? "#18110C" : header ? "#C69B4F" : muted ? "#cbb9a4" : "#EDE1D3",
        backgroundColor: highlight ? "#C69B4F" : "transparent",
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
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7a6050", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          ANEXO · ESCENARIOS DE INVERSIÓN
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Cuánto cuesta cada <span style={{ color: "#C69B4F" }}>porcentaje.</span>
        </div>
      </div>

      {/* Matrix */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr",
          rowGap: "0.6vh",
          backgroundColor: "#24160F",
          borderRadius: "1vw",
          padding: "1.5vh 1.5vw",
          boxSizing: "border-box",
        }}
      >
        {/* Header row */}
        <Cell header><span style={{ fontSize: "1.3vw", color: "#7a6050" }}>Valoración ↓ / Monto →</span></Cell>
        <Cell header>US$ 100K</Cell>
        <Cell header>US$ 200K</Cell>
        <Cell header>US$ 300K</Cell>
        <Cell header>US$ 400K</Cell>

        {/* Row: US$ 2M */}
        <Cell muted>US$ 2M <span style={{ fontSize: "1.1vw", color: "#7a6050" }}>(recomendada)</span></Cell>
        <Cell>5,0%</Cell>
        <Cell>10,0%</Cell>
        <Cell highlight bold>15,0%</Cell>
        <Cell>20,0%</Cell>

        {/* Row: US$ 3M */}
        <Cell muted>US$ 3M</Cell>
        <Cell>3,3%</Cell>
        <Cell>6,7%</Cell>
        <Cell>10,0%</Cell>
        <Cell>13,3%</Cell>

        {/* Row: US$ 4M */}
        <Cell muted>US$ 4M</Cell>
        <Cell>2,5%</Cell>
        <Cell>5,0%</Cell>
        <Cell>7,5%</Cell>
        <Cell>10,0%</Cell>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.4vw", fontWeight: 400, color: "#7a6050", lineHeight: 1.55, maxWidth: "84vw" }}>
        % cedido = monto ÷ valoración post-money. Celda destacada = escenario recomendado (US$ 300.000 por 15%).
        <span style={{ color: "#5a4632", fontSize: "1.3vw", display: "block", marginTop: "1vh" }}>
          Una valoración más alta cede menos por el mismo monto, pero es más difícil de defender antes del lanzamiento.
        </span>
      </div>
    </div>
  );
}
