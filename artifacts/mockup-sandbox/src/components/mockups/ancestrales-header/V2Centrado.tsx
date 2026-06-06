import { T, BowlIcon, BackBtn, SearchBar, CatList, Frame } from "./_shared";

export function V2Centrado() {
  return (
    <Frame>
      <BackBtn />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            background: "rgba(196,149,106,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <BowlIcon size={34} />
        </div>
        <div style={{ color: T.fg, fontSize: 26, fontWeight: 700, letterSpacing: 0.2, marginBottom: 4 }}>
          Ancestrales
        </div>
        <div style={{ color: T.sub, fontSize: 13, lineHeight: "19px" }}>
          Cuencos, gongs y frecuencias sagradas
        </div>
      </div>
      <SearchBar />
      <CatList />
    </Frame>
  );
}
