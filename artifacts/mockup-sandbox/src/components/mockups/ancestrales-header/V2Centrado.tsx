import { T, BowlIcon, Hero, BackBtnHero, SearchBar, Tabs, SessionList, Frame } from "./_shared";

/** Medallón centrado, flotando sobre el centro del fade del hero. */
export function V2Centrado() {
  return (
    <Frame>
      <Hero>
        <BackBtnHero />
      </Hero>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: -40, position: "relative", zIndex: 2, padding: "0 20px" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            background: "rgba(11,15,20,0.72)",
            border: "1px solid rgba(190,150,80,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
            marginBottom: 12,
          }}
        >
          <BowlIcon size={38} color={T.accent} />
        </div>
        <div style={{ color: T.fg, fontSize: 26, fontWeight: 700, letterSpacing: 0.2, marginBottom: 4 }}>
          Ancestrales
        </div>
        <div style={{ color: T.sub, fontSize: 13, lineHeight: "19px", opacity: 0.85 }}>
          Cuencos, gongs y frecuencias sagradas
        </div>
      </div>
      <div style={{ marginTop: 18 }} />
      <SearchBar />
      <Tabs />
      <SessionList />
    </Frame>
  );
}
