export default function SlideValleDeCaja() {
  // Mismo presupuesto de Slide11Inversion: $29,938M.
  // $27,438M se despliegan hasta el lanzamiento y $2,5M quedan reservados para marketing M1–M3.
  // El equipo pre-lanzamiento es reducido; la operación completa post-lanzamiento cuesta $4,56M/mes.
  const preLaunch = [
    { mes: "M–3", label: "Pre-lanz.", val: "–$1,60M", h: 75, note: "Equipo reducido" },
    { mes: "M–2", label: "Pre-lanz.", val: "–$1,60M", h: 75, note: "Equipo reducido" },
    { mes: "M–1", label: "Pre-lanz.", val: "–$1,60M", h: 75, note: "Equipo reducido" },
  ];
  const postLaunch = [
    { mes: "M1",  label: "Lanzamiento",  val: "+$0,44M", positive: true, note: "Caja real" },
    { mes: "M2",  label: "Post-lanz.",    val: "+$2,04M", positive: true, note: "Caja real" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO · USO DE LA INVERSIÓN
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Todo antes del <span style={{ color: "#FFFFFF" }}>lanzamiento.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(244,244,244,0.50)", marginTop: "1vh" }}>
          $27,438M CLP se despliegan hasta el lanzamiento · $2,5M quedan reservados para la campaña M1–M3
        </div>
      </div>

      {/* Main two columns */}
      <div style={{ flex: 1, display: "flex", gap: "2.5vw", alignItems: "stretch", marginTop: "2vh" }}>

        {/* Left: timeline */}
        <div style={{ flex: 1.25, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.08em", marginBottom: "1.5vh" }}>
            LÍNEA DE TIEMPO · 3 MESES PRE-LANZAMIENTO
          </div>

          {/* Chart area */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "0.8vw", padding: "0 0.2vw" }}>

            {/* Pre-launch bars */}
            {preLaunch.map((m) => (
              <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "22vh" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", width: "100%", alignItems: "center" }}>
                  <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4F4F4", marginBottom: "0.6vh" }}>{m.val}</div>
                  <div
                    style={{
                      width: "70%",
                      height: `${m.h * 0.20}vh`,
                      background: "linear-gradient(180deg, rgba(224,112,112,0.55), rgba(224,112,112,0.12))",
                      border: "1px solid rgba(224,112,112,0.6)",
                      borderRadius: "0.4vw",
                    }}
                  />
                </div>
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#F4F4F4", marginTop: "0.6vh" }}>{m.mes}</div>
                <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.50)" }}>{m.note}</div>
              </div>
            ))}

            {/* Divider / Launch marker */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "22vh", gap: "0.5vh", flexShrink: 0, paddingBottom: "2.5vh" }}>
              <div style={{ width: "2px", flex: 1, background: "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1))" }} />
              <div style={{ fontSize: "0.75vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.08em", textAlign: "center", whiteSpace: "nowrap" }}>LANZA-<br/>MIENTO</div>
            </div>

            {/* Post-launch bars */}
            {postLaunch.map((m) => (
              <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "22vh" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", width: "100%", alignItems: "center" }}>
                  <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#6EC49A", marginBottom: "0.6vh" }}>{m.val}</div>
                  <div style={{
                    width: "70%",
                    height: "3.2vh",
                    backgroundColor: "rgba(110,196,154,0.25)",
                    border: "1px solid #6EC49A",
                    borderRadius: "0.4vw",
                  }} />
                </div>
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#F4F4F4", marginTop: "0.6vh" }}>{m.mes}</div>
                <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.50)" }}>{m.note}</div>
              </div>
            ))}
          </div>

          {/* Summary boxes */}
          <div style={{ display: "flex", gap: "1vw", marginTop: "2vh" }}>
            <div style={{
              flex: 1,
              padding: "1.6vh 1.4vw",
              backgroundColor: "rgba(0,0,0,0.14)",
              border: "1px solid rgba(224,112,112,0.35)",
              borderRadius: "0.7vw",
            }}>
              <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#F4F4F4", marginBottom: "0.3vh" }}>Equipo reducido pre-lanzamiento</div>
              <div style={{ fontSize: "0.9vw", color: "rgba(244,244,244,0.50)", marginBottom: "0.5vh" }}>3 meses × $1,596M/mes</div>
              <div style={{ fontSize: "2.0vw", fontWeight: 700, color: "#F4F4F4", lineHeight: 1 }}>$4,788M CLP</div>
            </div>
            <div style={{
              flex: 1,
              padding: "1.6vh 1.4vw",
              backgroundColor: "rgba(0,0,0,0.14)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "0.7vw",
            }}>
              <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#F4F4F4", marginBottom: "0.3vh" }}>Otros usos hasta lanzamiento</div>
              <div style={{ fontSize: "0.9vw", color: "rgba(244,244,244,0.50)", marginBottom: "0.5vh" }}>contenido, externos, equipo y otros</div>
              <div style={{ fontSize: "2.0vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>$22,65M CLP</div>
            </div>
          </div>
        </div>

        {/* Right: deployment */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.08em", marginBottom: "1.5vh" }}>
            DESPLIEGUE DEL CAPITAL
          </div>

          <div style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.14)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "0.9vw",
            padding: "2.4vh 2vw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "1.6vh",
          }}>
            <div>
              <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.50)", letterSpacing: "0.06em" }}>TOTAL INVERSIÓN</div>
              <div style={{ fontSize: "3.2vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.05 }}>$29.938.000</div>
              <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.50)" }}>$27,438M pre-lanzamiento + $2,5M reservados</div>
            </div>

            <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4F4F4" }}>Contenido, externos, equipo y otros</div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4F4F4" }}>$22,65M</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4F4F4" }}>Equipo reducido · 3 meses pre-lanzamiento</div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4F4F4" }}>$4,788M</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4F4F4" }}>Reserva marketing lanzamiento M1–M3</div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#6EC49A" }}>$2,5M</div>
            </div>

            <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />

            <div style={{
              backgroundColor: "rgba(110,196,154,0.08)",
              border: "1px solid rgba(110,196,154,0.3)",
              borderRadius: "0.6vw",
              padding: "1.2vh 1.2vw",
            }}>
              <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#6EC49A", marginBottom: "0.4vh" }}>Desde el lanzamiento (M1)</div>
              <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.45 }}>
                El producto sale listo tras 3 meses con un equipo reducido. Desde M1 entra la estructura completa de $4,56M/mes; los prepagos anuales sostienen la caja y la campaña ya está reservada.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.2vw", color: "#3D0E16", lineHeight: 1.5, marginTop: "2vh" }}>
        Presupuesto igual a la lámina de inversión: contenido $4,95M + marketing $3,5M ($1M pre-lanzamiento y $2,5M reservados) + runway $4,788M + externos $9M + equipamiento $4,3M + otros $3,4M = $29,938M ·
        Equipo reducido pre-lanzamiento ≠ estructura post-lanzamiento de $4,56M/mes.
      </div>
    </div>
  );
}
