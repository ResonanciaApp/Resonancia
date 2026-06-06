import { T, BowlIcon, BackBtn, SearchBar, CatList, Frame } from "./_shared";

export function V1Lateral() {
  return (
    <Frame>
      <BackBtn />
      <div style={{ padding: "0 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BowlIcon size={32} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: T.fg, fontSize: 26, fontWeight: 700, letterSpacing: 0.2, marginBottom: 4 }}>
            Ancestrales
          </div>
          <div style={{ color: T.sub, fontSize: 13, lineHeight: "19px" }}>
            Cuencos, gongs y frecuencias sagradas
          </div>
        </div>
      </div>
      <SearchBar />
      <CatList />
    </Frame>
  );
}
