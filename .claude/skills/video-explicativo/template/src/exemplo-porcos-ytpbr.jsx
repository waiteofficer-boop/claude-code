import {registerRoot, Composition, AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing, Audio, Img, staticFile, Sequence, Freeze} from 'remotion';
import React from 'react';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/anton/400.css';
import T from './timeline-porcos2.json';

// ---------- paleta (marca) ----------
const NAVY = '#152c78';
const BLUE = '#1f45a8';
const YELLOW = '#ffe12e';
const PAPER = '#fbfaf5';
const INK = '#1d1d1f';
const PINK = '#f7b9bd';
const PINK_D = '#ec8f99';
const WATER = '#4f8df5';
const SANS = 'Manrope, sans-serif';
const CAPS = 'Montserrat, sans-serif';

const FPS = T.fps;
const DUR = Math.ceil(T.total * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const sec = (s) => Math.round(s * FPS);

// ---------- linha do tempo ----------
const scenes = {};
T.sentences.forEach((s, i) => {
  const sc = scenes[s.scene] || (scenes[s.scene] = {start: s.start, end: s.end, idx: []});
  sc.end = s.end;
  sc.idx.push(i);
});
const order = ['hook', 'glands', 'mud', 'temp', 'feed', 'help', 'end', 'cta'];
order.forEach((k, i) => {
  const next = order[i + 1];
  scenes[k].to = next ? scenes[next].start : T.total;
});
const sAt = (i) => sec(T.sentences[i].start);
const stF = (k) => sec(scenes[k].start);
const normW = (w) => w.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');
const wAt = (i, w) => sec((T.sentences[i].words.find((x) => normW(x.w) === w) || T.sentences[i]).s ?? T.sentences[i].start);
const CHIPS = {
  glands: ['01', 'Sem suor'],
  mud: ['02', 'A lama'],
  temp: ['03', 'Zona de conforto'],
  feed: ['04', 'Calor x ração'],
  help: ['05', 'Como ajudar'],
};

// ---------- animação base (bounce suave) ----------
const usePop = (startF, damping = 20) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - startF, fps, config: {damping, stiffness: 160}});
};
const Pop = ({at, children, style, from = 0.85, y = 16}) => {
  const p = usePop(at);
  return (
    <div style={{...style, opacity: Math.min(1, p * 1.4), transform: `${style?.transform || ''} translateY(${(1 - p) * y}px) scale(${from + (1 - from) * p})`}}>
      {children}
    </div>
  );
};
const blinkAt = (f, seed) => {
  const ph = (f + seed * 17) % 84;
  return ph < 5 ? Math.sin((ph / 5) * Math.PI) : 0;
};

// ---------- desenhos ----------
const PigHead = ({size = 200, mouth = 0, hot = 0, seed = 0}) => {
  const f = useCurrentFrame();
  const b = blinkAt(f, seed);
  const ear = Math.sin(f / 9 + seed) * 5;
  const bob = Math.sin(f / 11 + seed) * 2.5;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
      <g transform={`translate(0 ${bob})`}>
        <path d="M46 72 L34 14 L92 48 Z" fill={PINK_D} stroke={INK} strokeWidth="5" strokeLinejoin="round" transform={`rotate(${-ear} 70 60)`} />
        <path d="M154 72 L166 14 L108 48 Z" fill={PINK_D} stroke={INK} strokeWidth="5" strokeLinejoin="round" transform={`rotate(${ear} 130 60)`} />
        <ellipse cx="100" cy="112" rx="80" ry="70" fill={PINK} stroke={INK} strokeWidth="5" />
        <ellipse cx="70" cy="94" rx="8" ry={10 * (1 - b) + 1.5} fill={INK} />
        <ellipse cx="130" cy="94" rx="8" ry={10 * (1 - b) + 1.5} fill={INK} />
        {b < 0.5 && <><circle cx="73" cy="90" r="3" fill="#fff" /><circle cx="133" cy="90" r="3" fill="#fff" /></>}
        <ellipse cx="100" cy="134" rx="36" ry="25" fill={PINK_D} stroke={INK} strokeWidth="5" />
        <ellipse cx="88" cy="134" rx="6" ry="9" fill={INK} />
        <ellipse cx="112" cy="134" rx="6" ry="9" fill={INK} />
        {mouth > 0.05 && <ellipse cx="100" cy="170" rx={10 + mouth * 6} ry={2 + mouth * 9} fill="#7a2c38" stroke={INK} strokeWidth="4" />}
        <ellipse cx="46" cy="128" rx="11" ry="7" fill="#ff8f9d" opacity={0.5 + hot * 0.5} />
        <ellipse cx="154" cy="128" rx="11" ry="7" fill="#ff8f9d" opacity={0.5 + hot * 0.5} />
        {hot > 0.3 && <path d="M168 70 C168 70 180 86 180 93 A12 12 0 0 1 156 93 C156 86 168 70 168 70 Z" fill={WATER} stroke={INK} strokeWidth="3" opacity={hot} />}
      </g>
    </svg>
  );
};
const Drop = ({size = 40}) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 40 52">
    <path d="M20 2 C20 2 38 26 38 36 A18 18 0 0 1 2 36 C2 26 20 2 20 2 Z" fill={WATER} stroke={INK} strokeWidth="3" />
    <ellipse cx="13" cy="34" rx="4" ry="7" fill="#fff" opacity=".6" />
  </svg>
);
const FallingDrop = ({x, y0, at, size = 40, dist = 220}) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > 34) return null;
  const p = t / 30;
  return (
    <div style={{position: 'absolute', left: x, top: y0 + dist * p * p, opacity: interpolate(t, [0, 4, 26, 34], [0, 1, 1, 0], clamp), transform: `scale(${interpolate(t, [0, 6], [0.4, 1], clamp)})`}}>
      <Drop size={size} />
    </div>
  );
};
const Sun = ({size = 160}) => {
  const f = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" style={{overflow: 'visible'}}>
      <g transform={`rotate(${f * 1.2} 80 80)`}>
        {[...Array(10)].map((_, i) => <rect key={i} x="76" y="4" width="8" height="26" rx="4" fill={YELLOW} stroke={INK} strokeWidth="3" transform={`rotate(${i * 36} 80 80)`} />)}
      </g>
      <circle cx="80" cy="80" r="42" fill={YELLOW} stroke={INK} strokeWidth="5" />
    </svg>
  );
};
const Fan = ({size = 120}) => {
  const f = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="54" fill="#fff" stroke={NAVY} strokeWidth="5" />
      <g transform={`rotate(${f * 14} 60 60)`}>
        {[0, 120, 240].map((a) => <path key={a} d="M60 60 C50 40 54 18 66 14 C76 22 72 44 60 60 Z" fill={BLUE} transform={`rotate(${a} 60 60)`} />)}
      </g>
      <circle cx="60" cy="60" r="8" fill={YELLOW} stroke={NAVY} strokeWidth="3" />
    </svg>
  );
};
const Tree = ({size = 120}) => (
  <svg width={size} height={size} viewBox="0 0 120 120">
    <rect x="52" y="64" width="16" height="44" rx="4" fill="#8a5d24" stroke={INK} strokeWidth="4" />
    <circle cx="60" cy="50" r="38" fill="#4caf6a" stroke={INK} strokeWidth="5" />
    <ellipse cx="60" cy="110" rx="46" ry="7" fill="rgba(20,30,60,.2)" />
  </svg>
);
const Card = ({children, style}) => (
  <div style={{background: '#fff', border: '2px solid #e4e7ef', borderRadius: 28, boxShadow: '0 20px 50px rgba(21,44,120,.12)', ...style}}>{children}</div>
);
const Pill = ({children, style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 30px', borderRadius: 999, background: '#fff', border: `3px solid ${BLUE}`, fontSize: 32, fontWeight: 800, color: NAVY, fontFamily: SANS, boxShadow: '0 6px 18px rgba(21,44,120,.1)', ...style}}>{children}</div>
);
const Stamp = ({text, at, style, rot = -8}) => {
  const p = usePop(at, 14);
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <div style={{position: 'absolute', ...style, opacity: Math.min(1, p * 2), transform: `rotate(${rot}deg) scale(${1.6 - 0.6 * p})`}}>
      <div style={{fontFamily: CAPS, fontWeight: 900, fontSize: 54, color: NAVY, background: YELLOW, border: `6px solid ${NAVY}`, padding: '10px 26px', borderRadius: 14, boxShadow: '0 10px 30px rgba(0,0,0,.2)', whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};
// foto colada no papel: borda branca, fita amarela, zoom lento
const Photo = ({src, at, x, y, w, h, rot = -2, zoom = [1.02, 1.12], pos = 'center'}) => {
  const f = useCurrentFrame();
  const kb = interpolate(f, [at, at + 180], zoom, clamp);
  return (
    <Pop at={at} from={0.9} style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`}}>
      <div style={{background: '#fff', padding: 16, paddingBottom: 22, boxShadow: '0 22px 50px rgba(21,44,120,.22)', borderRadius: 6}}>
        <div style={{width: w, height: h, overflow: 'hidden', borderRadius: 2}}>
          <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${kb})`}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: -26, top: -18, width: 140, height: 44, background: 'rgba(255,225,46,.82)', transform: 'rotate(-28deg)', boxShadow: '0 2px 6px rgba(0,0,0,.1)'}} />
      <div style={{position: 'absolute', right: -26, top: -18, width: 140, height: 44, background: 'rgba(255,225,46,.82)', transform: 'rotate(28deg)', boxShadow: '0 2px 6px rgba(0,0,0,.1)'}} />
    </Pop>
  );
};
const Source = ({text, style}) => <div style={{position: 'absolute', fontFamily: SANS, fontWeight: 600, fontSize: 22, color: 'rgba(21,44,120,.55)', ...style}}>{text}</div>;

