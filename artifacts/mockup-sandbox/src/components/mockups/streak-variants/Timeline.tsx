import './_group.css';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ACTIVE = [true, true, true, false, false, false, false];
const TODAY = 3;
const COUNT = 3;

export function Timeline() {
  return (
    <div style={{
      background: '#1B060F',
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Número + barra lineal */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: '#D4AF37', fontSize: 52, fontWeight: 700, lineHeight: 1 }}>{COUNT}</span>
            <div>
              <div style={{ color: '#F4DAD5', fontSize: 14, fontWeight: 600, lineHeight: 1 }}>días</div>
              <div style={{ color: 'rgba(242,231,228,0.38)', fontSize: 10, letterSpacing: 0.8 }}>esta semana</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
            <span style={{ color: 'rgba(242,231,228,0.35)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}>Progreso</span>
            <div style={{ width: 110, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{
                width: `${(COUNT / 7) * 100}%`, height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #D4AF37, #BE8744)',
              }} />
            </div>
            <span style={{ color: 'rgba(212,175,55,0.65)', fontSize: 9 }}>{COUNT} / 7</span>
          </div>
        </div>

        {/* Timeline de días */}
        <div style={{ position: 'relative', padding: '4px 4px' }}>
          <div style={{
            position: 'absolute', top: '28px', left: '22px', right: '22px',
            height: '1px', background: 'rgba(255,255,255,0.06)',
          }} />
          <div style={{
            position: 'absolute', top: '28px', left: '22px',
            width: `calc((${COUNT - 1} / 6) * (100% - 44px))`,
            height: '1px',
            background: 'linear-gradient(90deg, rgba(212,175,55,0.65), rgba(190,135,68,0.2))',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {DAYS.map((d, i) => {
              const active = ACTIVE[i];
              const isToday = i === TODAY;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: active ? 32 : 22,
                    height: active ? 32 : 22,
                    borderRadius: '50%',
                    background: active
                      ? 'linear-gradient(135deg, #D4AF37, #BE8744)'
                      : isToday ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)',
                    border: active ? 'none' : isToday ? '1.5px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: active ? '0 0 12px rgba(212,175,55,0.28)' : 'none',
                    marginTop: active ? 0 : 5,
                  }}>
                    {active && (
                      <svg width={13} height={13} viewBox="0 0 13 13" fill="none">
                        <path d="M2 6.5L5.5 10L11 3.5" stroke="#1B060F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {isToday && !active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', opacity: 0.6 }} />}
                  </div>
                  <span style={{
                    color: active ? '#D4AF37' : isToday ? '#F4DAD5' : 'rgba(242,231,228,0.25)',
                    fontSize: 9, fontWeight: active ? 700 : 500,
                  }}>{d}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Frase con acento izquierdo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(212,175,55,0.06)',
          borderRadius: 12, padding: '12px 14px',
          border: '0.5px solid rgba(212,175,55,0.14)',
        }}>
          <div style={{ width: 2, height: 30, borderRadius: 1, background: 'linear-gradient(180deg, #D4AF37, rgba(212,175,55,0.15))', flexShrink: 0 }} />
          <div>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: 600, margin: 0 }}>
              Tres días de presencia.
            </p>
            <p style={{ color: 'rgba(242,231,228,0.48)', fontSize: 11, margin: '3px 0 0', lineHeight: 1.5 }}>
              Ya estás en ritmo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
