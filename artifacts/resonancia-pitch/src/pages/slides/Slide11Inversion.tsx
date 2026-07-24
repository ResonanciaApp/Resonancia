import type { CSSProperties } from "react";

export default function Slide11Inversion() {
  const grupos = [
    {
      titulo: "GASTOS OPERACIONALES",
      items: [
        { label: "Contenido",                  monto: "$4.950.000" },
        { label: "Marketing",                  monto: "$3.500.000" },
        { label: "Runway Operativo (4 meses)", monto: "$4.788.000" },
      ],
      total: "$13.238.000",
    },
    {
      titulo: "EXTERNOS",
      items: [
        { label: "Programación extra",     monto: "$5.000.000" },
        { label: "Masterización",          monto: "$800.000"   },
        { label: "Replit (programación)",  monto: "$1.200.000" },
        { label: "Diseños y animación",    monto: "$2.000.000" },
      ],
      total: "$9.000.000",
    },
    {
      titulo: "EQUIPAMIENTO",
      items: [
        { label: "Equipamiento (estudio + hardware)", monto: "$4.300.000" },
      ],
      total: "$4.300.000",
    },
    {
      titulo: "OTROS",
      items: [
        { label: "Trámites legales", monto: "$1.300.000" },
        { label: "Colchón",          monto: "$600.000"   },
        { label: "50% Arriendo 3 meses", monto: "$1.500.000" },
      ],
      total: "$3.400.000",
    },
  ];

  const rrhh = [
    { label: "Gerente General",                          monto: "$600.000" },
    { label: "Ventas / Logística / Coord. contenido",    monto: "$400.000" },
    { label: "Super admin / Atención cliente",           monto: "$400.000" },
  ];

  const equipos = [
    { label: "Estudio grabación (Acústica/Termos/Alfombra)", monto: "$2.000.000" },
    { label: "Gadgets grabación",                            monto: "$500.000"   },
    { label: "Micrófonos",                                   monto: "$1.200.000" },
    { label: "Lente gran angular",                           monto: "$600.000"   },
  ];

  const contenido = [
    { label: "Sesiones de Sonoterapia", valor: "$50.000", cantidad: 15, total: "$750.000"   },
    { label: "Voces Guía",              valor: "$25.000", cantidad: 40, total: "$1.000.000" },
    { label: "Música Ambient",          valor: "$80.000", cantidad: 30, total: "$2.400.000" },
    { label: "Mundo Holístico",         valor: "$40.000", cantidad: 20, total: "$800.000"   },
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
        background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)",
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
              $29.938.000 CLP
            </span>
          </div>
          <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.45)", marginTop: "0.5vh" }}>
            para producir el catálogo, equipar el estudio, lanzar al mercado y operar los 4 meses pre-lanzamiento.
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "1.0vw", color: "rgba(244,244,244,0.40)", letterSpacing: "0.1em" }}>TOTAL INVERSIÓN</div>
          <div style={{ fontSize: "2.8vw", fontWeight: 700, ...goldGrad, lineHeight: 1.1 }}>$29.938.000</div>
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
            <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>Total mensual (c/ cargas)</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, ...goldGrad }}>$1.596.000</div>
          </div>
          <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.35)", marginTop: "0.2vh" }}>
            Runway operativo total = $4.788.000
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
            <div style={{ fontSize: "1.2vw", fontWeight: 700, ...goldGrad }}>$4.300.000</div>
          </div>
          <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.35)", marginTop: "0.2vh" }}>
            Inversión única · hardware para producción de audio
          </div>
        </div>

        {/* Contenido */}
        <div style={card}>
          <div style={colHdr}>CONTENIDO · DESGLOSE</div>
          {/* Sub-header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "0.6vw", marginBottom: "0.3vh" }}>
            <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.35)", letterSpacing: "0.06em" }}></div>
            <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.35)", letterSpacing: "0.06em", textAlign: "right", minWidth: "4.5vw" }}>VALOR</div>
            <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.35)", letterSpacing: "0.06em", textAlign: "right", minWidth: "3vw" }}>CANT.</div>
            <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.35)", letterSpacing: "0.06em", textAlign: "right", minWidth: "5vw" }}>TOTAL</div>
          </div>
          {contenido.map((it) => (
            <div key={it.label} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "0.6vw", alignItems: "baseline" }}>
              <div style={{ fontSize: "1.0vw", color: "rgba(244,244,244,0.65)" }}>{it.label}</div>
              <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.50)", textAlign: "right", minWidth: "4.5vw" }}>{it.valor}</div>
              <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.50)", textAlign: "right", minWidth: "3vw" }}>×{it.cantidad}</div>
              <div style={{ fontSize: "0.95vw", fontWeight: 600, color: "#F4F4F4", textAlign: "right", minWidth: "5vw" }}>{it.total}</div>
            </div>
          ))}
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.2)", marginTop: "0.5vh" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.6vw", alignItems: "baseline", marginTop: "0.2vh" }}>
            <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>Total contenido</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, ...goldGrad }}>$4.950.000</div>
          </div>
          <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.35)", marginTop: "0.2vh" }}>
            105 piezas de audio producidas para lanzamiento
          </div>
        </div>
      </div>

    </div>
  );
}
