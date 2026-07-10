import type { CSSProperties } from "react";

export default function Slide11Inversion() {
  const grupos = [
    {
      titulo: "GASTOS OPERACIONALES",
      items: [
        { label: "Contenido",                  monto: "$6.400.000" },
        { label: "Marketing",                  monto: "$3.000.000" },
        { label: "Runway operativo (3 meses)", monto: "$8.400.000" },
      ],
      total: "$17.800.000",
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
        { label: "Programación extra", monto: "$2.500.000" },
        { label: "Masterización",      monto: "$1.500.000" },
      ],
      total: "$4.000.000",
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
    { label: "Gerente General",               monto: "$600.000" },
    { label: "Programador Chief",             monto: "$700.000" },
    { label: "Coordinador / Contenidos",      monto: "$500.000" },
    { label: "Ventas / Logística",            monto: "$500.000" },
    { label: "Super admin / Atención cliente",monto: "$500.000" },
  ];

  const equipos = [
    { label: "Estudio grabación", monto: "$1.500.000" },
    { label: "Equipos Loops",     monto: "$1.500.000" },
    { label: "Grabadora",         monto: "$800.000"   },
    { label: "Micrófono",         monto: "$900.000"   },
  ];

  const colHdr: CSSProperties = {
    fontSize: "0.9vw",
    fontWeight: 700,
    background: "linear-gradient(90deg, #F7CB6B, #FBA980)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "0.1em",
    marginBottom: "1.2vh",
  };

  const card: CSSProperties = {
    backgroundColor: "#1A0810",
    border: "1px solid rgba(247,203,107,0.18)",
    borderRadius: "0.7vw",
    padding: "1.6vh 1.4vw",
    display: "flex",
    flexDirection: "column",
    gap: "0.5vh",
  };

  const row: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{
        background: "linear-gradient(160deg, #2E0D16 0%, #1A0810 100%)",
        color: "#F4DAD5",
        padding: "7vh 6vw 5vh",
        boxSizing: "border-box",
        gap: "2.5vh",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "0.8vh" }}>
            LA INVERSIÓN
          </div>
          <div style={{ fontSize: "3.6vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Buscamos{" "}
            <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              $27.500.000 CLP
            </span>
          </div>
          <div style={{ fontSize: "1.3vw", color: "rgba(242,231,228,0.45)", marginTop: "0.6vh" }}>
            para producir el catálogo, equipar el estudio, lanzar al mercado y operar los 3 meses pre-lanzamiento.
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "1.0vw", color: "rgba(242,231,228,0.40)", letterSpacing: "0.1em" }}>TOTAL INVERSIÓN</div>
          <div style={{ fontSize: "2.8vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.1 }}>$27.500.000</div>
        </div>
      </div>

      {/* 4 group cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.2vw", flexShrink: 0 }}>
        {grupos.map((g) => (
          <div key={g.titulo} style={card}>
            <div style={colHdr}>{g.titulo}</div>
            {g.items.map((it) => (
              <div key={it.label} style={row}>
                <div style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.65)" }}>{it.label}</div>
                <div style={{ fontSize: "1.1vw", fontWeight: 600, color: "#F4DAD5" }}>{it.monto}</div>
              </div>
            ))}
            <div style={{ height: "1px", backgroundColor: "rgba(247,203,107,0.2)", marginTop: "0.4vh" }} />
            <div style={{ ...row, marginTop: "0.1vh" }}>
              <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>Subtotal</div>
              <div style={{ fontSize: "1.2vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{g.total}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Divider label */}
      <div style={{ display: "flex", alignItems: "center", gap: "1vw", flexShrink: 0 }}>
        <div style={{ height: "1px", flex: 1, backgroundColor: "rgba(247,203,107,0.15)" }} />
        <div style={{ fontSize: "0.9vw", color: "rgba(242,231,228,0.35)", letterSpacing: "0.1em" }}>DESGLOSE</div>
        <div style={{ height: "1px", flex: 1, backgroundColor: "rgba(247,203,107,0.15)" }} />
      </div>

      {/* Two detail tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.8vw", flex: 1 }}>

        {/* RH – Runway Operativo */}
        <div style={card}>
          <div style={colHdr}>RH · RUNWAY OPERATIVO</div>
          {rrhh.map((it) => (
            <div key={it.label} style={row}>
              <div style={{ fontSize: "1.1vw", color: "rgba(242,231,228,0.65)" }}>{it.label}</div>
              <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "#F4DAD5" }}>{it.monto}</div>
            </div>
          ))}
          <div style={{ height: "1px", backgroundColor: "rgba(247,203,107,0.2)", marginTop: "0.5vh" }} />
          <div style={{ ...row, marginTop: "0.2vh" }}>
            <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>Total mensual</div>
            <div style={{ fontSize: "1.3vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>$2.800.000</div>
          </div>
          <div style={{ fontSize: "0.9vw", color: "rgba(242,231,228,0.35)", marginTop: "0.2vh" }}>
            × 3 meses = $8.400.000 runway total
          </div>
        </div>

        {/* Equipamiento – Runway Operativo */}
        <div style={card}>
          <div style={colHdr}>EQUIPAMIENTO · DESGLOSE</div>
          {equipos.map((it) => (
            <div key={it.label} style={row}>
              <div style={{ fontSize: "1.1vw", color: "rgba(242,231,228,0.65)" }}>{it.label}</div>
              <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "#F4DAD5" }}>{it.monto}</div>
            </div>
          ))}
          <div style={{ height: "1px", backgroundColor: "rgba(247,203,107,0.2)", marginTop: "0.5vh" }} />
          <div style={{ ...row, marginTop: "0.2vh" }}>
            <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>Total</div>
            <div style={{ fontSize: "1.3vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>$4.700.000</div>
          </div>
          <div style={{ fontSize: "0.9vw", color: "rgba(242,231,228,0.35)", marginTop: "0.2vh" }}>
            Inversión única · hardware para producción de audio
          </div>
        </div>
      </div>

      {/* Contact footer */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(247,203,107,0.12)", paddingTop: "1.5vh", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "1.15vw", color: "rgba(242,231,228,0.40)" }}>
          [nombre] · [correo] · [teléfono]
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.3vw", fontWeight: 700, letterSpacing: "-0.04em", background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</div>
          <div style={{ fontSize: "1.0vw", color: "rgba(242,231,228,0.40)", letterSpacing: "0.08em" }}>CASA DEL CUENCO</div>
        </div>
      </div>
    </div>
  );
}
