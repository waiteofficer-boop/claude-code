import {registerRoot, Composition, AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, interpolateColors, Easing, Audio, staticFile, Sequence} from 'remotion';
import React from 'react';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/instrument-serif/400-italic.css';
import T from './timeline.json';

const FPS = T.fps;
const DUR = Math.ceil(T.total * FPS);
const BLUE = '#2c5bd8';
const SANS = 'Manrope, sans-serif';
const SERIF = '"Instrument Serif", serif';

// ---------- config editável ----------
const CFG = {
  left: 'CANAL CURIOSO / CIÊNCIA & NATUREZA',
  right: 'POR QUE A GALINHA CACAREJA?',
  handle: '@seucanal',
  tag: 'CURIOSIDADE',
};
const CHIPS = {
  risk: ['01', 'O momento do ovo'],
  pred: ['02', 'Despistar predadores'],
  flock: ['03', 'Chamar o bando'],
  rooster: ['04', 'Afastar o galo'],
  myth: ['05', 'Mitos'],
};

// ---------- helpers ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const sec = (s) => Math.round(s * FPS);
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
// scenes: first/last sentence time
const scenes = {};
T.sentences.forEach((s, i) => {
  const sc = scenes[s.scene] || (scenes[s.scene] = {start: s.start, end: s.end, idx: []});
  sc.end = s.end;
  sc.idx.push(i);
});
const order = ['hook', 'timer', 'risk', 'pred', 'flock', 'rooster', 'myth', 'end', 'cta'];
order.forEach((k, i) => {
  const next = order[i + 1];
  scenes[k].to = next ? scenes[next].start : T.total;
});
const sAt = (i) => sec(T.sentences[i].start); // frame where sentence i starts

