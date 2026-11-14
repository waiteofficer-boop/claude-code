import {registerRoot, Composition, AbsoluteFill, useCurrentFrame, interpolate, Easing, Audio, staticFile, Sequence, spring} from 'remotion';
import React from 'react';
import '@fontsource/rye/400.css';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import T from './timeline-cordel.json';

// ---------- paleta xilogravura ----------
const PAPER = '#efe0bf';
const PAPER_D = '#e2cd9f';
const INK = '#1b1611';
const RED = '#b5291c';
const OCHRE = '#d9932b';
const TITLE = 'Rye, serif';
const TEXT = '"IM Fell English", serif';

const FPS = T.fps;
const DUR = Math.ceil(T.total * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const sec = (s) => Math.round(s * FPS);
const sAt = (i) => sec(T.sentences[i].start);
const order = ['capa', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'cta'];
const scenes = {};
T.sentences.forEach((s, i) => {
  const sc = scenes[s.scene] || (scenes[s.scene] = {start: s.start, idx: []});
  sc.idx.push(i);
});
order.forEach((k, i) => { scenes[k].to = order[i + 1] ? scenes[order[i + 1]].start : T.total; });
const stF = (k) => sec(scenes[k].start);
const sceneAt = (f) => order.find((k) => f >= stF(k) && f < sec(scenes[k].to)) || order[order.length - 1];

// animação "feita à mão": 15 quadros por segundo + tremidinho do entalhe
const st2 = (f) => Math.floor(f / 2) * 2;
const boil = (f) => Math.floor(f / 3) % 6;
const popIn = (f, at, d = 8) => interpolate(st2(f), [at, at + d], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});

// ---------- títulos e versos de cada página ----------
const PAGES = {
  e1: 'O MENINO DO PAJEÚ',
  e2: 'A VINGANÇA',
  e3: 'O NOME LAMPIÃO',
  e4: 'O REI E A RAINHA',
  e5: 'A GROTA DO ANGICO',
  e6: 'A LENDA',
};
const VERSOS = {
  1: ['Lá no sertão do Pajeú,', 'terra de sol e de espinho,'],
  2: ['nasceu Virgulino Ferreira,', 'menino de bom caminho,'],
  3: ['vaqueiro e artesão de couro,', 'amansador de redemoinho.'],
  4: ['Mas a briga entre famílias', 'virou guerra no sertão;'],
  5: ['quando mataram seu pai,', 'ferveu o seu coração:'],
  6: ['deixou a vida de vaqueiro', 'e entrou pro cangaço, então.'],
  7: ['Dizem que, no tiroteio,', 'seu rifle não descansava:'],
  8: ['era tanto fogo aceso', 'que a noite se clareava.'],
  9: ['Por isso, de Lampião,', 'o povo o apelidava.'],
  10: ['Rei do Cangaço chamado,', 'quase vinte anos de correria,'],
  11: ['rodou sete estados inteiros,', 'temido de noite e de dia;'],
  12: ['e no sertão da Bahia', 'achou seu amor: Maria.'],
  13: ['Numa noite de julho,', 'no Angico, de madrugada,'],
  14: ['a volante cercou o bando', 'numa emboscada calada;'],
  15: ['caíram Lampião e Maria,', 'e a história foi encerrada.'],
  16: ['Morreu o homem, ficou', 'a lenda pelo sertão:'],
  17: ['pra uns, herói valente;', 'pra outros, puro vilão.'],
  18: ['E até hoje o cordel canta', 'a vida de Lampião.'],
};

