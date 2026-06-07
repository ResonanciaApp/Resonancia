import { T, BowlIcon, Hero, BackBtnHero, SearchBar, Tabs, SessionList, Frame } from "./_shared";

/** Medallón lateral apoyado sobre el fade del hero. */
export function V1Lateral() {
  return (
    <Frame>
      <Hero>
        <BackBtnHero />
      </Hero>
      <div style={{ padding: "0 20px", marginTop: -34, display: "flex", alignItems: "flex-end", gap: 14, position: "relative", zIndex: 2 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            background: "rgba(11,15,20,0.72)",
            border: "1px solid rgba(190,150,80,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
            flexShrink: 0,
          }}
        >
          <BowlIcon size={34} color={T.accent} />
        </div>
        <div style={{ flex: 1, paddingBottom: 4 }}>
          <div style={{ color: T.fg, fontSize: 26, fontWeight: 700, letterSpacing: 0.2, marginBottom: 3 }}>
            Ancestrales
          </div>
          <div style={{ color: T.sub, fontSize: 13, lineHeight: "19px", opacity: 0.85 }}>
            Cuencos, gongs y frecuencias sagradas
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }} />
      <SearchBar />
      <Tabs />
      <SessionList />
    </Frame>
  );
}