// ---------- desenhos ----------
const ChickenHead = ({mouth = 0, blink = 0}) => (
  <>
    <path d="M70 52 q10-34 22-6 q8-30 20 0 q12-26 18 8 z" fill="#e5413b" />
    <ellipse cx="100" cy="118" rx="66" ry="64" fill="#fffaf0" stroke="#1d1d1f" strokeWidth="5" />
    <ellipse cx="78" cy="104" rx="9" ry={11 * (1 - blink) + 1.5} fill="#1d1d1f" />
    <ellipse cx="122" cy="104" rx="9" ry={11 * (1 - blink) + 1.5} fill="#1d1d1f" />
    {blink < 0.5 && <><circle cx="81" cy="100" r="3.5" fill="#fff" /><circle cx="125" cy="100" r="3.5" fill="#fff" /></>}
    <path d={`M84 124 L100 ${118 - mouth * 4} L116 124 L100 ${134 + mouth * 14} Z`} fill="#f5a623" stroke="#1d1d1f" strokeWidth="4" strokeLinejoin="round" />
    <path d="M93 140 q7 22 14 0" fill="#e5413b" />
    <ellipse cx="60" cy="130" rx="10" ry="6" fill="#ffb3a7" opacity=".7" />
    <ellipse cx="140" cy="130" rx="10" ry="6" fill="#ffb3a7" opacity=".7" />
  </>
);
const blinkAt = (f, seed) => {
  const ph = (f + seed * 17) % 84;
  return ph < 5 ? Math.sin((ph / 5) * Math.PI) : 0;
};
// cabeça de galinha com piscada e balanço
const Chicken = ({size = 200, mouth = 0, flip = false, seed = 0}) => {
  const f = useCurrentFrame();
  const sd = seed + (flip ? 3 : 0) + (size % 7);
  const tilt = Math.sin(f / 13 + sd) * 4;
  const bob = Math.sin(f / 9 + sd) * 2.5;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{transform: flip ? 'scaleX(-1)' : undefined, overflow: 'visible'}}>
      <g transform={`translate(0 ${bob}) rotate(${tilt} 100 170)`}>
        <ChickenHead mouth={mouth} blink={blinkAt(f, sd)} />
      </g>
    </svg>
  );
};
// galinha de corpo inteiro: asas, pernas, cabeça
const ChickenFull = ({w = 420, flap = 0, mouth = 0, squash = [1, 1]}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 7) * 3 * (1 - flap * 0.5);
  const wing = flap * (0.5 + 0.5 * Math.sin(f * 1.5)) * 38 + Math.sin(f / 10) * 3;
  const step = Math.sin(f / 6) * 2;
  return (
    <svg width={w} height={(w * 270) / 240} viewBox="0 0 240 270" style={{overflow: 'visible', transformOrigin: '50% 100%', transform: `scale(${squash[0]}, ${squash[1]})`}}>
      <g stroke="#f5a623" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d={`M100 212 L${97 + step} 252 M${97 + step} 252 l-13 6 M${97 + step} 252 l11 6`} />
        <path d={`M142 212 L${145 - step} 252 M${145 - step} 252 l-11 6 M${145 - step} 252 l13 6`} />
      </g>
      <g transform={`rotate(${Math.sin(f / 8) * 4} 60 150)`}>
        <path d="M58 150 q-38 -36 -22 -78 q14 30 34 40 q-16 -40 8 -62 q8 40 30 58 z" fill="#fffaf0" stroke="#1d1d1f" strokeWidth="5" strokeLinejoin="round" />
      </g>
      <path d="M36 138 Q30 222 122 224 Q206 224 212 158 Q214 112 186 92 Q168 128 120 124 Q62 118 36 138 Z" fill="#fffaf0" stroke="#1d1d1f" strokeWidth="5" strokeLinejoin="round" />
      <path d="M70 196 q12 8 24 0 q12 8 24 0 q12 8 24 0" fill="none" stroke="#e8dcc4" strokeWidth="4" strokeLinecap="round" />
      <g transform={`rotate(${-wing} 168 150)`}>
        <path d="M168 146 Q120 130 86 150 Q78 172 96 184 Q104 176 112 186 Q122 176 132 186 Q142 174 152 180 Q172 168 168 146 Z" fill="#efe3cb" stroke="#1d1d1f" strokeWidth="5" strokeLinejoin="round" />
      </g>
      <g transform={`translate(0 ${bob})`}>
        <svg x="96" y="-14" width="132" height="132" viewBox="0 0 200 200" overflow="visible">
          <g transform={`rotate(${Math.sin(f / 11) * 5 + flap * Math.sin(f * 0.9) * 6} 100 170)`}>
            <ChickenHead mouth={mouth} blink={blinkAt(f, 2)} />
          </g>
        </svg>
      </g>
    </svg>
  );
};
const Rooster = ({size = 180}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
    <path d="M58 60 q6-44 22-12 q6-44 22-6 q10-40 22 0 q14-30 18 14 z" fill="#d62f2a" />
    <ellipse cx="100" cy="120" rx="64" ry="62" fill="#f3d9a4" stroke="#1d1d1f" strokeWidth="5" />
    <path d="M70 100 l18 6 M130 100 l-18 6" stroke="#1d1d1f" strokeWidth="6" strokeLinecap="round" />
    <ellipse cx="80" cy="114" rx="7" ry="8" fill="#1d1d1f" />
    <ellipse cx="120" cy="114" rx="7" ry="8" fill="#1d1d1f" />
    <path d="M86 130 L100 124 L114 130 L100 142 Z" fill="#f5a623" stroke="#1d1d1f" strokeWidth="4" />
    <path d="M90 146 q10 34 20 0" fill="#d62f2a" />
  </svg>
);
const Fox = ({size = 150}) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <path d="M30 40 L70 80 L130 80 L170 40 L160 120 Q100 190 40 120 Z" fill="#f07b2c" stroke="#1d1d1f" strokeWidth="5" strokeLinejoin="round" />
    <path d="M60 120 Q100 175 140 120 Q100 140 60 120 Z" fill="#fff" />
    <ellipse cx="78" cy="104" rx="7" ry="9" fill="#1d1d1f" />
    <ellipse cx="122" cy="104" rx="7" ry="9" fill="#1d1d1f" />
    <circle cx="100" cy="142" r="8" fill="#1d1d1f" />
  </svg>
);
const Egg = ({size = 80}) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 80 100">
    <path d="M40 4 C70 4 76 60 76 66 C76 88 60 98 40 98 C20 98 4 88 4 66 C4 60 10 4 40 4 Z" fill="#fff3dc" stroke="#1d1d1f" strokeWidth="4" />
    <ellipse cx="28" cy="40" rx="6" ry="12" fill="#fff" />
  </svg>
);
const Nest = ({w = 240}) => (
  <svg width={w} height={w * 0.4} viewBox="0 0 240 96">
    <path d="M10 30 Q120 120 230 30 Q220 90 120 92 Q20 90 10 30 Z" fill="#c8954f" stroke="#1d1d1f" strokeWidth="4" />
    <path d="M30 50 l40 16 M90 70 l50 -6 M160 64 l50 -18 M50 72 l30 -20" stroke="#8a5d24" strokeWidth="4" strokeLinecap="round" />
  </svg>
);
const Avatar = ({size = 96, dark, children}) => (
  <div style={{width: size, height: size, borderRadius: '50%', background: dark ? '#1b2235' : '#fff', border: `4px solid ${dark ? '#3a4560' : '#1d1d1f'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,.12)'}}>
    {children || <Chicken size={size * 0.95} />}
  </div>
);
const Card = ({children, style, dark}) => (
  <div style={{background: dark ? '#141b2d' : '#fff', border: `2px solid ${dark ? '#2a3550' : '#e3e7ef'}`, borderRadius: 28, boxShadow: dark ? '0 20px 60px rgba(0,0,0,.4)' : '0 20px 60px rgba(30,40,80,.12)', ...style}}>
    {children}
  </div>
);
const Window = ({title, children, style, dark}) => (
  <Card dark={dark} style={{overflow: 'hidden', ...style}}>
    <div style={{height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', borderBottom: `2px solid ${dark ? '#2a3550' : '#eef0f5'}`, background: dark ? '#10162a' : '#f7f8fb'}}>
      {[0, 1, 2].map((i) => <div key={i} style={{width: 14, height: 14, borderRadius: 7, background: dark ? '#2f3a55' : '#d9dde6'}} />)}
      <div style={{flex: 1, textAlign: 'center', fontSize: 22, fontFamily: 'monospace', color: dark ? '#7f8bab' : '#666', marginRight: 60}}>{title}</div>
    </div>
    {children}
  </Card>
);
const Pill = ({children, dark, style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 30px', borderRadius: 999, background: dark ? '#141b2d' : '#fff', border: `2px solid ${dark ? '#2a3550' : '#dfe3ec'}`, fontSize: 32, fontWeight: 700, color: dark ? '#e8ecf6' : '#1d1d1f', boxShadow: '0 6px 18px rgba(0,0,0,.06)', ...style}}>
    {children}
  </div>
);
const Waves = ({x, y, f, color = BLUE, flip}) => (
  <svg width="160" height="200" style={{position: 'absolute', left: x, top: y, transform: flip ? 'scaleX(-1)' : undefined}} viewBox="0 0 160 200">
    {[0, 1, 2].map((i) => {
      const o = (Math.sin(f / 4 - i) + 1) / 2;
      return <path key={i} d={`M${30 + i * 36} ${60 - i * 22} Q${70 + i * 40} 100 ${30 + i * 36} ${140 + i * 22}`} stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" opacity={0.25 + o * 0.75} />;
    })}
  </svg>
);
const Bubble = ({text, at, style, dark}) => {
  const f = useCurrentFrame();
  const shake = Math.sin(f * 0.6) * 1.2;
  return (
    <Pop at={at} style={{position: 'absolute', ...style}}>
      <div style={{transform: `rotate(${shake}deg)`, background: dark ? BLUE : '#1d1d1f', color: '#fff', fontWeight: 800, fontSize: 34, padding: '12px 24px', borderRadius: 18, fontFamily: SANS}}>{text}</div>
    </Pop>
  );
};

// ---------- legenda palavra a palavra (tamanho dinâmico) ----------
const Caption = ({dark}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / FPS;
  const si = T.sentences.findIndex((s, i) => t >= s.start - 0.05 && t < (T.sentences[i + 1]?.start ?? 999) - 0.05);
  if (si < 0) return null;
  const s = T.sentences[si];
  const groups = [];
  const ng = Math.ceil(s.words.length / 4), per = Math.ceil(s.words.length / ng);
  s.words.forEach((w, i) => {
    if (i % per === 0) groups.push([]);
    groups[groups.length - 1].push(w);
  });
  let g = groups.findIndex((gr, i) => t < (groups[i + 1]?.[0].s ?? 999));
  if (g < 0) g = groups.length - 1;
  const L = groups[g].reduce((a, w) => a + w.w.length + 1, 0);
  const size = Math.round(Math.max(58, Math.min(104, 122 - L * 2.7)));
  return (
    <div style={{position: 'absolute', top: 150, left: 60, right: 60, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', alignContent: 'center', fontFamily: SANS, fontSize: size, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1}}>
      {groups[g].map((w, i) => {
        const wf = Math.round(w.s * FPS);
        const p = spring({frame: f - wf, fps, config: {damping: 11, stiffness: 200}});
        const on = f >= wf;
        const k = w.k && on;
        const kp = interpolate(f - wf, [0, 6], [0, 1], clamp);
        const sc = 0.55 + 0.45 * p;
        return (
          <span key={i} style={{margin: `0 ${size * (w.k ? 0.3 : 0.16)}px`, fontSize: w.k ? size * 1.2 : size, display: 'inline-block', position: 'relative', color: on ? (dark ? '#f2f4fa' : '#15161a') : dark ? 'rgba(120,135,170,.35)' : 'rgba(30,35,50,.18)', transform: on ? `translateY(${(1 - p) * 34}px) scale(${sc}) rotate(${w.k ? -2 * p : 0}deg)` : 'scale(.92)'}}>
            {k && (
              <span style={{position: 'absolute', left: -12, right: -12, top: 0, bottom: 0, border: `4px solid ${BLUE}`, background: dark ? 'rgba(44,91,216,.3)' : 'rgba(44,91,216,.1)', transform: `scaleX(${kp})`, transformOrigin: 'left', borderRadius: 6}}>
                <span style={{position: 'absolute', right: -8, bottom: -8, width: 14, height: 14, borderRadius: 7, background: BLUE}} />
                <span style={{position: 'absolute', left: -8, top: -8, width: 14, height: 14, borderRadius: 7, background: BLUE}} />
              </span>
            )}
            <span style={{position: 'relative', color: k ? (dark ? '#fff' : BLUE) : undefined}}>{w.w}</span>
          </span>
        );
      })}
    </div>
  );
};



// ---------- ovo caindo ----------
const EGG1 = sec(1.0), EGG2 = sAt(3) + 8, FALL = 13;
const FallingEgg = ({at, x, y0, y1, size}) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0) return null;
  let y, sx = 1, sy = 1;
  if (t <= FALL) {
    const p = t / FALL;
    y = y0 + (y1 - y0) * p * p;
    sy = 1 + 0.12 * p; sx = 1 - 0.06 * p;
  } else {
    const b = t - FALL;
    y = y1 - 14 * Math.exp(-b / 7) * Math.abs(Math.sin((b * Math.PI) / 10));
    const sq = Math.exp(-b / 3) + 0.6 * Math.exp(-Math.abs(b - 10) / 2) * (b > 8 ? 1 : 0);
    sy = 1 - 0.14 * Math.min(1, sq); sx = 1 + 0.1 * Math.min(1, sq);
  }
  const grow = interpolate(t, [0, 4], [0.5, 1], clamp);
  const near = 1 - Math.min(1, (y1 - y) / 160);
  const h = size * 1.25;
  return (
    <>
      <div style={{position: 'absolute', left: x + size * 0.1 + (1 - near) * size * 0.2, top: y1 + h - 10, width: size * (0.8 - (1 - near) * 0.4), height: 16, borderRadius: '50%', background: 'rgba(20,30,60,.18)', opacity: near}} />
      <div style={{position: 'absolute', left: x, top: y, transformOrigin: '50% 100%', transform: `scale(${grow * sx}, ${grow * sy})`}}><Egg size={size} /></div>
    </>
  );
};

// ---------- cenas ----------
const SceneHook = () => {
  const f = useCurrentFrame();
  const s2 = sAt(1);
  const c1 = sec(1.3), c2 = sec(1.8) + 20;
  const flap = Math.max(interpolate(f, [c1 - 2, c1 + 3, c1 + 36, c1 + 42], [0, 1, 1, 0], clamp), interpolate(f, [c2 - 2, c2 + 3, c2 + 26, c2 + 32], [0, 1, 1, 0], clamp));
  return (
    <AbsoluteFill>
      <Pop at={4} style={{position: 'absolute', left: 300, top: 600}}>
        <ChickenFull w={420} flap={flap} mouth={flap * (Math.sin(f / 1.6) + 1) / 2}
          squash={[interpolate(f, [EGG1 - 8, EGG1 - 1, EGG1 + 4, EGG1 + 12], [1, 1.04, 0.97, 1], clamp), interpolate(f, [EGG1 - 8, EGG1 - 1, EGG1 + 4, EGG1 + 12], [1, 0.93, 1.03, 1], clamp)]} />
      </Pop>
      <FallingEgg at={EGG1} x={500} y0={1010} y1={1190} size={100} />
      <Bubble at={sec(1.3)} text="CÓ CÓ CÓ!" style={{left: 140, top: 560}} />
      <Bubble at={sec(1.8)} text="CÓ-CÓ-CÓ-CÓÓ!" style={{left: 690, top: 700}} />
      <Waves x={170} y={780} f={f} flip />
      <Waves x={760} y={830} f={f} />
      {f >= s2 && (
        <Pop at={s2} style={{position: 'absolute', left: 0, right: 0, top: 1290, textAlign: 'center'}}>
          <Pill style={{fontSize: 44}}>
            <span style={{textDecoration: 'line-through', textDecorationColor: '#e5413b', textDecorationThickness: 6}}>Orgulho</span>
            <span style={{color: '#e5413b'}}>✕</span>
          </Pill>
        </Pop>
      )}
    </AbsoluteFill>
  );
};

const SceneTimer = () => {
  const st = sec(scenes.timer.start);
  return (
    <AbsoluteFill>
      <Pop at={st} style={{position: 'absolute', left: 130, top: 640}}>
        <Window title="pergunta.do-dia" style={{width: 820}}>
          <div style={{padding: '40px 44px', fontFamily: SANS}}>
            <div style={{fontSize: 26, color: '#888', fontWeight: 700, letterSpacing: 2}}>PERGUNTA</div>
            <div style={{fontSize: 56, fontWeight: 800, lineHeight: 1.15, marginTop: 14}}>Por que a galinha cacareja depois de botar ovo?</div>
            <div style={{display: 'flex', gap: 16, marginTop: 30}}>
              {['3 hipóteses', '1 mito', '0 enrolação'].map((x, i) => (
                <Pop key={i} at={st + 10 + i * 6}><Pill style={{fontSize: 26, padding: '10px 22px'}}>{x}</Pill></Pop>
              ))}
            </div>
          </div>
        </Window>
      </Pop>
      <Pop at={st + 8} from={0.2} style={{position: 'absolute', left: 800, top: 560}}>
        <div style={{width: 210, height: 210, borderRadius: 105, background: BLUE, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, boxShadow: '0 16px 40px rgba(44,91,216,.45)', border: '8px solid #fff'}}>
          <div style={{fontSize: 84, fontWeight: 800, lineHeight: 1}}>40</div>
          <div style={{fontSize: 22, fontWeight: 800, letterSpacing: 2}}>SEGUNDOS</div>
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

const SceneRisk = () => {
  const f = useCurrentFrame();
  const st = sec(scenes.risk.start);
  const s2 = sAt(4);
  const away = interpolate(f, [s2, s2 + 40], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Pop at={st} style={{position: 'absolute', left: 110, top: 720}}>
        <Window title="ninho.cam • AO VIVO" style={{width: 860, height: 560}}>
          <div style={{position: 'relative', height: 500}}>
            <div style={{position: 'absolute', left: 50, top: 120, transform: `translate(${interpolate(f, [EGG2 - 8, EGG2, EGG2 + 30, EGG2 + 45], [0, -10, -10, -40], clamp)}px, ${interpolate(f, [EGG2 - 8, EGG2, EGG2 + 30, EGG2 + 45], [0, -70, -70, -50], clamp)}px)`}}><Chicken size={220} /></div>
            <FallingEgg at={EGG2} x={140} y0={200} y1={282} size={60} />
            <div style={{position: 'absolute', left: 40, top: 300}}><Nest w={260} /></div>
            <div style={{position: 'absolute', right: 30, top: 24, display: 'flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontWeight: 800, fontSize: 24, color: '#e5413b'}}>
              <div style={{width: 16, height: 16, borderRadius: 8, background: '#e5413b', opacity: f % 30 < 15 ? 1 : 0.3}} /> REC
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{position: 'absolute', left: 430 + i * 130 + away * 60, top: 150 + (i % 2) * 110, opacity: 1 - away * 0.6, transform: `scale(${0.85 - away * 0.3})`}}>
                <Chicken size={160} flip />
              </div>
            ))}
          </div>
        </Window>
      </Pop>
      {['sozinha', 'parada', 'vulnerável'].map((x, i) => (
        <Pop key={i} at={s2 + 20 + i * 10} style={{position: 'absolute', top: 1320, left: 120 + i * 290}}>
          <Pill style={{fontSize: 30, color: i === 2 ? '#e5413b' : undefined}}>{i === 2 ? '⚠ ' : ''}{x}</Pill>
        </Pop>
      ))}
    </AbsoluteFill>
  );
};

const HypPill = ({n, at, dark}) => (
  <Pop at={at} style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center'}}>
    <Pill dark={dark}><span style={{color: BLUE}}>{n}/3</span> hipóteses</Pill>
  </Pop>
);

const Node = ({children, label, sub, dark, style}) => (
  <div style={{position: 'absolute', ...style}}>
    <Card dark={dark} style={{width: 220, height: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `3px solid ${BLUE}`, borderRadius: 30}}>
      {children}
      {label && <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, marginTop: 6, color: dark ? '#fff' : '#1d1d1f'}}>{label}</div>}
      {sub && <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 18, marginTop: 6, color: BLUE, background: 'rgba(44,91,216,.1)', padding: '4px 12px', borderRadius: 8}}>{sub}</div>}
    </Card>
  </div>
);

const ScenePred = () => {
  const f = useCurrentFrame();
  const st = sec(scenes.pred.start);
  const s2 = sAt(6), s3 = sAt(7);
  const move = interpolate(f, [s2, s2 + 25], [0, 1], clamp);
  const fx = interpolate(f, [s3 + 5, s3 + 45], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Pop at={st + 5} style={{position: 'absolute', left: 120, top: 760}}>
        <Node label="Ninho" sub="ovo aqui"><Egg size={70} /></Node>
      </Pop>
      <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0}}>
        <line x1="340" y1="875" x2={340 + move * 300} y2="875" stroke={BLUE} strokeWidth="5" strokeDasharray="14 12" />
        {fx > 0 && <path d={`M540 1360 Q ${560 + fx * 40} 1150 ${540 + fx * 140} ${1360 - fx * 330}`} stroke="#e5413b" strokeWidth="6" fill="none" strokeDasharray="16 12" />}
      </svg>
      {move > 0.02 && (
        <div style={{position: 'absolute', left: 120 + move * 520, top: 760, opacity: move}}>
          <Node label="Galinha" sub="faz barulho"><Chicken size={120} mouth={(Math.sin(f / 2) + 1) / 2} /></Node>
          <Waves x={210} y={-10} f={f} />
        </div>
      )}
      {f >= s3 && (
        <Pop at={s3} style={{position: 'absolute', left: 420, top: 1300}}>
          <Node label="Predador" sub="segue o som"><Fox size={120} /></Node>
        </Pop>
      )}
      {fx >= 1 && (
        <Pop at={s3 + 45} style={{position: 'absolute', left: 90, top: 1080}}>
          <Pill style={{fontSize: 28}}>🥚 ovo seguro</Pill>
        </Pop>
      )}
    </AbsoluteFill>
  );
};

const SceneFlock = () => {
  const f = useCurrentFrame();
  const st = sec(scenes.flock.start);
  const s2 = sAt(9);
  const cx = 540, cy = 1060;
  const pos = [[-300, -260], [300, -260], [-300, 260], [300, 260]];
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0}}>
        <circle cx={cx} cy={cy} r={330} stroke="#d6dbe6" strokeWidth="3" fill="none" strokeDasharray="10 12" />
        {pos.map(([dx, dy], i) => {
          const p = interpolate(f, [s2 + i * 8, s2 + i * 8 + 12], [0, 1], clamp);
          return <line key={i} x1={cx} y1={cy} x2={cx + dx * p} y2={cy + dy * p} stroke={BLUE} strokeWidth="5" />;
        })}
      </svg>
      <Pop at={st + 4} style={{position: 'absolute', left: cx - 110, top: cy - 115}}>
        <Node label="Ela" sub="CÓ CÓ CÓ!"><Chicken size={120} mouth={(Math.sin(f / 2) + 1) / 2} /></Node>
      </Pop>
      {pos.map(([dx, dy], i) => (
        <Pop key={i} at={s2 + i * 8 + 10} style={{position: 'absolute', left: cx + dx - 85, top: cy + dy - 85}}>
          <Card style={{width: 170, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 26}}>
            <Chicken size={120} flip={dx > 0} mouth={(Math.sin(f / 2 + i) + 1) / 2} />
          </Card>
          <div style={{position: 'absolute', top: -30, right: -30, background: '#1d1d1f', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 24, padding: '6px 14px', borderRadius: 12}}>CÓ!</div>
        </Pop>
      ))}
    </AbsoluteFill>
  );
};

const SceneRooster = () => {
  const f = useCurrentFrame();
  const st = sec(scenes.rooster.start);
  const s2 = sAt(11), s3 = sAt(12);
  const rows = [
    ['Postura concluída', '✓', s2 - 10, '#3ecf8e'],
    ['Chance de fecundação', 'BAIXA', s2 + 20, '#f5a623'],
    ['Cacarejo ativado', 'ON', s3, BLUE],
    ['Atenção dos machos', '↓ menos', s3 + 25, '#e5413b'],
  ];
  return (
    <AbsoluteFill>
      <Pop at={st + 6} style={{position: 'absolute', left: 120, top: 700}}>
        <Window title="relatório.galinheiro" style={{width: 840}}>
          <div style={{padding: '24px 36px 36px', fontFamily: SANS}}>
            {rows.map(([a, b, at, c], i) => {
              const on = f >= at;
              const p = interpolate(f, [at, at + 8], [0, 1], clamp);
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0', borderBottom: i < 3 ? '2px solid #eef0f5' : 'none', opacity: 0.35 + p * 0.65}}>
                  <div style={{fontSize: 34, fontWeight: 700, color: '#1d1d1f'}}>{a}</div>
                  <div style={{fontSize: 28, fontWeight: 800, color: on ? '#fff' : '#aab0bf', background: on ? c : '#f0f2f7', padding: '8px 18px', borderRadius: 10, transform: `scale(${0.8 + p * 0.2})`}}>{on ? b : '...'}</div>
                </div>
              );
            })}
          </div>
        </Window>
      </Pop>
      <Pop at={st + 14} style={{position: 'absolute', left: 140, top: 1300}}>
        <Avatar size={190}><Rooster size={170} /></Avatar>
      </Pop>
      {f >= s3 + 25 && (
        <Pop at={s3 + 25} style={{position: 'absolute', left: 370, top: 1350}}>
          <Pill style={{fontSize: 30}}>🐓 “deixa ela quieta”</Pill>
        </Pop>
      )}
    </AbsoluteFill>
  );
};

const SceneMyth = () => {
  const f = useCurrentFrame();
  const st = sec(scenes.myth.start);
  const s2 = sAt(14), s3 = sAt(15);
  const Item = ({q, a, at, stampAt, y}) => {
    const sp = usePop(stampAt, 9);
    return (
      <Pop at={at} style={{position: 'absolute', left: 120, top: y}}>
        <Card style={{width: 840, padding: '36px 40px', fontFamily: SANS, position: 'relative'}}>
          <div style={{fontSize: 24, fontWeight: 800, color: '#999', letterSpacing: 2}}>MITO</div>
          <div style={{fontSize: 48, fontWeight: 800, marginTop: 8}}>{q}</div>
          {f >= stampAt && (
            <div style={{position: 'absolute', right: 30, top: 34, transform: `rotate(-8deg) scale(${2 - sp})`, opacity: sp, border: '5px solid #e5413b', color: '#e5413b', fontWeight: 800, fontSize: 30, padding: '8px 18px', borderRadius: 12}}>{a}</div>
          )}
        </Card>
      </Pop>
    );
  };
  return (
    <AbsoluteFill>
      <Item q="Ela grita de dor?" a="SEM EVIDÊNCIA" at={st} stampAt={s2 + 10} y={720} />
      <Item q="Toda galinha cacareja?" a="NÃO" at={s3 - 4} stampAt={s3 + 18} y={1010} />
    </AbsoluteFill>
  );
};

const SceneEnd = () => {
  const f = useCurrentFrame();
  const st = sec(scenes.end.start);
  const s2 = sAt(17);
  return (
    <AbsoluteFill>
      <Pop at={st} style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 96, color: '#1d1d1f'}}>
        Não é orgulho.
      </Pop>
      {f >= s2 && (
        <Pop at={s2} style={{position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 110, color: BLUE}}>
          → é estratégia.
        </Pop>
      )}
      <Pop at={st + 8} style={{position: 'absolute', left: 390, top: 1000}}>
        <Avatar size={300}><Chicken size={280} /></Avatar>
      </Pop>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + f / 60;
        return (
          <Pop key={i} at={s2 + i * 4} style={{position: 'absolute', left: 540 + Math.cos(a) * 330 - 60, top: 1150 + Math.sin(a) * 200 - 60}}>
            <Avatar size={120}>{i % 3 === 2 ? <Egg size={60} /> : <Chicken size={110} flip={i % 2 === 1} />}</Avatar>
          </Pop>
        );
      })}
    </AbsoluteFill>
  );
};

const SceneCta = () => {
  const f = useCurrentFrame();
  const st = sec(scenes.cta.start);
  const s2 = sAt(19);
  return (
    <AbsoluteFill>
      <Pop at={st} style={{position: 'absolute', left: 430, top: 560}}>
        <Avatar size={220}><Chicken size={200} mouth={(Math.sin(f / 3) + 1) / 2} /></Avatar>
      </Pop>
      <Pop at={st + 6} style={{position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 84, lineHeight: 1.05}}>
        Qual hipótese<br />você acha que é?
      </Pop>
      {['1  Despistar predadores', '2  Chamar o bando', '3  Afastar o galo'].map((x, i) => (
        <Pop key={i} at={s2 + i * 7} style={{position: 'absolute', left: 0, right: 0, top: 1060 + i * 110, textAlign: 'center'}}>
          <Pill style={{fontSize: 36, minWidth: 560, justifyContent: 'flex-start'}}><span style={{color: BLUE}}>{x.slice(0, 1)}</span>{x.slice(1)}</Pill>
        </Pop>
      ))}
      {f >= s2 + 20 && (
        <Pop at={s2 + 20} style={{position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 92, color: BLUE}}>
          comenta aí ↓
        </Pop>
      )}
    </AbsoluteFill>
  );
};



// ---------- letreiros (texto da animação) ----------
const LETS = {
  hook: [[sAt(0) + 4, 'TODA GALINHA FAZ UM', '*ESCÂNDALO*'], [sAt(1), 'MAS', 'não é *orgulho*']],
  risk: [[sAt(3) + 6, 'BOTAR OVO É UM', 'momento de *risco*'], [sAt(4) + 6, 'A GALINHA FICA', '*sozinha* no ninho']],
  pred: [[sAt(5) + 4, 'HIPÓTESE 1', 'despistar *predadores*'], [sAt(6) + 4, 'ELA FAZ BARULHO', '*longe* do ninho'], [sAt(7) + 4, 'O PREDADOR SEGUE', 'o *som*, não o ovo']],
  flock: [[sAt(8) + 4, 'HIPÓTESE 2', 'chamar o *bando*'], [sAt(9) + 10, 'E AS OUTRAS', '*respondem*']],
  rooster: [[sAt(10) + 4, 'HIPÓTESE 3', 'afastar o *galo*'], [sAt(12) + 4, 'O CACAREJO =', '*menos* atenção']],
  myth: [[sAt(13) + 4, 'E NÃO', 'não é *dor*'], [sAt(15) + 4, 'E NEM TODA', 'galinha *cacareja*']],
};
const LetLine = ({item, out}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [at, kicker, main] = item;
  const words = main.split(' ');
  const len = main.replace(/\*/g, '').length;
  const size = Math.round(Math.max(68, Math.min(150, 168 - len * 5)));
  const kp = spring({frame: f - at, fps, config: {damping: 14}});
  return (
    <div style={{position: 'absolute', top: 150, left: 70, right: 70, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, opacity: 1 - out, transform: `translateY(${-out * 60}px) scale(${1 - out * 0.08})`}}>
      {kicker && <div style={{fontSize: 30, fontWeight: 800, letterSpacing: 6, color: 'rgba(30,35,50,.45)', opacity: kp, transform: `translateY(${(1 - kp) * 20}px)`, marginBottom: 14}}>{kicker}</div>}
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', fontSize: size, fontWeight: 800, letterSpacing: -2, lineHeight: 1.08}}>
        {words.map((w, i) => {
          const k = w.startsWith('*');
          const txt = w.replace(/\*/g, '');
          const wf = at + 3 + i * 3;
          const p = spring({frame: f - wf, fps, config: {damping: 18, stiffness: 170}});
          const bx = interpolate(f - wf - 3, [0, 7], [0, 1], clamp);
          return (
            <span key={i} style={{position: 'relative', display: 'inline-block', margin: `0 ${size * (k ? 0.3 : 0.13)}px`, color: k ? BLUE : '#15161a', opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 22}px) scale(${0.82 + 0.18 * p}) rotate(${k ? -1.5 * p : 0}deg)`}}>
              {k && (
                <span style={{position: 'absolute', left: -14, right: -14, top: 2, bottom: 2, border: `4px solid ${BLUE}`, background: 'rgba(44,91,216,.08)', transform: `scaleX(${bx})`, transformOrigin: 'left', borderRadius: 8}}>
                  <span style={{position: 'absolute', left: -9, top: -9, width: 16, height: 16, borderRadius: 8, background: BLUE}} />
                  <span style={{position: 'absolute', right: -9, bottom: -9, width: 16, height: 16, borderRadius: 8, background: BLUE}} />
                </span>
              )}
              <span style={{position: 'relative'}}>{txt}</span>
            </span>
          );
        })}
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

