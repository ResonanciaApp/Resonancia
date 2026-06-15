export default function SlideValleDeCaja() {
  // Escenario base · ARPU neto $3.300/mes · TC $900/USD · sueldos en efectivo desde el mes 1
  // Meses en rojo (1-3): –$3,1M + –$1,7M + –$2,3M = –$7,1M CLP ≈ US$7.900 (runway operativo)
  // Ronda US$30.000 ($27M) = upfront $17M (US$18.880) + runway $7,1M (US$7.900) + colchón $2,9M (US$3.220)
  const valley = [
    { mes: "Mes 1", subs: "0 subs", val: "–$3,1M", h: 100 },
    { mes: "Mes 2", subs: "400 subs", val: "–$1,7M", h: 55 },
    { mes: "Mes 3", subs: "1.000 subs", val: "–$2,3M", h: 74 },
    { mes: "Mes 4", subs: "~2.000 subs", val: "+$1,1M", h: 0, positive: true },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO · USO DE LA INVERSIÓN
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          El valle de caja, <span style={{ color: "#D4AF37" }}>cubierto.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(242,231,228,0.50)", marginTop: "1vh" }}>
          Cómo se reparte la ronda de US$30.000: construir y lanzar, sostener los meses en rojo y un colchón · escenario base
        </div>
      </div>

      {/* Main two columns */}
      <div style={{ flex: 1, display: "flex", gap: "2.5vw", alignItems: "stretch", marginTop: "2vh" }}>
        {/* Left: the valley */}
        <div style={{ flex: 1.15, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.08em", marginBottom: "1.5vh" }}>
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
            backgroundColor: "#27070E",
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
              <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#E07070", lineHeight: 1 }}>–$7,1M</div>
              <div style={{ fontSize: "1.1vw", color: "rgba(242,231,228,0.50)", marginTop: "0.3vh" }}>≈ US$ 7.900</div>
            </div>
          </div>
        </div>

        {/* Right: how the round covers it */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.08em", marginBottom: "1.5vh" }}>
            CÓMO SE DESPLIEGA LA RONDA
          </div>

          <div style={{
            flex: 1,
            backgroundColor: "#27070E",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: "0.9vw",
            padding: "2.4vh 2vw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "1.6vh",
          }}>
            <div>
              <div style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.50)", letterSpacing: "0.06em" }}>RONDA TOTAL</div>
              <div style={{ fontSize: "3.2vw", fontWeight: 700, color: "#D4AF37", lineHeight: 1.05 }}>US$ 30.000</div>
              <div style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.50)" }}>$27M CLP · TC $900</div>
            </div>

            <div style={{ height: "1px", backgroundColor: "rgba(212,175,55,0.2)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4DAD5" }}>Gasto upfront <span style={{ color: "rgba(242,231,228,0.50)", fontSize: "0.95vw" }}>(pre-mes 1)</span></div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4DAD5" }}>US$ 18.880</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4DAD5" }}>Runway operativo <span style={{ color: "rgba(242,231,228,0.50)", fontSize: "0.95vw" }}>(valle meses 1–3)</span></div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#E07070" }}>US$ 7.900</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.2vw", color: "#F4DAD5" }}>Colchón / imprevistos</div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#6EC49A" }}>US$ 3.220</div>
            </div>

            <div style={{ height: "1px", backgroundColor: "rgba(212,175,55,0.2)" }} />

            <div style={{ fontSize: "1.1vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.5 }}>
              La ronda se despliega en dos fases: <strong style={{ color: "#F4DAD5" }}>construir y lanzar</strong> antes del mes 1, y
              <strong style={{ color: "#F4DAD5" }}> sostener la operación</strong> hasta que el negocio se autofinancia (mes 4), con un colchón para imprevistos.
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.2vw", color: "#3D4F62", lineHeight: 1.5, marginTop: "2vh" }}>
        Escenario base · ARPU neto blended ~$3.300/mes (post IVA 19% + comisión tienda 30%) · Fijos $3,05M/mes (sueldos en efectivo desde el mes 1) ·
        Contenido $0 en M1–2, $2,0M/mes desde M3 · El negocio se autofinancia desde el mes 4; la inversión cubre el arranque, no la operación continua.
      </div>
    </div>
  );
}
