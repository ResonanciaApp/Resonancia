import { T, BowlIcon, BackBtn, SearchBar, CatList, Frame } from "./_shared";

export function V3Apilado() {
  return (
    <Frame>
      <BackBtn />
      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "rgba(196,149,106,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <BowlIcon size={38} />
        </div>
        <div style={{ color: T.fg, fontSize: 28, fontWeight: 700, letterSpacing: 0.2, marginBottom: 5 }}>
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