// ---------- filtro de entalhe (bordas irregulares que "fervem") ----------
const WoodDefs = ({f}) => (
  <svg width="0" height="0" style={{position: 'absolute'}}>
    <defs>
      <filter id={`wood${boil(f)}`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={boil(f) + 1} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <rect width="14" height="14" fill={INK} /><rect width="4" height="14" fill={PAPER} />
      </pattern>
      <pattern id="hatchR" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
        <rect width="16" height="16" fill={RED} /><rect width="4" height="16" fill={PAPER} />
      </pattern>
    </defs>
  </svg>
);
const Ink = ({children, f}) => <g filter={`url(#wood${boil(f)})`}>{children}</g>;

// ---------- desenhos em xilogravura ----------
const Sun = ({cx, cy, r, rot = 0, color = INK}) => (
  <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
    {[...Array(18)].map((_, i) => <path key={i} d={`M ${-r * 0.16} ${-r * 1.08} L 0 ${-r * 1.75} L ${r * 0.16} ${-r * 1.08} Z`} fill={i % 2 ? RED : color} transform={`rotate(${i * 20})`} />)}
    <circle r={r} fill={color} />
    <circle r={r * 0.78} fill="none" stroke={PAPER} strokeWidth="5" />
    <circle r={r * 0.55} fill="none" stroke={PAPER} strokeWidth="4" strokeDasharray="10 9" />
    <circle r={r * 0.28} fill={PAPER} />
  </g>
);
const Ground = ({y, w = 900, h = 840}) => (
  <g>
    <path d={`M0 ${y} Q ${w * 0.25} ${y - 60} ${w * 0.5} ${y} T ${w} ${y - 10} L ${w} ${h} L 0 ${h} Z`} fill={INK} />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${20 + i * 30} ${y + 40 + i * 38} q 110 -26 220 0 t 220 0 t 220 0 t 200 0`} stroke={PAPER} strokeWidth="5" fill="none" strokeLinecap="round" />)}
  </g>
);
const Mandacaru = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-28 0 L-28 -300 Q0 -340 28 -300 L28 0 Z" fill={INK} />
    <path d="M-28 -150 L-90 -150 Q-110 -150 -110 -175 L-110 -250 Q-90 -280 -70 -250 L-70 -185 L-28 -185 Z" fill={INK} />
    <path d="M28 -110 L90 -110 Q110 -110 110 -135 L110 -220 Q90 -250 70 -220 L70 -145 L28 -145 Z" fill={INK} />
    {[-12, 0, 12].map((d) => <line key={d} x1={d} y1="-15" x2={d} y2="-300" stroke={PAPER} strokeWidth="3" />)}
    <line x1="-90" y1="-175" x2="-90" y2="-245" stroke={PAPER} strokeWidth="3" />
    <line x1="90" y1="-135" x2="90" y2="-215" stroke={PAPER} strokeWidth="3" />
  </g>
);
const Casa = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-120 -120 L0 -200 L120 -120 Z" fill="url(#hatch)" stroke={INK} strokeWidth="6" />
    <rect x="-100" y="-120" width="200" height="120" fill={INK} />
    <rect x="-28" y="-80" width="56" height="80" fill={PAPER} />
    <rect x="45" y="-95" width="36" height="34" fill={PAPER} />
    <line x1="63" y1="-95" x2="63" y2="-61" stroke={INK} strokeWidth="4" />
  </g>
);
// chapéu de couro meia-lua (origem = centro do rosto): copa + aba dobrada presa na frente + estrela
const star = (cx, cy, r) => [...Array(10)].map((_, k) => {
  const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.42 : r;
  return `${k ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
}).join(' ') + ' Z';
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
      {[-60, -30, 0, 30, 60].map((cx) => <circle key={cx} cx={cx} cy={-45 + Math.abs(cx) * 0.12} r="4" fill={det} />)}
    </g>
  );
};
// sanfona em xilogravura: fole abre e fecha no ritmo da trilha (~96 BPM)
const BEAT = 0.627;
const Sanfona = ({x, y, s = 1, f, notes = false}) => {
  const t = f / 30;
  const open = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / (2 * BEAT));
  const folds = 9, W = 120 + 90 * open, H = 220;
  const fw = W / folds;
  const tilt = (open - 0.5) * 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {notes && [0, 1, 2].map((i) => {
        const ph = ((t / BEAT + i * 0.66) % 2) / 2;
        return <text key={i} x={-40 + i * 50 + Math.sin(ph * 6 + i) * 18} y={-H / 2 - 30 - ph * 160} fontSize={56} fontFamily="serif" fill={i === 1 ? RED : INK} opacity={Math.sin(ph * Math.PI)} textAnchor="middle">{i % 2 ? '♫' : '♪'}</text>;
      })}
      <g transform={`rotate(${-tilt})`}>
        <rect x={-W / 2 - 115} y={-H / 2} width="115" height={H} rx="10" fill={INK} />
        <rect x={-W / 2 - 92} y={-H / 2 + 18} width="44" height={H - 36} fill={PAPER} />
        {[...Array(9)].map((_, k) => <line key={k} x1={-W / 2 - 92} y1={-H / 2 + 18 + (k + 1) * ((H - 36) / 10)} x2={-W / 2 - 48} y2={-H / 2 + 18 + (k + 1) * ((H - 36) / 10)} stroke={INK} strokeWidth="3" />)}
        {[...Array(5)].map((_, k) => <rect key={k} x={-W / 2 - 92} y={-H / 2 + 26 + k * 36} width="26" height="14" fill={INK} />)}
        <path d={star(-W / 2 - 24, -H / 2 + 34, 14)} fill={RED} />
      </g>
      {[...Array(folds)].map((_, k) => (
        <g key={k}>
          <rect x={-W / 2 + k * fw} y={-H / 2 + 6} width={fw + 0.5} height={H - 12} fill={k % 2 ? RED : INK} />
          <path d={`M${-W / 2 + k * fw} ${-H / 2 + 6} l${fw / 2} -10 l${fw / 2} 10 M${-W / 2 + k * fw} ${H / 2 - 6} l${fw / 2} 10 l${fw / 2} -10`} stroke={INK} strokeWidth="4" fill="none" />
          <line x1={-W / 2 + k * fw} y1={-H / 2 + 6} x2={-W / 2 + k * fw} y2={H / 2 - 6} stroke={PAPER} strokeWidth="2.5" />
        </g>
      ))}
      <g transform={`rotate(${tilt})`}>
        <rect x={W / 2} y={-H / 2} width="100" height={H} rx="10" fill={INK} />
        {[...Array(12)].map((_, k) => <circle key={k} cx={W / 2 + 28 + (k % 3) * 22} cy={-H / 2 + 34 + Math.floor(k / 3) * 44} r="8" fill={PAPER} />)}
      </g>
      <path d={`M${-W / 2 - 100} ${-H / 2} Q0 ${-H / 2 - 50} ${W / 2 + 90} ${-H / 2}`} stroke={OCHRE} strokeWidth="8" fill="none" />
    </g>
  );
};
const Lampiao = ({x, y, s = 1, f}) => {
  const blink = (Math.floor(f / 2) % 70) < 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-170 260 Q-150 110 0 95 Q150 110 170 260 Z" fill={INK} />
      <line x1="-120" y1="140" x2="110" y2="260" stroke={PAPER} strokeWidth="22" />
      <line x1="-120" y1="140" x2="110" y2="260" stroke={INK} strokeWidth="12" strokeDasharray="8 10" />
      <line x1="120" y1="140" x2="-110" y2="260" stroke={PAPER} strokeWidth="22" />
      <line x1="120" y1="140" x2="-110" y2="260" stroke={INK} strokeWidth="12" strokeDasharray="8 10" />
      <path d="M-55 85 L55 85 L0 150 Z" fill={RED} />
      <rect x="-26" y="40" width="52" height="55" fill={INK} />
      <ellipse cx="0" cy="-5" rx="78" ry="92" fill={PAPER} stroke={INK} strokeWidth="9" />
      <path d="M-78 -10 q-22 10 0 40 M78 -10 q22 10 0 40" stroke={INK} strokeWidth="8" fill="none" />
      <circle cx="-30" cy="-10" r="22" fill={PAPER} stroke={INK} strokeWidth="7" />
      <circle cx="32" cy="-10" r="22" fill={PAPER} stroke={INK} strokeWidth="7" />
      <line x1="-8" y1="-12" x2="10" y2="-12" stroke={INK} strokeWidth="6" />
      {!blink ? <><circle cx="-30" cy="-8" r="6" fill={INK} /><circle cx="32" cy="-8" r="6" fill={INK} /></> : <><line x1="-40" y1="-8" x2="-20" y2="-8" stroke={INK} strokeWidth="5" /><line x1="22" y1="-8" x2="42" y2="-8" stroke={INK} strokeWidth="5" /></>}
      <path d="M0 5 L-10 35 L8 35" stroke={INK} strokeWidth="6" fill="none" />
      <path d="M-28 55 Q0 66 28 55" stroke={INK} strokeWidth="7" fill="none" />
      {[...Array(9)].map((_, i) => <circle key={i} cx={-40 + i * 10} cy={70 + (i % 2) * 6} r="2.5" fill={INK} />)}
      <path d="M-74 -28 Q-70 70 0 96 Q70 70 74 -28" stroke={INK} strokeWidth="4" fill="none" />
      <Hat />
    </g>
  );
};
const MariaBonita = ({x, y, s = 1, f}) => {
  const blink = ((Math.floor(f / 2) + 20) % 70) < 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-160 260 Q-140 110 0 98 Q140 110 160 260 Z" fill={INK} />
      {[...Array(10)].map((_, i) => <circle key={i} cx={-110 + (i % 5) * 55} cy={170 + Math.floor(i / 5) * 50} r="9" fill={PAPER} />)}
      <path d="M-95 -40 Q-110 120 -50 140 L50 140 Q110 120 95 -40 Q90 -120 0 -125 Q-90 -120 -95 -40 Z" fill={INK} />
      <rect x="-24" y="40" width="48" height="60" fill={INK} />
      <ellipse cx="0" cy="-5" rx="70" ry="86" fill={PAPER} stroke={INK} strokeWidth="9" />
      <path d="M-72 -30 Q-30 -95 0 -70 Q30 -95 72 -30 Q60 -110 0 -112 Q-60 -110 -72 -30 Z" fill={INK} />
      {!blink ? <><ellipse cx="-26" cy="-8" rx="9" ry="7" fill={INK} /><ellipse cx="26" cy="-8" rx="9" ry="7" fill={INK} /></> : <><line x1="-36" y1="-8" x2="-16" y2="-8" stroke={INK} strokeWidth="5" /><line x1="16" y1="-8" x2="36" y2="-8" stroke={INK} strokeWidth="5" /></>}
      <path d="M-40 -26 l26 -4 M14 -30 l26 4" stroke={INK} strokeWidth="5" />
      <path d="M0 2 L-8 28 L8 28" stroke={INK} strokeWidth="5" fill="none" />
      <path d="M-22 48 Q0 58 22 48" stroke={RED} strokeWidth="8" fill="none" />
      <circle cx="-74" cy="30" r="8" fill={OCHRE} /><circle cx="74" cy="30" r="8" fill={OCHRE} />
      <g transform="translate(70 -80)">
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-16" rx="11" ry="17" fill={RED} transform={`rotate(${a})`} />)}
        <circle r="8" fill={OCHRE} />
      </g>
    </g>
  );
};
const Rifle = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M0 0 L60 -8 L230 -8 L230 6 L70 10 L50 34 L0 30 Z" fill={INK} />
    <rect x="230" y="-6" width="120" height="8" fill={INK} />
    <rect x="80" y="-14" width="40" height="6" fill={INK} />
  </g>
);
const Lamp = ({x, y, s = 1, glow = 0, f}) => {
  const fl = 1 + 0.12 * Math.sin(st2(f) * 0.9);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {glow > 0 && [3, 2, 1].map((k) => <circle key={k} cx="0" cy="-60" r={60 * k * glow * fl} fill={OCHRE} opacity={0.12 * glow} />)}
      <path d="M-50 -170 Q0 -230 50 -170" stroke={INK} strokeWidth="8" fill="none" />
      <rect x="-45" y="-170" width="90" height="16" fill={INK} />
      <path d="M-38 -154 Q-55 -60 -38 -10 L38 -10 Q55 -60 38 -154 Z" fill="none" stroke={INK} strokeWidth="8" />
      <path d={`M0 ${-40 - 60 * fl} Q 22 -60 0 -30 Q -22 -60 0 ${-40 - 60 * fl} Z`} fill={glow > 0 ? OCHRE : PAPER_D} stroke={RED} strokeWidth="4" />
      <path d="M-60 -10 L60 -10 L50 30 L-50 30 Z" fill={INK} />
      <rect x="-30" y="0" width="60" height="6" fill={PAPER} />
    </g>
  );
};
const Bird = ({x, y, f, s = 1}) => {
  const up = Math.floor(f / 4) % 2;
  return <path transform={`translate(${x} ${y}) scale(${s})`} d={up ? 'M-50 0 Q-25 -30 0 0 Q25 -30 50 0' : 'M-50 -10 Q-25 10 0 0 Q25 10 50 -10'} stroke={INK} strokeWidth="9" fill="none" strokeLinecap="round" />;
};
const Burst = ({x, y, r = 40, color = OCHRE}) => (
  <g transform={`translate(${x} ${y})`}>
    {[...Array(10)].map((_, i) => <path key={i} d={`M -6 0 L 0 ${-r} L 6 0 Z`} fill={i % 2 ? RED : color} transform={`rotate(${i * 36})`} />)}
    <circle r={r * 0.3} fill={PAPER} />
  </g>
);

