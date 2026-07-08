import './_group.css';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ACTIVE = [true, true, true, false, false, false, false];
const TODAY = 3;
const COUNT = 3;

export function BadgeCentrado() {
  const r = 44;
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
      <div style={{
        width: '100%',
        maxWidth: 360,
        background: 'linear-gradient(160deg, rgba(74,12,12,0.30) 0%, rgba(27,6,15,0.0) 100%)',
        border: '0.5px solid rgba(212,175,55,0.15)',
        borderRadius: 20,
        padding: '28px 24px 22px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}>
        <div style={{ position: 'relative', width: 110, height: 110 }}>
          <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E9C46A" />
                <stop offset="100%" stopColor="#BE8744" />
              </linearGradient>
            </defs>
            <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
            <circle cx={55} cy={55} r={r} fill="none"
              stroke="url(#goldGrad)" strokeWidth={7}
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{COUNT}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: 1, marginTop: 2 }}>DÍAS</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignSelf: 'stretch', justifyContent: 'space-between' }}>
          {DAYS.map((d, i) => {
            const active = ACTIVE[i];
            const isToday = i === TODAY;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: active ? 'rgba(212,175,55,0.18)' : isToday ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                  border: active ? '1.5px solid rgba(212,175,55,0.55)' : isToday ? '1.5px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <span style={{ color: '#D4AF37', fontSize: 14 }}>✓</span>}
                  {isToday && !active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'block' }} />}
                </div>
                <span style={{ color: isToday ? '#F4DAD5' : 'rgba(242,231,228,0.38)', fontSize: 9, fontWeight: 600 }}>{d}</span>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', borderTop: '0.5px solid rgba(255,255,255,0.07)', paddingTop: 14, width: '100%' }}>
          <p style={{ color: '#D4AF37', fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: 0.3 }}>
            Tres días de presencia.
          </p>
          <p style={{ color: 'rgba(242,231,228,0.55)', fontSize: 11, margin: '4px 0 0', lineHeight: 1.5 }}>
            Ya estás en ritmo.
          </p>
        </div>
      </div>
    </div>
  );
}