// ---------- cenas ----------
const SceneHook = () => {
  const f = useCurrentFrame();
  const s1 = sAt(1), s2 = sAt(2);
  const drops = [[220, 0], [420, 8], [700, 4], [860, 14], [320, 22], [600, 28], [780, 36], [480, 44]];
  return (
    <AbsoluteFill>
      <Photo src="img/grupo.jpg" at={2} x={130} y={600} w={790} h={560} rot={-2} />
      {drops.map(([x, d], i) => {
        const at = sAt(0) + 18 + d;
        return f < s1 + 10 ? <FallingDrop key={i} x={x} y0={560} at={at} size={46} dist={360} /> : null;
      })}
      <Stamp text="QUASE NÃO SUA" at={s1 + 4} style={{left: 250, top: 820}} />
      {f >= s2 && (
        <Pop at={s2 + 2} style={{position: 'absolute', left: 150, top: 1300}}>
          <Card style={{width: 780, padding: '30px 36px', display: 'flex', alignItems: 'center', gap: 28}}>
            <div style={{width: 120, height: 120, borderRadius: 60, background: YELLOW, border: `5px solid ${NAVY}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: CAPS, fontWeight: 900, fontSize: 74, color: NAVY, transform: `rotate(${Math.sin(f / 6) * 8}deg)`}}>?</div>
            <div style={{fontFamily: SANS}}>
              <div style={{fontSize: 30, fontWeight: 800, color: 'rgba(21,44,120,.6)'}}>O SEGREDO DELE PRA NÃO FERVER</div>
              <div style={{fontSize: 48, fontWeight: 800, color: NAVY, filter: 'blur(11px)', marginTop: 6}}>se jogar na lama</div>
            </div>
          </Card>
        </Pop>
      )}
    </AbsoluteFill>
  );
};

const Skin = ({kind, at, fatAt}) => {
  const f = useCurrentFrame();
  const human = kind === 'human';
  const fat = human ? 0 : interpolate(f, [fatAt, fatAt + 24], [40, 150], {...clamp, easing: Easing.out(Easing.cubic)});
  const glands = human ? [70, 150, 230, 310] : [];
  return (
    <svg width="420" height="520" viewBox="0 0 420 520">
      {/* ar quente / suor */}
      {human && [0, 1, 2, 3, 4, 5].map((i) => {
        const t = ((f - at + i * 11) % 60) / 60;
        return f > at + 10 ? <path key={i} d="M0 -12 C0 -12 9 0 9 5 A9 9 0 0 1 -9 5 C-9 0 0 -12 0 -12 Z" fill={WATER} stroke={INK} strokeWidth="2" transform={`translate(${glands[i % 4] + (i > 3 ? 30 : 0)} ${150 - t * 120}) scale(${1 - t * 0.3})`} opacity={1 - t} /> : null;
      })}
      {!human && [0, 1, 2].map((i) => {
        const t = ((f + i * 14) % 42) / 42;
        return <path key={i} d={`M${120 + i * 90} ${118 - t * 30} q 10 -12 0 -24 q -10 -12 0 -24`} stroke="#f08a3c" strokeWidth="6" fill="none" strokeLinecap="round" opacity={interpolate(f, [fatAt, fatAt + 20], [0.15, 0.9], clamp) * (1 - t)} />;
      })}
      {/* epiderme */}
      <rect x="10" y="160" width="400" height="34" rx="6" fill={human ? '#f2c7a5' : PINK} stroke={INK} strokeWidth="4" />
      {/* derme */}
      <rect x="10" y="194" width="400" height="150" fill={human ? '#f8dcc6' : '#fbd3d6'} stroke={INK} strokeWidth="4" />
      {glands.map((x, i) => (
        <g key={i}>
          <line x1={x} y1="194" x2={x} y2="250" stroke={WATER} strokeWidth="6" />
          <path d={`M${x} 250 c-22 6 -22 26 0 30 c22 4 22 24 0 30 c-22 6 -22 20 0 22`} stroke={WATER} strokeWidth="7" fill="none" strokeLinecap="round" />
        </g>
      ))}
      {!human && (
        <g opacity=".5">
          <line x1="210" y1="194" x2="210" y2="240" stroke="#9aa6c4" strokeWidth="6" />
          <path d="M196 236 l28 28 M224 236 l-28 28" stroke="#9aa6c4" strokeWidth="6" strokeLinecap="round" />
        </g>
      )}
      {/* gordura */}
      <rect x="10" y="344" width="400" height={human ? 40 : fat} fill={YELLOW} stroke={INK} strokeWidth="4" />
      {[...Array(human ? 6 : Math.round(fat / 22) * 6)].map((_, i) => <circle key={i} cx={40 + (i % 6) * 68} cy={364 + Math.floor(i / 6) * 24} r="9" fill="#fff3a0" stroke="#d9b800" strokeWidth="2" />)}
      {!human && f > fatAt + 10 && <text x="210" y={344 + fat / 2 + 12} textAnchor="middle" fontFamily={CAPS} fontWeight="900" fontSize="30" fill={NAVY}>GORDURA</text>}
    </svg>
  );
};
const SceneGlands = () => {
  const st = stF('glands');
  const s4 = sAt(4);
  return (
    <AbsoluteFill>
      {[['HUMANO', 'human', 'sua ✓', 70, st + 4], ['PORCO', 'pig', 'quase nada ✕', 560, st + 12]].map(([title, kind, tag, x, at]) => (
        <Pop key={kind} at={at} style={{position: 'absolute', left: x, top: 600}}>
          <Card style={{width: 450, height: 700, padding: '24px 15px', position: 'relative'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: CAPS, fontWeight: 900, fontSize: 36, color: NAVY}}>
              {kind === 'pig' ? <PigHead size={64} /> : <span style={{fontSize: 46}}>🧍</span>}{title}
            </div>
            <Skin kind={kind} at={at} fatAt={s4 + 6} />
            <div style={{position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center'}}>
              <span style={{background: kind === 'human' ? BLUE : YELLOW, color: kind === 'human' ? '#fff' : NAVY, fontFamily: SANS, fontWeight: 800, fontSize: 30, padding: '8px 22px', borderRadius: 12}}>{tag}</span>
            </div>
          </Card>
        </Pop>
      ))}
      <Source text="Ilustração esquemática da pele" style={{left: 70, top: 1320}} />
    </AbsoluteFill>
  );
};

const SceneMud = () => {
  const f = useCurrentFrame();
  const st = stF('mud');
  const s6 = sAt(6), s7 = sAt(7);
  const splash = [...Array(14)].map((_, i) => {
    const a = (i / 14) * Math.PI + Math.PI;
    const t = Math.max(0, f - (st + 6));
    const v = 9 + (i % 4) * 3;
    return [540 + Math.cos(a) * v * t * 1.4, 1130 + Math.sin(a) * v * t + 0.9 * t * t, 18 + (i % 3) * 10, t];
  });
  const rows = [['💧 Água', 1, 6], ['🟤 Lama', 0.32, 6]];
  return (
    <AbsoluteFill>
      <Photo src="img/lama.jpg" at={st} x={110} y={600} w={830} h={520} rot={1.5} />
      {splash.map(([x, y, r, t], i) => t > 0 && t < 30 ? <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: '50%', background: '#7a5530', opacity: interpolate(t, [0, 22, 30], [1, 1, 0], clamp)}} /> : null)}
      {f >= s6 && (
        <Pop at={s6 + 2} style={{position: 'absolute', left: 110, top: 1240}}>
          <Card style={{width: 860, padding: '26px 34px', fontFamily: SANS}}>
            <div style={{fontSize: 26, fontWeight: 800, color: 'rgba(21,44,120,.6)', letterSpacing: 2, marginBottom: 10}}>QUANTO RESTA ÚMIDO NA PELE</div>
            {rows.map(([label, rate, d], i) => {
              const p = interpolate(f, [s6 + 14, s6 + 80], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
              const level = 100 - p * (i === 0 ? 85 : 30);
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, margin: '14px 0'}}>
                  <div style={{width: 170, fontSize: 32, fontWeight: 800, color: NAVY}}>{label}</div>
                  <div style={{flex: 1, height: 44, background: '#eef1f8', borderRadius: 12, overflow: 'hidden', border: `3px solid ${NAVY}`}}>
                    <div style={{width: `${level}%`, height: '100%', background: i === 0 ? WATER : '#7a5530'}} />
                  </div>
                  <div style={{width: 90, fontFamily: CAPS, fontWeight: 900, fontSize: 30, color: NAVY, textAlign: 'right'}}>{i === 0 ? 'seca' : 'dura'}</div>
                </div>
              );
            })}
            <div style={{fontSize: 22, fontWeight: 600, color: 'rgba(21,44,120,.5)'}}>comparação ilustrativa</div>
          </Card>
        </Pop>
      )}
      {f >= s7 && (
        <>
          <Pop at={s7} style={{position: 'absolute', left: 800, top: 520}}><Sun size={180} /></Pop>
          <Pop at={s7 + 8} style={{position: 'absolute', left: 560, top: 1110}}><Pill style={{background: YELLOW, border: `3px solid ${NAVY}`}}>🛡️ protege do sol</Pill></Pop>
        </>
      )}
    </AbsoluteFill>
  );
};

const SceneTemp = () => {
  const f = useCurrentFrame();
  const st = stF('temp');
  const s9 = sAt(9);
  const X = (c) => 60 + (c / 40) * 780;
  const temp = interpolate(f, [st + 10, st + 50, s9, s9 + 30], [8, 18, 18, 33], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const hot = interpolate(temp, [24, 31], [0, 1], clamp);
  const band = (a, b, at) => interpolate(f, [at, at + 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}) * (X(b) - X(a));
  return (
    <AbsoluteFill>
      <Pop at={st + 2} style={{position: 'absolute', left: 80, top: 640}}>
        <Card style={{width: 920, height: 720, position: 'relative', fontFamily: SANS}}>
          <div style={{position: 'absolute', top: 28, left: 34, fontSize: 28, fontWeight: 800, letterSpacing: 2, color: 'rgba(21,44,120,.6)'}}>TEMPERATURA DO AR · PORCO ADULTO</div>
          <div style={{position: 'absolute', top: 70, left: 34, fontFamily: CAPS, fontWeight: 900, fontSize: 120, color: hot > 0.5 ? '#d9480f' : NAVY}}>{Math.round(temp)}°C</div>
          <div style={{position: 'absolute', top: 70, right: 40}}><PigHead size={190} hot={hot} mouth={hot * (Math.sin(f / 3) + 1) / 2} /></div>
          <svg width="920" height="400" style={{position: 'absolute', top: 290, left: 0}}>
            <rect x={X(0)} y="120" width={X(40) - X(0)} height="70" rx="14" fill="#eef1f8" stroke={NAVY} strokeWidth="3" />
            <rect x={X(10)} y="120" width={band(10, 24, st + 12)} height="70" fill={BLUE} />
            <defs>
              <pattern id="haz" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="14" height="28" fill={YELLOW} /><rect x="14" width="14" height="28" fill={NAVY} />
              </pattern>
            </defs>
            <rect x={X(27)} y="120" width={band(27, 40, s9)} height="70" fill="url(#haz)" />
            {[0, 5, 10, 15, 20, 25, 30, 35, 40].map((c) => (
              <g key={c}>
                <line x1={X(c)} y1="196" x2={X(c)} y2="212" stroke={NAVY} strokeWidth="3" />
                <text x={X(c)} y="244" textAnchor="middle" fontFamily={SANS} fontWeight="800" fontSize="26" fill={NAVY}>{c}°</text>
              </g>
            ))}
            {f > st + 26 && <text x={(X(10) + X(24)) / 2} y="100" textAnchor="middle" fontFamily={CAPS} fontWeight="900" fontSize="32" fill={BLUE}>CONFORTO 10–24 °C</text>}
            {f > s9 + 10 && <text x={(X(27) + X(40)) / 2} y="100" textAnchor="middle" fontFamily={CAPS} fontWeight="900" fontSize="32" fill="#d9480f">⚠ PERIGO</text>}
            <g transform={`translate(${X(temp)} 0)`}>
              <line x1="0" y1="110" x2="0" y2="200" stroke={NAVY} strokeWidth="6" />
              <circle cx="0" cy="110" r="12" fill={YELLOW} stroke={NAVY} strokeWidth="4" />
            </g>
          </svg>
          <Source text="Fonte: Penn State Extension (50–75 °F; risco acima de 80 °F)" style={{left: 34, bottom: 24}} />
        </Card>
      </Pop>
    </AbsoluteFill>
  );
};

const SceneFeed = () => {
  const f = useCurrentFrame();
  const st = stF('feed');
  const s11 = sAt(11), s12 = sAt(12);
  const H = 420;
  const g1 = interpolate(f, [s11 - 10, s11 + 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const g2 = interpolate(f, [s11 + 6, s11 + 28], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const drop = interpolate(f, [s12 + 10, s12 + 40], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const hotTop = 100 - drop * 25, hotLow = 100 - drop * 50;
  return (
    <AbsoluteFill>
      {[0, 1, 2, 3, 4].map((i) => (
        <Pop key={i} at={st + 6 + i * 4} style={{position: 'absolute', left: 300 + i * 110, top: 600 + (i % 2) * 30}}>
          <div style={{width: 92, height: 92, borderRadius: 46, background: YELLOW, border: `5px solid ${NAVY}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: CAPS, fontWeight: 900, fontSize: 34, color: NAVY, transform: `translateY(${interpolate(f, [s11 - 6, s11 + 14], [0, 1700], {...clamp, easing: Easing.in(Easing.quad)})}px) rotate(${(f - st) * (i % 2 ? 4 : -4)}deg)`}}>R$</div>
        </Pop>
      ))}
      {f >= s11 - 12 && (
        <Pop at={s11 - 12} style={{position: 'absolute', left: 90, top: 640}}>
          <Card style={{width: 900, height: 780, position: 'relative', fontFamily: SANS}}>
            <div style={{position: 'absolute', top: 28, left: 34, fontSize: 28, fontWeight: 800, letterSpacing: 2, color: 'rgba(21,44,120,.6)'}}>CONSUMO DE RAÇÃO (%)</div>
            <div style={{position: 'absolute', top: 18, right: 30}}><PigHead size={130} hot={drop} seed={3} /></div>
            <svg width="900" height="620" style={{position: 'absolute', top: 120, left: 0}}>
              {[0, 50, 100].map((v) => (
                <g key={v}>
                  <line x1="110" x2="860" y1={540 - (v / 100) * H} y2={540 - (v / 100) * H} stroke="rgba(21,44,120,.15)" strokeWidth="3" strokeDasharray="10 10" />
                  <text x="90" y={548 - (v / 100) * H} textAnchor="end" fontFamily={SANS} fontWeight="800" fontSize="26" fill={NAVY}>{v}</text>
                </g>
              ))}
              <rect x="190" y={540 - H * g1} width="220" height={H * g1} rx="10" fill={BLUE} />
              <text x="300" y={520 - H * g1} textAnchor="middle" fontFamily={CAPS} fontWeight="900" fontSize="44" fill={NAVY} opacity={g1}>100</text>
              <rect x="560" y={540 - (H * g2 * hotTop) / 100} width="220" height={(H * g2 * hotTop) / 100} rx="10" fill={YELLOW} stroke={NAVY} strokeWidth="4" strokeDasharray={drop > 0 ? '12 8' : undefined} />
              <rect x="560" y={540 - (H * g2 * hotLow) / 100} width="220" height={(H * g2 * hotLow) / 100} rx="10" fill={YELLOW} stroke={NAVY} strokeWidth="4" />
              {drop > 0.2 && <text x="670" y={540 - (H * hotTop) / 100 - 20} textAnchor="middle" fontFamily={CAPS} fontWeight="900" fontSize="40" fill="#d9480f" opacity={drop}>−25% a −50%</text>}
              <text x="300" y="590" textAnchor="middle" fontFamily={SANS} fontWeight="800" fontSize="32" fill={NAVY}>Conforto</text>
              <text x="670" y="590" textAnchor="middle" fontFamily={SANS} fontWeight="800" fontSize="32" fill={NAVY}>Calor intenso</text>
            </svg>
            <Source text="Fonte: Penn State Extension (estresse térmico agudo)" style={{left: 34, bottom: 22}} />
          </Card>
        </Pop>
      )}
    </AbsoluteFill>
  );
};

