const BG = '#1B060F';
const DAYS = ['L','M','M','J','V','S','D'];
const ACTIVE = [true,true,true,false,false,false,false];
const TODAY = 3;
const COUNT = 3;

function StreakCard({ mask }: { mask: string }) {
  const r = 28, circ = 2*Math.PI*r, offset = circ*(1-COUNT/7);
  return (
    <div style={{
      width:'100%', maxWidth:360,
      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      background:'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 100%)',
      border:'0.5px solid rgba(255,255,255,0.12)',
      borderRadius:16, padding:'18px 14px 16px',
      display:'flex', flexDirection:'column', gap:13,
      maskImage: mask,
      WebkitMaskImage: mask,
    }}>
      <div style={{ position:'relative', height:114 }}>
        <div style={{ position:'absolute', left:0, top:0, width:114, height:114, borderRadius:57, zIndex:2 }}>
          <svg width={114} height={114} style={{ position:'absolute', inset:0 }}>
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#E9C46A"/>
                <stop offset="1" stopColor="#BE8744"/>
              </linearGradient>
            </defs>
            <circle cx={57} cy={57} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5}
              transform="rotate(-90 57 57)" strokeDasharray={circ}/>
            <circle cx={57} cy={57} r={r} fill="none" stroke="url(#rg)" strokeWidth={5}
              transform="rotate(-90 57 57)" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingBottom:10 }}>
            <svg width={52} height={50}>
              <defs><linearGradient id="gn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9C46A"/><stop offset="1" stopColor="#BE8744"/></linearGradient></defs>
              <text x="26" y="44" fill="url(#gn)" fontSize={44} fontWeight="700" textAnchor="middle">{COUNT}</text>
            </svg>
            <span style={{ color:'rgba(255,255,255,0.95)', fontSize:12, fontWeight:300 }}>Días</span>
          </div>
        </div>
        <div style={{
          position:'absolute', left:0, right:0, top:0, bottom:0,
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          background:'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)',
          border:'0.5px solid rgba(255,255,255,0.10)',
          borderRadius:16, paddingLeft:141, paddingRight:14,
          display:'flex', flexDirection:'column', justifyContent:'center', gap:4,
        }}>
          <div style={{ width:1, position:'absolute', left:114, top:16, bottom:16, background:'rgba(255,255,255,0.1)' }}/>
          <span style={{ color:'rgba(255,255,255,0.90)', fontSize:12, fontWeight:700 }}>¡Dos días seguidos!</span>
          <span style={{ color:'#e8e8e8', fontSize:12, lineHeight:1.5 }}>Estás construyendo un hábito.</span>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        {DAYS.map((d,i) => {
          const active=ACTIVE[i], isToday=i===TODAY;
          return (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
              <div style={{
                width:39, height:39, borderRadius:'50%',
                backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                background:'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 100%)',
                border:(active||isToday) ? '1px solid rgba(200,180,120,0.5)' : '0.5px solid rgba(255,255,255,0.12)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {active && <svg width={16} height={16} viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="rgba(255,255,255,0.9)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {isToday && !active && <div style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.4)' }}/>}
              </div>
              <span style={{ color: isToday ? '#F4DAD5' : 'rgba(194,194,194,1)', fontSize:10, fontWeight:600 }}>{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FadeB() {
  return (
    <div style={{ background:BG, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 20px', gap:12 }}>
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:10, letterSpacing:2, textTransform:'uppercase', margin:0 }}>B — 10px · lineal</p>
      <StreakCard mask="linear-gradient(to bottom, transparent 0px, black 10px)" />
    </div>
  );
}
