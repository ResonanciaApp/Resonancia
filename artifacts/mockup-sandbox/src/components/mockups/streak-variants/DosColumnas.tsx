import './_group.css';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ACTIVE = [true, true, true, false, false, false, false];
const TODAY = 3;
const COUNT = 3;

export function DosColumnas() {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - COUNT / 7);

  return (
    <div style={{
      background: '#1B060F',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          {/* Anillo */}
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(74,12,12,0.7), rgba(27,6,15,0.9))',
            border: '0.5px solid rgba(212,175,55,0.2)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            flexShrink: 0,
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={96} height={96} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
              <circle cx={48} cy={48} r={r} fill="none"
                stroke="#D4AF37" strokeWidth={6}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{COUNT}</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, letterSpacing: 1 }}>DÍAS</span>
            </div>
          </div>

          {/* Card frase */}
          <div style={{
            flex: 1, height: 96, borderRadius: 14,
            background: 'rgba(0,0,0,0.4)',
            border: '0.2px solid rgba(255,255,255,0.2)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '0 16px', gap: 5,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 700, letterSpacing: 0.2 }}>
              Tres días de presencia.
            </span>
            <span style={{ color: 'rgba(242,231,228,0.55)', fontSize: 11, lineHeight: 1.5 }}>
              Ya estás en ritmo.
            </span>
          </div>
        </div>

        {/* Días */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          background: 'rgba(74,12,12,0.06)',
          borderRadius: 14, padding: '12px 10px',
          border: '0.5px solid rgba(255,255,255,0.04)',
        }}>
          {DAYS.map((d, i) => {
            const active = ACTIVE[i];
            const isToday = i === TODAY;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: active ? 'rgba(212,175,55,0.15)' : isToday ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.04)',
                  border: active ? '1.5px solid rgba(212,175,55,0.5)' : isToday ? '1.5px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <span style={{ color: '#D4AF37', fontSize: 14 }}>✓</span>}
                </div>
                <span style={{ color: isToday ? '#F4DAD5' : 'rgba(242,231,228,0.35)', fontSize: 9, fontWeight: 600 }}>{d}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
