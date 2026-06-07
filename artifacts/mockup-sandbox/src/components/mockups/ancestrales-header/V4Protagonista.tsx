import { T, BowlIcon, Hero, BackBtnHero, SearchBar, Tabs, SessionList, Frame } from "./_shared";

/** Ícono como marca de agua, centrado dentro del hero. */
export function V4Protagonista() {
  return (
    <Frame>
      <Hero h={216}>
        <BackBtnHero />
        {/* marca de agua: ícono grande translúcido al centro del hero */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            opacity: 0.5,
          }}
        >
          <BowlIcon size={104} color={T.accent} stroke={1} />
        </div>
        {/* título sobre el borde inferior del hero */}
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 14, zIndex: 3, textAlign: "center" }}>
          <div style={{ color: T.fg, fontSize: 30, fontWeight: 700, letterSpacing: 1.5, lineHeight: "32px" }}>
            Ancestrales
          </div>
          <div style={{ color: T.sub, fontSize: 13, lineHeight: "19px", opacity: 0.85, marginTop: 4 }}>
            Cuencos, gongs y frecuencias sagradas
          </div>
        </div>
      </Hero>
      <div style={{ marginTop: 6 }} />
      <SearchBar subtle />
      <Tabs />
      <SessionList />
    </Frame>
  );
}
