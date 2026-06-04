function Bullet({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7vw", marginBottom: "0.8vh" }}>
      <div style={{ width: "0.45vw", height: "0.45vw", backgroundColor: "#BE9650", transform: "rotate(45deg)", flexShrink: 0, marginTop: "0.55vw" }} />
      <div style={{ fontSize: "1.15vw", color: "#7A8FA8", lineHeight: 1.4 }}>{text}</div>
    </div>
  );
}

function ScenarioCard({
  label, highlight, subs, arr, multiple, valuation, stakeVal, returnX,
}: {
  label: string; highlight?: boolean;
  subs: string; arr: string; multiple: string;
  valuation: string; stakeVal: string; returnX: string;
}) {
  return (
    <div style={{
      flex: 1,
      backgroundColor: highlight ? "#090E17" : "rgba(255,255,255,0.02)",
      border: `1.5px solid ${highlight ? "#BE9650" : "rgba(255,255,255,0.08)"}`,
      borderRadius: "0.8vw",
      padding: "1.8vh 1.3vw",
      display: "flex",
      flexDirection: "column",
      gap: "0.9vh",
    }}>
      <div style={{ fontSize: "1.35vw", fontWeight: 700, color: highlight ? "#BE9650" : "#EDE1D3" }}>{label}</div>
      <div style={{ fontSize: "1.05vw", color: "#7A8FA8" }}>{subs} suscriptores</div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.9vh", display: "flex", flexDirection: "column", gap: "0.4vh" }}>
        {[
          ["ARR neto M12", arr],
          ["Múltiplo", multiple],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: "1.0vw", color: "#3D4F62" }}>{k}</div>
            <div style={{ fontSize: "1.05vw", color: "#EDE1D3" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: highlight ? "rgba(190,150,80,0.1)" : "rgba(255,255,255,0.03)", borderRadius: "0.5vw", padding: "0.9vh 0.8vw" }}>
        <div style={{ fontSize: "0.95vw", color: "#7A8FA8", marginBottom: "0.3vh" }}>VALORACIÓN ESTIMADA M12</div>
        <div style={{ fontSize: "2.0vw", fontWeight: 700, color: highlight ? "#BE9650" : "#EDE1D3", lineHeight: 1 }}>{valuation}</div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.9vh" }}>
        <div style={{ fontSize: "0.9vw", color: "#7A8FA8", marginBottom: "0.3vh" }}>STAKE 2,5% VALE</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: "1.55vw", fontWeight: 700, color: "#6EC49A" }}>{stakeVal}</div>
          <div style={{
            fontSize: "1.1vw", fontWeight: 700,
            color: highlight ? "#BE9650" : "#7A8FA8",
            backgroundColor: "rgba(110,196,154,0.1)",
            border: "1px solid rgba(110,196,154,0.25)",
            borderRadius: "0.4vw",
            padding: "0.2vh 0.5vw",
          }}>{returnX} el capital</div>
        </div>
      </div>
    </div>
  );
}

