function Bullet({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7vw", marginBottom: "0.6vh" }}>
      <div style={{ width: "0.42vw", height: "0.42vw", backgroundColor: "#FFFFFF", transform: "rotate(45deg)", flexShrink: 0, marginTop: "0.5vw" }} />
      <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.35 }}>{text}</div>
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
      backgroundColor: highlight ? "#1f2a62" : "rgba(255,255,255,0.02)",
      border: `1.5px solid ${highlight ? "#FFFFFF" : "rgba(255,255,255,0.08)"}`,
      borderRadius: "0.8vw",
      padding: "1.5vh 1.2vw",
      display: "flex",
      flexDirection: "column",
      gap: "0.8vh",
    }}>
      <div style={{ fontSize: "1.3vw", fontWeight: 700, color: highlight ? "#FFFFFF" : "#F4F4F4" }}>{label}</div>
      <div style={{ fontSize: "1.0vw", color: "rgba(244,244,244,0.50)" }}>{subs} suscriptores</div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.7vh", display: "flex", flexDirection: "column", gap: "0.35vh" }}>
        {[
          ["ARR neto M12", arr],
          ["Múltiplo", multiple],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.45)" }}>{k}</div>
            <div style={{ fontSize: "1.0vw", color: "#F4F4F4" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: highlight ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)", borderRadius: "0.5vw", padding: "0.8vh 0.8vw" }}>
        <div style={{ fontSize: "0.9vw", color: "rgba(244,244,244,0.50)", marginBottom: "0.2vh" }}>VALORACIÓN ESTIMADA M12</div>
        <div style={{ fontSize: "1.9vw", fontWeight: 700, color: highlight ? "#FFFFFF" : "#F4F4F4", lineHeight: 1 }}>{valuation}</div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.7vh" }}>
        <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.50)", marginBottom: "0.3vh" }}>STAKE 35,0% VALE</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#6EC49A" }}>{stakeVal}</div>
          <div style={{
            fontSize: "1.05vw", fontWeight: 700,
            color: highlight ? "#FFFFFF" : "rgba(244,244,244,0.50)",
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
      style={{ background: "linear-gradient(160deg, #2d1c52 0%, #24245d 33%, #1f2a62 66%, #2d4081 100%)", color: "#F4F4F4", padding: "5vh 6vw 4.5vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.7vh" }}>
          ANEXO · VALORACIÓN ESTIMADA
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          ¿Cuánto vale esta empresa <span style={{ color: "#FFFFFF" }}>en 12 meses?</span>
        </div>
      </div>

      {/* Main: HOY + M12 */}
      <div style={{ display: "flex", gap: "3vw", flex: 1, minHeight: 0, marginTop: "2.5vh" }}>

        {/* Left: Hoy */}
        <div style={{ flex: 0.9, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "1vh" }}>VALORACIÓN HOY (PRE-INVERSIÓN)</div>

          <div style={{
            backgroundColor: "rgba(0,0,0,0.14)",
            border: "1.5px solid rgba(255,255,255,0.35)",
            borderRadius: "0.9vw",
            padding: "1.8vh 1.5vw",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ fontSize: "1.1vw", color: "rgba(244,244,244,0.50)", marginBottom: "0.3vh" }}>VALORACIÓN PRE-MONEY</div>
            <div style={{ fontSize: "3.2vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1, marginBottom: "0.4vh" }}>$211,5M CLP</div>
            <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.50)", marginBottom: "1.4vh" }}>doscientos once millones</div>

            <div style={{ marginBottom: "1.4vh" }}>
              <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#F4F4F4", letterSpacing: "0.06em", marginBottom: "0.6vh" }}>POR QUÉ ES DEFENDIBLE</div>
              <Bullet text="+1.000.000 seguidores activos = distribución con costo de adquisición casi nulo" />
              <Bullet text="180 pistas de audio listas al lanzar (activo de contenido producido)" />
              <Bullet text="App funcional con auth, player, suscripciones y back-office construidos" />
              <Bullet text="Precio premium ($8.990/mes IVA incl.) validado en el segmento objetivo" />
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "1vh", marginTop: "auto" }}>
              <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.50)", marginBottom: "0.5vh" }}>
                $23,50M ÷ post-money $67,2M ={" "}
                <span style={{ color: "#FFFFFF", fontWeight: 700 }}>35,0%</span>
              </div>
              <div style={{ display: "flex", gap: "0.8vw" }}>
                <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "0.4vw", padding: "0.6vh 0.6vw", textAlign: "center" }}>
                  <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.45)" }}>Inversión</div>
                  <div style={{ fontSize: "1.25vw", fontWeight: 700, color: "#F4F4F4" }}>$23,50M</div>
                  <div style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.35)" }}>CLP</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "0.4vw", padding: "0.6vh 0.6vw", textAlign: "center" }}>
                  <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.45)" }}>Equity</div>
                  <div style={{ fontSize: "1.25vw", fontWeight: 700, color: "#FFFFFF" }}>35,0%</div>

                  <div style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.35)" }}>máx.</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "0.4vw", padding: "0.6vh 0.6vw", textAlign: "center" }}>
                  <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.45)" }}>Post-money</div>
                  <div style={{ fontSize: "1.25vw", fontWeight: 700, color: "#F4F4F4" }}>$67,2M</div>
                  <div style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.35)" }}>CLP</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.8vh" }}>
          <div style={{ fontSize: "0.9vw", color: "rgba(244,244,244,0.40)", letterSpacing: "0.08em" }}>12 MESES</div>
          <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.5)" }}>→</div>
          <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.40)", textAlign: "center" }}>múltiplo<br/>ARR</div>
        </div>

        {/* Right: M12 scenarios */}
        <div style={{ flex: 1.7, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "1vh" }}>VALORACIÓN ESTIMADA · MES 12 (CLP)</div>
          <div style={{ display: "flex", gap: "1.1vw", flex: 1 }}>
            {/* Base: 5.000 subs × $4.350 × 12 × 4× = $1.044B → 10% = $104.4M → 104.4/23.19 = 4.5× */}
            <ScenarioCard
              label="Base"
              highlight
              subs="5.000"
              arr="$261M CLP"
              multiple="4× ARR"
              valuation="$1,044M"
              stakeVal="$365M CLP"
              returnX="15,5×"
            />
            {/* Optimista: 7.000 × $4.350 × 12 × 5× = $1.827B → 35% = $639.45M → 639/23.50 = 27.2× */}
            <ScenarioCard
              label="Optimista"
              subs="7.000"
              arr="$365M CLP"
              multiple="5× ARR"
              valuation="$1,827M"
              stakeVal="$639M CLP"
              returnX="27,2×"
            />
            {/* Agresivo: 10.000 × $4.350 × 12 × 6× = $3.132B → 35% = $1.096.2M → 1096/23.50 = 46.6× */}
            <ScenarioCard
              label="Agresivo"
              subs="10.000"
              arr="$522M CLP"
              multiple="6× ARR"
              valuation="$3,132M"
              stakeVal="$1.096M CLP"
              returnX="46,6×"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ fontSize: "1.0vw", color: "rgba(244,244,244,0.32)", lineHeight: 1.45, marginTop: "1.5vh" }}>
        El % de equity depende solo de la valoración de entrada, no de los costos operativos. ARR neto = suscriptores M12 × ARPU neto $4.350 × 12 ·
        Múltiplos de referencia para consumer subscription en etapa temprana (Calm valuó en ~4–8× ARR en rondas tempranas) ·
        Valoración estimada ilustrativa, no garantizada. El retorno real depende del exit y dilución en rondas futuras.
      </div>

      {/* Pulso 4 · logo esquina */}
      <div style={{ position: "absolute", top: "3.5vh", right: "3vw", zIndex: 200, pointerEvents: "none" }}>
        <img src={`${import.meta.env.BASE_URL}logo-pulso4.png`} alt="Pulso 4" style={{ height: "4.5vh", opacity: 0.50, display: "block" }} />
      </div>
    </div>
  );
}
