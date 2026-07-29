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
            border: "1px solid rgba(190,150,80,0.35)",
            display: "block",
          }}
        />
      ))}
    </div>
  );
}

export default function Galeria() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-body"
      style={{
        background: "linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)",
        color: "#F4F4F4",
      }}
    >
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
