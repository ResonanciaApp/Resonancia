function CostRow({ label, sub, value }: { label: string; sub?: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5vw", padding: "0.28vh 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: "0.4vw", height: "0.4vw", backgroundColor: "#FFFFFF", transform: "rotate(45deg)", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: "1.0vw", fontWeight: 600, color: "#F4F4F4" }}>{label}</span>
        {sub && <span style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.40)", marginLeft: "0.4vw" }}>{sub}</span>}
      </div>
      <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", minWidth: "6.5vw", textAlign: "right" }}>{value}</div>
    </div>
  );
}

export default function SlideFinanzas3() {
  // Blend 35/60/5
  const pricingRows = [
    { plan: "Mensual",  pct: "35%", launch: "$5.990",   launchNeto: "$3.517/mes",     normal: "$7.990",   normalNeto: "$4.700/mes" },
    { plan: "Anual",   pct: "60%", launch: "$39.990",  launchNeto: "$1.961/mes eq.", normal: "$49.990",  normalNeto: "$2.451/mes eq." },
    { plan: "Lifetime",pct: "5%",  launch: "$99.990",  launchNeto: "$58.817 único",   normal: "$149.990", normalNeto: "$88.229 único" },
  ];

  const mktRamp = [
    { rango: "Mes 1–2",   valor: "$0",         desc: "Cubierto por campaña de lanzamiento ($3M upfront)" },
    { rango: "Mes 3–6",   valor: "$500.000",   desc: "Pauta social básica + orgánico" },
    { rango: "Mes 7–12",  valor: "$1M – $1,5M",desc: "Pauta + influencers nicho wellness" },
    { rango: "Mes 13–24", valor: "$2M – $2,5M",desc: "Retargeting + campañas LATAM" },
  ];

  const phases = [
    { fase: "M1–M2",    fijo: "$3,9M", cont: "$0",    mkt: "$0",    total: "$3,9M" },
    { fase: "M3–M6",    fijo: "$3,9M", cont: "$1,2M", mkt: "$0,5M", total: "$5,6M" },
    { fase: "M7–M12",   fijo: "$3,9M", cont: "$1,5M", mkt: "$1,0M–$1,5M", total: "$6,4M–$6,9M" },
    { fase: "M13–M24",  fijo: "$3,9M", cont: "$1,5M", mkt: "$2,0M–$2,5M", total: "$7,4M–$7,9M" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "3vh 5vw 2.5vh", boxSizing: "border-box", gap: "0.9vh" }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.3vh" }}>
          ANEXO FINANCIERO · HOJA 3 DE 3
        </div>
        <div style={{ fontSize: "3.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Estrategia de precios + <span style={{ color: "#FFFFFF" }}>costos mensuales.</span>
        </div>
      </div>

      {/* Pricing table */}
      <div style={{
        flexShrink: 0,
        backgroundColor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "0.6vw", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "0.9fr 0.45fr 1.05fr 1.0fr 1.05fr 1.0fr",
          backgroundColor: "rgba(255,255,255,0.06)", padding: "0.55vh 1.1vw",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          {["Plan", "Mix", "Lanzamiento (M1–M3)", "Neto empresa", "Normal (M4+)", "Neto empresa"].map((h, i) => (
            <div key={i} style={{ fontSize: "0.78vw", fontWeight: 700, letterSpacing: "0.06em",
              color: i >= 2 && i <= 3 ? "#BE9650" : i >= 4 ? "#6EC49A" : "#FFFFFF" }}>{h}</div>
          ))}
        </div>
        {pricingRows.map((r, i) => (
          <div key={r.plan} style={{
            display: "grid", gridTemplateColumns: "0.9fr 0.45fr 1.05fr 1.0fr 1.05fr 1.0fr",
            padding: "0.6vh 1.1vw", alignItems: "center",
            backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
            borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div style={{ fontSize: "0.97vw", fontWeight: 700, color: "#F4F4F4" }}>{r.plan}</div>
            <div style={{ fontSize: "0.97vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>{r.pct}</div>
            <div style={{ fontSize: "0.97vw", color: "#F4F4F4" }}>{r.launch}</div>
            <div style={{ fontSize: "0.88vw", color: "#BE9650", fontWeight: 600 }}>{r.launchNeto}</div>
            <div style={{ fontSize: "0.97vw", color: "#F4F4F4" }}>{r.normal}</div>
            <div style={{ fontSize: "0.88vw", color: "#6EC49A", fontWeight: 600 }}>{r.normalNeto}</div>
          </div>
        ))}
        {/* ARPU row */}
        <div style={{
          display: "grid", gridTemplateColumns: "0.9fr 0.45fr 1.05fr 1.0fr 1.05fr 1.0fr",
          padding: "0.55vh 1.1vw", backgroundColor: "rgba(0,0,0,0.18)",
          borderTop: "1px solid rgba(255,255,255,0.14)", alignItems: "center",
        }}>
          <div style={{ fontSize: "0.78vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", gridColumn: "1/3" }}>ARPU RECURRENTE BLENDED</div>
          <div style={{ gridColumn: "3/5", display: "flex", alignItems: "center", gap: "0.5vw" }}>
            <span style={{ fontSize: "1.1vw", fontWeight: 700, color: "#BE9650" }}>$2.408/mes/sub</span>
            <span style={{ fontSize: "0.72vw", color: "rgba(244,244,244,0.38)" }}>+ $1.18M boost lifetime/mes</span>
          </div>
          <div style={{ gridColumn: "5/7", display: "flex", alignItems: "center", gap: "0.5vw" }}>
            <span style={{ fontSize: "1.1vw", fontWeight: 700, color: "#6EC49A" }}>$3.116/mes/sub</span>
            <span style={{ fontSize: "0.72vw", color: "rgba(244,244,244,0.38)" }}>+ $1.77M boost lifetime/mes</span>
          </div>
        </div>
      </div>

      {/* IVA note */}
      <div style={{ flexShrink: 0, fontSize: "0.77vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.3 }}>
        Neto = precio ÷ 1,19 (IVA 19% Chile, Ley 21.210) × 70% (comisión Apple/Google 30%) · Mensual y anual = recurrente · Lifetime = pago único, no renueva.
      </div>

      {/* Main columns */}
      <div style={{ display: "flex", gap: "3vw", flex: 1, minHeight: 0 }}>

        {/* Left: fixed costs */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.35vh" }}>COSTOS FIJOS / MES · RRHH</div>
          <CostRow label="Gerente general" sub="Dirección y comercial" value="$700.000" />
          <CostRow label="Ventas / Logística" sub="Crecimiento y ops" value="$300.000" />
          <CostRow label="Admin / Atención al cliente" value="$600.000" />
          <CostRow label="Desarrollo / TI" value="$700.000" />
          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", margin: "0.6vh 0 0.3vh" }}>OPERACIONALES</div>
          <CostRow label="Arriendo Casa + servicios" sub="Espacio y suministros" value="$850.000" />
          <CostRow label="Hosting + infraestructura" sub="Replit, Postgres, Bunny.net" value="$250.000" />
          <CostRow label="Cuentas + otros" value="$500.000" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5vh 0 0", borderTop: "1px solid rgba(255,255,255,0.28)", marginTop: "0.2vh" }}>
            <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#F4F4F4" }}>Total fijos</div>
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FFFFFF" }}>$3.900.000</div>
          </div>

          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", margin: "0.7vh 0 0.35vh" }}>CONTENIDO / MES</div>
          <div style={{
            backgroundColor: "rgba(0,0,0,0.20)", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "0.4vw", padding: "0.6vh 0.9vw",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: "0.92vw", fontWeight: 700, color: "#F4F4F4" }}>~25 sesiones / mes · $60.000 prom.</div>
              <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.45)" }}>Sin costo en M1–M2 · Activo producido</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FFFFFF" }}>$1.200.000</div>
              <div style={{ fontSize: "0.72vw", color: "rgba(244,244,244,0.40)" }}>M3–M6 · $1.500.000 desde M7</div>
            </div>
          </div>
        </div>

        {/* Right: marketing + phase totals */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.35vh" }}>MARKETING: RAMP-UP MENSUAL</div>
          <div style={{
            backgroundColor: "rgba(0,0,0,0.12)", border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: "0.5vw", padding: "0.6vh 0.9vw", marginBottom: "0.8vh",
          }}>
            {mktRamp.map(m => (
              <div key={m.rango} style={{ display: "flex", gap: "0.7vw", marginBottom: "0.3vh", alignItems: "baseline" }}>
                <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#F4F4F4", minWidth: "5vw", flexShrink: 0 }}>{m.rango}</div>
                <div style={{ flex: 1, fontSize: "0.80vw", color: "rgba(244,244,244,0.48)" }}>{m.desc}</div>
                <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#6EC49A", minWidth: "6vw", textAlign: "right" }}>{m.valor}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.35vh" }}>COSTO TOTAL MENSUAL POR FASE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.6vw", flex: 1 }}>
            {phases.map((p) => (
              <div key={p.fase} style={{
                backgroundColor: "rgba(0,0,0,0.14)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.5vw", padding: "0.7vh 0.75vw",
              }}>
                <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", marginBottom: "0.5vh" }}>{p.fase}</div>
                {[["Fijo", p.fijo], ["Contenido", p.cont], ["Marketing", p.mkt]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2vh" }}>
                    <span style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.40)" }}>{k}</span>
                    <span style={{ fontSize: "0.75vw", color: "#F4F4F4", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.18)", paddingTop: "0.3vh", marginTop: "0.25vh", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.80vw", fontWeight: 700, color: "#F4F4F4" }}>Total</span>
                  <span style={{ fontSize: "0.80vw", fontWeight: 700, color: "#FFFFFF" }}>{p.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
