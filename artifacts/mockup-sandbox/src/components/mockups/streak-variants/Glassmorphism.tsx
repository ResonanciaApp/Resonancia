import './_group.css';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ACTIVE = [true, true, true, false, false, false, false];
const TODAY = 3;
const COUNT = 3;

export function Glassmorphism() {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - COUNT / 7);

  return (
    <div style={{
      background: 'linear-gradient(160deg, #1B060F 0%, #2A0A12 100%)',
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(0,0,0,0.55) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '0.5px solid rgba(212,175,55,0.2)',
        borderRadius: 22,
        padding: '22px 20px 20px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {/* Número grande + anillo mini */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: '#D4AF37', fontSize: 52, fontWeight: 700, lineHeight: 1 }}>{COUNT}</span>
              <span style={{ color: 'rgba(212,175,55,0.6)', fontSize: 16, marginBottom: 6 }}>/ 7</span>
            </div>
            <span style={{ color: 'rgba(242,231,228,0.45)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              días esta semana
            </span>
          </div>

          <div style={{ position: 'relative', width: 72, height: 72 }}>
            <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E9C46A" />
                  <stop offset="100%" stopColor="#BE8744" />
                </linearGradient>
              </defs>
              <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5.5} />
              <circle cx={36} cy={36} r={r} fill="none"
                stroke="url(#g2)" strokeWidth={5.5}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{Math.round(COUNT / 7 * 100)}%</span>
            </div>
          </div>
        </div>

        <div style={{ height: '0.5px', background: 'rgba(212,175,55,0.12)', marginBottom: 14 }} />

        {/* Días */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between', marginBottom: 14 }}>
          {DAYS.map((d, i) => {
            const active = ACTIVE[i];
            const isToday = i === TODAY;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: active
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(190,135,68,0.15))'
                    : isToday ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                  border: active ? '1px solid rgba(212,175,55,0.45)' : isToday ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 0 8px rgba(212,175,55,0.2)' : 'none',
                }}>
                  {active && (
                    <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L6 11L12 4" stroke="#D4AF37" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isToday && !active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />}
                </div>
                <span style={{ color: isToday ? '#F4DAD5' : 'rgba(242,231,228,0.32)', fontSize: 9, fontWeight: 600 }}>{d}</span>
              </div>
            );
          })}
        </div>

        {/* Frase */}
        <div style={{
          background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '10px 14px',
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: 600, margin: 0 }}>
            Tres días de presencia.
          </p>
          <p style={{ color: 'rgba(242,231,228,0.5)', fontSize: 11, margin: '3px 0 0', lineHeight: 1.5 }}>
            Ya estás en ritmo.
          </p>
        </div>
      </div>
    </div>
  );
}