const SceneHelp = () => {
  const st = stF('help');
  const s13 = sAt(13);
  const items = [[<Tree size={130} />, 'Sombra'], [<Drop size={90} />, 'Água fresca'], [<Fan size={130} />, 'Ventilação']];
  return (
    <AbsoluteFill>
      <Photo src="img/agua.jpg" at={st} x={150} y={600} w={760} h={500} rot={-1.5} />
      {items.map(([icon, label], i) => (
        <Pop key={i} at={s13 + 4 + i * 14} style={{position: 'absolute', left: 90 + i * 310, top: 1240}}>
          <Card style={{width: 280, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, border: `3px solid ${BLUE}`}}>
            <div style={{height: 150, display: 'flex', alignItems: 'center'}}>{icon}</div>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: NAVY}}>{label}</div>
          </Card>
        </Pop>
      ))}
    </AbsoluteFill>
  );
};

const SceneEnd = () => {
  const st = stF('end');
  const s15 = sAt(15);
  return (
    <AbsoluteFill>
      <Photo src="img/focinho.jpg" at={st} x={170} y={620} w={720} h={560} rot={2} />
      <Stamp text="CORRIGIDO ✓" at={s15 + 6} style={{left: 290, top: 1230}} rot={-6} />
    </AbsoluteFill>
  );
};

