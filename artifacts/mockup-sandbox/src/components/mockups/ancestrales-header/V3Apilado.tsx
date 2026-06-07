import { T, BowlIcon, Hero, BackBtnHero, SearchBar, Tabs, SessionList, Frame } from "./_shared";

/** Ícono integrado en la esquina superior del hero; título apilado debajo. */
export function V3Apilado() {
  return (
    <Frame>
      <Hero>
        <BackBtnHero />
        {/* ícono apoyado en la esquina del hero, mezclado con la bruma */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            zIndex: 3,
            opacity: 1,
            filter: "drop-shadow(0 0 14px rgba(190,150,80,0.45))",
          }}
        >
          <BowlIcon size={52} color={T.accent} stroke={1.5} />
        </div>
        {/* título sobre la parte baja del hero */}
        <div style={{ position: "absolute", left: 20, bottom: 16, zIndex: 3 }}>
          <div style={{ color: T.fg, fontSize: 30, fontWeight: 700, letterSpacing: 0.2, lineHeight: "32px" }}>
            Ancestrales
          </div>
          <div style={{ color: T.sub, fontSize: 13, lineHeight: "19px", opacity: 0.85, marginTop: 4 }}>
            Cuencos, gongs y frecuencias sagradas
          </div>
        </div>
      </Hero>
      <div style={{ marginTop: 4 }} />
      <SearchBar />
      <Tabs />
      <SessionList />
    </Frame>
  );
}
