export default function SlideValleDeCaja() {
  // Escenario base · Los $27M se despliegan ANTES del lanzamiento
  // Pre-lanzamiento (3 meses): equipo trabaja y cobra $2,8M/mes (=$8,4M runway) + $17,9M upfront producción/equipo/mkt/legal
  // Desde el día 1 (lanzamiento), la operación se financia únicamente con ingresos de suscripciones
  const preLaunch = [
    { mes: "M–3", label: "Pre-lanz.", val: "–$2,8M", h: 75, note: "Equipo" },
    { mes: "M–2", label: "Pre-lanz.", val: "–$2,8M", h: 75, note: "Equipo" },
    { mes: "M–1", label: "Pre-lanz.", val: "–$2,8M", h: 75, note: "Equipo" },
  ];
  const postLaunch = [
    { mes: "M1",  label: "Lanzamiento",  val: "+$0,23M", positive: true, note: "~800 subs" },
    { mes: "M2",  label: "Post-lanz.",    val: "+$1,97M", positive: true, note: "~1.200 subs" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #2E0D16 0%, #1A0810 100%)", color: "#F4DAD5", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO · USO DE LA INVERSIÓN
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Todo antes del <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>lanzamiento.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(242,231,228,0.50)", marginTop: "1vh" }}>
          Los $27M CLP se despliegan íntegros en los 3 meses previos al lanzamiento · desde el día 1 la operación se autofinancia
        </div>
      </div>

      {/* Main two columns */}
      <div style={{ flex: 1, display: "flex", gap: "2.5vw", alignItems: "stretch", marginTop: "2vh" }}>

        {/* Left: timeline */}
        <div style={{ flex: 1.25, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.08em", marginBottom: "1.5vh" }}>
            LÍNEA DE TIEMPO · 3 MESES PRE-LANZAMIENTO
          </div>

          {/* Chart area */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "0.8vw", padding: "0 0.2vw" }}>

            {/* Pre-launch bars */}
            {preLaunch.map((m) => (
              <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "22vh" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", width: "100%", alignItems: "center" }}>
                  <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#E07070", marginBottom: "0.6vh" }}>{m.val}</div>
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
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#F4DAD5", marginTop: "0.6vh" }}>{m.mes}</div>
                <div style={{ fontSize: "0.95vw", color: "rgba(242,231,228,0.50)" }}>{m.note}</div>
              </div>
            ))}

            {/* Divider / Launch marker */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "22vh", gap: "0.5vh", flexShrink: 0, paddingBottom: "2.5vh" }}>
              <div style={{ width: "2px", flex: 1, background: "linear-gradient(180deg, rgba(247,203,107,0.6), rgba(247,203,107,0.1))" }} />
              <div style={{ fontSize: "0.75vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.08em", textAlign: "center", whiteSpace: "nowrap" }}>LANZA-<br/>MIENTO</div>
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
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#F4DAD5", marginTop: "0.6vh" }}>{m.mes}</div>
                <div style={{ fontSize: "0.95vw", color: "rgba(242,231,228,0.50)" }}>{m.note}</div>
              </div>
            ))}
          </div>

          {/* Summary boxes */}
          <div style={{ display: "flex", gap: "1vw", marginTop: "2vh" }}>
            <div style={{
              flex: 1,
              padding: "1.6vh 1.4vw",
              backgroundColor: "#1A0810",
              border: "1px solid rgba(224,112,112,0.35)",
              borderRadius: "0.7vw",
            }}>
              <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#F4DAD5", marginBottom: "0.3vh" }}>RRHH pre-lanzamiento</div>
              <div style={{ fontSize: "0.9vw", color: "rgba(242,231,228,0.50)", marginBottom: "0.5vh" }}>3 meses × $2,8M/mes</div>
              <div style={{ fontSize: "2.0vw", fontWeight: 700, color: "#E07070", lineHeight: 1 }}>$8,4M CLP</div>
            </div>
            <div style={{
              flex: 1,
              padding: "1.6vh 1.4vw",
              backgroundColor: "#1A0810",
              border: "1px solid rgba(247,203,107,0.25)",
              borderRadius: "0.7vw",
            }}>
              <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#F4DAD5", marginBottom: "0.3vh" }}>Upfront (prod. + equipo + mkt)</div>
              <div style={{ fontSize: "0.9vw", color: "rgba(242,231,228,0.50)", marginBottom: "0.5vh" }}>paralelo al período de runway</div>
              <div style={{ fontSize: "2.0vw", fontWeight: 700, color: "#F7CB6B", lineHeight: 1 }}>$17,9M CLP</div>
            </div>
          </div>
        </div>

        {/* Right: deployment */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.08em", marginBottom: "1.5vh" }}>
            DESPLIEGUE DEL CAPITAL
          </div>

          <div style={{
            flex: 1,
            backgroundColor: "#1A0810",
            border: "1px solid rgba(247,203,107,0.3)",
            borderRadius: "0.9vw",
            padding: "2.4vh 2vw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "1.6vh",
          }}>
            <div>
              <div style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.50)", letterSpacing: "0.06em" }}>TOTAL INVERSIÓN</div>
              <div style={{ fontSize: "3.2vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.05 }}>$27.000.000</div>
              <div style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.50)" }}>desembolsados antes del día 1</div>
            </div>

            <div style={{ height: "1px", backgroundColor: "rgba(247,203,107,0.2)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4DAD5" }}>Producción, equipo, mkt, legal</div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4DAD5" }}>$17,9M</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4DAD5" }}>RRHH 3 meses pre-lanzamiento</div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#E07070" }}>$8,4M</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4DAD5" }}>Colchón / imprevistos</div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#6EC49A" }}>$0,5M</div>
            </div>

            <div style={{ height: "1px", backgroundColor: "rgba(247,203,107,0.2)" }} />

            <div style={{
              backgroundColor: "rgba(110,196,154,0.08)",
              border: "1px solid rgba(110,196,154,0.3)",
              borderRadius: "0.6vw",
              padding: "1.2vh 1.2vw",
            }}>
              <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#6EC49A", marginBottom: "0.4vh" }}>Desde el lanzamiento (M1)</div>
              <div style={{ fontSize: "0.95vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.45 }}>
                El producto sale listo y el equipo lleva 3 meses trabajando. La operación se financia con ingresos de suscripciones desde el día 1 — sin necesidad de más capital.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.2vw", color: "#3D0E16", lineHeight: 1.5, marginTop: "2vh" }}>
        RRHH: Gerente $600K + Programador $700K + Coordinador $500K + Ventas $500K + Admin $500K = $2.800.000/mes ·
        Upfront: Contenido $6,4M + Prog. extra $2,5M + Masterización $1,5M + Equipamiento $4M + Marketing $3M + Legal $0,5M = $17,9M ·
        Desde M1 los costos operativos se cubren con ingresos; no se requiere capital adicional.
      </div>
    </div>
  );
}
