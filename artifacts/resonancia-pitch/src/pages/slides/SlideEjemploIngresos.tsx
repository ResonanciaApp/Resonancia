import { M3_EXAMPLE, formatMillions } from "../../data/financialModel";

export default function SlideEjemploIngresos() {
  const m3 = M3_EXAMPLE;
  
  const fNum = (val: number) => Math.round(val).toLocaleString("es-CL");
  const fMil = (val: number, digits = 2, signed = false) => formatMillions(val, digits, signed);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "4.5vh 6vw 3.5vh", boxSizing: "border-box", gap: "1.4vh" }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.6vh" }}>
          MODELO DE NEGOCIO
        </div>
        <div style={{ fontSize: "3.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Cómo se construye el <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ingreso.</span>
        </div>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.45)", marginTop: "0.6vh" }}>
           Ejemplo práctico Mes 3: altas nuevas, retención P&L y recaudación en caja real.
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1.05fr", gap: "2vw", marginTop: "1vh" }}>
        
        {/* Col 1: M3 Cohort */}
        <div style={{ backgroundColor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.6vw", padding: "1.5vw", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#D6A45C", marginBottom: "1vh", letterSpacing: "0.05em" }}>NUEVAS ALTAS M3</div>
          <div style={{ fontSize: "2.8vw", fontWeight: 700, lineHeight: 1 }}>{fNum(m3.grossAdditions)} <span style={{fontSize:"1.1vw", fontWeight:400, color:"rgba(255,255,255,0.5)"}}>usuarios</span></div>
          <div style={{ fontSize: "0.85vw", color: "rgba(255,255,255,0.45)", marginBottom: "3vh", marginTop: "0.5vh", lineHeight: 1.4 }}>
            Distribución según mix M3 (65% Premium, 35% Plus) y cadencia (65% Mensual, 35% Anual).
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8vh", flex: 1, justifyContent: "center" }}>
            <CohortRow label="Premium Mensual" users={m3.m3NewUsers.premiumMonthly.users} rev={m3.m3NewUsers.premiumMonthly.revM} />
            <CohortRow label="Premium Anual" users={m3.m3NewUsers.premiumAnnual.users} rev={m3.m3NewUsers.premiumAnnual.revM} />
            <CohortRow label="Plus Mensual" users={m3.m3NewUsers.plusMonthly.users} rev={m3.m3NewUsers.plusMonthly.revM} />
            <CohortRow label="Plus Anual" users={m3.m3NewUsers.plusAnnual.users} rev={m3.m3NewUsers.plusAnnual.revM} />
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5vh", marginTop: "1vh", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "0.95vw", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Total Cohorte M3</span>
            <span style={{ fontSize: "1.3vw", fontWeight: 700 }}>{fMil(m3.cohortContributionsM.m3Total)}</span>
          </div>
        </div>

        {/* Col 2: P&L */}
        <div style={{ backgroundColor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.6vw", padding: "1.5vw", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#6EC49A", marginBottom: "1vh", letterSpacing: "0.05em" }}>INGRESOS P&L M3</div>
          <div style={{ fontSize: "2.8vw", fontWeight: 700, lineHeight: 1, color: "#F4F4F4" }}>{fMil(m3.recurringRevenueM)} <span style={{fontSize:"1.1vw", fontWeight:400, color:"rgba(255,255,255,0.5)"}}>devengado</span></div>
          <div style={{ fontSize: "0.85vw", color: "rgba(255,255,255,0.45)", marginBottom: "3vh", marginTop: "0.5vh", lineHeight: 1.4 }}>
            {fNum(m3.activeSubscribers)} suscriptores activos. Ingresos de nuevas altas sumados a la retención previa.
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8vh", flex: 1, justifyContent: "center" }}>
            <StackRow label="Nuevas Altas M3" rev={m3.cohortContributionsM.m3Total} total={m3.recurringRevenueM} color="#6EC49A" />
            <StackRow label="Retención Cohorte M2" rev={m3.cohortContributionsM.m2} total={m3.recurringRevenueM} color="rgba(255,255,255,0.8)" />
            <StackRow label="Retención Cohorte M1" rev={m3.cohortContributionsM.m1} total={m3.recurringRevenueM} color="rgba(255,255,255,0.5)" />
          </div>
        </div>

        {/* Col 3: Cash & Net */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5vw" }}>
          <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.6vw", padding: "1.5vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh", letterSpacing: "0.05em" }}>P&L NETO M3</div>
            <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#6EC49A" }}>{fMil(m3.netResultM, 2, true)}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5vh" }}>
              <span style={{ fontSize: "1vw", color: "rgba(255,255,255,0.6)" }}>Ingresos</span>
              <span style={{ fontSize: "1vw", fontWeight: 700 }}>{fMil(m3.recurringRevenueM)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.8vh" }}>
              <span style={{ fontSize: "1vw", color: "rgba(255,255,255,0.6)" }}>Costos</span>
              <span style={{ fontSize: "1vw", fontWeight: 700 }}>{fMil(-m3.totalOperatingCostM)}</span>
            </div>
          </div>

          <div style={{ flex: 1, backgroundColor: "rgba(214,164,92,0.08)", border: "1px solid rgba(214,164,92,0.3)", borderRadius: "0.6vw", padding: "1.5vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#D6A45C", marginBottom: "1vh", letterSpacing: "0.05em" }}>CAJA REAL M3</div>
            <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#D6A45C" }}>{fMil(m3.subscriptionCashM)}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5vh" }}>
              <span style={{ fontSize: "1vw", color: "rgba(255,255,255,0.6)" }}>Renovaciones mes</span>
              <span style={{ fontSize: "1vw", fontWeight: 700 }}>{fMil(m3.monthlyCashM)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.8vh" }}>
              <span style={{ fontSize: "1vw", color: "rgba(255,255,255,0.6)" }}>Anualidades upfront</span>
              <span style={{ fontSize: "1vw", fontWeight: 700 }}>{fMil(m3.annualPrepaidCashM)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, fontSize: "1.0vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.45, marginTop: "1vh" }}>
         Ingreso Neto = Precio Bruto ÷ 1,19 (IVA) × 70% (Tienda). Las anualidades se devengan en 12 meses en el P&L, pero se recaudan íntegras en el mes 1 en la Caja. Cada cohorte mantiene su plan y precio de adquisición.
      </div>
    </div>
  );

  function CohortRow({ label, users, rev }: { label: string, users: number, rev: number }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", padding: "1vh 1vw", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "0.4vw" }}>
        <div style={{ fontSize: "0.95vw", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.5)", width: "4vw", textAlign: "right" }}>{fNum(users)}</div>
        <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#D6A45C", width: "5vw", textAlign: "right" }}>{fMil(rev)}</div>
      </div>
    );
  }

  function StackRow({ label, rev, total, color }: { label: string, rev: number, total: number, color: string }) {
    const pct = Math.round((rev / total) * 100);
    return (
      <div style={{ padding: "1.2vh 1vw", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "0.4vw", borderLeft: `3px solid ${color}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5vh" }}>
          <div style={{ fontSize: "1vw", fontWeight: 600, color }}>{label}</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4F4F4" }}>{fMil(rev)}</div>
        </div>
        <div style={{ width: "100%", height: "0.4vh", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "1vh", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", backgroundColor: color }} />
        </div>
        <div style={{ fontSize: "0.8vw", color: "rgba(255,255,255,0.4)", marginTop: "0.5vh", textAlign: "right" }}>
          {pct}% del ingreso
        </div>
      </div>
    );
  }
}
