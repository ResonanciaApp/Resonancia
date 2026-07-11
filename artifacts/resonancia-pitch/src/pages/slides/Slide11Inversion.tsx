import type { CSSProperties } from "react";

export default function Slide11Inversion() {
  const grupos = [
    {
      titulo: "GASTOS OPERACIONALES",
      items: [
        { label: "Contenido",                  monto: "$5.350.000" },
        { label: "Marketing",                  monto: "$3.500.000" },
        { label: "Runway operativo (3 meses)", monto: "$6.840.000" },
      ],
      total: "$15.690.000",
    },
    {
      titulo: "EQUIPAMIENTO",
      items: [
        { label: "Equipamiento (estudio + hardware)", monto: "$4.700.000" },
      ],
      total: "$4.700.000",
    },
    {
      titulo: "EXTERNOS",
      items: [
        { label: "Programación extra", monto: "$1.000.000" },
        { label: "Masterización",      monto: "$800.000"   },
      ],
      total: "$1.800.000",
    },
    {
      titulo: "OTROS",
      items: [
        { label: "Trámites legales", monto: "$500.000" },
        { label: "Colchón",          monto: "$500.000" },
      ],
      total: "$1.000.000",
    },
  ];

  const rrhh = [
    { label: "Gerente General",               monto: "$400.000" },
    { label: "Programador Chief",             monto: "$500.000" },
    { label: "Coordinador / Contenidos",      monto: "$300.000" },
    { label: "Ventas / Logística",            monto: "$400.000" },
    { label: "Super admin / Atención cliente",monto: "$400.000" },
  ];

  const equipos = [
    { label: "Estudio grabación (Acústica)", monto: "$1.500.000" },
    { label: "Equipos Loops",               monto: "$1.500.000" },
    { label: "Grabadora PodCast",            monto: "$800.000"   },
    { label: "Lente gran angular",          monto: "$900.000"   },
  ];

  const contenido = [
    { label: "Sesiones de Sonoterapia", valor: "$70.000",  cantidad: 30, total: "$2.100.000" },
    { label: "Voces Guía",             valor: "$30.000",  cantidad: 25, total: "$750.000"   },
    { label: "Música Ambient",         valor: "$80.000",  cantidad: 20, total: "$1.600.000" },
    { label: "Mundo Holístico",        valor: "$60.000",  cantidad: 15, total: "$900.000"   },
  ];

  const colHdr: CSSProperties = {
    fontSize: "0.85vw",
    fontWeight: 700,
    color: "#FFFFFF",
    letterSpacing: "0.1em",
    marginBottom: "1.0vh",
  };

  const card: CSSProperties = {
    backgroundColor: "rgba(0,0,0,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "0.7vw",
    padding: "1.4vh 1.2vw",
    display: "flex",
    flexDirection: "column",
    gap: "0.45vh",
  };

  const row: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  };

  const goldGrad: CSSProperties = {
    color: "#FFFFFF",
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{
        background: "linear-gradient(160deg, #2d1c52 0%, #24245d 33%, #1f2a62 66%, #2d4081 100%)",
        color: "#F4F4F4",
        padding: "6vh 6vw 4vh",
        boxSizing: "border-box",
        gap: "2.0vh",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.6vh" }}>
            LA INVERSIÓN
          </div>
          <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Buscamos{" "}
            <span style={goldGrad}>
              $23.190.000 CLP
            </span>
          </div>
          <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.45)", marginTop: "0.5vh" }}>
            para producir el catálogo, equipar el estudio, lanzar al mercado y operar los 3 meses pre-lanzamiento.
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "1.0vw", color: "rgba(244,244,244,0.40)", letterSpacing: "0.1em" }}>TOTAL INVERSIÓN</div>
          <div style={{ fontSize: "2.8vw", fontWeight: 700, ...goldGrad, lineHeight: 1.1 }}>$23.190.000</div>
        </div>
      </div>

      {/* 4 group cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.0vw", flexShrink: 0 }}>
        {grupos.map((g) => (
          <div key={g.titulo} style={card}>
            <div style={colHdr}>{g.titulo}</div>
            {g.items.map((it) => (
              <div key={it.label} style={row}>
                <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.65)" }}>{it.label}</div>
                <div style={{ fontSize: "1.0vw", fontWeight: 600, color: "#F4F4F4" }}>{it.monto}</div>
              </div>
            ))}
            <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.2)", marginTop: "0.4vh" }} />
            <div style={{ ...row, marginTop: "0.1vh" }}>
              <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>Subtotal</div>
              <div style={{ fontSize: "1.1vw", fontWeight: 700, ...goldGrad }}>{g.total}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "1vw", flexShrink: 0 }}>
        <div style={{ height: "1px", flex: 1, backgroundColor: "rgba(255,255,255,0.15)" }} />
        <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.35)", letterSpacing: "0.1em" }}>DESGLOSE</div>
        <div style={{ height: "1px", flex: 1, backgroundColor: "rgba(255,255,255,0.15)" }} />
      </div>

      {/* Three detail tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr", gap: "1.2vw", flex: 1 }}>

        {/* RH – Runway Operativo */}
        <div style={card}>
          <div style={colHdr}>RH · RUNWAY OPERATIVO</div>
          {rrhh.map((it) => (
            <div key={it.label} style={row}>
              <div style={{ fontSize: "1.0vw", color: "rgba(244,244,244,0.65)" }}>{it.label}</div>
              <div style={{ fontSize: "1.05vw", fontWeight: 600, color: "#F4F4F4" }}>{it.monto}</div>
            </div>
          ))}
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.2)", marginTop: "0.5vh" }} />
          <div style={{ ...row, marginTop: "0.2vh" }}>
            <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>Total mensual</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, ...goldGrad }}>$2.280.000</div>
          </div>
          <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.35)", marginTop: "0.2vh" }}>
            × 3 meses = $6.840.000 runway total
          </div>
        </div>

        {/* Equipamiento */}
        <div style={card}>
          <div style={colHdr}>EQUIPAMIENTO · DESGLOSE</div>
          {equipos.map((it) => (
            <div key={it.label} style={row}>
              <div style={{ fontSize: "1.0vw", color: "rgba(244,244,244,0.65)" }}>{it.label}</div>
              <div style={{ fontSize: "1.05vw", fontWeight: 600, color: "#F4F4F4" }}>{it.monto}</div>
            </div>
          ))}
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.2)", marginTop: "0.5vh" }} />
          <div style={{ ...row, marginTop: "0.2vh" }}>
            <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>Total</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, ...goldGrad }}>$4.700.000</div>
          </div>
          <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.35)", marginTop: "0.2vh" }}>
            Inversión única · hardware para producción de audio
          </div>
        </div>

        {/* Contenido */}
        <div style={card}>
          <div style={colHdr}>CONTENIDO · DESGLOSE</div>
          {/* Sub-header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.6vw", marginBottom: "0.3vh" }}>
            <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.35)", letterSpacing: "0.06em" }}></div>
            <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.35)", letterSpacing: "0.06em", textAlign: "right", minWidth: "4.5vw" }}>VALOR</div>
            <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.35)", letterSpacing: "0.06em", textAlign: "right", minWidth: "3vw" }}>CANT.</div>
          </div>
          {contenido.map((it) => (
            <div key={it.label} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.6vw", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.0vw", color: "rgba(244,244,244,0.65)" }}>{it.label}</div>
              <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.50)", textAlign: "right", minWidth: "4.5vw" }}>{it.valor}</div>
              <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.50)", textAlign: "right", minWidth: "3vw" }}>×{it.cantidad}</div>
            </div>
          ))}
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.2)", marginTop: "0.5vh" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.6vw", alignItems: "baseline", marginTop: "0.2vh" }}>
            <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>Total contenido</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, ...goldGrad }}>$5.350.000</div>
          </div>
          <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.35)", marginTop: "0.2vh" }}>
            90 piezas de audio producidas para lanzamiento
          </div>
        </div>
      </div>

      {/* Contact footer */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "1.2vh", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "1.1vw", color: "rgba(244,244,244,0.40)" }}>
          [nombre] · [correo] · [teléfono]
        </div>
      </div>
    </div>
  );
}