// ---------- efeitos sonoros ----------
const buildSfx = () => {
  const E = [];
  let pc = 0;
  const POPS = ['pop_a', 'pop_b', 'pop_c', 'pop_d'];
  const add = (name, frame, vol = 0.5) => E.push({name: name === 'pop' ? POPS[pc++ % 4] : name, frame: Math.max(0, Math.round(frame)), vol});
  const st = (k) => sec(scenes[k].start);
  ['timer', 'risk', 'pred', 'flock', 'rooster', 'myth', 'end', 'cta'].forEach((k) => add('whoosh', st(k) - 10, 0.32));
  Object.values(LETS).forEach((L) => L.forEach(([at, , main]) => {
    add('pop', at, 0.3);
    main.split(' ').forEach((w, i) => w.startsWith('*') && add('popk', at + 3 + i * 3, 0.45));
  }));
  // hook
  add('whoosh', 0, 0.3); add('pop', 4, 0.55); add('bubble', EGG1, 0.45); add('pop_c', EGG1 + FALL, 0.55); add('hit', EGG1 + FALL, 0.45); add('tick', EGG1 + FALL + 10, 0.25);
  add('bubble', EGG2, 0.35); add('pop_c', EGG2 + FALL, 0.45); add('hit', EGG2 + FALL, 0.3);
  add('cacarejo', sec(1.3), 0.75); add('co', sec(1.8) + 20, 0.6); add('hit', sAt(1), 0.45); add('pop', sAt(1), 0.5);
  // timer
  add('ding', st('timer') + 8, 0.35); add('hit', st('timer') + 8, 0.25); [10, 16, 22].forEach((d) => add('pop', st('timer') + d, 0.4));
  // risco
  add('pop', st('risk'), 0.45); [20, 30, 40].forEach((d) => add('pop', sAt(4) + d, 0.4));
  // predadores
  add('pop', st('pred'), 0.4); add('pop', st('pred') + 5, 0.45);
  add('whoosh', sAt(6), 0.25); add('co', sAt(6) + 6, 0.65); add('hit', sAt(7), 0.35); add('pop', sAt(7), 0.5); add('ding', sAt(7) + 45, 0.3);
  // bando
  add('pop', st('flock'), 0.4); add('cacarejo', st('flock') + 4, 0.6);
  [0, 1, 2, 3].forEach((i) => { add('pop', sAt(9) + i * 8 + 10, 0.4); add('cluck', sAt(9) + i * 8 + 12, 0.55); });
  // galo
  add('hit', st('rooster'), 0.3); add('pop', st('rooster'), 0.4); add('pop', st('rooster') + 6, 0.4); add('pop', st('rooster') + 14, 0.45);
  [sAt(11) - 10, sAt(11) + 20, sAt(12), sAt(12) + 25].forEach((f) => add('type', f - 6, 0.45));
  add('pop', sAt(12) + 25, 0.45);
  // mitos
  add('pop', st('myth'), 0.45); add('stamp', sAt(14) + 10, 0.7); add('pop', sAt(15) - 4, 0.45); add('stamp', sAt(15) + 18, 0.7);
  // final
  add('pop', st('end'), 0.5); add('hit', sAt(17), 0.45); add('sparkle', sAt(17) + 6, 0.35); add('pop', st('end') + 8, 0.45);
  [0, 1, 2, 3, 4, 5].forEach((i) => add('bubble', sAt(17) + i * 4, 0.3));
  // cta
  add('cluck', st('cta'), 0.55); add('pop', st('cta') + 6, 0.45);
  [0, 1, 2].forEach((i) => add('pop', sAt(19) + i * 7, 0.45)); add('ding', sAt(19) + 20, 0.4); add('sparkle', sAt(19) + 22, 0.25);
  return E;
};
const SFX = buildSfx();
const Sfx = () => <>{SFX.map((e, i) => <Sequence key={i} from={e.frame} durationInFrames={45}><Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.vol} /></Sequence>)}</>;