export default function SlideAnexoInversion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "7.5vh 6vw 6vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1vh" }}>
          ANEXO · VALORACIÓN ESTIMADA
        </div>
        <div style={{ fontSize: "4.0vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          ¿Cuánto vale esta empresa <span style={{ color: "#BE9650" }}>en 12 meses?</span>
        </div>
      </div>

      {/* Main: HOY + M12 */}
      <div style={{ display: "flex", gap: "3.5vw", flex: 1, marginTop: "3.5vh" }}>

        {/* Left: Hoy */}
        <div style={{ flex: 0.85, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "1.4vh" }}>VALORACIÓN HOY (PRE-INVERSIÓN)</div>

          <div style={{
            backgroundColor: "#090E17",
            border: "1.5px solid rgba(190,150,80,0.35)",
            borderRadius: "0.9vw",
            padding: "2.2vh 1.6vw",
            flex: 1,
          }}>
            <div style={{ fontSize: "1.2vw", color: "#7A8FA8", marginBottom: "0.4vh" }}>VALORACIÓN PRE-MONEY</div>
            <div style={{ fontSize: "3.8vw", fontWeight: 700, color: "#BE9650", lineHeight: 1, marginBottom: "0.5vh" }}>US$ 1.000.000</div>
            <div style={{ fontSize: "1.15vw", color: "#7A8FA8", marginBottom: "2vh" }}>≈ $900M CLP · TC $900</div>

            <div style={{ marginBottom: "2vh" }}>
              <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#EDE1D3", letterSpacing: "0.06em", marginBottom: "0.8vh" }}>POR QUÉ ES DEFENDIBLE</div>
              <Bullet text="+1.000.000 seguidores activos = distribución con costo de adquisición casi nulo" />
              <Bullet text="180 pistas de audio listas al lanzar (activo de contenido producido)" />
              <Bullet text="App funcional con auth, player, suscripciones y back-office construidos" />
              <Bullet text="Precio premium ($6.900/mes IVA incl.) validado en el segmento objetivo" />
            </div>

            <div style={{ borderTop: "1px solid rgba(190,150,80,0.2)", paddingTop: "1.2vh" }}>
              <div style={{ fontSize: "1.0vw", color: "#7A8FA8", marginBottom: "0.4vh" }}>INVERSIÓN US$25.000 = 2,5% de la empresa</div>
              <div style={{ display: "flex", gap: "1vw" }}>
                <div style={{ flex: 1, backgroundColor: "rgba(190,150,80,0.08)", borderRadius: "0.4vw", padding: "0.6vh 0.8vw", textAlign: "center" }}>
                  <div style={{ fontSize: "0.9vw", color: "#3D4F62" }}>Ticket</div>
                  <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#EDE1D3" }}>US$ 25K</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "rgba(190,150,80,0.08)", borderRadius: "0.4vw", padding: "0.6vh 0.8vw", textAlign: "center" }}>
                  <div style={{ fontSize: "0.9vw", color: "#3D4F62" }}>Equity</div>
                  <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#BE9650" }}>2,5%</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "rgba(190,150,80,0.08)", borderRadius: "0.4vw", padding: "0.6vh 0.8vw", textAlign: "center" }}>
                  <div style={{ fontSize: "0.9vw", color: "#3D4F62" }}>Post-money</div>
                  <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#EDE1D3" }}>US$ 1,025M</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.8vh", paddingTop: "2vh" }}>
          <div style={{ fontSize: "0.9vw", color: "#3D4F62", letterSpacing: "0.08em" }}>12 MESES</div>
          <div style={{ fontSize: "2.5vw", color: "rgba(190,150,80,0.5)" }}>→</div>
          <div style={{ fontSize: "0.85vw", color: "#3D4F62", textAlign: "center" }}>múltiplo<br/>ARR</div>
        </div>

        {/* Right: M12 scenarios */}
        <div style={{ flex: 1.6, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "1.4vh" }}>VALORACIÓN ESTIMADA · MES 12</div>
          <div style={{ display: "flex", gap: "1.2vw", flex: 1 }}>
            <ScenarioCard
              label="Conservador"
              subs="7.000"
              arr="US$ 308K"
              multiple="5× ARR"
              valuation="US$ 1,5M"
              stakeVal="US$ 38K"
              returnX="1,5×"
            />
            <ScenarioCard
              label="Base"
              highlight
              subs="15.000"
              arr="US$ 660K"
              multiple="7× ARR"
              valuation="US$ 4,6M"
              stakeVal="US$ 115K"
              returnX="4,6×"
            />
            <ScenarioCard
              label="Optimista"
              subs="25.000"
              arr="US$ 1,1M"
              multiple="8× ARR"
              valuation="US$ 8,8M"
              stakeVal="US$ 220K"
              returnX="8,8×"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ fontSize: "1.1vw", color: "#3D4F62", lineHeight: 1.5, marginTop: "2vh" }}>
        Metodología: ARR neto = suscriptores M12 × ARPU neto $3.300 × 12 · Múltiplos de referencia para SaaS/consumer subscription en etapa temprana (Calm valuó en ~4–8× ARR en rondas tempranas) ·
        Valoración estimada ilustrativa, no garantizada. El retorno real depende del exit, dilución en rondas futuras y condiciones de mercado.
      </div>
    </div>
  );
}
