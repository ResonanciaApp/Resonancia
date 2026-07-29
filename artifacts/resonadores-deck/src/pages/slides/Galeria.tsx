export function GaleriaRows({ rows }: { rows: number[][] }) {
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
          gap: "2.4vh",
          padding: "0 3vw",
        }}
      >
        {rows.map((nums, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "center", gap: "1vw" }}>
            {nums.map((n) => (
              <img
                key={n}
                src={`${import.meta.env.BASE_URL}fotos/${n}.jpg`}
                alt=""
                style={{
                  width: "10.8vw",
                  aspectRatio: "736 / 1600",
                  objectFit: "cover",
                  borderRadius: "0.6vw",
                  border: "1px solid rgba(190,150,80,0.35)",
                  display: "block",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Galeria() {
  return <GaleriaRows rows={[[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11]]} />;
}
