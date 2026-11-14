import {registerRoot, Composition, AbsoluteFill, useCurrentFrame, spring, interpolate, Easing, Audio, staticFile, Sequence} from 'remotion';
import React from 'react';
import '@fontsource/rubik-dirt/400.css';
import T from './timeline-lamp2.json';

// ---------- sépia de xilogravura ----------
const INK = '#1c1814';
const PAPER = '#e9dfc4';
const PAPER2 = '#d8c9a3';
const SEPIA = '#6b5a40';
const DIRT = '"Rubik Dirt", sans-serif';
const W = 1080, H = 1920, PERSP = 1100, SPACING = 3000;

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
const enF = (k) => sec(scenes[k].to);
const sceneIdx = (f) => { let i = 0; order.forEach((k, j) => { if (f >= stF(k)) i = j; }); return i; };
const st2 = (f) => Math.floor(f / 2) * 2;
const sp = (f, at, d = 14, s = 150) => spring({frame: f - at, fps: FPS, config: {damping: d, stiffness: s}});

// ---------- texturas ----------
const Defs = () => (
  <defs>
    <pattern id="dotsW" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill={INK} /><circle cx="6" cy="6" r="3.4" fill={PAPER} /><circle cx="17" cy="17" r="3.4" fill={PAPER} /></pattern>
    <pattern id="dotsI" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill={PAPER2} /><circle cx="7" cy="7" r="2.6" fill={INK} /><circle cx="20" cy="19" r="2.6" fill={INK} /></pattern>
    <pattern id="hatchS" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><rect width="16" height="16" fill={PAPER} /><rect width="16" height="3" fill={INK} /></pattern>
    <pattern id="stripesW" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill={INK} /><rect x="7" width="3" height="18" fill={PAPER} /></pattern>
  </defs>
);