const SceneCta = () => {
  const f = useCurrentFrame();
  const st = stF('cta');
  const s = sAt(16);
  return (
    <AbsoluteFill>
      <Pop at={st} style={{position: 'absolute', left: 340, top: 600}}><PigHead size={400} mouth={interpolate(f, [st, st + 4, st + 14, st + 18], [0, 1, 1, 0], clamp)} seed={5} /></Pop>
      <Pop at={s + 8} style={{position: 'absolute', left: 0, right: 0, top: 1100, textAlign: 'center'}}><Pill style={{fontSize: 40}}>📤 Manda pra quem cria porco</Pill></Pop>
      <Pop at={sAt(16) + 40} style={{position: 'absolute', left: 0, right: 0, top: 1220, textAlign: 'center'}}><Pill style={{fontSize: 40, background: YELLOW, border: `3px solid ${NAVY}`}}>💬 Comenta: você sabia?</Pill></Pop>
      <Pop at={sAt(16) + 50} style={{position: 'absolute', left: 0, right: 0, top: 1350, textAlign: 'center', fontFamily: CAPS, fontWeight: 900, fontSize: 90, color: BLUE}}>
        <span style={{display: 'inline-block', transform: `translateY(${Math.sin(f / 5) * 8}px)`}}>↓</span>
      </Pop>
    </AbsoluteFill>
  );
};

