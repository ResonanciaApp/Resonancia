export default function Dec04EAS() {
  const done = [
    { label: "eas.json", detail: "3 perfiles: development / preview / production" },
    { label: "app.json", detail: "bundleId: com.resonancia.app · projectId: 181736c1" },
    { label: "owner / slug", detail: "casadelcuenco / resonancia" },
    { label: "Push Notifications", detail: "usePushNotifications — registro y desregistro automático" },
  ];
  const pending = [
    { label: "Apple IDs", detail: "appleId + ascAppId + appleTeamId en eas.json", cost: "" },
    { label: "Google key", detail: "google-play-service-account.json desde Google Play Console", cost: "" },
    { label: "Apple Developer Program", detail: "Membresía anual requerida para publicar en App Store", cost: "USD 99/año" },
    { label: "Google Play Console", detail: "Pago único para publicar en Play Store", cost: "USD 25" },
    { label: "Primer build", detail: "eas build --platform all --profile development", cost: "" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0E0508", color: "#F4DAD5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)", backgroundSize: "8vw 8vw", zIndex: 0 }} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3.5vh 5vw", borderBottom: "1px solid rgba(212,175,55,0.15)", zIndex: 2 }}>
        <span style={{ fontSize: "0.85vw", fontWeight: 700, letterSpacing: "0.06em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
          <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.35)", letterSpacing: "0.1em" }}>DECISIÓN</span>
          <span style={{ fontSize: "1.4vw", fontWeight: 700, color: "#D4AF37" }}>02</span>
        </div>
      </div>

      <div style={{ position: "absolute", top: "13vh", left: "5vw", right: "5vw", bottom: "10vh", zIndex: 2 }}>
        <h2 style={{ fontSize: "3vw", fontWeight: 700, margin: "0 0 0.5vh 0", letterSpacing: "-0.02em" }}>EAS Build</h2>
        <p style={{ fontSize: "1.1vw", color: "rgba(242,231,228,0.45)", margin: "0 0 3vh 0" }}>Expo Application Services — compilación nativa para App Store y Google Play.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3vw" }}>
          {/* Done */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "1.5vh" }}>
              <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#D4AF37" }} />
              <span style={{ fontSize: "0.8vw", fontWeight: 600, color: "#D4AF37", letterSpacing: "0.12em", textTransform: "uppercase" }}>Listo en código</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9vh" }}>
              {done.map((item, i) => (
                <div key={i} style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.13)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "0.4vh" }}>
                    <span style={{ color: "#D4AF37", fontSize: "0.9vw" }}>✅</span>
                    <span style={{ fontSize: "0.95vw", fontWeight: 600, color: "#F4DAD5" }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: "0.82vw", color: "rgba(242,231,228,0.45)", paddingLeft: "1.7vw" }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "1.5vh" }}>
              <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "rgba(242,231,228,0.25)" }} />
              <span style={{ fontSize: "0.8vw", fontWeight: 600, color: "rgba(242,231,228,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Pasos externos pendientes</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9vh" }}>
              {pending.map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "0.4vh" }}>
                      <span style={{ color: "rgba(242,231,228,0.25)", fontSize: "0.9vw" }}>⬜</span>
                      <span style={{ fontSize: "0.95vw", fontWeight: 600, color: "rgba(242,231,228,0.5)" }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: "0.82vw", color: "rgba(242,231,228,0.3)", paddingLeft: "1.7vw" }}>{item.detail}</div>
                  </div>
                  {item.cost && (
                    <span style={{ fontSize: "0.82vw", fontWeight: 700, color: "#D4AF37", background: "rgba(212,175,55,0.1)", borderRadius: "0.4vw", padding: "0.3vh 0.7vw", whiteSpace: "nowrap", marginLeft: "1vw", flexShrink: 0 }}>{item.cost}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2vh 5vw", borderTop: "1px solid rgba(212,175,55,0.08)", display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>Casa del Cuenco · Uso interno</span>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>3 / 6</span>
      </div>
    </div>
  );
}