// ---------- desenhos ----------
const spiral = (r, turns = 3.2, seed = 0) => {
  let d = '';
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const a = t * turns * Math.PI * 2;
    const rr = r * (0.12 + 0.88 * t) + Math.sin(t * 60 + seed) * 4;
    d += `${t ? 'L' : 'M'}${(rr * Math.cos(a)).toFixed(1)} ${(rr * Math.sin(a)).toFixed(1)} `;
  }
  return d;
};
const SpiralSun = ({x, y, r, f, night}) => (
  <g transform={`translate(${x} ${y}) rotate(${f * 0.4})`}>
    {night ? <circle r={r * 1.05} fill={PAPER} /> : null}
    <path d={spiral(r, 3.4, 1)} stroke={INK} strokeWidth="9" fill="none" strokeLinecap="round" />
    <circle r={r * 1.08} fill="none" stroke={INK} strokeWidth="5" strokeDasharray="4 14" />
  </g>
);
const Cloud = ({x, y, s = 1}) => {
  const n = 6, bw = 60;
  let d = `M0 0 `;
  for (let i = 0; i < n; i++) d += `q${bw / 2} ${-(40 + (i % 2) * 25)} ${bw} 0 `;
  d += `Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={d} fill={PAPER} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      {[...Array(9)].map((_, i) => <circle key={i} cx={30 + i * 36} cy={-14 - (i % 2) * 8} r="4" fill={INK} />)}
    </g>
  );
};
const Hills = ({y, h = 260, seed = 0, fill = 'url(#dotsI)'}) => {
  const d = `M-1200 ${y} Q -500 ${y - h * 0.8} -200 ${y - 20} Q 150 ${y - h} 420 ${y - 40} Q 700 ${y - h * 1.2} 1000 ${y - 30} Q 1200 ${y - h * 0.6} 1500 ${y - 20} Q 1900 ${y - h * 0.9} 2300 ${y} L2300 3400 L-1200 3400 Z`;
  return <path d={d} fill={fill} stroke={INK} strokeWidth="7" transform={`translate(${seed} 0)`} />;
};
const Ground = ({y}) => (
  <g>
    <path d={`M-1400 ${y + 40} Q -400 ${y - 40} 540 ${y - 70} Q 1480 ${y - 40} 2480 ${y + 40} L2480 3400 L-1400 3400 Z`} fill={PAPER} stroke={INK} strokeWidth="7" />
    {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M ${-1100 + (i % 2) * 90} ${y + 60 + i * 55} q 140 -18 280 0 t 280 0 t 280 0 t 280 0 t 280 0 t 280 0 t 280 0 t 280 0 t 280 0 t 280 0 t 280 0`} stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".85" />)}
  </g>
);
const Palma = ({x, y, s = 1, flip}) => {
  const pads = [[0, -120, 70, 115, 0], [-80, -270, 55, 90, -25], [75, -250, 50, 85, 22], [-10, -380, 42, 70, 5]];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {pads.map(([cx, cy, rx, ry, r], i) => (
        <g key={i} transform={`translate(${cx} ${cy}) rotate(${r})`}>
          <ellipse rx={rx} ry={ry} fill={INK} />
          <ellipse rx={rx - 12} ry={ry - 12} fill="none" stroke={PAPER} strokeWidth="3" />
          {[...Array(10)].map((_, k) => <circle key={k} cx={Math.cos(k * 2.4) * rx * 0.55} cy={Math.sin(k * 2.4) * ry * 0.6} r="4" fill={PAPER} />)}
        </g>
      ))}
    </g>
  );
};
const Mandacaru = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-30 0 L-30 -330 Q0 -370 30 -330 L30 0 Z" fill="url(#stripesW)" stroke={INK} strokeWidth="6" />
    <path d="M-30 -160 L-95 -160 Q-115 -160 -115 -185 L-115 -265 Q-95 -295 -75 -265 L-75 -195 L-30 -195 Z" fill="url(#stripesW)" stroke={INK} strokeWidth="6" />
    <path d="M30 -120 L95 -120 Q115 -120 115 -145 L115 -235 Q95 -265 75 -235 L75 -155 L30 -155 Z" fill="url(#stripesW)" stroke={INK} strokeWidth="6" />
  </g>
);
const DryTree = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} fill="none" strokeLinecap="round">
    <path d="M0 0 L5 -220" strokeWidth="26" />
    <path d="M5 -200 L-80 -330 M-80 -330 L-130 -380 M-80 -330 L-70 -420 M5 -220 L70 -350 M70 -350 L130 -390 M70 -350 L60 -440 M5 -220 L10 -380 M10 -380 L-25 -450 M10 -380 L45 -460" strokeWidth="12" />
  </g>
);
const Church = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-70" y="-110" width="140" height="110" fill={PAPER} stroke={INK} strokeWidth="6" />
    <path d="M-80 -110 L0 -170 L80 -110 Z" fill={INK} />
    <rect x="40" y="-230" width="50" height="120" fill={PAPER} stroke={INK} strokeWidth="6" />
    <path d="M35 -230 L65 -270 L95 -230 Z" fill={INK} />
    <path d="M65 -270 L65 -310 M50 -295 L80 -295" stroke={INK} strokeWidth="6" />
    <path d="M-18 0 L-18 -50 Q0 -70 18 -50 L18 0 Z" fill={INK} />
  </g>
);
const House = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-110" y="-110" width="220" height="110" fill={PAPER} stroke={INK} strokeWidth="6" />
    <path d="M-130 -110 L0 -185 L130 -110 Z" fill="url(#hatchS)" stroke={INK} strokeWidth="6" />
    <rect x="-25" y="-75" width="50" height="75" fill={INK} />
    <rect x="45" y="-85" width="40" height="34" fill={INK} />
  </g>
);
const Cow = ({x, y, s = 1, f}) => {
  const chew = Math.sin(st2(f) / 3) * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-60, -30, 40, 70].map((lx) => <rect key={lx} x={lx} y="-70" width="16" height="70" fill={INK} />)}
      <ellipse cx="0" cy="-110" rx="110" ry="60" fill={PAPER} stroke={INK} strokeWidth="6" />
      <ellipse cx="-30" cy="-120" rx="28" ry="22" fill={INK} /><ellipse cx="45" cy="-95" rx="20" ry="16" fill={INK} />
      <g transform={`translate(115 ${-140 + chew})`}>
        <ellipse rx="38" ry="30" fill={PAPER} stroke={INK} strokeWidth="6" />
        <path d="M-20 -24 q-20 -30 -40 -20 M20 -24 q20 -30 40 -20" stroke={INK} strokeWidth="6" fill="none" />
        <circle cx="10" cy="-6" r="5" fill={INK} />
      </g>
      <path d="M-110 -120 q-30 20 -20 60" stroke={INK} strokeWidth="6" fill="none" />
    </g>
  );
};
const star = (cx, cy, r) => [...Array(10)].map((_, k) => {
  const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.42 : r;
  return `${k ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
}).join(' ') + ' Z';
// chapéu de couro (origem = centro do rosto, rosto rx ~78)
const Hat = ({x = 0, y = 0, s = 1, color = INK}) => {
  const det = color === INK ? PAPER : INK;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-84 -34 Q-94 -150 0 -160 Q94 -150 84 -34 Q0 -56 -84 -34 Z" fill={color} />
      <path d="M-166 -24 Q-150 -196 0 -212 Q150 -196 166 -24 Q120 -108 0 -118 Q-120 -108 -166 -24 Z" fill={color} />
      <path d="M-166 -24 Q-120 -108 0 -118 Q120 -108 166 -24" fill="none" stroke={det} strokeWidth="7" />
      <path d="M-145 -40 Q-130 -178 0 -192 Q130 -178 145 -40" fill="none" stroke={det} strokeWidth="5" strokeDasharray="14 8" />
      {[-0.8, -0.45, 0.45, 0.8].map((t) => <circle key={t} cx={t * 130} cy={-146 + Math.abs(t) * 66} r="6" fill={det} />)}
      <path d={star(0, -158, 28)} fill={det} />
      <path d="M-88 -42 Q0 -66 88 -42 L86 -26 Q0 -50 -86 -26 Z" fill={color} stroke={det} strokeWidth="2" />
    </g>
  );
};
const Rifle = ({x, y, rot = 0, s = 1, c = INK}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M0 0 L60 -8 L230 -8 L230 6 L70 10 L50 34 L0 30 Z" fill={c} />
    <rect x="230" y="-6" width="130" height="8" fill={c} /><rect x="80" y="-14" width="40" height="6" fill={c} />
  </g>
);
const Burst = ({x, y, r = 50}) => (
  <g transform={`translate(${x} ${y})`}>{[...Array(12)].map((_, i) => <path key={i} d={`M -6 0 L 0 ${-r} L 6 0 Z`} fill={i % 2 ? INK : PAPER} stroke={INK} strokeWidth="2" transform={`rotate(${i * 30})`} />)}<circle r={r * 0.3} fill={PAPER} stroke={INK} strokeWidth="4" /></g>
);
// personagens de corpo inteiro (origem nos pés)
const Leg = ({x, rot, boot = true}) => (
  <g transform={`translate(${x} -270) rotate(${rot})`}>
    <rect x="-22" y="0" width="44" height="245" fill={INK} />
    <line x1="0" y1="10" x2="0" y2="235" stroke={PAPER} strokeWidth="3" />
    {boot && <rect x="-26" y="215" width="58" height="42" rx="6" fill={INK} stroke={PAPER} strokeWidth="3" />}
  </g>
);
const Cangaceiro = ({x, y, s = 1, f, aim = 0, walk = 0, young = false, crown = 0}) => {
  const step = walk ? Math.sin(st2(f) / 3) * 18 * walk : 0;
  const blink = (st2(f) % 80) < 4;
  const recoil = aim ? Math.max(0, Math.sin(st2(f) * 1.3)) * 4 * aim : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Leg x={-26} rot={step} /><Leg x={26} rot={-step} />
      <path d="M-92 -470 Q-102 -300 -72 -258 L72 -258 Q102 -300 92 -470 Q0 -505 -92 -470 Z" fill="url(#dotsW)" stroke={INK} strokeWidth="5" />
      <rect x="-78" y="-292" width="156" height="24" fill={PAPER} stroke={INK} strokeWidth="5" />
      <rect x="-14" y="-296" width="28" height="32" fill={INK} />
      {!young && <>
        <line x1="-82" y1="-470" x2="74" y2="-292" stroke={PAPER} strokeWidth="22" /><line x1="-82" y1="-470" x2="74" y2="-292" stroke={INK} strokeWidth="9" strokeDasharray="7 9" />
        <line x1="82" y1="-470" x2="-74" y2="-292" stroke={PAPER} strokeWidth="22" /><line x1="82" y1="-470" x2="-74" y2="-292" stroke={INK} strokeWidth="9" strokeDasharray="7 9" />
      </>}
      {aim ? (
        <g transform={`translate(${-recoil} 0)`}>
          <path d="M-88 -455 Q-20 -420 110 -415" stroke={INK} strokeWidth="34" fill="none" strokeLinecap="round" />
          <path d="M88 -455 Q120 -430 150 -412" stroke={INK} strokeWidth="34" fill="none" strokeLinecap="round" />
          <Rifle x={20} y={-425} rot={-3} s={1.0} />
        </g>
      ) : (
        <>
          <path d="M-90 -455 Q-120 -360 -110 -280" stroke={INK} strokeWidth="34" fill="none" strokeLinecap="round" />
          <path d="M90 -455 Q120 -360 112 -290" stroke={INK} strokeWidth="34" fill="none" strokeLinecap="round" />
          {!young && <Rifle x={125} y={-120} rot={-88} s={0.95} />}
        </>
      )}
      <path d="M-40 -500 L40 -500 L0 -440 Z" fill={PAPER} stroke={INK} strokeWidth="5" />
      <rect x="-20" y="-530" width="40" height="35" fill={PAPER} stroke={INK} strokeWidth="5" />
      <g transform="translate(0 -600)">
        <ellipse rx="62" ry="72" fill={PAPER} stroke={INK} strokeWidth="7" />
        {!young ? <>
          <circle cx="-24" cy="-4" r="19" fill={PAPER} stroke={INK} strokeWidth="6" /><circle cx="26" cy="-4" r="19" fill={PAPER} stroke={INK} strokeWidth="6" />
          <line x1="-5" y1="-6" x2="7" y2="-6" stroke={INK} strokeWidth="5" />
        </> : null}
        {blink ? <><line x1="-32" y1="-2" x2="-16" y2="-2" stroke={INK} strokeWidth="5" /><line x1="18" y1="-2" x2="34" y2="-2" stroke={INK} strokeWidth="5" /></>
          : <><circle cx="-24" cy="-2" r="6" fill={INK} /><circle cx="26" cy="-2" r="6" fill={INK} /></>}
        <path d="M2 8 L-6 30 L8 30" stroke={INK} strokeWidth="5" fill="none" />
        <path d="M-20 46 Q0 54 20 46" stroke={INK} strokeWidth="6" fill="none" />
        <path d="M-58 -22 Q-56 56 0 76 Q56 56 58 -22" stroke={INK} strokeWidth="3" fill="none" />
        <Hat s={young ? 0.7 : 0.8} />
        {crown > 0 && <path transform={`translate(0 ${-210 - (1 - crown) * 200}) scale(${crown})`} d="M-80 30 L-60 -30 L-30 0 L0 -50 L30 0 L60 -30 L80 30 Z" fill={PAPER} stroke={INK} strokeWidth="7" />}
      </g>
    </g>
  );
};
const Maria = ({x, y, s = 1, f}) => {
  const blink = ((st2(f) + 30) % 80) < 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-40" y="-60" width="28" height="60" fill={INK} /><rect x="12" y="-60" width="28" height="60" fill={INK} />
      <path d="M-70 -470 Q-160 -100 -150 -50 L150 -50 Q160 -100 70 -470 Q0 -500 -70 -470 Z" fill="url(#dotsW)" stroke={INK} strokeWidth="5" />
      <path d="M-70 -455 Q-120 -380 -60 -320" stroke={INK} strokeWidth="30" fill="none" strokeLinecap="round" />
      <path d="M70 -455 Q120 -380 60 -320" stroke={INK} strokeWidth="30" fill="none" strokeLinecap="round" />
      <rect x="-18" y="-520" width="36" height="40" fill={PAPER} stroke={INK} strokeWidth="5" />
      <g transform="translate(0 -590)">
        <path d="M-80 -20 Q-90 120 -40 140 L40 140 Q90 120 80 -20 Q75 -100 0 -102 Q-75 -100 -80 -20 Z" fill={INK} />
        <ellipse rx="56" ry="68" fill={PAPER} stroke={INK} strokeWidth="7" />
        <path d="M-60 -20 Q-25 -80 0 -60 Q25 -80 60 -20 Q50 -94 0 -96 Q-50 -94 -60 -20 Z" fill={INK} />
        {blink ? <><line x1="-28" y1="0" x2="-12" y2="0" stroke={INK} strokeWidth="5" /><line x1="12" y1="0" x2="28" y2="0" stroke={INK} strokeWidth="5" /></>
          : <><ellipse cx="-20" cy="0" rx="7" ry="6" fill={INK} /><ellipse cx="20" cy="0" rx="7" ry="6" fill={INK} /></>}
        <path d="M0 8 L-6 28 L6 28" stroke={INK} strokeWidth="5" fill="none" />
        <path d="M-16 44 Q0 52 16 44" stroke={INK} strokeWidth="6" fill="none" />
        <g transform="translate(54 -60)">{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-14" rx="10" ry="15" fill={PAPER} stroke={INK} strokeWidth="3" transform={`rotate(${a})`} />)}<circle r="7" fill={INK} /></g>
      </g>
    </g>
  );
};
const Soldier = ({x, y, s = 1, f, walk = 1, flip}) => {
  const step = Math.sin(st2(f) / 3) * 18 * walk;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Leg x={-24} rot={step} /><Leg x={24} rot={-step} />
      <path d="M-82 -470 Q-92 -300 -66 -258 L66 -258 Q92 -300 82 -470 Q0 -500 -82 -470 Z" fill={INK} />
      {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx="0" cy={-450 + i * 38} r="6" fill={PAPER} />)}
      <path d="M-84 -455 Q-20 -420 100 -415" stroke={INK} strokeWidth="30" fill="none" strokeLinecap="round" />
      <Rifle x={10} y={-430} rot={-6} s={0.95} />
      <g transform="translate(0 -560)">
        <ellipse rx="54" ry="62" fill={PAPER} stroke={INK} strokeWidth="7" />
        <circle cx="-20" cy="0" r="5" fill={INK} /><circle cx="20" cy="0" r="5" fill={INK} />
        <path d="M-18 36 L18 36" stroke={INK} strokeWidth="5" />
        <rect x="-58" y="-80" width="116" height="44" fill={INK} />
        <rect x="-62" y="-40" width="124" height="12" fill={INK} />
        <circle cx="0" cy="-58" r="8" fill={PAPER} />
      </g>
    </g>
  );
};
const Lamp = ({x, y, s = 1, glow = 0, f}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow > 0 && [3, 2, 1].map((k) => <circle key={k} cy="-70" r={55 * k * glow} fill={PAPER} opacity={0.18} />)}
    <path d="M-50 -170 Q0 -230 50 -170" stroke={PAPER} strokeWidth="8" fill="none" />
    <rect x="-46" y="-172" width="92" height="16" fill={PAPER} />
    <path d="M-38 -154 Q-56 -60 -38 -10 L38 -10 Q56 -60 38 -154 Z" fill="none" stroke={PAPER} strokeWidth="8" />
    <path d={`M0 ${-100 - Math.sin(f) * 8} Q 24 -60 0 -28 Q -24 -60 0 ${-100 - Math.sin(f) * 8} Z`} fill={PAPER} />
    <path d="M-62 -10 L62 -10 L50 34 L-50 34 Z" fill={PAPER} />
  </g>
);
const Heart = ({x, y, s = 1}) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 40 C-60 -30 -10 -80 0 -30 C10 -80 60 -30 0 40 Z" fill={INK} />;
const Stamp = ({x, y, f, at, text, size = 46, rot = -4}) => {
  if (f < at) return null;
  const p = sp(f, at, 12, 200);
  const w = text.length * size * 0.62 + 50;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${1.6 - 0.6 * p})`} opacity={Math.min(1, p * 2)}>
      <rect x={-w / 2} y={-size} width={w} height={size * 1.6} fill={PAPER} stroke={INK} strokeWidth="7" />
      <rect x={-w / 2 + 8} y={-size + 8} width={w - 16} height={size * 1.6 - 16} fill="none" stroke={INK} strokeWidth="3" />
      <text y={size * 0.12 + 4} textAnchor="middle" fontFamily={DIRT} fontSize={size} fill={INK}>{text}</text>
    </g>
  );
};