// ---------- letreiros no estilo da marca ----------
const LETS = {
  hook: [[sAt(0) + 4, 'Você já ouviu alguém', 'SUANDO COMO UM *PORCO*?'], [sAt(1), 'Pois é...', 'PORCO QUASE *NÃO SUA*'], [sAt(2) + 4, 'E o jeito dele se refrescar', 'É *ESTRANHO*']],
  glands: [[sAt(3) + 4, 'Glândulas de suor', '*QUASE* NENHUMA'], [sAt(4) + 4, 'E ainda tem', 'GORDURA QUE *SEGURA* O CALOR']],
  mud: [[sAt(5) + 2, 'A solução dele', '*LAMA*'], [sAt(6) + 4, 'Seca devagar', 'REFRESCA POR *MAIS TEMPO*'], [sAt(7) + 4, 'E de quebra', '*PROTETOR* SOLAR']],
  temp: [[sAt(8) + 4, 'Zona de conforto', '*10 A 24* °C'], [sAt(9) + 4, 'Acima de 27 °C', '*PERIGO*']],
  feed: [[sAt(10) + 4, 'E tem a parte que', 'DÓI NO *BOLSO*'], [sAt(11), 'No calor ele', '*COME MENOS*'], [sAt(12) + 4, 'Consumo de ração', 'CAI ATÉ *50%*']],
  help: [[sAt(13) + 2, 'Como ajudar', 'SOMBRA, ÁGUA E *VENTO*']],
  end: [[sAt(14) + 4, 'Da próxima vez...', 'SUANDO COMO UM *PORCO*?'], [sAt(15), 'Pode corrigir', 'PORCO *NÃO SUA*']],
  cta: [[sAt(16) + 2, 'Manda pra quem cria', '*COMENTA*: VOCÊ SABIA?']],
};
const LetLine = ({item, out}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [at, kicker, main] = item;
  const len = main.replace(/\*/g, '').length;
  const size = Math.round(Math.max(58, Math.min(118, 150 - len * 3.6)));
  const k1 = spring({frame: f - at, fps, config: {damping: 20, stiffness: 170}});
  const k2 = spring({frame: f - at - 5, fps, config: {damping: 20, stiffness: 170}});
  const t1 = interpolate(f - at, [3, 9], [0, 1], clamp);
  const t2 = interpolate(f - at, [8, 14], [0, 1], clamp);
  const parts = main.split(' ');
  return (
    <div style={{position: 'absolute', top: 140, left: 50, right: 50, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: 1 - out, transform: `translateY(${-out * 40}px) rotate(-1.2deg)`}}>
      <div style={{background: YELLOW, padding: '8px 22px', transform: `scaleX(${k1})`, transformOrigin: 'left', boxShadow: '0 6px 0 rgba(21,44,120,.15)'}}>
        <span style={{display: 'inline-block', fontFamily: SANS, fontWeight: 800, fontSize: 50, color: BLUE, letterSpacing: -1, opacity: t1, transform: `translateY(${(1 - t1) * 14}px)`}}>{kicker}</span>
      </div>
      <div style={{background: BLUE, padding: '10px 28px', transform: `scaleX(${k2})`, transformOrigin: 'left', boxShadow: '0 8px 0 rgba(21,44,120,.25)', textAlign: 'center'}}>
        <span style={{display: 'inline-block', fontFamily: CAPS, fontWeight: 900, fontSize: size, color: '#fff', lineHeight: 1.05, opacity: t2, transform: `translateY(${(1 - t2) * 18}px)`}}>
          {parts.map((w, i) => <span key={i} style={{color: w.startsWith('*') ? YELLOW : '#fff'}}>{w.replace(/\*/g, '')}{i < parts.length - 1 ? ' ' : ''}</span>)}
        </span>
      </div>
    </div>
  );
};
const Letreiro = ({k}) => {
  const f = useCurrentFrame();
  const L = LETS[k];
  if (!L) return null;
  let ci = -1;
  L.forEach((it, i) => { if (f >= it[0]) ci = i; });
  if (ci < 0) return null;
  const out = ci > 0 ? 1 - interpolate(f - L[ci][0], [0, 5], [0, 1], clamp) : 0;
  return (
    <>
      {ci > 0 && out > 0 && <LetLine item={L[ci - 1]} out={1 - out} />}
      <LetLine key={ci} item={L[ci]} out={0} />
    </>
  );
};