// ---------- ilustrações das páginas (viewBox 900x840) ----------
const IlluE1 = ({f}) => {
  const a = stF('e1');
  return (
    <>
      <Sun cx={650} cy={220} r={95} rot={st2(f) * 0.3} />
      <Ground y={640} />
      <g opacity={popIn(f, a + 4)}><Mandacaru x={140} y={660} s={1.05} /></g>
      <g opacity={popIn(f, a + 10)}><Mandacaru x={790} y={670} s={0.7} /></g>
      <g opacity={popIn(f, sAt(2) - 6)} transform={`translate(${interpolate(st2(f), [sAt(2), sAt(3) + 60], [0, 40], clamp)} 0)`}>
        <Casa x={470} y={650} s={0.9} />
      </g>
      {f >= sAt(2) && <g transform={`translate(0 ${(1 - popIn(f, sAt(2), 10)) * 120})`}><Lampiao x={300} y={420} s={0.62} f={f} /></g>}
      {f >= sAt(3) && [0, 1, 2].map((i) => {
        const t = (st2(f) - sAt(3) + i * 14) % 42;
        return <path key={i} d={`M ${600 + i * 40} ${560 - t * 4} q 30 -20 0 -40 q -30 -20 0 -40`} stroke={INK} strokeWidth="6" fill="none" opacity={1 - t / 42} />;
      })}
    </>
  );
};
const IlluE2 = ({f}) => {
  const a = stF('e2');
  return (
    <>
      <rect x="0" y="0" width="900" height="840" fill="url(#hatchR)" opacity={interpolate(st2(f), [sAt(5), sAt(5) + 10], [0, 0.55], clamp)} />
      <Sun cx={450} cy={300} r={80} rot={-st2(f) * 0.2} />
      <Ground y={600} />
      <g opacity={popIn(f, a + 6)}>
        <rect x="210" y="380" width="18" height="230" fill={INK} />
        <rect x="160" y="440" width="118" height="18" fill={INK} />
      </g>
      <Bird x={300 + (st2(f) - a) * 2} y={180 + Math.sin(st2(f) / 10) * 20} f={f} s={1.1} />
      <Bird x={140 + (st2(f) - a) * 1.6} y={250} f={f + 2} s={0.8} />
      {f >= sAt(5) && <g opacity={popIn(f, sAt(5) + 4)} transform="translate(560 360)"><path d="M0 40 C-60 -30 -10 -80 0 -30 C10 -80 60 -30 0 40 Z" fill={RED} /></g>}
      {f >= sAt(6) && (
        <g transform={`translate(0 ${(1 - popIn(f, sAt(6), 10)) * 140})`}>
          <Lampiao x={600} y={500} s={0.6} f={f} />
          <Rifle x={430} y={640} rot={-35} s={0.9} />
        </g>
      )}
    </>
  );
};
const IlluE3 = ({f}) => {
  const fire = [sAt(7) + 6, sAt(7) + 18, sAt(7) + 26, sAt(7) + 40, sAt(8) + 4, sAt(8) + 12];
  const glow = interpolate(st2(f), [sAt(8), sAt(8) + 20], [0, 1], clamp);
  return (
    <>
      <rect x="0" y="0" width="900" height="840" fill={INK} />
      {[...Array(24)].map((_, i) => <circle key={i} cx={(i * 137) % 900} cy={(i * 89) % 420} r={i % 3 ? 2.5 : 4} fill={PAPER} opacity={1 - glow * 0.7} />)}
      <path d="M700 120 a 60 60 0 1 0 50 95 a 48 48 0 1 1 -50 -95 Z" fill={PAPER} opacity={1 - glow * 0.6} />
      <rect x="0" y="0" width="900" height="840" fill={OCHRE} opacity={glow * 0.35} />
      <path d="M0 640 Q 225 590 450 640 T 900 630 L 900 840 L 0 840 Z" fill={PAPER} opacity=".18" />
      <Rifle x={150} y={560} rot={-12} s={1.1} />
      {fire.map((t, i) => st2(f) >= t && st2(f) < t + 6 ? <Burst key={i} x={555 + (i % 3) * 18} y={480 - (i % 2) * 20} r={50} /> : null)}
      {f >= sAt(9) - 10 && <g opacity={popIn(f, sAt(9) - 10)}><Lamp x={700} y={720} s={1.1} glow={glow} f={f} /></g>}
      {f >= sAt(9) && (
        <text x="450" y="300" textAnchor="middle" fontFamily={TITLE} fontSize={96 * popIn(f, sAt(9) + 4)} fill={OCHRE} stroke={INK} strokeWidth="3">LAMPIÃO</text>
      )}
    </>
  );
};
const IlluE4 = ({f}) => {
  const a = stF('e4');
  const map = interpolate(st2(f), [sAt(11), sAt(11) + 50], [0, 1], clamp);
  const pts = [[200, 300], [300, 220], [420, 260], [520, 200], [600, 330], [500, 430], [360, 470]];
  const couple = st2(f) >= sAt(12);
  return (
    <>
      {!couple && (
        <>
          <g opacity={popIn(f, a + 2)} transform={`translate(0 ${(1 - popIn(f, a + 2)) * 80})`}><Lampiao x={450} y={330} s={0.85} f={f} /></g>
          {f >= a + 10 && <g transform={`translate(450 ${95 + Math.sin(st2(f) / 8) * 6})`} opacity={popIn(f, a + 10)}>
            <path d="M-110 30 L-80 -40 L-40 0 L0 -60 L40 0 L80 -40 L110 30 Z" fill={OCHRE} stroke={INK} strokeWidth="6" />
          </g>}
          {f >= sAt(11) && (
            <g>
              <path d="M120 600 Q160 520 260 540 Q380 500 470 560 Q600 540 700 600 Q760 680 640 740 Q480 790 300 760 Q140 740 120 600 Z" fill={PAPER_D} stroke={INK} strokeWidth="7" transform="translate(40 -10)" />
              <path d={'M' + pts.map(([x, y]) => `${x + 60} ${y + 380}`).join(' L ')} fill="none" stroke={RED} strokeWidth="6" strokeDasharray="14 10" pathLength="1" style={{strokeDasharray: `${map} 1`}} />
              {pts.map(([x, y], i) => map * 7 > i ? <circle key={i} cx={x + 60} cy={y + 380} r="14" fill={INK} /> : null)}
              <text x="450" y="830" textAnchor="middle" fontFamily={TITLE} fontSize="40" fill={INK} opacity={map}>SETE ESTADOS</text>
            </g>
          )}
        </>
      )}
      {couple && (
        <>
          <Sun cx={450} cy={170} r={70} rot={st2(f) * 0.3} />
          <g transform={`translate(${(1 - popIn(f, sAt(12), 10)) * -300} 0)`}><Lampiao x={250} y={470} s={0.75} f={f} /></g>
          <g transform={`translate(${(1 - popIn(f, sAt(12) + 4, 10)) * 300} 0)`}><MariaBonita x={650} y={480} s={0.75} f={f} /></g>
          {f >= sAt(12) + 18 && <path transform={`translate(450 ${380 - (st2(f) % 20)}) scale(${0.8 + 0.1 * Math.sin(st2(f) / 4)})`} d="M0 40 C-60 -30 -10 -80 0 -30 C10 -80 60 -30 0 40 Z" fill={RED} />}
          <text x="450" y="800" textAnchor="middle" fontFamily={TITLE} fontSize="44" fill={RED} opacity={popIn(f, sAt(12) + 24)}>MARIA BONITA</text>
        </>
      )}
    </>
  );
};
const IlluE5 = ({f}) => {
  const a = stF('e5');
  const bangs = [sAt(14) + 10, sAt(14) + 18, sAt(14) + 30, sAt(14) + 38, sAt(14) + 52];
  const dark = interpolate(st2(f), [sAt(15), sAt(15) + 20], [0, 1], clamp);
  const soldiers = [[90, 590], [210, 560], [690, 560], [810, 590]];
  return (
    <>
      <rect x="0" y="0" width="900" height="840" fill={INK} />
      <path d="M180 140 a 70 70 0 1 0 60 110 a 56 56 0 1 1 -60 -110 Z" fill={PAPER} />
      {[...Array(18)].map((_, i) => <circle key={i} cx={(i * 173) % 900} cy={(i * 71) % 360} r="3" fill={PAPER} />)}
      <path d="M0 700 Q120 560 260 640 Q340 520 450 600 Q560 520 640 640 Q780 560 900 700 L900 840 L0 840 Z" fill={PAPER} opacity=".22" />
      <path d="M300 760 Q450 690 600 760" stroke={PAPER} strokeWidth="5" fill="none" opacity=".5" />
      {f >= sAt(14) && soldiers.map(([x, y], i) => (
        <g key={i} opacity={popIn(f, sAt(14) + i * 3)} transform={`translate(${x} ${y + (1 - popIn(f, sAt(14) + i * 3)) * 40})`}>
          <rect x="-12" y="-70" width="24" height="10" fill={PAPER} />
          <rect x="-22" y="-62" width="44" height="8" fill={PAPER} />
          <circle cx="0" cy="-42" r="18" fill={PAPER} />
          <path d="M-30 60 L-24 -20 L24 -20 L30 60 Z" fill={PAPER} />
          <line x1={i < 2 ? 20 : -20} y1="-6" x2={i < 2 ? 110 : -110} y2="-30" stroke={PAPER} strokeWidth="8" />
        </g>
      ))}
      {bangs.map((t, i) => st2(f) >= t && st2(f) < t + 6 ? <Burst key={i} x={i % 2 ? 330 : 580} y={540} r={45} /> : null)}
      {f >= sAt(15) + 6 && (
        <g opacity={popIn(f, sAt(15) + 6)}>
          <Hat x={360} y={790} s={0.42} color={PAPER} />
          <g transform="translate(540 720)">{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-14" rx="10" ry="15" fill={RED} transform={`rotate(${r})`} />)}<circle r="7" fill={OCHRE} /></g>
        </g>
      )}
      <rect x="0" y="0" width="900" height="840" fill={INK} opacity={dark * 0.55} />
    </>
  );
};
const IlluE6 = ({f}) => {
  const a = stF('e6');
  const tilt = f >= sAt(17) ? Math.sin((st2(f) - sAt(17)) / 10) * 12 : 0;
  const string = st2(f) >= sAt(18);
  return (
    <>
      <Sun cx={450} cy={300} r={120} rot={st2(f) * 0.25} />
      {!string && <g opacity={popIn(f, a + 2)}><Lampiao x={450} y={330} s={0.8} f={f} /></g>}
      {f >= sAt(17) && !string && (
        <g transform={`translate(450 545)`} opacity={popIn(f, sAt(17))}>
          <rect x="-8" y="0" width="16" height="200" fill={INK} />
          <g transform={`rotate(${tilt})`}>
            <rect x="-260" y="-8" width="520" height="16" fill={INK} />
            {[[-230, 'HERÓI', INK], [230, 'VILÃO', RED]].map(([x, t, c]) => (
              <g key={t} transform={`translate(${x} 0) rotate(${-tilt})`}>
                <line x1="-60" y1="0" x2="-40" y2="90" stroke={INK} strokeWidth="5" /><line x1="60" y1="0" x2="40" y2="90" stroke={INK} strokeWidth="5" />
                <path d="M-80 90 L80 90 Q60 140 0 140 Q-60 140 -80 90 Z" fill={c} />
                <text y="190" textAnchor="middle" fontFamily={TITLE} fontSize="44" fill={c}>{t}</text>
              </g>
            ))}
          </g>
        </g>
      )}
      {string && (
        <g>
          <path d="M-20 520 Q450 600 920 520" stroke={INK} strokeWidth="5" fill="none" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${130 + i * 215} ${548 + Math.abs(i - 1.5) * -12}) rotate(${Math.sin(st2(f) / 12 + i) * 4})`} opacity={popIn(f, sAt(18) + i * 5)}>
              <rect x="-8" y="-16" width="16" height="32" fill={OCHRE} stroke={INK} strokeWidth="3" />
              <rect x="-80" y="10" width="160" height="230" fill={PAPER_D} stroke={INK} strokeWidth="6" />
              <Hat x={0} y={170} s={0.36} />
              <text y="215" textAnchor="middle" fontFamily={TITLE} fontSize="22" fill={INK}>{['LAMPIÃO', 'CANGAÇO', 'SERTÃO', 'MARIA'][i]}</text>
            </g>
          ))}
        </g>
      )}
    </>
  );
};
const ILLU = {e1: IlluE1, e2: IlluE2, e3: IlluE3, e4: IlluE4, e5: IlluE5, e6: IlluE6};

// ---------- folheto (página) ----------
const PAGE = {x: 70, y: 150, w: 940, h: 1460};
const Verses = ({k, f}) => {
  const idx = scenes[k].idx;
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1000, height: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: TEXT, fontSize: 46, lineHeight: 1.22, color: INK}}>
      {idx.map((i) => {
        const lines = VERSOS[i];
        const words = T.sentences[i].words;
        let wi = 0;
        return lines.map((ln, li) => (
          <div key={`${i}-${li}`} style={{fontStyle: li === 1 ? 'italic' : 'normal'}}>
            {ln.split(' ').map((w, j) => {
              const ws = words[wi++];
              const on = ws ? f >= sec(ws.s) - 1 : f >= sAt(i);
              return <span key={j} style={{opacity: on ? 1 : 0.0}}>{w} </span>;
            })}
          </div>
        ));
      })}
    </div>
  );
};
const Page = ({k, f}) => {
  const Illu = ILLU[k];
  const a = stF(k);
  if (k === 'capa') return <Capa f={f} />;
  if (k === 'cta') return <Cta f={f} />;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 30, right: 30, top: 34, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: `6px solid ${INK}`, borderBottom: `6px solid ${INK}`}}>
        {[0, 1].map((side) => (
          <svg key={side} width="96" height="80" viewBox="-240 -180 480 360" style={{position: 'absolute', top: 18, [side ? 'right' : 'left']: 4}}>
            <Sanfona x={0} y={0} s={1} f={f + side * 9} />
          </svg>
        ))}
        <span style={{fontFamily: TITLE, fontSize: PAGES[k].length > 15 ? 54 : 64, color: INK, transform: `scale(${1.6 - 0.6 * popIn(f, a + 4, 6)})`, opacity: popIn(f, a + 4, 6), display: 'inline-block'}}>{PAGES[k]}</span>
      </div>
      <svg width="880" height="821" viewBox="0 0 900 840" style={{position: 'absolute', left: 30, top: 175, border: `6px solid ${INK}`, background: PAPER}}>
        <Ink f={f}><Illu f={f} /></Ink>
      </svg>
      <Verses k={k} f={f} />
    </div>
  );
};
const Capa = ({f}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <div style={{position: 'absolute', left: 30, right: 30, top: 30, textAlign: 'center', fontFamily: TEXT, fontStyle: 'italic', fontSize: 40, color: INK}}>— Literatura de Cordel —</div>
    <svg width="880" height="900" viewBox="0 0 900 920" style={{position: 'absolute', left: 30, top: 110}}>
      <Ink f={f}>
        <Sun cx={450} cy={330} r={150} rot={st2(f) * 0.3} />
        <Ground y={760} h={920} />
        <Mandacaru x={110} y={790} s={0.9} />
        <Sanfona x={725} y={700} s={0.8} f={f} notes />
        <g transform={`translate(0 ${(1 - popIn(f, 6, 12)) * 200})`}><Lampiao x={450} y={470} s={1.0} f={f} /></g>
      </Ink>
    </svg>
    <div style={{position: 'absolute', left: 30, right: 30, top: 1040, textAlign: 'center', fontFamily: TITLE, color: INK, lineHeight: 1.0}}>
      <div style={{fontSize: 62, opacity: popIn(f, 10, 6), transform: `scale(${1.5 - 0.5 * popIn(f, 10, 6)})`}}>A VIDA E A MORTE DE</div>
      <div style={{fontSize: 150, color: RED, marginTop: 10, opacity: popIn(f, 22, 6), transform: `scale(${1.6 - 0.6 * popIn(f, 22, 6)})`}}>LAMPIÃO</div>
      <div style={{fontFamily: TEXT, fontStyle: 'italic', fontSize: 46, marginTop: 24, opacity: popIn(f, 40, 8)}}>o Rei do Cangaço</div>
    </div>
  </div>
);
const Cta = ({f}) => {
  const a = stF('cta');
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width="880" height="700" viewBox="0 0 900 700" style={{position: 'absolute', left: 30, top: 120}}>
        <Ink f={f}>
          <Sun cx={450} cy={210} r={95} rot={st2(f) * 0.3} />
          <Hat x={450} y={450} s={1.05} />
          <Sanfona x={450} y={590} s={0.5} f={f} notes />
        </Ink>
      </svg>
      {[['HERÓI?', INK, -6, 140, 860, a + 4], ['VILÃO?', RED, 5, 470, 1010, a + 20]].map(([t, c, rot, x, y, at]) => (
        <div key={t} style={{position: 'absolute', left: x, top: y, fontFamily: TITLE, fontSize: 110, color: c, border: `10px solid ${c}`, padding: '6px 26px', transform: `rotate(${rot}deg) scale(${1.8 - 0.8 * popIn(f, at, 6)})`, opacity: popIn(f, at, 6)}}>{t}</div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', fontFamily: TEXT, fontStyle: 'italic', fontSize: 64, color: INK, opacity: popIn(f, a + 40, 8)}}>Comenta aí ↓</div>
    </div>
  );
};

// ---------- moldura: folhetos pendurados no barbante, virando página ----------
const FLIP = 12;
const Folheto = ({k, f, flip = 0}) => {
  const sway = Math.sin(st2(f) / 18) * 0.5;
  return (
    <div style={{position: 'absolute', left: PAGE.x, top: PAGE.y, width: PAGE.w, height: PAGE.h, transformOrigin: '0% 50%', transform: `rotate(${sway}deg) rotateY(${-flip * 105}deg)`, backfaceVisibility: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, background: PAPER, boxShadow: `0 30px 60px rgba(40,25,5,${0.35 + flip * 0.3})`, border: `3px solid ${INK}`}}>
        <div style={{position: 'absolute', inset: 14, border: `3px solid ${INK}`}} />
        <Page k={k} f={f} />
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,${flip * 0.5}), transparent)`}} />
      </div>
    </div>
  );
};
const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .25 0 0 0 0 .18 0 0 0 0 .08 0 0 0 .22 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")`;

