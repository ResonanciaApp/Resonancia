export default function SlideValleDeCaja() {
  // Escenario base · ARPU neto $4.350/mes · fijos $3.250.000/mes
  // Valle M1-3: –$3,25M + –$1,51M + –$0,90M = –$5,66M CLP ≈ –$5,7M (runway $8,4M lo cubre)
  // Ronda $27M: upfront $17,9M (contenido+prog.extra+masterización+equipo+mkt+legal) + runway $8,4M + colchón $0,5M
  const valley = [
    { mes: "Mes 1", subs: "0 subs",      val: "–$3,25M", h: 100 },
    { mes: "Mes 2", subs: "400 subs",    val: "–$1,51M", h: 46 },
    { mes: "Mes 3", subs: "1.000 subs",  val: "–$0,90M", h: 28 },
    { mes: "Mes 4", subs: "~2.000 subs", val: "+$3,45M", h: 0, positive: true },
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
          El valle de caja, <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>cubierto.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(242,231,228,0.50)", marginTop: "1vh" }}>
          Cómo se reparte la ronda de $27M CLP: construir y lanzar, sostener los meses en rojo y un colchón · escenario base
        </div>
      </div>

      {/* Main two columns */}
      <div style={{ flex: 1, display: "flex", gap: "2.5vw", alignItems: "stretch", marginTop: "2vh" }}>
        {/* Left: the valley */}
        <div style={{ flex: 1.15, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.08em", marginBottom: "1.5vh" }}>
            MESES EN ROJO · ANTES DE CRECER
          </div>

          {/* Mini valley chart */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: "1.4vw", padding: "0 0.5vw" }}>
            {valley.map((m) => (
              <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* baseline label */}
                <div style={{ fontSize: "1.5vw", fontWeight: 700, color: m.positive ? "#6EC49A" : "#E07070", marginBottom: "0.8vh" }}>
                  {m.val}
                </div>
                {/* bar (downward deficit) */}
                <div style={{ width: "100%", height: "22vh", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
                  {m.positive ? (
                    <div style={{ height: "100%", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
                      <div style={{ width: "70%", height: "3.2vh", backgroundColor: "rgba(110,196,154,0.25)", border: "1px solid #6EC49A", borderRadius: "0.4vw" }} />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "70%",
                        margin: "0 auto",
                        height: `${m.h * 0.20}vh`,
                        background: "linear-gradient(180deg, rgba(224,112,112,0.55), rgba(224,112,112,0.12))",
                        border: "1px solid rgba(224,112,112,0.6)",
                        borderRadius: "0.4vw",
                      }}
                    />
                  )}
                </div>
                <div style={{ fontSize: "1.35vw", fontWeight: 700, color: "#F4DAD5", marginTop: "0.6vh" }}>{m.mes}</div>
                <div style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.50)" }}>{m.subs}</div>
              </div>
            ))}
          </div>

          {/* Accumulated total */}
          <div style={{
            marginTop: "2vh",
            padding: "2vh 1.8vw",
            backgroundColor: "#1A0810",
            border: "1px solid rgba(224,112,112,0.35)",
            borderRadius: "0.7vw",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#F4DAD5" }}>Pérdida acumulada (meses 1–3)</div>
              <div style={{ fontSize: "1vw", color: "rgba(242,231,228,0.50)" }}>A partir del mes 4 la operación es rentable mes a mes</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#E07070", lineHeight: 1 }}>–$5,7M</div>
              <div style={{ fontSize: "1.1vw", color: "rgba(242,231,228,0.50)", marginTop: "0.3vh" }}>CLP acumulado M1–M3</div>
            </div>
          </div>
        </div>

        {/* Right: how the round covers it */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.08em", marginBottom: "1.5vh" }}>
            CÓMO SE DESPLIEGA LA RONDA
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
              <div style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.50)", letterSpacing: "0.06em" }}>RONDA TOTAL</div>
              <div style={{ fontSize: "3.2vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.05 }}>$27.000.000</div>
              <div style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.50)" }}>27 millones de pesos chilenos</div>
            </div>

            <div style={{ height: "1px", backgroundColor: "rgba(247,203,107,0.2)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4DAD5" }}>Upfront <span style={{ color: "rgba(242,231,228,0.50)", fontSize: "0.95vw" }}>(producción, equipo, mkt, legal)</span></div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4DAD5" }}>$17,9M</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4DAD5" }}>Runway operativo <span style={{ color: "rgba(242,231,228,0.50)", fontSize: "0.95vw" }}>(RRHH 3 meses)</span></div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#E07070" }}>$8,4M</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4DAD5" }}>Colchón / imprevistos</div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#6EC49A" }}>$0,5M</div>
            </div>

            <div style={{ height: "1px", backgroundColor: "rgba(247,203,107,0.2)" }} />

            <div style={{ fontSize: "1.1vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.5 }}>
              La ronda se despliega en dos fases: <strong style={{ color: "#F4DAD5" }}>construir y lanzar</strong> antes del mes 1, y
              <strong style={{ color: "#F4DAD5" }}> sostener la operación</strong> hasta que el negocio se autofinancia (mes 4), con un colchón de seguridad.
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.2vw", color: "#3D0E16", lineHeight: 1.5, marginTop: "2vh" }}>
        Escenario base · ARPU neto blended ~$4.350/mes (post IVA 19% + comisión tienda 30%) · Fijos $3,25M/mes (RRHH $2,8M + hosting $250K + otros $200K) ·
        Contenido $0 en M1–2, $1,5M/mes desde M3 · El negocio se autofinancia desde el mes 4; la inversión cubre el arranque, no la operación continua.
      </div>
    </div>
  );
}