// ---------- memes de porquinho ----------
const MEMES = () => ({
  hook: [{src: 'img/meme-leitao.jpg', top: 'EU NUNCA SUEI', bottom: 'NA MINHA VIDA', at: sAt(1) + 26, out: sAt(2) - 2, x: 190, y: 1180, w: 700, h: 420, rot: 3}],
  mud: [{src: 'img/meme-dormindo.jpg', top: 'EU NO VERÃO', bottom: 'ÀS 14H', at: sAt(7) + 18, out: stF('temp') - 12, x: 170, y: 760, w: 740, h: 500, rot: -3}],
  feed: [{src: 'img/meme-capim.jpg', top: 'SÓ UMA SALADINHA', bottom: 'HOJE TÁ CALOR', at: wAt(11, 'menos') + 8, out: sAt(12) + 10, x: 170, y: 760, w: 740, h: 500, rot: 3}],
  help: [{src: 'img/meme-focinho.jpg', top: 'SOMBRA E ÁGUA FRESCA', bottom: 'O RESTO É LUXO', at: sAt(13) + 48, out: stF('end') - 12, x: 170, y: 900, w: 740, h: 520, rot: -2.5}],
});
const MEME = MEMES();
const MemeText = ({children, size}) => (
  <div style={{fontFamily: 'Anton, Impact, sans-serif', fontSize: size, color: '#fff', textAlign: 'center', lineHeight: 1.02, letterSpacing: 1, WebkitTextStroke: '3px #000', paintOrder: 'stroke fill', textShadow: '0 0 6px #000, 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000'}}>{children}</div>
);
const Meme = ({m}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < m.at || f > m.out + 8) return null;
  const pin = spring({frame: f - m.at, fps, config: {damping: 16, stiffness: 200}});
  const pout = interpolate(f, [m.out, m.out + 8], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  const kb = interpolate(f, [m.at, m.out], [1.05, 1.15], clamp);
  return (
    <div style={{position: 'absolute', left: m.x, top: m.y, transform: `rotate(${m.rot}deg) scale(${(0.6 + 0.4 * pin) * pout})`, opacity: Math.min(1, pin * 2) * pout}}>
      <div style={{background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 30px 60px rgba(0,0,0,.35)'}}>
        <div style={{position: 'relative', width: m.w, height: m.h, overflow: 'hidden', background: '#000'}}>
          <Img src={staticFile(m.src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb})`}} />
          <div style={{position: 'absolute', top: 14, left: 16, right: 16}}><MemeText size={m.w * 0.105}>{m.top}</MemeText></div>
          <div style={{position: 'absolute', bottom: 14, left: 16, right: 16}}><MemeText size={m.w * 0.105}>{m.bottom}</MemeText></div>
        </div>
      </div>
    </div>
  );
};

// ---------- efeitos sonoros ----------
const buildSfx = () => {
  const E = [];
  let pc = 0;
  const POPS = ['pop_a', 'pop_b', 'pop_c', 'pop_d'];
  const add = (name, frame, vol = 0.5) => {
    const soft = name === 'pop' || name === 'popk' || POPS.includes(name);
    E.push({name: name === 'pop' ? POPS[pc++ % 4] : name, frame: Math.max(0, Math.round(frame)), vol: soft ? vol * 0.35 : vol});
  };
  order.slice(1).forEach((k) => add('whoosh', stF(k) - 10, 0.32));
  Object.values(LETS).forEach((L) => L.forEach(([at]) => { add('pop', at, 0.3); add('popk', at + 9, 0.38); }));
  // gancho
  add('tape', 2, 0.5); add('oink', 14, 0.55);
  [0, 8, 4, 14, 22, 28, 36, 44].forEach((d) => add('drip', sAt(0) + 18 + d, 0.28));
  add('stamp', sAt(1) + 4, 0.7); add('hit', sAt(1) + 4, 0.35); add('grunt', sAt(1) + 22, 0.45);
  add('pop', sAt(2) + 2, 0.45); add('tick', sAt(2) + 12, 0.35);
  // glândulas
  add('pop', stF('glands') + 4, 0.45); add('pop', stF('glands') + 12, 0.45);
  [0, 12, 24].forEach((d) => add('bubble', stF('glands') + 18 + d, 0.25));
  add('hit', sAt(4) + 6, 0.35); add('pop_c', sAt(4) + 10, 0.4);
  // lama
  add('tape', stF('mud'), 0.45); add('splash', stF('mud') + 6, 0.6); add('grunt', stF('mud') + 22, 0.45);
  add('pop', sAt(6) + 2, 0.45); add('whoosh', sAt(6) + 14, 0.18);
  add('ding', sAt(7), 0.35); add('pop', sAt(7) + 8, 0.45);
  // temperatura
  add('pop', stF('temp') + 2, 0.45); add('type', stF('temp') + 12, 0.35); add('ding', stF('temp') + 26, 0.3);
  add('type', sAt(9), 0.35); add('hit', sAt(9) + 12, 0.4); add('grunt', sAt(9) + 20, 0.45);
  // ração
  [0, 1, 2, 3, 4].forEach((i) => add('pop', stF('feed') + 6 + i * 4, 0.35));
  add('whoosh', sAt(11) - 6, 0.25); add('pop', sAt(11) - 12, 0.45); add('type', sAt(11), 0.3);
  add('hit', sAt(12) + 10, 0.4); add('stamp', sAt(12) + 24, 0.35);
  // ajuda
  add('tape', stF('help'), 0.45); add('bubble', stF('help') + 10, 0.3);
  [0, 1, 2].forEach((i) => add('pop', sAt(13) + 4 + i * 14, 0.45));
  // final
  add('tape', stF('end'), 0.45); add('stamp', sAt(15) + 6, 0.7); add('oink', sAt(15) + 20, 0.55); add('sparkle', sAt(15) + 10, 0.3);
  // cta
  add('oink', stF('cta') + 2, 0.55); add('pop', sAt(16) + 8, 0.45); add('pop', sAt(16) + 40, 0.45); add('ding', sAt(16) + 50, 0.35);
  Object.values(MEME).forEach((L) => L.forEach((m) => { add('boom', m.at, 0.45); add('boing', m.at + 1, 0.35); add('oink_hi', m.at + 8, 0.5); add('whoosh', m.out - 2, 0.15); }));
  // porco em toda cena
  order.slice(1).forEach((k, i) => add(['snort', 'grunt', 'oink', 'snort', 'oink_hi', 'grunt', 'oink'][i % 7], stF(k) + 12, 0.45));
  // efeitos YTP
  FX.punches.forEach(([f, , big]) => add(big ? 'boom' : 'tick', f, big ? 0.5 : 0.25));
  FX.fry.forEach(([f, , , snd]) => snd && add(snd, f, 0.55));
  add('squeal', wAt(9, 'perigo') + 4, 0.55); add('airhorn', wAt(9, 'perigo'), 0.4);
  add('scratch', sAt(15) - 4, 0.55); add('laugh', sAt(15) + 34, 0.5);
  add('snort', wAt(10, 'bolso'), 0.45); add('grunt', wAt(11, 'menos') + 2, 0.45);
  add('oink_hi', sAt(5) + 6, 0.4); add('laugh', stF('cta') + 20, 0.45); add('oink_hi', sAt(16) + 60, 0.45);
  return E;
};
const Sfx = () => <>{SFX.map((e, i) => <Sequence key={i} from={e.frame} durationInFrames={45}><Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.vol} /></Sequence>)}</>;

const SCENES = {hook: SceneHook, glands: SceneGlands, mud: SceneMud, temp: SceneTemp, feed: SceneFeed, help: SceneHelp, end: SceneEnd, cta: SceneCta};

// ---------- câmera passando pelo papel ----------
const CX = 540, CY = 1000;
const OFF = {hook: [0, 0], glands: [1500, 450], mud: [250, 2250], temp: [1750, 2650], feed: [150, 4600], help: [1650, 4950], end: [250, 6900], cta: [1750, 7250]};
const en = (k) => sec(scenes[k].to);
const CAM = {
  hook: [[0, 540, 960, 1.1, -1], [sAt(1) - 4, 540, 960, 1.02, 0], [sAt(2) + 10, 540, 1080, 1.04, 0.5], [en('hook'), 540, 1060, 1.0, 0]],
  glands: [[stF('glands'), 540, 980, 1.0, 0], [sAt(4), 580, 1000, 1.05, 0.5], [en('glands'), 560, 1000, 1.03, 0]],
  mud: [[stF('mud'), 540, 900, 1.1, 0], [sAt(6), 540, 980, 1.0, 0], [sAt(6) + 30, 540, 1080, 1.04, 0], [en('mud'), 560, 1000, 1.0, 0]],
  temp: [[stF('temp'), 540, 980, 1.0, 0], [sAt(9), 560, 1000, 1.06, 0], [en('temp'), 620, 1000, 1.1, 0.5]],
  feed: [[stF('feed'), 540, 860, 1.08, 0], [sAt(11), 540, 1000, 1.0, 0], [sAt(12) + 20, 640, 1000, 1.08, 0], [en('feed'), 620, 1000, 1.06, 0]],
  help: [[stF('help'), 540, 920, 1.08, 0], [sAt(13) + 30, 540, 1060, 1.0, 0], [en('help'), 540, 1060, 1.03, 0]],
  end: [[stF('end'), 540, 940, 1.08, -0.8], [sAt(15) + 10, 540, 1040, 1.04, 0], [en('end'), 540, 1020, 1.0, 0]],
  cta: [[stF('cta'), 540, 900, 1.06, 0], [sAt(16) + 50, 540, 1060, 1.02, 0], [en('cta'), 540, 1060, 1.04, 0]],
};
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const camAt = (k, f) => {
  const K = CAM[k];
  if (f <= K[0][0]) return K[0].slice(1);
  for (let i = 0; i < K.length - 1; i++) {
    const [a, b] = [K[i], K[i + 1]];
    if (f <= b[0]) {
      const p = ease((f - a[0]) / Math.max(1, b[0] - a[0]));
      return [1, 2, 3, 4].map((j) => a[j] + (b[j] - a[j]) * p);
    }
  }
  return K[K.length - 1].slice(1);
};
const sceneAt = (f) => order.find((k) => f >= stF(k) && f < en(k)) || (f < 0 ? 'hook' : order[order.length - 1]);
const W1 = 11, W2 = 11;
const canvasCam = (f) => {
  for (let i = 1; i < order.length; i++) {
    const A = order[i - 1], B = order[i];
    const b = stF(B);
    if (f >= b - W1 && f < b + W2) {
      const a = camAt(A, b - W1), c = camAt(B, b + W2);
      const p = ease((f - (b - W1)) / (W1 + W2));
      const x = OFF[A][0] + a[0] + (OFF[B][0] + c[0] - OFF[A][0] - a[0]) * p;
      const y = OFF[A][1] + a[1] + (OFF[B][1] + c[1] - OFF[A][1] - a[1]) * p;
      const s = (a[2] + (c[2] - a[2]) * p) * (1 - 0.34 * Math.sin(Math.PI * p));
      const r = a[3] + (c[3] - a[3]) * p + 2.5 * Math.sin(Math.PI * p);
      return [x, y, s, r];
    }
  }
  const k = sceneAt(f);
  const c = camAt(k, f);
  return [OFF[k][0] + c[0], OFF[k][1] + c[1], c[2], c[3]];
};
const SHK = [[sAt(1) + 4, 6], [sAt(9) + 12, 4], [sAt(12) + 10, 4], [sAt(15) + 6, 6]];
const shakeAt = (f) => SHK.reduce(([x, y], [e, a]) => {
  const d = f - e;
  if (d < 0 || d > 24) return [x, y];
  const m = a * Math.exp(-d / 5);
  return [x + m * Math.sin(d * 2.3), y + m * Math.cos(d * 1.9)];
}, [0, 0]);

const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .1 0 0 0 0 .15 0 0 0 0 .35 0 0 0 .08 0'/></filter><rect width='320' height='320' filter='url(%23n)'/></svg>")`;
const GRID = 'rgba(31,69,168,.10)';

const SceneOnPaper = ({k}) => {
  const Scene = SCENES[k];
  const chip = CHIPS[k];
  const st = stF(k);
  return (
    <div style={{position: 'absolute', left: OFF[k][0], top: OFF[k][1], width: 1080, height: 1920}}>
      <Scene />
      <Letreiro k={k} />
      {(MEME[k] || []).map((m, i) => <Meme key={i} m={m} />)}
      {chip && (
        <>
          <Pop at={st} style={{position: 'absolute', left: 70, top: 470}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, background: NAVY, color: '#fff', padding: '10px 26px 10px 12px', borderRadius: 999, fontFamily: SANS, fontWeight: 800, fontSize: 30, boxShadow: '0 8px 24px rgba(21,44,120,.3)'}}>
              <span style={{background: YELLOW, color: NAVY, padding: '4px 12px', borderRadius: 999, fontFamily: CAPS, fontWeight: 900, fontSize: 24}}>{chip[0]}</span>{chip[1]}
            </div>
          </Pop>
          <div style={{position: 'absolute', right: 70, top: 484, fontFamily: CAPS, fontWeight: 800, fontSize: 26, color: 'rgba(21,44,120,.45)'}}>{chip[0]} / 05</div>
        </>
      )}
    </div>
  );
};

// ---------- efeitos YTPBR ----------
const FX = (() => {
  const punches = []; // [frame, escala, grande?, cx, cy]
  (T.stutters || []).forEach((st) => {
    for (let k = 0; k < st.n; k++) punches.push([sec(st.s + k * (st.seg + 0.035)), 1.16 + k * 0.14, false]);
    punches.push([sec(st.s + st.n * (st.seg + 0.035)), 1.6, true]);
  });
  const fry = [ // [início, duração, emoji, som]
    [wAt(0, 'porco') + 4, 18, '🤨', 'boom'],
    [wAt(4, 'gordura'), 16, '😳', 'boom'],
    [wAt(9, 'perigo'), 24, '💀', null],
    [sAt(15), 16, '🗿', 'boom'],
  ];
  const freeze = [[sAt(15), 14]];
  const invert = [[sAt(15) - 4, 3]];
  const stretch = Object.values(MEME).flat().map((m) => [m.at, 7]);
  return {punches, fry, freeze, invert, stretch};
})();
const SFX = buildSfx();
const inWin = (list, f) => list.find(([a, d]) => f >= a && f < a + d);
const punchAt = (f) => {
  const ps = FX.punches.filter((p) => f >= p[0] && f < p[0] + (p[2] ? 14 : 6));
  return ps.length ? ps[ps.length - 1] : null;
};
const YtpOverlay = () => {
  const f = useCurrentFrame();
  const fr = inWin(FX.fry, f);
  if (!fr) return null;
  const t = f - fr[0];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(255,120,0,.0) 35%, rgba(200,30,0,.55) 100%)', mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{backgroundImage: NOISE, backgroundSize: '160px 160px', opacity: 0.9, mixBlendMode: 'overlay'}} />
      <div style={{position: 'absolute', left: 620, top: 1180, fontSize: 300, transform: `rotate(${-12 + Math.sin(t) * 6}deg) scale(${interpolate(t, [0, 3], [2.2, 1], clamp)})`}}>{fr[2]}</div>
    </AbsoluteFill>
  );
};

const Frame = () => {
  const f = useCurrentFrame();
  const cur = sceneAt(f);
  const ci = order.indexOf(cur);
  const [cx, cy, s, r] = canvasCam(f);
  const [px, py, ps] = canvasCam(f - 1);
  const [sx, sy] = shakeAt(f);
  const speed = Math.hypot((cx - px) * s, (cy - py) * s) + Math.abs(s - ps) * 600;
  const blur = Math.min(5, Math.max(0, (speed - 25) / 30));
  const vis = order.slice(Math.max(0, ci - 1), ci + 2);
  const fz = inWin(FX.freeze, f);
  const fr = inWin(FX.fry, f);
  const inv = inWin(FX.invert, f);
  const st = inWin(FX.stretch, f);
  const pu = punchAt(f);
  let zs = pu ? pu[1] : 1;
  if (fr) zs *= 1.12 + Math.min(1, (f - fr[0]) / 4) * 0.12;
  const jit = fr || (pu && pu[2]) ? [Math.sin(f * 3.1) * 14, Math.cos(f * 2.3) * 14] : [0, 0];
  const stretch = st ? [1 + 0.5 * Math.sin(((f - st[0]) / st[1]) * Math.PI), 1 - 0.25 * Math.sin(((f - st[0]) / st[1]) * Math.PI)] : [1, 1];
  const ytpFilter = [fr && 'contrast(1.7) saturate(2.6) brightness(1.05)', inv && 'invert(1) hue-rotate(180deg)', pu && pu[2] && 'contrast(1.3) saturate(1.8)'].filter(Boolean).join(' ');
  const canvas = (
    <AbsoluteFill style={{transformOrigin: '0 0', transform: `translate(${CX + sx}px, ${CY + sy}px) rotate(${r}deg) scale(${s}) translate(${-cx}px, ${-cy}px)`, filter: blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
      <div style={{position: 'absolute', left: -2000, top: -2000, width: 6000, height: 12500, backgroundColor: PAPER, backgroundImage: `${NOISE}, linear-gradient(${GRID} 2px,transparent 2px), linear-gradient(90deg,${GRID} 2px,transparent 2px)`, backgroundSize: '320px 320px, 72px 72px, 72px 72px'}} />
      {vis.map((k) => <SceneOnPaper key={k} k={k} />)}
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{background: PAPER, fontFamily: SANS, overflow: 'hidden'}}>
      <AbsoluteFill style={{transformOrigin: '50% 55%', transform: `translate(${jit[0]}px, ${jit[1]}px) scale(${zs * stretch[0]}, ${zs * stretch[1]})`, filter: ytpFilter || undefined}}>
        {fz ? <Freeze frame={fz[0]}>{canvas}</Freeze> : canvas}
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 62%, rgba(21,44,120,.10) 100%)'}} />
      </AbsoluteFill>
      <YtpOverlay />
      <Audio src={staticFile('porcos/voz2.wav')} />
      <Sfx />
    </AbsoluteFill>
  );
};

registerRoot(() => <Composition id="Porcos2" component={Frame} durationInFrames={DUR} fps={FPS} width={1080} height={1920} />);
