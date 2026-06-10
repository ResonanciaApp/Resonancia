export function OptionA() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e]">
      <p className="text-white/50 text-xs mb-3 tracking-widest uppercase">Opción A — Suave</p>
      <div
        className="relative rounded-2xl overflow-hidden shadow-xl"
        style={{ width: 340, height: 460 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, #E3E7F2, #D5DAE8, #C6CCDA)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <GeometrySVG color="#5BA4A4" />
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
          <Thumb color="#5BA4A4" />
          <Thumb color="#8A6BAD" />
        </div>
      </div>
      <p className="text-white/30 text-xs mt-3 font-mono">#E3E7F2 → #C6CCDA</p>
    </div>
  );
}

function GeometrySVG({ color }: { color: string }) {
  return (
    <svg width={200} height={200} viewBox="0 0 200 200" fill="none">
      <circle cx={100} cy={100} r={90} stroke={color} strokeWidth={1.2} opacity={0.7} />
      <circle cx={100} cy={100} r={60} stroke={color} strokeWidth={1.2} opacity={0.7} />
      <circle cx={100} cy={70} r={30} stroke={color} strokeWidth={1} opacity={0.6} />
      <circle cx={126} cy={85} r={30} stroke={color} strokeWidth={1} opacity={0.6} />
      <circle cx={126} cy={115} r={30} stroke={color} strokeWidth={1} opacity={0.6} />
      <circle cx={100} cy={130} r={30} stroke={color} strokeWidth={1} opacity={0.6} />
      <circle cx={74} cy={115} r={30} stroke={color} strokeWidth={1} opacity={0.6} />
      <circle cx={74} cy={85} r={30} stroke={color} strokeWidth={1} opacity={0.6} />
    </svg>
  );
}

function Thumb({ color }: { color: string }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center"
      style={{ width: 52, height: 52, backgroundColor: "rgba(11,15,20,0.5)" }}
    >
      <svg width={32} height={32} viewBox="0 0 200 200" fill="none">
        <circle cx={100} cy={100} r={60} stroke={color} strokeWidth={2} opacity={0.8} />
        <circle cx={100} cy={70} r={30} stroke={color} strokeWidth={1.5} opacity={0.7} />
        <circle cx={126} cy={115} r={30} stroke={color} strokeWidth={1.5} opacity={0.7} />
        <circle cx={74} cy={115} r={30} stroke={color} strokeWidth={1.5} opacity={0.7} />
      </svg>
    </div>
  );
}