const SCENES = {hook: SceneHook, timer: SceneTimer, risk: SceneRisk, pred: ScenePred, flock: SceneFlock, rooster: SceneRooster, myth: SceneMyth, end: SceneEnd, cta: SceneCta};

// ---------- câmera passando pelo papel ----------
const CX = 540, CY = 1000;
// posição de cada cena na folha
const OFF = {hook: [0, 0], timer: [1500, 450], risk: [250, 2250], pred: [1750, 2650], flock: [150, 4600], rooster: [1650, 4950], myth: [250, 6900], end: [1750, 7250], cta: [350, 9200]};
const camKeys = () => {
  const st = (k) => sec(scenes[k].start), en = (k) => sec(scenes[k].to);
  return {
    hook: [[0, 540, 960, 1.12, -1], [sec(1.2), 540, 980, 1.04, 0], [sAt(1) + 12, 540, 1040, 1.08, 0.5], [en('hook'), 540, 1000, 1.0, 0]],
    timer: [[st('timer'), 540, 960, 1.0, 0], [st('timer') + 14, 620, 920, 1.08, 0.8], [en('timer'), 540, 950, 1.04, 0]],
    risk: [[st('risk'), 470, 980, 1.1, 0], [sAt(4) + 20, 540, 1000, 1.0, 0], [en('risk'), 540, 1040, 1.05, 0]],
    pred: [[st('pred'), 400, 960, 1.1, 0], [sAt(6) + 25, 600, 960, 1.08, 0], [sAt(7) + 22, 540, 1040, 0.98, 0], [en('pred'), 540, 1040, 1.02, 0]],
    flock: [[st('flock'), 540, 1000, 1.12, -0.8], [sAt(9) + 45, 540, 1020, 0.97, 0], [en('flock'), 540, 1020, 1.0, 0.5]],
    rooster: [[st('rooster'), 540, 960, 1.0, 0], [sAt(11), 540, 930, 1.08, 0], [sAt(12) + 25, 540, 1020, 1.04, 0], [en('rooster'), 540, 1040, 1.0, 0]],
    myth: [[st('myth'), 540, 900, 1.08, 0], [sAt(15) - 6, 540, 920, 1.08, 0], [sAt(15) + 10, 540, 1030, 1.08, 0], [en('myth'), 540, 1000, 1.02, 0]],
    end: [[st('end'), 540, 900, 1.12, -0.8], [sAt(17) + 30, 540, 1000, 1.0, 0], [en('end'), 540, 1000, 1.04, 0.5]],
    cta: [[st('cta'), 540, 880, 1.08, 0], [sAt(19) + 30, 540, 1050, 1.04, 0], [en('cta'), 540, 1050, 1.06, 0]],
  };
};
const CAM = camKeys();
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
const sceneAt = (f) => order.find((k) => f >= sec(scenes[k].start) && f < sec(scenes[k].to)) || (f < 0 ? 'hook' : order[order.length - 1]);
const W1 = 11, W2 = 11;
const canvasCam = (f) => {
  for (let i = 1; i < order.length; i++) {
    const A = order[i - 1], B = order[i];
    const b = sec(scenes[B].start);
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
const SHAKES = () => [[EGG1 + FALL, 5], [EGG2 + FALL, 3], [sAt(1), 4], [sAt(7), 4], [sAt(14) + 10, 8], [sAt(15) + 18, 8], [sAt(17), 4]];
const SHK = SHAKES();
const shakeAt = (f) => SHK.reduce(([x, y], [e, a]) => {
  const d = f - e;
  if (d < 0 || d > 24) return [x, y];
  const m = a * Math.exp(-d / 5);
  return [x + m * Math.sin(d * 2.3), y + m * Math.cos(d * 1.9)];
}, [0, 0]);

// ---------- papel ----------
const PAPER_BG = '#f6f5f1';
const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .2 0 0 0 0 .2 0 0 0 0 .25 0 0 0 .09 0'/></filter><rect width='320' height='320' filter='url(%23n)'/></svg>")`;
const GRID = 'rgba(40,60,110,.09)';

const HYP = {pred: 1, flock: 2, rooster: 3};
const SceneOnPaper = ({k}) => {
  const Scene = SCENES[k];
  const chip = CHIPS[k];
  const st = sec(scenes[k].start);
  return (
    <div style={{position: 'absolute', left: OFF[k][0], top: OFF[k][1], width: 1080, height: 1920}}>
      <Scene />
      <Letreiro k={k} />
      {chip && (
        <>
          <Pop at={st} style={{position: 'absolute', left: 70, top: 462}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, background: BLUE, color: '#fff', padding: '10px 26px 10px 12px', borderRadius: 999, fontWeight: 800, fontSize: 30, boxShadow: '0 8px 24px rgba(44,91,216,.3)'}}>
              <span style={{background: 'rgba(255,255,255,.22)', padding: '4px 12px', borderRadius: 999, fontFamily: 'monospace', fontSize: 24}}>{chip[0]}</span>{chip[1]}
            </div>
          </Pop>
          <div style={{position: 'absolute', right: 70, top: 476, fontFamily: 'monospace', fontSize: 26, color: 'rgba(30,35,50,.4)'}}>{chip[0]} / 05</div>
        </>
      )}
      {HYP[k] && <HypPill n={HYP[k]} at={st} />}
    </div>
  );
};

// ---------- moldura ----------
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
  return (
    <AbsoluteFill style={{background: PAPER_BG, fontFamily: SANS, overflow: 'hidden'}}>
      <AbsoluteFill style={{transformOrigin: '0 0', transform: `translate(${CX + sx}px, ${CY + sy}px) rotate(${r}deg) scale(${s}) translate(${-cx}px, ${-cy}px)`, filter: blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
        <div style={{position: 'absolute', left: -2000, top: -2000, width: 6000, height: 14000, backgroundColor: PAPER_BG, backgroundImage: `${NOISE}, linear-gradient(${GRID} 2px,transparent 2px), linear-gradient(90deg,${GRID} 2px,transparent 2px)`, backgroundSize: `320px 320px, 72px 72px, 72px 72px`}} />
        {vis.map((k) => <SceneOnPaper key={k} k={k} />)}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 60%, rgba(60,50,30,.10) 100%)'}} />
      <Audio src={staticFile('voz.wav')} />
      <Sfx />
    </AbsoluteFill>
  );
};


registerRoot(() => <Composition id="Galinha" component={Frame} durationInFrames={DUR} fps={FPS} width={1080} height={1920} />);
