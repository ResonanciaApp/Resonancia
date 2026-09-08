import { ARPU_NORMAL, BASE_CASE, YEAR_ONE_SCENARIOS, formatMillions } from "../../data/financialModel";

function ScenarioCard({
  label,
  highlight,
  paidSignups,
  subs,
  revenue,
}: {
  label: string;
  highlight?: boolean;
  paidSignups: string;
  subs: string;
  revenue: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: highlight ? "#181C3E" : "transparent",
        border: highlight ? "1.5px solid rgba(255,255,255,0.7)" : "1.5px solid rgba(255,255,255,0.3)",
        borderRadius: "1vw",
        padding: "3.2vh 1.9vw",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: "1.7vw", fontWeight: 700, color: highlight ? "#FFFFFF" : "#F4F4F4", marginBottom: "2.4vh" }}>
        {label}
      </div>
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.50)", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>REGISTROS PAGADOS ACUM.</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#F4F4F4", lineHeight: 1 }}>{paidSignups}</div>
      </div>
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.50)", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>SUSCRIPTORES MES 12</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#F4F4F4", lineHeight: 1 }}>{subs}</div>
      </div>
      <div>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.50)", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>RESULTADO NETO AÑO 1</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>{revenue}</div>
      </div>
    </div>
  );
}

export default function SlideProyeccion() {
  const [base, optimistic, aggressive] = YEAR_ONE_SCENARIOS;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          PROYECCIÓN A 12 MESES
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Un primer año <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>realista.</span>
        </div>
      </div>

      {/* Scenario cards */}
      <div style={{ display: "flex", gap: "2vw" }}>
        <ScenarioCard
          label="Base"
          highlight
          paidSignups={base.registrations}
          subs={base.subs12}
          revenue={`${formatMillions(base.netM, 1, true)} CLP`}
        />
        <ScenarioCard
          label="Optimista"
          paidSignups={optimistic.registrations}
          subs={optimistic.subs12}
          revenue={`${formatMillions(optimistic.netM, 0, true)} CLP`}
        />
        <ScenarioCard
          label="Agresivo"
          paidSignups={aggressive.registrations}
          subs={aggressive.subs12}
          revenue={`${formatMillions(aggressive.netM, 0, true)} CLP`}
        />
      </div>

      {/* Assumptions */}
      <div>
        {/* Key figures row */}
        <div style={{ display: "flex", gap: "1.2vw", alignItems: "stretch", marginBottom: "1.4vh" }}>
          {[
             { label: "Lanzamiento M1", value: "$1.990 / $19.990", note: "Premium · 70% mensual / 30% anual" },
             { label: "Premium normal M2+", value: "$4.990 / $39.990", note: "65% mensual / 35% anual" },
             { label: "M3+ con Premium Plus", value: `~$${Math.round(ARPU_NORMAL).toLocaleString("es-CL")}/mes`, note: "65% Premium / 35% Plus · churn 15%" },
          ].map((k) => (
            <div
              key={k.label}
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.23)",
                border: "1px solid rgba(255,255,255,0.20)",
                borderRadius: "0.6vw",
                padding: "1.0vh 1.1vw",
                display: "flex",
                flexDirection: "column",
                gap: "0.3vh",
              }}
            >
              <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.40)", letterSpacing: "0.08em" }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.35)" }}>{k.note}</div>
            </div>
          ))}
        </div>
        {/* Short disclaimer */}
        <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.35)", lineHeight: 1.5 }}>
           Base: 1.000 altas brutas M1; ~{base.grossM2toM11}/mes M2–M11 y ajuste M12 para 4.400 activos. Registros acumulados ≠ activos: churn mensual 15%. Equilibrio M{BASE_CASE.firstPositiveMonth}; recuperación M{BASE_CASE.cumulativeRecoveryMonth}. Escenarios ilustrativos, no garantizados.
        </div>
      </div>

    </div>
  );
}
