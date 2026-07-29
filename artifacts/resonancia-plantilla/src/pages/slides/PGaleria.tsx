const ROW1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const ROW2 = [12, 13, 14, 15, 16, 17, 18, 19, 21, 23, 25];

function Row({ nums }: { nums: number[] }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "0.55vw" }}>
      {nums.map((n) => (
        <img
          key={n}
          src={`${import.meta.env.BASE_URL}fotos/${n}.jpg`}
          alt=""
          style={{
            width: "7.6vw",
            aspectRatio: "736 / 1600",
            objectFit: "cover",
            borderRadius: "0.55vw",
            border: "1px solid rgba(212,175,55,0.28)",
            display: "block",
          }}
        />
      ))}
    </div>
  );
}

export default function PGaleria() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.06) 0%, transparent 60%)" }} />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "1.6vh",
          padding: "0 3vw",
        }}
      >
        <Row nums={ROW1} />
        <Row nums={ROW2} />
      </div>
    </div>
  );
}
