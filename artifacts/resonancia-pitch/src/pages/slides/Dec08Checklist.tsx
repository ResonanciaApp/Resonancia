export default function Dec08Checklist() {
  const items = [
    { done: false, text: "Decidir lanzar free vs premium", rec: "recomendado: free primero" },
    { done: false, text: "Subir código a GitHub", rec: "repo privado" },
    { done: false, text: "Crear cuenta Apple Developer", rec: "USD 99/año" },
    { done: false, text: "Crear cuenta Google Play Console", rec: "USD 25 único" },
    { done: false, text: "Completar datos en eas.json submit.production", rec: "appleId, ascAppId, appleTeamId" },
    { done: false, text: "Convertir audios WAV a AAC con ffmpeg", rec: "-c:a aac -b:a 256k" },
    { done: false, text: "eas build --platform all --profile development", rec: "primer build nativo" },
    { done: false, text: "Testear en device físico (iOS + Android)", rec: "antes de publicar" },
    { done: false, text: "Preparar pantalla /membresía en modo 'Próximamente'", rec: "si lanzás free" },
    { done: false, text: "Enviar a review en App Store y Google Play", rec: "última etapa" },
  ];

  const half = Math.ceil(items.length / 2);
  const col1 = items.slice(0, half);
  const col2 = items.slice(half);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0E0508", color: "#F4DAD5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)", backgroundSize: "8vw 8vw", zIndex: 0 }} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3.5vh 5vw", borderBottom: "1px solid rgba(212,175,55,0.15)", zIndex: 2 }}>
        <span style={{ fontSize: "0.85vw", fontWeight: 700, letterSpacing: "0.06em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</span>
        <div style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.35)", letterSpacing: "0.1em" }}>CHECKLIST DE LANZAMIENTO</div>
      </div>

      <div style={{ position: "absolute", top: "13vh", left: "5vw", right: "5vw", bottom: "10vh", zIndex: 2 }}>
        <h2 style={{ fontSize: "2.8vw", fontWeight: 700, margin: "0 0 0.5vh 0", letterSpacing: "-0.02em" }}>Antes del primer build</h2>
        <p style={{ fontSize: "1vw", color: "rgba(242,231,228,0.4)", margin: "0 0 2.5vh 0" }}>10 pasos en orden — del código a las tiendas.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1vw 3vw" }}>
          {[col1, col2].map((col, colIdx) => (
            <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: "0.85vh" }}>
              {col.map((item, i) => {
                const globalIdx = colIdx * half + i + 1;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.55vw", padding: "1.2vh 1.4vw" }}>
                    <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "50%", background: "rgba(212,175,55,0.08)", border: "1.5px solid rgba(212,175,55,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vh" }}>
                      <span style={{ fontSize: "0.78vw", fontWeight: 700, color: "rgba(212,175,55,0.7)" }}>{globalIdx.toString().padStart(2, "0")}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.9vw", fontWeight: 500, color: "rgba(242,231,228,0.8)", lineHeight: 1.3, marginBottom: "0.25vh" }}>{item.text}</div>
                      <div style={{ fontSize: "0.75vw", color: "rgba(212,175,55,0.6)", fontWeight: 500 }}>{item.rec}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2vh 5vw", borderTop: "1px solid rgba(212,175,55,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>Casa del Cuenco · Uso interno · Confidencial</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
          <div style={{ width: "0.4vw", height: "0.4vw", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #E9C46A)" }} />
          <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>RESONANCIA 2026</span>
        </div>
      </div>
    </div>
  );
}
