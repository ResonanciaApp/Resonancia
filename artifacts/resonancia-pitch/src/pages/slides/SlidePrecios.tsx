import { ARPU_LAUNCH, ARPU_NORMAL, NET_REVENUE_FACTOR, PRICING } from "../../data/financialModel";

export default function SlidePrecios() {
  const money = (value: number) => `$${Math.round(value).toLocaleString("es-CL")}`;
  const pricingRows = [
    { plan: "Premium", cadence: "Mensual", pct: "M1 70% · M2+ 65%", launch: money(PRICING.launchPremium.monthly), launchNeto: money(PRICING.launchPremium.monthly * NET_REVENUE_FACTOR), normal: money(PRICING.premium.monthly), normalNeto: money(PRICING.premium.monthly * NET_REVENUE_FACTOR), plus: false },
    { plan: "Premium", cadence: "Anual", pct: "M1 30% · M2+ 35%", launch: money(PRICING.launchPremium.annual), launchNeto: money(PRICING.launchPremium.annual * NET_REVENUE_FACTOR), normal: money(PRICING.premium.annual), normalNeto: money(PRICING.premium.annual * NET_REVENUE_FACTOR), plus: false },
    { plan: "Premium Plus", cadence: "Mensual", pct: "M3+ 65% mensual", launch: "Desde M3", launchNeto: "—", normal: money(PRICING.premiumPlus.monthly), normalNeto: money(PRICING.premiumPlus.monthly * NET_REVENUE_FACTOR), plus: true },
    { plan: "Premium Plus", cadence: "Anual", pct: "M3+ 35% anual", launch: "Desde M3", launchNeto: "—", normal: money(PRICING.premiumPlus.annual), normalNeto: money(PRICING.premiumPlus.annual * NET_REVENUE_FACTOR), plus: true },
  ];

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
          Estrategia de <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>precios.</span>
        </div>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.45)", marginTop: "0.6vh" }}>
           M1: solo Premium (70% mensual / 30% anual) · M2: Premium normal (65% / 35%) · Premium Plus comienza en M3.
        </div>
      </div>

      {/* Mixes canónicos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.8vw", flexShrink: 0 }}>
        {[
          { label: "M1 · LANZAMIENTO", value: "100% Premium", note: "70% mensual · 30% anual", color: "#D6A45C" },
          { label: "M2 · PREMIUM NORMAL", value: "100% Premium", note: "65% mensual · 35% anual", color: "#FFFFFF" },
          { label: "M3+ · DOS NIVELES", value: "65% Premium · 35% Plus", note: "cada nivel: 65% mensual · 35% anual", color: "#6EC49A" },
        ].map((item) => (
          <div key={item.label} style={{ backgroundColor: "rgba(0,0,0,0.14)", border: `1px solid ${item.color}55`, borderRadius: "0.55vw", padding: "0.9vh 1vw" }}>
            <div style={{ fontSize: "0.75vw", fontWeight: 700, letterSpacing: "0.08em", color: item.color }}>{item.label}</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#F4F4F4", marginTop: "0.2vh" }}>{item.value}</div>
            <div style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.48)", marginTop: "0.15vh" }}>{item.note}</div>
          </div>
        ))}
      </div>

      {/* Pricing table */}
      <div style={{
        flexShrink: 0,
        backgroundColor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "0.6vw", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1.15fr 1.05fr 0.95fr 0.9fr 0.95fr 0.9fr",
          backgroundColor: "rgba(255,255,255,0.06)", padding: "0.85vh 1.3vw",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          {["Oferta", "Mix facturación", "Lanzamiento M1", "Neto empresa", "Precio normal", "Neto empresa"].map((h, i) => (
            <div key={i} style={{ fontSize: "0.82vw", fontWeight: 700, letterSpacing: "0.05em",
              color: i >= 2 && i <= 3 ? "#D6A45C" : i >= 4 ? "#6EC49A" : "#FFFFFF" }}>{h}</div>
          ))}
        </div>
        {pricingRows.map((r, i) => (
          <div key={`${r.plan}-${r.cadence}`} style={{
            display: "grid", gridTemplateColumns: "1.15fr 1.05fr 0.95fr 0.9fr 0.95fr 0.9fr",
            padding: "1.05vh 1.3vw", alignItems: "center",
            backgroundColor: r.plus ? "rgba(110,196,154,0.035)" : i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
            borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div>
              <div style={{ fontSize: "1.08vw", fontWeight: 700, color: r.plus ? "#6EC49A" : "#F4F4F4" }}>{r.plan}</div>
              <div style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.45)", marginTop: "0.1vh" }}>{r.cadence}</div>
            </div>
            <div style={{ fontSize: "0.86vw", fontWeight: 600, color: "rgba(244,244,244,0.55)" }}>{r.pct}</div>
            <div style={{ fontSize: "1.08vw", color: r.plus ? "rgba(244,244,244,0.48)" : "#F4F4F4", fontWeight: r.plus ? 600 : 400 }}>{r.launch}</div>
            <div style={{ fontSize: "0.95vw", color: r.plus ? "rgba(244,244,244,0.28)" : "#D6A45C", fontWeight: 600 }}>{r.launchNeto}</div>
            <div style={{ fontSize: "1.08vw", color: "#F4F4F4" }}>{r.normal}</div>
            <div style={{ fontSize: "0.95vw", color: "#6EC49A", fontWeight: 600 }}>{r.normalNeto}</div>
          </div>
        ))}
        {/* ARPU row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1.15fr 1.05fr 0.95fr 0.9fr 0.95fr 0.9fr",
          padding: "0.9vh 1.3vw", backgroundColor: "rgba(0,0,0,0.18)",
          borderTop: "1px solid rgba(255,255,255,0.14)", alignItems: "center",
        }}>
           <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", gridColumn: "1/3" }}>ARPU RECURRENTE NETO</div>
          <div style={{ gridColumn: "3/5", display: "flex", alignItems: "center", gap: "0.5vw" }}>
             <span style={{ fontSize: "1.15vw", fontWeight: 700, backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{money(ARPU_LAUNCH)}/mes/sub</span>
          </div>
          <div style={{ gridColumn: "5/7", display: "flex", alignItems: "center", gap: "0.5vw" }}>
             <span style={{ fontSize: "1.15vw", fontWeight: 700, color: "#6EC49A" }}>M3+: {money(ARPU_NORMAL)}/mes/sub</span>
          </div>
        </div>
      </div>

      {/* IVA note */}
      <div style={{ flexShrink: 0, fontSize: "1.0vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.45 }}>
         Neto empresa = precio bruto ÷ 1,19 (IVA) × 70% (comisión tienda 30%). Los planes anuales se cobran por adelantado; el ARPU los reconoce por equivalente mensual.
      </div>
    </div>
  );
}
