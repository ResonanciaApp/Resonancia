export default function ResonanciaPalette() {
  const groups = [
    {
      label: "Fondos",
      colors: [
        { name: "warmBlack", token: "bg principal", hex: "#1B060F", light: false },
        { name: "secondary / deepBrown", token: "bg secundario / cards base", hex: "#27070E", light: false },
        { name: "bgMid", token: "módulos / headers", hex: "#4A0C0C", light: false },
        { name: "border", token: "bordes", hex: "#3D0E16", light: false },
      ],
    },
    {
      label: "Dorados",
      colors: [
        { name: "primary / premiumGold", token: "acción principal / CTA", hex: "#D4AF37", light: true },
        { name: "accent / copperLight", token: "acento secundario / gradiente", hex: "#E9C46A", light: true },
        { name: "card / darkChocolate", token: "fondo cards (8% opacidad)", hex: "rgba(74,12,12,0.08)", light: false, preview: "#2a0d12" },
      ],
    },
    {
      label: "Texto",
      colors: [
        { name: "fg / warmIvory", token: "texto principal", hex: "#F4DAD5", light: true },
        { name: "mutedForeground", token: "texto secundario / subtítulos", hex: "rgba(242,231,228,0.45)", light: false, preview: "#6b5050" },
        { name: "primaryForeground", token: "texto sobre dorado", hex: "#1B060F", light: false },
      ],
    },
    {
      label: "Sistema",
      colors: [
        { name: "destructive", token: "error / eliminar", hex: "#E63946", light: true },
        { name: "input", token: "campos de entrada", hex: "#27070E", light: false },
        { name: "goldGradient start→end", token: "degradado botones CTA", hex: "#D4AF37 → #E9C46A", light: true, isGradient: true },
      ],
    },
  ];

  return (
    <div
      style={{
        background: "#1B060F",
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "32px 36px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#D4AF37", fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "0.04em" }}>
          RESONANCIA
        </h1>
        <p style={{ color: "rgba(242,231,228,0.45)", fontSize: 12, margin: "4px 0 0", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Paleta de color · Casa del Cuenco
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {groups.map((group) => (
          <div key={group.label}>
            <p style={{
              color: "rgba(242,231,228,0.45)",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 10,
              marginTop: 0,
              fontWeight: 600,
            }}>
              {group.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.colors.map((c) => (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "rgba(74,12,12,0.18)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    border: "1px solid #3D0E16",
                  }}
                >
                  {/* Swatch */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        background: (c as any).isGradient
                          ? "linear-gradient(135deg, #D4AF37, #E9C46A)"
                          : (c as any).preview ?? c.hex,
                        border: "1.5px solid rgba(255,255,255,0.08)",
                        flexShrink: 0,
                      }}
                    />
                    {(c as any).isGradient && (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 8,
                        background: "linear-gradient(135deg, #D4AF37 0%, #E9C46A 100%)",
                      }} />
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{
                      color: "#F4DAD5",
                      fontSize: 12,
                      fontWeight: 600,
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {c.name}
                    </p>
                    <p style={{
                      color: "rgba(242,231,228,0.5)",
                      fontSize: 10,
                      margin: "2px 0 0",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {c.token}
                    </p>
                  </div>
                  {/* Hex */}
                  <div style={{
                    background: "#27070E",
                    borderRadius: 6,
                    padding: "3px 8px",
                    flexShrink: 0,
                  }}>
                    <span style={{
                      color: "#D4AF37",
                      fontSize: 11,
                      fontFamily: "'Menlo', 'Monaco', monospace",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}>
                      {c.hex}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Gradient strip */}
      <div style={{ marginTop: 28 }}>
        <p style={{
          color: "rgba(242,231,228,0.45)",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: 10,
          fontWeight: 600,
        }}>
          Degradado CTA — Gold Gradient
        </p>
        <div style={{
          height: 36,
          borderRadius: 10,
          background: "linear-gradient(90deg, #D4AF37 0%, #E9C46A 100%)",
          border: "1.5px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}>
          <span style={{ color: "#1B060F", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>#D4AF37</span>
          <span style={{ color: "#1B060F", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>→ Gradiente estándar CTA</span>
          <span style={{ color: "#1B060F", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>#E9C46A</span>
        </div>
      </div>
    </div>
  );
}
