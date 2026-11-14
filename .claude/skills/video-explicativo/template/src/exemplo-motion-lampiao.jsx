import {registerRoot, Composition, AbsoluteFill, useCurrentFrame, spring, interpolate, Easing, Audio, staticFile, Sequence} from 'remotion';
import React from 'react';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/rye/400.css';
import T from './timeline-lamp2.json';

// ---------- paleta do sertão ----------
const SAND = '#f4e3c1';
const TERRA = '#c8553d';
const MUST = '#f0a202';
const TEAL = '#1f6e6e';
const BROWN = '#2b1d14';
const CREAM = '#fff6e4';
const SKIN = '#e5b48a';
const KHAKI = '#8a6a43';
const HEAD = 'Montserrat, sans-serif';
const BODY = 'Manrope, sans-serif';
const WEST = 'Rye, serif';

const FPS = T.fps;
const DUR = Math.ceil(T.total * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const sec = (s) => Math.round(s * FPS);
const sAt = (i) => sec(T.sentences[i].start);
const norm = (w) => w.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');
const wAt = (i, w) => { const x = T.sentences[i].words.find((y) => norm(y.w) === w); return x ? sec(x.s) : sAt(i); };
const order = ['hook', 'origem', 'virada', 'apelido', 'rei', 'maria', 'fim', 'lenda', 'cta'];
const scenes = {};
T.sentences.forEach((s, i) => { (scenes[s.scene] = scenes[s.scene] || {start: s.start, idx: []}).idx.push(i); });
order.forEach((k, i) => { scenes[k].to = order[i + 1] ? scenes[order[i + 1]].start : T.total; });
const stF = (k) => sec(scenes[k].start);
const sceneAt = (f) => order.find((k) => f >= stF(k) && f < sec(scenes[k].to)) || order[order.length - 1];

// ---------- movimento ----------
const sp = (f, at, damping = 14, stiffness = 140) => spring({frame: f - at, fps: FPS, config: {damping, stiffness}});
const P = ({f, at, children, x = 0, y = 0, from = 0, rot = 0, dy = 40, style}) => {
  const p = sp(f, at);
  if (f < at - 1) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translateY(${(1 - p) * dy}px) scale(${from + (1 - from) * p}) rotate(${(1 - p) * rot}deg)`, opacity: Math.min(1, p * 2), ...style}}>{children}</div>
  );
};
const G = ({f, at, children, x = 0, y = 0, from = 0, rot = 0}) => {
  const p = sp(f, at);
  if (f < at - 1) return null;
  return <g transform={`translate(${x} ${y}) scale(${from + (1 - from) * p}) rotate(${(1 - p) * rot})`} opacity={Math.min(1, p * 2)}>{children}</g>;
};

// ---------- formas vivas de fundo ----------
const SHAPES = [...Array(16)].map((_, i) => ({
  x: (i * 263) % 1080, y: (i * 491) % 1920, s: 30 + (i * 37) % 70, k: i % 4,
  c: [TERRA, MUST, TEAL, KHAKI][i % 4], sp: 0.4 + (i % 5) * 0.15, ph: i * 1.7,
}));
const Shape = ({k, s, c}) => {
  if (k === 0) return <circle r={s / 2} fill={c} />;
  if (k === 1) return <path d={`M0 ${-s / 2} L${s / 2} ${s / 2} L${-s / 2} ${s / 2} Z`} fill={c} />;
  if (k === 2) return <rect x={-s / 2} y={-s / 6} width={s} height={s / 3} rx={s / 6} fill={c} />;
  return <path d={`M${-s / 2} 0 q${s / 4} ${-s / 3} ${s / 2} 0 t${s / 2} 0`} stroke={c} strokeWidth={s / 6} fill="none" strokeLinecap="round" />;
};
const LiveBg = ({f}) => (
  <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
    {SHAPES.map((o, i) => (
      <g key={i} transform={`translate(${o.x + Math.sin(f / 60 * o.sp + o.ph) * 40} ${(o.y - f * o.sp * 0.8 + 2200) % 2100 - 90}) rotate(${f * o.sp + i * 30})`} opacity=".22">
        <Shape {...o} />
      </g>
    ))}
  </svg>
);

// ---------- personagens em formas ----------
const star = (cx, cy, r) => [...Array(10)].map((_, k) => {
  const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.42 : r;
  return `${k ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
}).join(' ') + ' Z';
const HatFlat = ({x = 0, y = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-84 -34 Q-94 -150 0 -160 Q94 -150 84 -34 Q0 -56 -84 -34 Z" fill="#5a3a22" />
    <path d="M-166 -24 Q-150 -196 0 -212 Q150 -196 166 -24 Q120 -108 0 -118 Q-120 -108 -166 -24 Z" fill="#7a5230" />
    <path d="M-166 -24 Q-120 -108 0 -118 Q120 -108 166 -24" fill="none" stroke={BROWN} strokeWidth="6" />
    <path d="M-145 -40 Q-130 -178 0 -192 Q130 -178 145 -40" fill="none" stroke={MUST} strokeWidth="5" strokeDasharray="14 8" />
    <path d={star(0, -158, 28)} fill={MUST} />
    {[-0.8, -0.45, 0.45, 0.8].map((t) => <circle key={t} cx={t * 130} cy={-146 + Math.abs(t) * 66} r="7" fill={CREAM} />)}
    <path d="M-88 -42 Q0 -66 88 -42 L86 -26 Q0 -50 -86 -26 Z" fill={BROWN} />
  </g>
);
const blinkAt = (f, seed) => ((f + seed * 23) % 96) < 4;
const LampiaoFlat = ({x, y, s = 1, f, mood = 0}) => {
  const b = blinkAt(f, 1);
  const bob = Math.sin(f / 12) * 4;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <path d="M-170 270 Q-150 115 0 100 Q150 115 170 270 Z" fill={KHAKI} />
      <line x1="-125" y1="140" x2="115" y2="268" stroke={MUST} strokeWidth="24" />
      <line x1="-125" y1="140" x2="115" y2="268" stroke={BROWN} strokeWidth="10" strokeDasharray="8 10" />
      <line x1="125" y1="140" x2="-115" y2="268" stroke={MUST} strokeWidth="24" />
      <line x1="125" y1="140" x2="-115" y2="268" stroke={BROWN} strokeWidth="10" strokeDasharray="8 10" />
      <path d="M-58 88 L58 88 L0 160 Z" fill={TERRA} />
      <rect x="-26" y="42" width="52" height="56" fill={SKIN} />
      <ellipse cx="0" cy="-5" rx="78" ry="92" fill={SKIN} />
      <ellipse cx="-80" cy="5" rx="14" ry="22" fill={SKIN} /><ellipse cx="80" cy="5" rx="14" ry="22" fill={SKIN} />
      <circle cx="-30" cy="-8" r="23" fill={CREAM} stroke={BROWN} strokeWidth="7" />
      <circle cx="32" cy="-8" r="23" fill={CREAM} stroke={BROWN} strokeWidth="7" />
      <line x1="-7" y1="-10" x2="9" y2="-10" stroke={BROWN} strokeWidth="6" />
      {b ? <><line x1="-40" y1="-6" x2="-20" y2="-6" stroke={BROWN} strokeWidth="5" /><line x1="22" y1="-6" x2="42" y2="-6" stroke={BROWN} strokeWidth="5" /></>
        : <><circle cx="-30" cy="-6" r="7" fill={BROWN} /><circle cx="32" cy="-6" r="7" fill={BROWN} /></>}
      <path d="M2 8 L-8 34 L8 34" stroke="#b07a52" strokeWidth="6" fill="none" />
      <path d={mood > 0 ? 'M-26 52 Q0 70 26 52' : 'M-26 56 L26 56'} stroke={BROWN} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M-74 -28 Q-70 70 0 96 Q70 70 74 -28" stroke={BROWN} strokeWidth="4" fill="none" />
      <HatFlat />
    </g>
  );
};
const MariaFlat = ({x, y, s = 1, f}) => {
  const b = blinkAt(f, 3);
  const bob = Math.sin(f / 12 + 1) * 4;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <path d="M-160 270 Q-140 115 0 100 Q140 115 160 270 Z" fill={TEAL} />
      {[...Array(10)].map((_, i) => <circle key={i} cx={-110 + (i % 5) * 55} cy={175 + Math.floor(i / 5) * 50} r="10" fill={MUST} />)}
      <path d="M-98 -40 Q-114 130 -50 145 L50 145 Q114 130 98 -40 Q92 -125 0 -128 Q-92 -125 -98 -40 Z" fill="#3a2418" />
      <rect x="-24" y="42" width="48" height="60" fill={SKIN} />
      <ellipse cx="0" cy="-5" rx="70" ry="86" fill={SKIN} />
      <path d="M-74 -26 Q-30 -98 0 -72 Q30 -98 74 -26 Q62 -114 0 -116 Q-62 -114 -74 -26 Z" fill="#3a2418" />
      {b ? <><line x1="-36" y1="-6" x2="-16" y2="-6" stroke={BROWN} strokeWidth="5" /><line x1="16" y1="-6" x2="36" y2="-6" stroke={BROWN} strokeWidth="5" /></>
        : <><ellipse cx="-26" cy="-6" rx="9" ry="8" fill={BROWN} /><ellipse cx="26" cy="-6" rx="9" ry="8" fill={BROWN} /></>}
      <path d="M-22 48 Q0 60 22 48" stroke={TERRA} strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="-72" cy="28" r="9" fill={MUST} /><circle cx="72" cy="28" r="9" fill={MUST} />
      <g transform="translate(70 -82)">{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-16" rx="11" ry="17" fill={TERRA} transform={`rotate(${a})`} />)}<circle r="8" fill={MUST} /></g>
    </g>
  );
};

// ---------- ícones ----------
const Pin = ({c = TERRA}) => <g><path d="M0 0 C-40 -50 -40 -110 0 -110 C40 -110 40 -50 0 0 Z" fill={c} /><circle cx="0" cy="-72" r="16" fill={CREAM} /></g>;
const Rifle = ({s = 1, c = BROWN}) => (
  <g transform={`scale(${s})`}>
    <path d="M0 0 L60 -8 L230 -8 L230 6 L70 10 L50 34 L0 30 Z" fill={c} />
    <rect x="230" y="-6" width="130" height="9" fill={c} /><rect x="80" y="-14" width="40" height="6" fill={c} />
  </g>
);
const Burst = ({r = 50, c = MUST}) => (
  <g>{[...Array(12)].map((_, i) => <path key={i} d={`M -7 0 L 0 ${-r} L 7 0 Z`} fill={i % 2 ? TERRA : c} transform={`rotate(${i * 30})`} />)}<circle r={r * 0.32} fill={CREAM} /></g>
);
const Lamp = ({glow = 0, f}) => {
  const fl = 1 + 0.12 * Math.sin(f * 0.6);
  return (
    <g>
      {glow > 0 && [3, 2, 1].map((k) => <circle key={k} cy="-70" r={55 * k * glow * fl} fill={MUST} opacity={0.15} />)}
      <path d="M-50 -170 Q0 -230 50 -170" stroke={BROWN} strokeWidth="9" fill="none" />
      <rect x="-46" y="-172" width="92" height="18" rx="4" fill={TEAL} />
      <path d="M-38 -154 Q-56 -60 -38 -10 L38 -10 Q56 -60 38 -154 Z" fill={CREAM} opacity=".55" stroke={TEAL} strokeWidth="8" />
      <path d={`M0 ${-40 - 60 * fl} Q 24 -60 0 -28 Q -24 -60 0 ${-40 - 60 * fl} Z`} fill={glow > 0 ? MUST : '#d9c9a5'} />
      <path d="M-62 -10 L62 -10 L50 34 L-50 34 Z" fill={TEAL} />
    </g>
  );
};
const House = ({c = TERRA}) => (
  <g><path d="M-90 -70 L0 -140 L90 -70 Z" fill={BROWN} /><rect x="-75" y="-70" width="150" height="110" fill={c} /><rect x="-20" y="-20" width="40" height="60" fill={BROWN} /></g>
);
const Cow = () => (
  <g>
    <rect x="-80" y="-40" width="140" height="80" rx="30" fill={CREAM} stroke={BROWN} strokeWidth="6" />
    <circle cx="-30" cy="-10" r="16" fill={BROWN} /><circle cx="25" cy="15" r="12" fill={BROWN} />
    <rect x="50" y="-62" width="62" height="56" rx="18" fill={CREAM} stroke={BROWN} strokeWidth="6" />
    <path d="M56 -60 q-14 -20 -4 -30 M106 -60 q14 -20 4 -30" stroke={BROWN} strokeWidth="6" fill="none" strokeLinecap="round" />
    {[-60, -25, 15, 45].map((x) => <rect key={x} x={x} y="36" width="12" height="34" fill={BROWN} />)}
  </g>
);
const Boot = () => (
  <g>
    <path d="M-40 -90 L30 -90 L30 10 L80 20 Q100 30 90 50 L-40 50 Z" fill={KHAKI} stroke={BROWN} strokeWidth="6" />
    <path d="M-30 -60 L20 -60 M-30 -30 L20 -30" stroke={MUST} strokeWidth="5" strokeDasharray="6 6" />
  </g>
);
const Person = ({c = BROWN}) => <g><circle cy="-46" r="16" fill={c} /><path d="M-22 20 L-18 -26 L18 -26 L22 20 Z" fill={c} /></g>;
const Crown = () => <path d="M-110 30 L-80 -40 L-40 0 L0 -60 L40 0 L80 -40 L110 30 Z" fill={MUST} stroke={BROWN} strokeWidth="6" />;
const Heart = ({c = TERRA}) => <path d="M0 40 C-60 -30 -10 -80 0 -30 C10 -80 60 -30 0 40 Z" fill={c} />;
const Tent = () => <g><path d="M-90 40 L0 -80 L90 40 Z" fill={MUST} stroke={CREAM} strokeWidth="6" /><path d="M0 -80 L-20 40 L20 40 Z" fill={BROWN} /></g>;

// ---------- cartões de informação ----------
const Tag = ({children, bg = BROWN, fg = CREAM, size = 40, style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, background: bg, color: fg, fontFamily: HEAD, fontWeight: 900, fontSize: size, padding: '12px 26px', borderRadius: 999, boxShadow: '0 10px 0 rgba(43,29,20,.18)', whiteSpace: 'nowrap', ...style}}>{children}</div>
);
const Card = ({children, w = 760, style}) => (
  <div style={{width: w, background: CREAM, borderRadius: 34, border: `6px solid ${BROWN}`, boxShadow: `14px 14px 0 ${BROWN}`, padding: '26px 34px', fontFamily: BODY, color: BROWN, ...style}}>{children}</div>
);
const Row = ({k, v, f, at}) => {
  const p = sp(f, at);
  const n = Math.round(interpolate(f, [at, at + 22], [0, v.length], clamp));
  return (
    <div style={{display: 'flex', gap: 16, alignItems: 'baseline', margin: '8px 0', opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * -30}px)`}}>
      <span style={{fontFamily: HEAD, fontWeight: 900, fontSize: 26, color: TERRA, letterSpacing: 2, minWidth: 150}}>{k}</span>
      <span style={{fontWeight: 800, fontSize: 38}}>{v.slice(0, n)}</span>
    </div>
  );
};
const Counter = ({f, at, to, suffix = '', size = 170, c = TERRA}) => {
  const v = Math.round(interpolate(f, [at, at + 30], [0, to], {...clamp, easing: Easing.out(Easing.cubic)}));
  return <span style={{fontFamily: HEAD, fontWeight: 900, fontSize: size, color: c, lineHeight: 1}}>{v}{suffix}</span>;
};
const Big = ({children, size = 120, c = BROWN, font = HEAD}) => <div style={{fontFamily: font, fontWeight: 900, fontSize: size, color: c, lineHeight: 0.95, letterSpacing: -2, textAlign: 'center'}}>{children}</div>;

// ---------- cenas ----------
const Hook = ({f}) => {
  const tags = [['HERÓI', TEAL, 90, 520, wAt(0, 'herói')], ['BANDIDO', TERRA, 640, 600, wAt(0, 'bandido')], ['REI', MUST, 420, 430, wAt(0, 'rei')]];
  const name = 'LAMPIÃO'.split('');
  const nm = wAt(0, 'lampião');
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <G f={f} at={2} x={540} y={1040} from={0.3}><circle r={330 + Math.sin(f / 10) * 8} fill={MUST} /></G>
        <G f={f} at={6} x={540} y={1040} from={0.3}><circle r={270} fill={TERRA} /></G>
        <G f={f} at={10} x={540} y={1080} from={0.2}><LampiaoFlat x={0} y={0} s={1.25} f={f} mood={f > nm ? 1 : 0} /></G>
      </svg>
      {tags.map(([t, c, x, y, at]) => (
        <P key={t} f={f} at={at} x={x} y={y + Math.sin(f / 9 + x) * 10} from={0.2} rot={-20}><Tag bg={c} size={56}>{t}</Tag></P>
      ))}
      <div style={{position: 'absolute', top: 1420, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        {name.map((ch, i) => {
          const p = sp(f, nm + i * 2, 11, 180);
          return <span key={i} style={{fontFamily: WEST, fontSize: 170, color: BROWN, display: 'inline-block', opacity: f >= nm + i * 2 ? 1 : 0, transform: `translateY(${(1 - p) * -120}px) rotate(${(1 - p) * 30}deg)`}}>{ch}</span>;
        })}
      </div>
      <P f={f} at={nm + 16} x={0} y={1620} style={{left: 0, right: 0, textAlign: 'center'}}><Tag bg={BROWN} size={34}>A VIDA E A MORTE</Tag></P>
    </AbsoluteFill>
  );
};
const Origem = ({f}) => {
  const a = stF('origem'), s2 = sAt(2);
  return (
    <AbsoluteFill>
      <P f={f} at={a + 2} x={160} y={250} from={0.6}>
        <Card w={760}>
          <div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: TEAL}}>FICHA</div>
          <Row k="NOME" v="Virgulino Ferreira da Silva" f={f} at={a + 6} />
          <Row k="ORIGEM" v="Sertão do Pajeú • PE" f={f} at={wAt(1, 'pajeú') - 10} />
          <Row k="APELIDO" v="Lampião" f={f} at={wAt(1, 'pajeú') + 8} />
        </Card>
      </P>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <G f={f} at={a + 10} x={540} y={980} from={0.4}>
          <path d="M-300 -60 Q-250 -170 -90 -150 Q60 -200 200 -120 Q330 -80 300 40 Q260 140 80 150 Q-120 170 -260 100 Q-340 40 -300 -60 Z" fill={TEAL} />
          <text x="-20" y="110" textAnchor="middle" fontFamily={HEAD} fontWeight="900" fontSize="40" fill={CREAM}>PERNAMBUCO</text>
        </G>
        <G f={f} at={wAt(1, 'pajeú') - 6} x={480 + 0} y={950 - Math.abs(Math.sin(f / 7)) * 18} from={0}><Pin /></G>
        {f >= s2 && (
          <>
            <G f={f} at={wAt(2, 'vaqueiro') - 4} x={300} y={1400} from={0} rot={-20}><circle r="150" fill={MUST} /><g transform="scale(1.1)"><Cow /></g></G>
            <G f={f} at={wAt(2, 'couro') - 4} x={780} y={1400} from={0} rot={20}><circle r="150" fill={TERRA} /><g transform="translate(0 20) scale(1.2)"><Boot /></g></G>
          </>
        )}
      </svg>
      {f >= s2 && <P f={f} at={wAt(2, 'vaqueiro')} x={190} y={1580}><Tag bg={BROWN} size={34}>VAQUEIRO</Tag></P>}
      {f >= s2 && <P f={f} at={wAt(2, 'couro')} x={610} y={1580}><Tag bg={BROWN} size={34}>ARTESÃO DO COURO</Tag></P>}
    </AbsoluteFill>
  );
};
const Virada = ({f}) => {
  const a = stF('virada');
  const clash = wAt(3, 'guerra');
  const pai = wAt(3, 'pai');
  const cang = wAt(3, 'cangaço');
  const shake = f > clash && f < clash + 14 ? Math.sin(f * 3) * 10 : 0;
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <G f={f} at={a + 2} x={240 + shake} y={620} from={0}><circle r="140" fill={TEAL} /><g transform="translate(0 50)"><House c={MUST} /></g></G>
        <G f={f} at={a + 8} x={840 - shake} y={620} from={0}><circle r="140" fill={TERRA} /><g transform="translate(0 50)"><House c={CREAM} /></g></G>
        {f >= clash && <G f={f} at={clash} x={540} y={620} from={0} rot={90}><Burst r={110} /></G>}
        {f >= pai && <G f={f} at={pai} x={540} y={1060} from={0}><rect x="-14" y="-120" width="28" height="240" fill={BROWN} /><rect x="-80" y="-60" width="160" height="28" fill={BROWN} /></G>}
        {f >= cang && <G f={f} at={cang - 6} x={330} y={1400} from={0} rot={-30}><Rifle s={1.2} /></G>}
      </svg>
      <P f={f} at={clash} x={0} y={820} style={{left: 0, right: 0, textAlign: 'center'}}><Tag bg={BROWN} size={56}>BRIGA DE FAMÍLIAS ⚔</Tag></P>
      {f >= pai && <P f={f} at={pai + 4} x={0} y={1220} style={{left: 0, right: 0, textAlign: 'center'}}><Tag bg={TERRA} size={44}>O PAI É MORTO</Tag></P>}
      {f >= cang && <P f={f} at={cang} x={0} y={1520} style={{left: 0, right: 0}}><Big size={110} c={TERRA} font={WEST}>→ CANGAÇO</Big></P>}
    </AbsoluteFill>
  );
};
const Apelido = ({f}) => {
  const a = stF('apelido');
  const shots = [wAt(4, 'atirava'), wAt(4, 'atirava') + 6, wAt(4, 'rápido'), wAt(4, 'rápido') + 7, wAt(4, 'cano'), wAt(4, 'clareava')];
  const glow = interpolate(f, [wAt(4, 'clareava'), wAt(4, 'clareava') + 20], [0, 1], clamp);
  const lamp = wAt(4, 'lampião');
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <G f={f} at={a} x={540} y={980} from={0.5}><rect x="-470" y="-560" width="940" height="1120" rx="60" fill={BROWN} /></G>
        <rect x="70" y="420" width="940" height="1120" rx="60" fill={MUST} opacity={glow * 0.35} />
        {[...Array(20)].map((_, i) => <circle key={i} cx={110 + (i * 149) % 860} cy={460 + (i * 97) % 420} r={i % 3 ? 3 : 5} fill={CREAM} opacity={(1 - glow * 0.8) * (0.5 + 0.5 * Math.sin(f / 6 + i))} />)}
        <G f={f} at={a + 6} x={200} y={1050} from={0} rot={-20}><Rifle s={1.4} c={CREAM} /></G>
        {shots.map((t, i) => f >= t && f < t + 5 ? <g key={i} transform={`translate(${720 + (i % 2) * 20} ${1040 - (i % 3) * 14})`}><Burst r={70} /></g> : null)}
        {f >= lamp - 12 && <G f={f} at={lamp - 12} x={760} y={1420} from={0}><Lamp glow={glow} f={f} /></G>}
      </svg>
      <P f={f} at={a + 4} x={0} y={500} style={{left: 0, right: 0, textAlign: 'center'}}><Tag bg={MUST} fg={BROWN} size={40}>DE ONDE VEIO O APELIDO?</Tag></P>
      {f >= lamp && <P f={f} at={lamp} x={110} y={1180}><Big size={120} c={MUST} font={WEST}>LAMPIÃO</Big></P>}
      {f >= lamp && <P f={f} at={lamp + 10} x={110} y={1310}><div style={{fontFamily: BODY, fontWeight: 800, fontSize: 34, color: CREAM, maxWidth: 520}}>lampião: lanterna a querosene</div></P>}
    </AbsoluteFill>
  );
};
const Rei = ({f}) => {
  const a = stF('rei');
  const anos = wAt(5, 'vinte');
  const est = wAt(5, 'sete');
  const pts = [[260, 1180], [380, 1080], [520, 1130], [660, 1060], [780, 1180], [680, 1330], [480, 1360]];
  const route = interpolate(f, [est, est + 40], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <G f={f} at={a + 2} x={540} y={700} from={0}><LampiaoFlat x={0} y={0} s={0.8} f={f} mood={1} /></G>
        <G f={f} at={a + 12} x={540} y={470 + Math.sin(f / 8) * 8} from={0} rot={-30}><Crown /></G>
        {f >= est - 6 && <G f={f} at={est - 6} x={0} y={0} from={0.8}>
          <path d="M180 1200 Q220 1020 420 1040 Q620 980 820 1080 Q900 1200 820 1330 Q640 1440 420 1420 Q200 1380 180 1200 Z" fill={TEAL} />
          <path d={'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L ')} fill="none" stroke={MUST} strokeWidth="8" strokeDasharray="1" pathLength="1" style={{strokeDasharray: `${route} 1`}} strokeLinecap="round" />
          {pts.map(([x, y], i) => route * 7 > i ? <g key={i} transform={`translate(${x} ${y}) scale(${Math.min(1, (route * 7 - i) * 2)})`}><circle r="20" fill={TERRA} stroke={CREAM} strokeWidth="5" /></g> : null)}
        </G>}
      </svg>
      <P f={f} at={wAt(5, 'líder')} x={0} y={980} style={{left: 0, right: 0, textAlign: 'center'}}><Tag bg={MUST} fg={BROWN} size={50}>REI DO CANGAÇO</Tag></P>
      {f >= anos - 4 && <P f={f} at={anos - 4} x={90} y={1500}><Card w={420} style={{textAlign: 'center', padding: '16px 20px'}}><div><Counter f={f} at={anos - 4} to={20} suffix="" size={120} /></div><div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 30}}>≈ ANOS EM FUGA</div></Card></P>}
      {f >= est && <P f={f} at={est} x={580} y={1500}><Card w={420} style={{textAlign: 'center', padding: '16px 20px'}}><div><Counter f={f} at={est} to={7} size={120} c={TEAL} /></div><div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 30}}>ESTADOS DO NORDESTE</div></Card></P>}
    </AbsoluteFill>
  );
};
const Maria = ({f}) => {
  const a = stF('maria');
  const mb = wAt(6, 'maria');
  const fim = wAt(6, 'fim');
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <G f={f} at={a + 2} x={320} y={900} from={0}><circle r="250" fill={MUST} /></G>
        <G f={f} at={mb - 6} x={760} y={900} from={0}><circle r="250" fill={TEAL} /></G>
        <G f={f} at={a + 4} x={320} y={950} from={0.5}><LampiaoFlat x={0} y={0} s={0.85} f={f} mood={f > mb ? 1 : 0} /></G>
        <G f={f} at={mb - 2} x={760} y={960} from={0.5}><MariaFlat x={0} y={0} s={0.85} f={f} /></G>
        {f >= mb + 10 && [0, 1, 2].map((i) => {
          const t = ((f - mb - 10 + i * 16) % 48) / 48;
          return <g key={i} transform={`translate(${540 + Math.sin(t * 6 + i) * 40} ${780 - t * 260}) scale(${0.6 + t * 0.4})`} opacity={1 - t}><Heart /></g>;
        })}
      </svg>
      <P f={f} at={wAt(6, 'bahia')} x={0} y={480} style={{left: 0, right: 0, textAlign: 'center'}}><Tag bg={BROWN} size={40}>📍 SERTÃO DA BAHIA</Tag></P>
      {f >= mb && <P f={f} at={mb + 4} x={0} y={1290} style={{left: 0, right: 0}}><Big size={110} c={TERRA} font={WEST}>MARIA BONITA</Big></P>}
      {f >= wAt(6, 'bando') && <P f={f} at={wAt(6, 'bando')} x={150} y={1450}><Tag bg={TEAL} size={36}>ENTROU PARA O BANDO</Tag></P>}
      {f >= fim - 6 && <P f={f} at={fim - 6} x={560} y={1550}><Tag bg={MUST} fg={BROWN} size={36}>JUNTOS ATÉ O FIM</Tag></P>}
    </AbsoluteFill>
  );
};
const Fim = ({f}) => {
  const a = stF('fim');
  const cerc = wAt(7, 'cercou');
  const s8 = sAt(8);
  const close = interpolate(f, [cerc - 10, cerc + 40], [1, 0.42], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const N = 12;
  const people = [...Array(11)];
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <G f={f} at={a} x={540} y={980} from={0.5}><rect x="-470" y="-560" width="940" height="1120" rx="60" fill={BROWN} /></G>
        <path d="M300 560 a 60 60 0 1 0 50 95 a 48 48 0 1 1 -50 -95 Z" fill={CREAM} opacity={sp(f, a + 6)} />
        {f < s8 && (
          <>
            <G f={f} at={wAt(7, 'angico') - 4} x={540} y={1020} from={0}><Tent /></G>
            {f >= cerc - 12 && [...Array(N)].map((_, i) => {
              const ang = (i / N) * Math.PI * 2 + f / 90;
              const R = 380 * close;
              return <g key={i} transform={`translate(${540 + Math.cos(ang) * R} ${1000 + Math.sin(ang) * R * 0.75})`} opacity={sp(f, cerc - 12 + i)}><circle r="26" fill={TERRA} /><circle r="10" fill={CREAM} /></g>;
            })}
          </>
        )}
        {f >= s8 && people.map((_, i) => {
          const big = i < 2;
          const x = big ? 380 + i * 320 : 170 + ((i - 2) % 5) * 185;
          const y = big ? 820 : 1010 + Math.floor((i - 2) / 5) * 130;
          const fade = interpolate(f, [s8 + 10 + i * 3, s8 + 30 + i * 3], [1, 0.25], clamp);
          return <g key={i} transform={`translate(${x} ${y}) scale(${big ? 2 : 1.4})`} opacity={sp(f, s8 + i * 2) * fade}><Person c={big ? MUST : CREAM} /></g>;
        })}
      </svg>
      <P f={f} at={a + 4} x={0} y={470} style={{left: 0, right: 0, textAlign: 'center'}}><Tag bg={TERRA} size={40}>📍 GROTA DO ANGICO • SE</Tag></P>
      {f < s8 && f >= cerc && <P f={f} at={cerc} x={0} y={1420} style={{left: 0, right: 0, textAlign: 'center'}}><Tag bg={CREAM} fg={BROWN} size={40}>VOLANTE CERCA O ACAMPAMENTO</Tag></P>}
      {f >= s8 && <P f={f} at={s8 + 6} x={0} y={1200} style={{left: 0, right: 0, textAlign: 'center'}}><Counter f={f} at={s8 + 6} to={11} size={190} c={MUST} /><div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 40, color: CREAM}}>MORTOS NA EMBOSCADA</div></P>}
    </AbsoluteFill>
  );
};
const Lenda = ({f}) => {
  const a = stF('lenda');
  const her = wAt(9, 'herói'), ban = wAt(9, 'bandido');
  const tilt = f < her ? 0 : f < ban ? -10 : Math.sin((f - ban) / 9) * 10;
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <G f={f} at={a + 2} x={540} y={720} from={0}><circle r={240 + Math.sin(f / 10) * 10} fill={MUST} /><LampiaoFlat x={0} y={20} s={0.75} f={f} /></G>
        {f >= her - 10 && <G f={f} at={her - 10} x={540} y={1180} from={0.6}>
          <rect x="-12" y="0" width="24" height="300" fill={BROWN} />
          <path d="M-60 300 L60 300 L40 270 L-40 270 Z" fill={BROWN} />
          <g transform={`rotate(${tilt})`}>
            <rect x="-330" y="-12" width="660" height="24" rx="12" fill={BROWN} />
            {[[-300, TEAL], [300, TERRA]].map(([x, c]) => (
              <g key={x} transform={`translate(${x} 0) rotate(${-tilt})`}>
                <line x1="-70" y1="0" x2="-50" y2="110" stroke={BROWN} strokeWidth="6" /><line x1="70" y1="0" x2="50" y2="110" stroke={BROWN} strokeWidth="6" />
                <path d="M-90 110 L90 110 Q70 170 0 170 Q-70 170 -90 110 Z" fill={c} />
              </g>
            ))}
          </g>
        </G>}
      </svg>
      <P f={f} at={wAt(9, 'lenda')} x={0} y={420} style={{left: 0, right: 0, textAlign: 'center'}}><Tag bg={BROWN} size={44}>O HOMEM MORREU. A LENDA FICOU.</Tag></P>
      {f >= her && <P f={f} at={her} x={90} y={1400} rot={-10}><Tag bg={TEAL} size={52}>HERÓI</Tag></P>}
      {f >= ban && <P f={f} at={ban} x={640} y={1400} rot={10}><Tag bg={TERRA} size={52}>BANDIDO</Tag></P>}
    </AbsoluteFill>
  );
};
const Cta = ({f}) => {
  const a = stF('cta');
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <G f={f} at={a} x={540} y={980} from={0}><circle r={280 + Math.sin(f / 8) * 10} fill={TERRA} /><HatFlat x={0} y={150} s={1.25} /></G>
      </svg>
      <P f={f} at={a + 6} x={0} y={380} style={{left: 0, right: 0}}><Big size={120} font={WEST}>HERÓI OU</Big></P>
      <P f={f} at={a + 12} x={0} y={500} style={{left: 0, right: 0}}><Big size={120} c={TERRA} font={WEST}>BANDIDO?</Big></P>
      <P f={f} at={wAt(10, 'comenta')} x={0} y={1320} style={{left: 0, right: 0, textAlign: 'center'}}><Tag bg={BROWN} size={60}>💬 COMENTA AÍ</Tag></P>
      <P f={f} at={wAt(10, 'comenta') + 10} x={0} y={1460} style={{left: 0, right: 0, textAlign: 'center'}}><span style={{display: 'inline-block', fontSize: 100, color: TERRA, transform: `translateY(${Math.sin(f / 5) * 10}px)`}}>↓</span></P>
    </AbsoluteFill>
  );
};
const SCENES = {hook: Hook, origem: Origem, virada: Virada, apelido: Apelido, rei: Rei, maria: Maria, fim: Fim, lenda: Lenda, cta: Cta};

// ---------- transição: círculo de cor ----------
const WIPE = [TERRA, MUST, TEAL];
const Wipe = ({f}) => {
  for (let i = 1; i < order.length; i++) {
    const b = stF(order[i]);
    if (f >= b - 9 && f < b + 9) {
      const r = interpolate(f, [b - 9, b, b + 9], [0, 1250, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
      const r2 = interpolate(f, [b - 7, b + 1, b + 7], [0, 1250, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
      return (
        <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
          <circle cx={i % 2 ? 1000 : 80} cy={i % 2 ? 300 : 1600} r={r * 1.6} fill={WIPE[i % 3]} />
          <circle cx={i % 2 ? 1000 : 80} cy={i % 2 ? 300 : 1600} r={r2 * 1.3} fill={WIPE[(i + 1) % 3]} />
        </svg>
      );
    }
  }
  return null;
};

// ---------- sons ----------
const SFX = (() => {
  const E = [];
  const add = (n, fr, v) => E.push([n, Math.max(0, Math.round(fr)), v]);
  order.slice(1).forEach((k) => add('sfx/whoosh', stF(k) - 9, 0.35));
  ['herói', 'bandido', 'rei'].forEach((w, i) => add(`sfx/pop_${'abc'[i]}`, wAt(0, w), 0.3));
  add('cordel/carimbo', wAt(0, 'lampião'), 0.5);
  add('sfx/type', stF('origem') + 6, 0.3); add('sfx/pop_d', wAt(1, 'pajeú') - 6, 0.3);
  add('sfx/pop_a', wAt(2, 'vaqueiro') - 4, 0.3); add('sfx/pop_b', wAt(2, 'couro') - 4, 0.3);
  add('sfx/hit', wAt(3, 'guerra'), 0.45); add('cordel/carimbo', wAt(3, 'cangaço'), 0.5);
  [wAt(4, 'atirava'), wAt(4, 'atirava') + 6, wAt(4, 'rápido'), wAt(4, 'rápido') + 7, wAt(4, 'cano'), wAt(4, 'clareava')].forEach((t) => add('cordel/bang', t, 0.18));
  add('sfx/ding', wAt(4, 'lampião'), 0.3);
  add('sfx/sparkle', stF('rei') + 12, 0.25); add('sfx/type', wAt(5, 'vinte') - 4, 0.3); add('sfx/type', wAt(5, 'sete'), 0.3);
  add('sfx/pop_c', wAt(6, 'maria'), 0.3); add('sfx/sparkle', wAt(6, 'maria') + 10, 0.2);
  add('cordel/wind', stF('fim'), 0.3); [0, 12, 24].forEach((d) => add('cordel/bang', wAt(7, 'cercou') + 30 + d, 0.12));
  add('sfx/hit', sAt(8) + 6, 0.35);
  add('sfx/stamp', wAt(9, 'herói'), 0.35); add('sfx/stamp', wAt(9, 'bandido'), 0.35);
  add('cordel/carimbo', stF('cta') + 6, 0.5); add('sfx/ding', wAt(10, 'comenta'), 0.3);
  return E;
})();

const Frame = () => {
  const f = useCurrentFrame();
  const cur = sceneAt(f);
  const Scene = SCENES[cur];
  const local = f - stF(cur);
  const zoom = 1 + local * 0.0006;
  const dark = cur === 'fim';
  const music = (fr) => (fr >= stF('fim') && fr < stF('lenda') ? 0.08 : 0.17) * interpolate(fr, [0, 12, DUR - 75, DUR], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{background: SAND, overflow: 'hidden'}}>
      <LiveBg f={f} />
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 50%'}}>
        <Scene f={f} />
      </AbsoluteFill>
      <Wipe f={f} />
      <Audio src={staticFile('lamp2/voz.wav')} />
      <Audio src={staticFile('lamp2/trilha.mp3')} volume={music} />
      {SFX.map(([n, fr, v], i) => <Sequence key={i} from={fr} durationInFrames={75}><Audio src={staticFile(`${n}.wav`)} volume={v} /></Sequence>)}
    </AbsoluteFill>
  );
};

registerRoot(() => <Composition id="Lampiao2" component={Frame} durationInFrames={DUR} fps={FPS} width={1080} height={1920} />);