// ---------- letras 3D extrudadas ----------
const DEPTH = 14;
const TY = 300;
const Title3D = ({text, at, f, x = 540, y = 400, size = 150, line2}) => {
  if (f < at - 1) return null;
  const lines = line2 ? [text, line2] : [text];
  let idx = 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, transformStyle: 'preserve-3d', transform: `translate3d(0, ${y}px, 0)`}}>
      {lines.map((ln, li) => (
        <div key={li} style={{position: 'absolute', left: 0, width: W, top: li * size * 1.05, display: 'flex', justifyContent: 'center', transformStyle: 'preserve-3d'}}>
          {ln.split('').map((ch, i) => {
            const k = idx++;
            const p = sp(f, at + k * 2, 11, 170);
            const wob = Math.sin(f / 18 + k * 0.7) * 6;
            return (
              <div key={i} style={{position: 'relative', fontFamily: DIRT, fontSize: size, lineHeight: 1, width: ch === ' ' ? size * 0.35 : undefined, transformStyle: 'preserve-3d',
                transform: `translateY(${(1 - p) * -260}px) rotateX(${(1 - p) * -110 + wob * 0.3}deg) rotateY(${wob}deg)`, opacity: Math.min(1, p * 2)}}>
                {[...Array(DEPTH)].map((_, d) => (
                  <span key={d} style={{position: d ? 'absolute' : 'relative', left: 0, top: 0, color: d ? (d === DEPTH - 1 ? INK : SEPIA) : INK, transform: `translateZ(${-d * 2.4}px)`, WebkitTextStroke: d ? undefined : `3px ${PAPER}`, filter: d ? `brightness(${1 - d * 0.03})` : undefined}}>{ch === ' ' ? ' ' : ch}</span>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ---------- cenas em camadas (z local: negativo = longe) ----------
const LAYERS = {
  hook: (f) => ({
    bg: <><SpiralSun x={760} y={380} r={150} f={f} /><Cloud x={80} y={330} s={1.1} /><Cloud x={540} y={560} s={0.8} /></>,
    far: <><Hills y={1180} /><Church x={250} y={1060} s={0.9} /></>,
    mid: <DryTree x={170} y={1300} s={1.3} />,
    main: <><Cangaceiro x={560} y={1500} s={1.35} f={f} aim={f > wAt(0, 'lampião') ? 1 : 0} />
      <Stamp x={210} y={600} f={f} at={wAt(0, 'herói')} text="HERÓI" rot={-8} size={54} /><Stamp x={870} y={660} f={f} at={wAt(0, 'bandido')} text="BANDIDO" rot={6} size={54} /><Stamp x={540} y={540} f={f} at={wAt(0, 'rei')} text="REI" rot={-3} size={60} /></>,
    fg: <><Ground y={1560} /><Palma x={90} y={1760} s={1.4} /><Mandacaru x={990} y={1780} s={1.5} /></>,
    title: <Title3D text="LAMPIÃO" at={wAt(0, 'lampião')} f={f} y={TY} size={170} />,
  }),
  origem: (f) => ({
    bg: <><SpiralSun x={300} y={360} r={130} f={f} /><Cloud x={560} y={420} s={1} /></>,
    far: <><Hills y={1150} h={200} /><House x={800} y={1080} s={0.8} /></>,
    mid: <><Cow x={250} y={1320} s={0.9} f={f} /><Cow x={830} y={1360} s={0.75} f={f + 10} /></>,
    main: <><Cangaceiro x={540} y={1520} s={1.25} f={f} young walk={0} />
      <Stamp x={540} y={560} f={f} at={wAt(1, 'pajeú') - 4} text="SERTÃO DO PAJEÚ • PE" size={40} />
      <Stamp x={260} y={800} f={f} at={wAt(2, 'vaqueiro')} text="VAQUEIRO" rot={-7} size={40} /><Stamp x={800} y={820} f={f} at={wAt(2, 'couro')} text="ARTESÃO DO COURO" rot={5} size={36} /></>,
    fg: <><Ground y={1580} /><Palma x={960} y={1780} s={1.3} flip /><Palma x={60} y={1820} s={1.0} /></>,
    title: <Title3D text="PAJEÚ" at={wAt(1, 'pajeú')} f={f} y={TY} size={180} />,
  }),
  virada: (f) => {
    const g = wAt(3, 'guerra'), pai = wAt(3, 'pai'), c = wAt(3, 'cangaço');
    return {
      bg: <><rect x="-3000" y="-3000" width="7100" height="8000" fill="url(#hatchS)" opacity=".5" /><SpiralSun x={540} y={330} r={120} f={f} /></>,
      far: <><Hills y={1100} h={220} /><House x={230} y={1000} s={0.75} /><House x={850} y={1010} s={0.75} />{f >= g && f < g + 30 && <Burst x={540} y={900} r={90} />}</>,
      mid: <>{f >= pai && <g opacity={sp(f, pai)}><path d="M720 1250 L720 1000 M650 1070 L790 1070" stroke={INK} strokeWidth="26" /></g>}
        <path transform={`translate(${200 + (f - stF('virada')) * 3} 620)`} d={st2(f) % 8 < 4 ? 'M-50 0 Q-25 -30 0 0 Q25 -30 50 0' : 'M-50 -10 Q-25 10 0 0 Q25 10 50 -10'} stroke={INK} strokeWidth="9" fill="none" /></>,
      main: <>{f >= c - 10 && <Cangaceiro x={400} y={1520} s={1.25} f={f} walk={0.6} />}
        <Stamp x={540} y={700} f={f} at={g} text="BRIGA DE FAMÍLIAS" size={44} /><Stamp x={720} y={1330} f={f} at={pai + 4} text="O PAI É MORTO" size={38} rot={5} /></>,
      fg: <><Ground y={1580} /><Mandacaru x={950} y={1800} s={1.4} /></>,
      title: <Title3D text="CANGAÇO" at={c} f={f} y={TY} size={165} />,
    };
  },
  apelido: (f) => {
    const sh = [wAt(4, 'atirava'), wAt(4, 'atirava') + 6, wAt(4, 'rápido'), wAt(4, 'rápido') + 7, wAt(4, 'cano'), wAt(4, 'clareava')];
    const glow = interpolate(f, [wAt(4, 'clareava'), wAt(4, 'clareava') + 20], [0, 1], clamp);
    return {
      bg: <><rect x="-3000" y="-3000" width="7100" height="8000" fill={INK} />{[...Array(40)].map((_, i) => <circle key={i} cx={(i * 197) % 1400 - 150} cy={(i * 113) % 1100 - 100} r={i % 4 ? 3 : 6} fill={PAPER} opacity={0.4 + 0.6 * Math.abs(Math.sin(f / 9 + i))} />)}
        <SpiralSun x={800} y={330} r={100} f={f} night /><rect x="-3000" y="-3000" width="7100" height="8000" fill={PAPER} opacity={glow * 0.22} /></>,
      far: <path d="M-1200 1180 Q -400 1060 -200 1150 Q 200 1000 540 1120 T 1300 1100 L2300 3400 L-1200 3400 Z" fill={INK} stroke={PAPER} strokeWidth="5" />,
      mid: <>{f >= wAt(4, 'lampião') - 14 && <Lamp x={820} y={1300} s={1.3} glow={glow} f={f / 3} />}</>,
      main: <><Cangaceiro x={420} y={1500} s={1.25} f={f} aim={1} />{sh.map((t, i) => f >= t && f < t + 5 ? <Burst key={i} x={760 + (i % 2) * 20} y={980} r={70} /> : null)}
        <Stamp x={540} y={560} f={f} at={stF('apelido') + 6} text="DE ONDE VEIO O APELIDO?" size={40} /></>,
      fg: <path d="M-1400 1660 Q 540 1540 2480 1660 L2480 3400 L-1400 3400 Z" fill={INK} stroke={PAPER} strokeWidth="5" />,
      title: <Title3D text="LAMPIÃO" at={wAt(4, 'lampião')} f={f} y={TY} size={170} />,
    };
  },
  rei: (f) => {
    const est = wAt(5, 'sete');
    const route = interpolate(f, [est, est + 40], [0, 1], clamp);
    const pts = [[160, 900], [300, 820], [450, 870], [600, 800], [760, 900], [660, 1010], [460, 1040]];
    return {
      bg: <><SpiralSun x={540} y={360} r={170} f={f} /><Cloud x={-20} y={520} s={0.9} /><Cloud x={760} y={600} s={0.8} /></>,
      far: <><path d="M120 960 Q160 760 380 790 Q560 720 760 800 Q880 900 800 1040 Q620 1140 380 1120 Q140 1090 120 960 Z" fill="url(#dotsI)" stroke={INK} strokeWidth="7" opacity={sp(f, est - 10)} />
        <path d={'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L ')} fill="none" stroke={INK} strokeWidth="8" strokeDasharray="1" pathLength="1" style={{strokeDasharray: `${route} 1`}} />
        {pts.map(([x, y], i) => route * 7 > i ? <circle key={i} cx={x} cy={y} r="18" fill={INK} stroke={PAPER} strokeWidth="5" /> : null)}</>,
      mid: null,
      main: <><Cangaceiro x={540} y={1560} s={1.15} f={f} crown={sp(f, stF('rei') + 10)} />
        <Stamp x={280} y={1200} f={f} at={wAt(5, 'vinte') - 4} text="≈ 20 ANOS" size={44} rot={-6} /><Stamp x={800} y={1220} f={f} at={est} text="7 ESTADOS" size={44} rot={5} /></>,
      fg: <><Ground y={1600} /><Palma x={70} y={1800} s={1.2} /></>,
      title: <Title3D text="REI DO" line2="CANGAÇO" at={wAt(5, 'líder')} f={f} y={TY} size={140} />,
    };
  },
  maria: (f) => {
    const mb = wAt(6, 'maria');
    return {
      bg: <><SpiralSun x={540} y={420} r={150} f={f} /><Cloud x={40} y={360} s={1} /><Cloud x={700} y={300} s={0.9} /></>,
      far: <><Hills y={1150} h={180} /><Church x={880} y={1060} s={0.8} /></>,
      mid: <><DryTree x={540} y={1250} s={1.0} />{f >= mb + 10 && [0, 1, 2].map((i) => { const t = ((f - mb - 10 + i * 16) % 48) / 48; return <g key={i} opacity={1 - t}><Heart x={540 + Math.sin(t * 6 + i) * 40} y={900 - t * 260} s={0.8 + t * 0.4} /></g>; })}</>,
      main: <><Cangaceiro x={300} y={1520} s={1.1} f={f} />{f >= mb - 6 && <g opacity={sp(f, mb - 6)} transform={`translate(${(1 - sp(f, mb - 6)) * 300} 0)`}><Maria x={790} y={1520} s={1.1} f={f} /></g>}
        <Stamp x={540} y={760} f={f} at={wAt(6, 'bahia')} text="SERTÃO DA BAHIA" size={42} /></>,
      fg: <><Ground y={1580} /><Palma x={1000} y={1800} s={1.2} flip /></>,
      title: <Title3D text="MARIA" line2="BONITA" at={mb} f={f} y={TY} size={150} />,
    };
  },
  fim: (f) => {
    const cerc = wAt(7, 'cercou'), s8 = sAt(8);
    const close = interpolate(f, [cerc - 10, cerc + 40], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
    const bangs = [cerc + 30, cerc + 42, cerc + 54];
    return {
      bg: <><rect x="-3000" y="-3000" width="7100" height="8000" fill={INK} /><SpiralSun x={300} y={380} r={90} f={f} night />{[...Array(30)].map((_, i) => <circle key={i} cx={(i * 211) % 1400 - 150} cy={(i * 97) % 1000} r="3" fill={PAPER} />)}</>,
      far: <path d="M-1200 1220 Q-500 1060 -200 1200 Q100 1000 300 1100 Q420 950 560 1080 Q720 960 860 1100 Q1050 1000 1300 1200 L2300 3400 L-1200 3400 Z" fill={INK} stroke={PAPER} strokeWidth="5" />,
      mid: <>{f < s8 && <path d="M440 1300 L540 1150 L640 1300 Z" fill={PAPER} stroke={INK} strokeWidth="6" />}{f >= s8 + 6 && <g opacity={sp(f, s8 + 6)}><Hat x={430} y={1380} s={0.45} color={PAPER} /><g transform="translate(650 1360)">{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-14" rx="10" ry="15" fill={PAPER} transform={`rotate(${r})`} />)}</g></g>}</>,
      main: <>{f >= cerc - 12 && f < s8 && <><g transform={`translate(${-220 + close * 220} 0)`}><Soldier x={250} y={1560} s={1} f={f} walk={1 - close} /></g><g transform={`translate(${220 - close * 220} 0)`}><Soldier x={830} y={1560} s={1} f={f} flip walk={1 - close} /></g></>}
        {bangs.map((t, i) => f >= t && f < t + 5 ? <Burst key={i} x={i % 2 ? 400 : 680} y={1150} r={55} /> : null)}
        <Stamp x={540} y={560} f={f} at={wAt(7, 'angico')} text="GROTA DO ANGICO • SE" size={40} />
        {f >= s8 && <Stamp x={540} y={900} f={f} at={s8 + 8} text="11 MORTOS" size={70} rot={-3} />}</>,
      fg: <path d="M-1400 1660 Q 540 1540 2480 1660 L2480 3400 L-1400 3400 Z" fill={INK} stroke={PAPER} strokeWidth="5" />,
      title: <Title3D text="ANGICO" at={wAt(7, 'angico')} f={f} y={TY} size={180} />,
    };
  },
  lenda: (f) => {
    const her = wAt(9, 'herói'), ban = wAt(9, 'bandido');
    return {
      bg: <><SpiralSun x={540} y={500} r={230} f={f} /></>,
      far: <Hills y={1250} h={150} />,
      mid: null,
      main: <><Cangaceiro x={540} y={1560} s={1.2} f={f} />
        <Stamp x={540} y={640} f={f} at={wAt(9, 'lenda')} text="O HOMEM MORREU. A LENDA FICOU." size={30} /></>,
      fg: <><Ground y={1600} /><Mandacaru x={90} y={1800} s={1.3} /><Palma x={1000} y={1800} s={1.2} flip /></>,
      title: <>{f >= her && <div style={{position: 'absolute', left: -280, top: 0, width: W, transformStyle: 'preserve-3d', transform: 'rotateZ(-6deg)'}}><Title3D text="HERÓI?" at={her} f={f} y={280} size={120} /></div>}
        {f >= ban && <div style={{position: 'absolute', left: 250, top: 0, width: W, transformStyle: 'preserve-3d', transform: 'rotateZ(5deg)'}}><Title3D text="BANDIDO?" at={ban} f={f} y={420} size={110} /></div>}</>,
    };
  },
  cta: (f) => ({
    bg: <SpiralSun x={540} y={620} r={260} f={f} />,
    far: null,
    mid: null,
    main: <><Hat x={540} y={1250} s={1.6} /><Stamp x={540} y={1420} f={f} at={stF('cta') + 6} text="HERÓI OU BANDIDO?" size={50} /></>,
    fg: <><Palma x={80} y={1820} s={1.3} /><Mandacaru x={990} y={1820} s={1.4} /></>,
    title: <Title3D text="COMENTA" line2="AÍ" at={wAt(10, 'comenta')} f={f} y={TY} size={150} />,
  }),
};
const ZL = {bg: -1500, far: -900, mid: -450, main: -150, title: -110, fg: 280};

// ---------- câmera ----------
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const FLY0 = 16, FLY1 = 10, DOLLY = 300;
const camAt = (f) => {
  const i = sceneIdx(f);
  const k = order[i];
  const a = stF(k), b = enF(k);
  const next = order[i + 1];
  let z = i * SPACING + interpolate(f, [a + FLY1, b - FLY0], [0, DOLLY], {...clamp, easing: Easing.inOut(Easing.sin)});
  if (i > 0 && f < a + FLY1) {
    const p = ease(interpolate(f, [a - FLY0, a + FLY1], [0, 1], clamp));
    z = (i - 1) * SPACING + DOLLY + p * (SPACING - DOLLY);
  }
  if (next && f >= b - FLY0) {
    const p = ease(interpolate(f, [b - FLY0, b + FLY1], [0, 1], clamp));
    z = i * SPACING + DOLLY + p * (SPACING - DOLLY);
  }
  const x = Math.sin(f / 70) * 110 + Math.sin(f / 23) * 18;
  const y = Math.cos(f / 85) * 50;
  const ry = Math.sin(f / 60) * 4;
  const rz = Math.sin(f / 95) * 1.6;
  return {z, x, y, ry, rz};
};

const Layer = ({k, name, idx, cam, f, children}) => {
  const z = -idx * SPACING + ZL[name];
  const eff = z + cam.z;
  if (eff > PERSP - 60 || eff < -6200) return null;
  const sc = (PERSP - ZL[name]) / PERSP;
  const op = interpolate(eff, [PERSP * 0.55, PERSP - 80], [1, 0], clamp) * interpolate(eff, [-4300, -3100], [0, 1], clamp);
  const isHtml = name === 'title';
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformStyle: 'preserve-3d', transform: `translate3d(0,0,${z}px) scale(${sc})`, opacity: op}}>
      {isHtml ? children : (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', overflow: 'visible'}}><Defs />{children}</svg>
      )}
    </div>
  );
};

const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .2 0 0 0 0 .16 0 0 0 0 .1 0 0 0 .35 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")`;

const SFX = (() => {
  const E = [];
  const add = (n, fr, v) => E.push([n, Math.max(0, Math.round(fr)), v]);
  order.slice(1).forEach((k) => add('sfx/whoosh', stF(k) - FLY0, 0.4));
  [['hook', 0, 'lampião'], ['origem', 1, 'pajeú'], ['virada', 3, 'cangaço'], ['apelido', 4, 'lampião'], ['rei', 5, 'líder'], ['maria', 6, 'maria'], ['fim', 7, 'angico'], ['cta', 10, 'comenta']].forEach(([, i, w]) => add('cordel/carimbo', wAt(i, w) + 10, 0.55));
  [wAt(0, 'herói'), wAt(0, 'bandido'), wAt(0, 'rei'), wAt(2, 'vaqueiro'), wAt(2, 'couro'), wAt(3, 'guerra'), wAt(5, 'vinte'), wAt(5, 'sete'), sAt(8) + 8, wAt(9, 'herói'), wAt(9, 'bandido')].forEach((t) => add('cordel/carimbo', t, 0.35));
  [wAt(4, 'atirava'), wAt(4, 'atirava') + 6, wAt(4, 'rápido'), wAt(4, 'rápido') + 7, wAt(4, 'cano'), wAt(4, 'clareava')].forEach((t) => add('cordel/bang', t, 0.18));
  [0, 12, 24].forEach((d) => add('cordel/bang', wAt(7, 'cercou') + 30 + d, 0.14));
  add('cordel/wind', 0, 0.25); add('cordel/wind', stF('fim'), 0.3);
  return E;
})();

const Frame = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const ci = sceneIdx(f);
  const vis = order.slice(Math.max(0, ci - 1), ci + 2).filter((k) => order.indexOf(k) <= ci || f >= stF(k) - FLY0 - 1);
  const flick = 0.96 + ((Math.floor(f / 2) * 7919) % 100) / 2500;
  const music = (fr) => (fr >= stF('fim') && fr < stF('lenda') ? 0.08 : 0.18) * interpolate(fr, [0, 12, DUR - 75, DUR], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{background: PAPER, overflow: 'hidden'}}>
      <AbsoluteFill style={{perspective: PERSP, perspectiveOrigin: '50% 50%', filter: `brightness(${flick}) sepia(.25)`}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateZ(${cam.rz}deg) rotateY(${cam.ry}deg) translate3d(${-cam.x}px, ${-cam.y}px, ${cam.z}px)`}}>
          {vis.map((k) => {
            const idx = order.indexOf(k);
            const L = LAYERS[k](f);
            return ['bg', 'far', 'mid', 'main', 'title', 'fg'].map((n) => L[n] ? <Layer key={`${k}-${n}`} k={k} name={n} idx={idx} cam={cam} f={f}>{L[n]}</Layer> : null);
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundImage: NOISE, backgroundPosition: `${(f * 37) % 300}px ${(f * 53) % 300}px`, mixBlendMode: 'multiply', opacity: 0.8}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(40,28,12,.55) 100%)'}} />
      <Audio src={staticFile('lamp2/voz.wav')} />
      <Audio src={staticFile('lamp2/trilha.mp3')} volume={music} />
      {SFX.map(([n, fr, v], i) => <Sequence key={i} from={fr} durationInFrames={90}><Audio src={staticFile(`${n}.wav`)} volume={v} /></Sequence>)}
    </AbsoluteFill>
  );
};

registerRoot(() => <Composition id="Cordel3D" component={Frame} durationInFrames={DUR} fps={FPS} width={W} height={H} />);