// sons
const SFX = (() => {
  const E = [];
  const add = (n, fr, v) => E.push([n, Math.max(0, Math.round(fr)), v]);
  order.slice(1).forEach((k) => { add('flip', stF(k) - 2, 0.55); add('carimbo', stF(k) + 4, 0.5); });
  add('carimbo', 10, 0.5); add('carimbo', 22, 0.6); add('wind', 0, 0.35);
  add('wind', stF('e1'), 0.3); add('wind', stF('e5'), 0.4);
  [sAt(7) + 6, sAt(7) + 18, sAt(7) + 26, sAt(7) + 40, sAt(8) + 4, sAt(8) + 12].forEach((t) => add('bang', t, 0.25));
  [sAt(14) + 10, sAt(14) + 18, sAt(14) + 30, sAt(14) + 38, sAt(14) + 52].forEach((t) => add('bang', t, 0.3));
  add('carimbo', stF('cta') + 4, 0.6); add('carimbo', stF('cta') + 20, 0.6);
  return E;
})();

const Frame = () => {
  const f = useCurrentFrame();
  const cur = sceneAt(f);
  const ci = order.indexOf(cur);
  const prev = ci > 0 ? order[ci - 1] : null;
  const p = prev ? interpolate(f, [stF(cur) - 2, stF(cur) + FLIP], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)}) : 1;
  const musicVol = (fr) => {
    const e5 = fr >= stF('e5') && fr < stF('e6');
    return (e5 ? 0.09 : 0.2) * interpolate(fr, [0, 12, DUR - 75, DUR], [0, 1, 1, 0], clamp);
  };
  return (
    <AbsoluteFill style={{background: '#3a2a18', perspective: 2600, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #6b4e2c 0%, #2b1d0e 100%)'}} />
      <AbsoluteFill style={{backgroundImage: NOISE, opacity: 0.7}} />
      <WoodDefs f={f} />
      {/* barbante */}
      <svg width="1080" height="200" style={{position: 'absolute', top: 0, left: 0, zIndex: 5}}>
        <path d={`M-20 120 Q540 ${170 + Math.sin(st2(f) / 18) * 4} 1100 120`} stroke="#c9b48a" strokeWidth="5" fill="none" />
        {[260, 820].map((x) => <g key={x} transform={`translate(${x} 140)`}><rect x="-12" y="-28" width="24" height="64" rx="4" fill="#b08a55" stroke="#2b1d0e" strokeWidth="3" /><line x1="0" y1="-24" x2="0" y2="32" stroke="#2b1d0e" strokeWidth="2" /></g>)}
      </svg>
      <Folheto k={cur} f={f} />
      {prev && p < 1 && <Folheto k={prev} f={f} flip={p} />}
      <AbsoluteFill style={{backgroundImage: NOISE, opacity: 0.55, mixBlendMode: 'multiply', pointerEvents: 'none'}} />
      <Audio src={staticFile('cordel/voz.wav')} />
      <Audio src={staticFile('cordel/trilha.mp3')} volume={musicVol} />
      {SFX.map(([n, fr, v], i) => <Sequence key={i} from={fr} durationInFrames={90}><Audio src={staticFile(`cordel/${n}.wav`)} volume={v} /></Sequence>)}
    </AbsoluteFill>
  );
};

registerRoot(() => <Composition id="Cordel" component={Frame} durationInFrames={DUR} fps={FPS} width={1080} height={1920} />);
