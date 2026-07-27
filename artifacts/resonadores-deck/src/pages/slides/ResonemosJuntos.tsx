export default function ResonemosJuntos() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg" style={{ background: 'linear-gradient(160deg, #2D1C52 0%, #261F57 20%, #1F255A 40%, #1F2A62 60%, #283673 80%, #2D4082 100%)' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(190,150,80,0.16) 0%, rgba(38,28,85,0) 60%)' }}
      />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-[12vw]">
        <img
          src={`${import.meta.env.BASE_URL}isotipo.png`}
          alt="Isotipo RESONANCIA"
          style={{ width: '9vw', display: 'block' }}
        />
        <h2 className="font-display text-text mt-[3vh]" style={{ fontSize: '6.5vw', fontWeight: 500, lineHeight: 1.05 }}>
          Resonemos juntos
        </h2>
        <p className="font-body text-text/85 mt-[4vh] max-w-[52vw]" style={{ fontSize: '2vw', lineHeight: 1.5, textWrap: 'balance' }}>
          Conversemos sobre tu música y tu lugar en RESONANCIA
        </p>
        <div className="mt-[5vh] flex items-center justify-center gap-[3.5vw]">
          <div className="flex items-center gap-[0.8vw]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.5vw', height: '1.5vw' }}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 6l-10 7L2 6" />
            </svg>
            <span className="font-body text-text/85" style={{ fontSize: '1.4vw', letterSpacing: '0.04em' }}>contacto@appresonancia.cl</span>
          </div>
          <div className="flex items-center gap-[0.8vw]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.5vw', height: '1.5vw' }}>
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.8" fill="#F7CB6B" stroke="none" />
            </svg>
            <span className="font-body text-text/85" style={{ fontSize: '1.4vw', letterSpacing: '0.04em' }}>@Appresonancia</span>
          </div>
          <div className="flex items-center gap-[0.8vw]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#F7CB6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.5vw', height: '1.5vw' }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="font-body text-text/85" style={{ fontSize: '1.4vw', letterSpacing: '0.04em' }}>+56 9 9799 6771</span>
          </div>
        </div>
        <div className="mt-[6vh] h-[1px] w-[12vw]" style={{ background: 'linear-gradient(90deg, transparent, #be9650, transparent)' }} />
      </div>
    </div>
  );
}
