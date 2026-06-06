import { T, BowlIcon, BackBtn, SearchBar, CatList, Frame } from "./_shared";

export function V4Protagonista() {
  return (
    <Frame>
      <BackBtn />
      <div style={{ padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ color: T.fg, fontSize: 32, fontWeight: 700, letterSpacing: 0.2, lineHeight: "34px" }}>
            Ancestrales
          </div>
          <BowlIcon size={30} color={T.gold} />
        </div>
        <div style={{ color: T.sub, fontSize: 13, lineHeight: "19px", marginTop: 6 }}>
          Cuencos, gongs y frecuencias sagradas
        </div>
      </div>
      <SearchBar subtle />
      <CatList />
    </Frame>
  );
}
