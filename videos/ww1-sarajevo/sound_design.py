"""Design de som procedural (48 kHz, estéreo) para os vídeos.

Cada efeito é sintetizado em camadas (transiente + corpo + cauda), espacializado
(pan, largura estéreo, Doppler) e colocado num espaço acústico por convolução
(sala, ar livre, eco sobre a água). Sem samples externos: nada de licença a resolver.

Uso: python3 sound_design.py eventos.json saida.wav duracao
Eventos: [{"k": tipo, "t": início_s, "d": duração_s (ambiências), "pan": -1..1 (opcional)}]
"""
import json, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
RNG = np.random.default_rng(1941)


# ───────────────────────── blocos básicos ─────────────────────────
def t_(d): return np.arange(int(round(d * SR))) / SR
def white(n): return RNG.standard_normal(n)
def pink(n):  # 1/f por soma de oitavas (Voss-McCartney simplificado)
    out = np.zeros(n)
    for k in range(7):
        step = 2 ** k
        out += np.repeat(RNG.standard_normal(n // step + 2), step)[:n]
    return out / 7
def brown(n):
    b = np.cumsum(white(n)); b -= np.convolve(b, np.ones(4001) / 4001, 'same'); return b / (np.abs(b).max() + 1e-9)
def filt(x, kind, f, order=4):
    f = np.atleast_1d(f) / (SR / 2); f = np.clip(f, 1e-4, .999)
    return sosfilt(butter(order, f if len(f) > 1 else f[0], btype=kind, output='sos'), x)
def env(n, a=.005, d=.1, s=.6, r=.3, total=None):  # ADSR em segundos
    total = total or n / SR; e = np.interp(t_(total)[:n], [0, a, a + d, max(a + d, total - r), total], [0, 1, s, s, 0]); return e
def expdecay(n, tau): return np.exp(-t_(n / SR)[:n] / tau)
def sat(x, k=2.0): return np.tanh(k * x) / np.tanh(k)
def norm(x, peak=1.0): m = np.abs(x).max(); return x * (peak / m) if m > 0 else x
def stereo(x, pan=0.0, width=0.0):
    """pan de potência constante + largura por descorrelação (atraso curto no lado oposto)."""
    a = (pan + 1) * np.pi / 4; L, Rr = x * np.cos(a), x * np.sin(a)
    if width > 0:
        dly = int(.011 * SR); Rr = (1 - width) * Rr + width * np.concatenate([np.zeros(dly), Rr[:-dly]])
    return np.stack([L, Rr], 1)
def ir(decay, pre=.01, bright=6000, density=1.0, sparse_echoes=()):
    n = int((decay * 1.2 + pre) * SR); tt = t_(n / SR)[:n]
    irs = []
    for ch in range(2):
        nz = RNG.standard_normal(n) * np.exp(-tt * 6.9 / decay) * (tt > pre)
        nz = filt(nz, 'low', bright) * density
        for (et, eg) in sparse_echoes:  # reflexões discretas (água, prédios, colinas)
            i = int((et + ch * .007) * SR)
            if i < n: nz[i:i + 400] += eg * np.hanning(400) * (1 if ch else .9)
        irs.append(nz)
    out = np.stack(irs, 1); return out / np.sqrt((out ** 2).sum(0).max())
IRS = {
    'room': ir(.45, .006, 5000),
    'hall': ir(1.6, .02, 4500),
    'outdoor': ir(2.2, .03, 3500, .5, ((.18, .6), (.42, .35), (.9, .2))),
    'water': ir(1.4, .02, 4000, .35, ((.09, .7), (.23, .4))),
}
def space(st, kind, wet):
    if wet <= 0: return st
    rv = np.stack([fftconvolve(st[:, c], IRS[kind][:, c])[:len(st)] for c in range(2)], 1)
    return st * (1 - wet * .5) + rv * wet
def doppler(x, t_close, speed=90., dist=25., c=343.):
    """fonte passando em linha reta pelo ouvinte: atraso, ganho por distância e abafamento ao longe."""
    tt = t_(len(x) / SR)[:len(x)]; xpos = (tt - t_close) * speed; r = np.sqrt(xpos ** 2 + dist ** 2)
    src_t = tt - r / c; y = np.interp(src_t * SR, np.arange(len(x)), x, left=0, right=0)
    y *= dist / r
    near = dist / r; return filt(y, 'low', 900) * (1 - near) + y * near, xpos / r


# ───────────────────────── ambiências (com duração) ─────────────────────────
def bed(kind, d):
    n = int(d * SR); tt = t_(d)[:n]
    if kind == 'waves':
        swell = .55 + .45 * np.sin(2 * np.pi * tt / 5.2) ** 2
        wash = filt(pink(n), 'band', [180, 2200]) * swell ** 1.5
        crash = np.zeros(n)
        for k in range(int(d / 5.2) + 1):
            i = int((k * 5.2 + 2.0 + RNG.random() * .6) * SR); m = min(int(2.4 * SR), n - i)
            if m > 0: crash[i:i + m] += filt(white(m), 'band', [400, 6000]) * expdecay(m, .6) * np.clip(t_(m / SR)[:m] / .15, 0, 1) * .5
        L = wash + crash; Rr = np.roll(filt(pink(n), 'band', [180, 2200]) * swell ** 1.5, 2400) + np.roll(crash, 1800)
        return space(np.stack([L, Rr], 1) * .5, 'water', .15)
    if kind == 'crickets':
        out = np.zeros((n, 2))
        for c in range(6):
            f0 = 4200 + RNG.random() * 900; rate = 2 + RNG.random() * 1.5; ph = RNG.random() * 6
            chirp = (np.sin(2 * np.pi * rate * tt + ph) > .6) * (np.sin(2 * np.pi * 42 * tt) > 0)
            sig = np.sin(2 * np.pi * f0 * tt) * filt(chirp.astype(float), 'low', 300) * .06
            out += stereo(sig, RNG.uniform(-.9, .9))
        return space(out, 'outdoor', .3)
    if kind == 'flame':
        return stereo(filt(pink(n), 'band', [300, 3000]) * (.5 + .5 * filt(white(n), 'low', 4)) * .15, 0, .4)
    if kind == 'drone':  # motor de navio ao longe
        f = 38 + .4 * np.sin(2 * np.pi * tt / 7)
        hum = sum(np.sin(2 * np.pi * f * h * tt + h) / h ** 1.2 for h in range(1, 9)) * (.85 + .15 * np.sin(2 * np.pi * 6.3 * tt))
        rumble = filt(brown(n), 'low', 160) * .6
        return space(stereo(filt(hum * .12 + rumble * .2, 'low', 700), 0, .5), 'water', .25)
    if kind == 'wind':
        gust = .35 + .65 * np.clip(.5 + .5 * np.sin(2 * np.pi * tt / 6.1) * np.sin(2 * np.pi * tt / 2.7 + 1), 0, 1)
        L = filt(brown(n), 'band', [120, 900]) * gust + filt(pink(n), 'band', [1500, 4000]) * gust ** 3 * .25
        Rr = filt(brown(n), 'band', [120, 900]) * np.roll(gust, 9000) + filt(pink(n), 'band', [1500, 4000]) * np.roll(gust, 9000) ** 3 * .25
        return np.stack([L, Rr], 1) * .45
    if kind in ('engines', 'cockpit'):  # motores radiais: pulsos de combustão + hélice + ar, vários aviões
        out = np.zeros((n, 2)); planes = 1 if kind == 'cockpit' else 5
        for p in range(planes):
            rpm = 2050 * (1 + RNG.uniform(-.03, .03)); fire = rpm / 60 * 4.5; blade = rpm / 60 * .6 * 3
            ph = 2 * np.pi * np.cumsum(fire * (1 + .004 * np.sin(2 * np.pi * .3 * tt + p))) / SR
            pulses = sum(np.sin(h * ph + RNG.random() * 6) * (1 / h) * (1 + .3 * RNG.standard_normal()) for h in range(1, 14))
            prop = .7 + .3 * np.sin(2 * np.pi * blade * tt) ** 2
            body = sat(filt(pulses, 'low', 1600) * .4, 1.6) * prop + filt(pink(n), 'band', [250, 2500]) * .25
            out += stereo(body * (.6 if kind == 'engines' else 1.0), RNG.uniform(-.7, .7) if planes > 1 else 0, .3)
        return space(out * (.35 if kind == 'engines' else .5), 'outdoor' if kind == 'engines' else 'room', .2 if kind == 'engines' else .05)
    if kind == 'teletype':
        out = np.zeros(n)
        k_t = 0.0
        while k_t < d - .05:
            i = int(k_t * SR); m = int(.035 * SR)
            click = filt(white(m), 'band', [1800, 5000]) * expdecay(m, .006) + np.sin(2 * np.pi * 820 * t_(m / SR)[:m]) * expdecay(m, .01) * .4
            out[i:i + m] += click * (.6 + .4 * RNG.random()); k_t += .065 + RNG.random() * .04
        out += filt(pink(n), 'low', 300) * .08  # motor do teletipo
        return space(stereo(out * .5, .1, .2), 'room', .25)
    if kind == 'radarhum':
        hum = sum(np.sin(2 * np.pi * 60 * h * tt) / h ** 1.5 for h in range(1, 7)) * .05
        fan = filt(pink(n), 'band', [200, 1200]) * .06
        return space(stereo(hum + fan, 0, .4), 'room', .2)
    if kind == 'roomtone':
        return stereo(filt(pink(n), 'low', 400) * .12 + np.sin(2 * np.pi * 60 * tt) * .006, 0, .6)
    if kind == 'crowd':  # murmúrio: formantes de voz em ruído
        out = np.zeros((n, 2))
        for v in range(8):
            f1 = RNG.uniform(350, 750); gate = filt((RNG.random(n // 2400 + 2).repeat(2400)[:n] > .45).astype(float), 'low', 6)
            out += stereo(filt(pink(n), 'band', [f1 * .8, f1 * 1.3]) * gate * .25, RNG.uniform(-.8, .8))
        return space(out, 'outdoor', .35)
    if kind == 'siren':  # sirene antiaérea de manivela: rotor com harmônicos, sobe e desce
        f = 260 + 380 * (.5 - .5 * np.cos(2 * np.pi * np.clip(tt, 0, None) / 5.5)) * np.clip(tt / 2.5, 0, 1)
        ph = 2 * np.pi * np.cumsum(f) / SR
        tone = sum(np.sin(h * ph) / h for h in (1, 2, 3, 5)) * (1 + .15 * np.sin(2 * np.pi * 9 * tt))
        return space(stereo(sat(tone * .3, 1.5) * np.clip(tt / 2, 0, 1) * .25, -.3, .3), 'outdoor', .55)
    if kind == 'dive':  # avião mergulhando: rotação subindo + vento e Doppler
        prog = (tt / d) ** 1.6; f = 150 + 210 * prog; ph = 2 * np.pi * np.cumsum(f) / SR
        eng = sat(sum(np.sin(h * ph) / h for h in range(1, 10)) * .35, 1.8)
        rush = filt(pink(n), 'band', [600, 5000]) * prog * .6
        y, pos = doppler(eng * .6 + rush, d * .8, 110, 30)
        return space(np.stack([y * (1 - np.clip(pos, -1, 1)) * .5, y * (1 + np.clip(pos, -1, 1)) * .5], 1) * .5, 'outdoor', .2)
    if kind == 'drone_low':
        return stereo(filt(brown(n), 'low', 120) * .3, 0, .5)
    return None


# ───────────────────────── eventos pontuais ─────────────────────────
def hit(kind):
    if kind == 'boom':  # canhão: estalo + corpo grave + cauda ecoando na água
        m = int(3.5 * SR); tt = t_(3.5)[:m]
        crack = filt(white(m), 'high', 1500) * expdecay(m, .012)
        body = np.sin(2 * np.pi * (55 * np.exp(-tt * 4) + 32) * tt) * expdecay(m, .35)
        rumble = filt(brown(m), 'low', 220) * expdecay(m, .8)
        return space(stereo(sat(crack * .9 + body * 1.2 + rumble * .8, 2.2) * .7, -.1, .3), 'water', .6)
    if kind == 'impact':  # golpe cinematográfico (títulos, "Tora")
        m = int(3 * SR); tt = t_(3)[:m]
        sub = np.sin(2 * np.pi * (70 * np.exp(-tt * 2.5) + 28) * tt) * expdecay(m, .7)
        snap = filt(white(m), 'band', [800, 7000]) * expdecay(m, .03)
        return space(stereo(sat(sub * 1.1 + snap * .5, 1.8) * .6, 0, .2), 'hall', .45)
    if kind == 'splash':
        m = int(2.2 * SR); tt = t_(2.2)[:m]
        burst = filt(white(m), 'band', [300, 5000]) * expdecay(m, .35) * np.clip(tt / .02, 0, 1)
        drops = np.zeros(m)
        for k in range(40):
            i = int((.15 + RNG.random() * 1.6) * SR); q = int(.03 * SR)
            if i + q < m: drops[i:i + q] += np.sin(2 * np.pi * RNG.uniform(900, 2400) * t_(q / SR)[:q]) * expdecay(q, .008) * .3
        return space(stereo(burst * .6 + drops, .15, .5), 'water', .35)
    if kind == 'gunburst':  # rajada: canhão 20 mm + metralhadora, com mecânica e eco
        m = int(2.4 * SR); out = np.zeros(m)
        for k in range(16):
            i = int(k * .068 * SR); q = int(.12 * SR); tt = t_(.12)[:q]
            shot = filt(white(q), 'band', [600, 6000]) * expdecay(q, .012) + np.sin(2 * np.pi * 95 * tt) * expdecay(q, .04) * .8
            out[i:i + q] += shot * (.8 + .4 * RNG.random())
        return space(stereo(sat(out * .7, 2), .2, .4), 'outdoor', .45)
    if kind == 'whistle':  # bomba caindo: assobio descendente com Doppler
        m = int(2.2 * SR); tt = t_(2.2)[:m]; f = 1700 - 900 * (tt / 2.2) ** 1.3
        tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + .2 * filt(white(m), 'band', [1200, 3000])
        return space(stereo(tone * np.clip(tt / .4, 0, 1) * np.clip((2.2 - tt) / .1, 0, 1) * .12, -.2, .2), 'outdoor', .3)
    if kind == 'ping':  # traço do radar: bip eletrônico suave
        m = int(.9 * SR); tt = t_(.9)[:m]
        return space(stereo(np.sin(2 * np.pi * 1180 * tt) * expdecay(m, .12) * .14, .2), 'room', .3)
    if kind == 'ring':  # campainha de telefone antigo: martelo batendo em dois sinos
        m = int(2.2 * SR); tt = t_(2.2)[:m]; gate = (np.sin(2 * np.pi * 20 * tt) > 0) * (tt < 1.6)
        bells = (np.sin(2 * np.pi * 1020 * tt) + .7 * np.sin(2 * np.pi * 1375 * tt) + .3 * np.sin(2 * np.pi * 2830 * tt))
        return space(stereo(bells * filt(gate.astype(float), 'low', 120) * .1, .3), 'room', .35)
    if kind == 'click':
        m = int(.25 * SR); tt = t_(.25)[:m]
        return space(stereo(filt(white(m), 'band', [700, 4000]) * expdecay(m, .01) * .5 + np.sin(2 * np.pi * 160 * tt) * expdecay(m, .03) * .4, .1), 'room', .2)
    if kind == 'bugle':  # corneta: metal com vibrato e formante
        notes = ((392, 0, .38), (523, .42, .38), (659, .84, .38), (784, 1.26, 1.2))
        m = int(3.2 * SR); out = np.zeros(m)
        for f, st, du in notes:
            q = int(du * SR); tt = t_(du)[:q]; vib = 1 + .006 * np.sin(2 * np.pi * 5.5 * tt) * np.clip(tt / .3, 0, 1)
            ph = 2 * np.pi * np.cumsum(f * vib) / SR
            tone = sum(np.sin(h * ph) * (h ** -.8) for h in range(1, 12))
            tone = filt(tone, 'band', [400, 3500]) * np.clip(tt / .04, 0, 1) * np.clip((du - tt) / .12, 0, 1)
            i = int(st * SR); out[i:i + q] += tone
        return space(stereo(sat(out * .25, 1.4) * .5, -.3, .2), 'outdoor', .55)
    if kind == 'morse':  # ".-" com estática de rádio
        m = int(.6 * SR); tt = t_(.6)[:m]; key = np.zeros(m)
        for o, du in ((0, .08), (.13, .24)): key[int(o * SR):int((o + du) * SR)] = 1
        key = filt(key, 'low', 60)
        return stereo(np.sin(2 * np.pi * 720 * tt) * key * .12 + filt(white(m), 'band', [800, 3000]) * .015, 0)
    if kind == 'tock':  # relógio: bloco de madeira ressonante
        m = int(.12 * SR); tt = t_(.12)[:m]
        return stereo((np.sin(2 * np.pi * 2100 * tt) + .5 * np.sin(2 * np.pi * 3400 * tt)) * expdecay(m, .012) * .035, .4)
    if kind in ('cut', 'whoosh'):
        m = int(.6 * SR); tt = t_(.6)[:m]; f = 300 + 3000 * (tt / .6)
        sweep = filt(pink(m), 'band', [400, 4000]) * np.sin(np.pi * tt / .6) ** 2
        return stereo(sweep * .12, 0, .5)
    if kind == 'pop':
        m = int(.15 * SR); tt = t_(.15)[:m]
        return space(stereo(np.sin(2 * np.pi * (900 - 2500 * tt) * tt) * expdecay(m, .03) * .12, 0), 'room', .2)
    if kind == 'low':
        m = int(2 * SR); tt = t_(2)[:m]
        return space(stereo(np.sin(2 * np.pi * (60 - 20 * tt) * tt) * expdecay(m, .6) * .5, 0), 'hall', .3)
    if kind == 'shimmer':
        m = int(2 * SR); tt = t_(2)[:m]
        return space(stereo(sum(np.sin(2 * np.pi * f * tt) for f in (1318, 1568, 1976, 2637)) * expdecay(m, .5) * .03, 0, .5), 'hall', .5)
    return None


# ───────────────────────── efeitos extras (v3) ─────────────────────────
def extra(kind, d=0):
    if kind == 'horn':  # buzina de navio ao longe
        m = int(4 * SR); tt = t_(4)[:m]; f = 98
        tone = sum(np.sin(2 * np.pi * f * h * tt + h) / h ** .9 for h in range(1, 10)) * np.clip(tt / .4, 0, 1) * np.clip((3.2 - tt) / .5, 0, 1)
        return space(stereo(sat(filt(tone, 'low', 1400) * .3, 1.4), .4, .3), 'water', .7)
    if kind == 'shipbell':
        m = int(3 * SR); tt = t_(3)[:m]; out = np.zeros(m)
        for k in range(2):
            i = int(k * .45 * SR); q = m - i; u = t_(q / SR)[:q]
            out[i:] += sum(np.sin(2 * np.pi * f * u) * a for f, a in ((1180, 1), (2420, .5), (3610, .25))) * expdecay(q, .9)
        return space(stereo(out * .2, -.5), 'water', .5)
    if kind == 'flyby':  # avião passando pela câmera
        m = int(3.2 * SR); tt = t_(3.2)[:m]; ph = 2 * np.pi * np.cumsum(np.full(m, 160.)) / SR
        eng = sat(sum(np.sin(h * ph + h) / h for h in range(1, 12)) * .35, 1.7) + filt(pink(m), 'band', [500, 4000]) * .5
        y, pos = doppler(eng, 1.6, 95, 9)
        p = np.clip(pos, -1, 1)
        return space(np.stack([y * (1 - p) * .5, y * (1 + p) * .5], 1), 'outdoor', .2)
    if kind == 'enginestart':  # motor pegando: tossidas e subida de rotação
        m = int(3 * SR); tt = t_(3)[:m]; f = 30 + 130 * np.clip((tt - .6) / 1.6, 0, 1) ** .7
        ph = 2 * np.pi * np.cumsum(f) / SR; eng = sat(sum(np.sin(h * ph) / h for h in range(1, 12)) * .4, 2)
        cough = np.zeros(m)
        for k in range(4):
            i = int((.05 + k * .14) * SR); q = int(.09 * SR); cough[i:i + q] += filt(white(q), 'low', 900) * expdecay(q, .03)
        return space(stereo(eng * np.clip(tt / .6, .2, 1) + cough, .2, .3), 'outdoor', .25)
    if kind == 'servo':  # motor da antena do radar girando
        n = int(d * SR); tt = t_(d)[:n]
        return space(stereo((np.sin(2 * np.pi * 220 * tt) * .3 + np.sin(2 * np.pi * 440 * tt) * .1) * (.8 + .2 * np.sin(2 * np.pi * 1.2 * tt)) + filt(pink(n), 'band', [800, 2000]) * .2, .2, .3), 'outdoor', .2)
    if kind == 'crtwhine':  # chiado do tubo de raios catódicos + zumbido
        n = int(d * SR); tt = t_(d)[:n]
        return stereo(np.sin(2 * np.pi * 7800 * tt) * .08 + filt(pink(n), 'band', [2000, 6000]) * .05 + np.sin(2 * np.pi * 120 * tt) * .1, 0, .2)
    if kind == 'gulls':
        n = int(d * SR); out = np.zeros((n, 2)); tcur = RNG.random()
        while tcur < d - 1:
            q = int(.5 * SR); u = t_(.5)[:q]; f = 1500 + 900 * np.sin(np.pi * u / .5) - 500 * u
            cry = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * u / .5) ** 2 * (1 + .3 * np.sin(2 * np.pi * 30 * u))
            i = int(tcur * SR); out[i:i + q] += stereo(filt(cry, 'band', [900, 4000]) * .3, RNG.uniform(-.9, .9))[:len(out) - i]
            tcur += 1.2 + RNG.random() * 2.5
        return space(out, 'outdoor', .5)
    if kind == 'flag':  # lona tremulando
        n = int(d * SR); tt = t_(d)[:n]; flap = np.clip(np.sin(2 * np.pi * 4.5 * tt) + .4 * np.sin(2 * np.pi * 7.1 * tt), 0, None)
        return stereo(filt(pink(n), 'band', [300, 3000]) * flap * .5, -.2, .4)
    if kind == 'static':  # estática de rádio
        n = int(max(d, .8) * SR); tt = t_(n / SR)[:n]
        crackle = (RNG.random(n) > .997) * RNG.standard_normal(n) * 3
        return stereo(filt(white(n) * .3 + crackle, 'band', [400, 3500]) * (.6 + .4 * np.sin(2 * np.pi * .7 * tt)), 0, .3)
    if kind == 'debris':  # destroços caindo depois da explosão
        m = int(3.5 * SR); out = np.zeros(m)
        for k in range(60):
            i = int((.3 + RNG.random() * 2.8) * SR); q = int(.06 * SR)
            if i + q < m: out[i:i + q] += filt(white(q), 'band', [1500, 7000]) * expdecay(q, .01) * RNG.uniform(.2, 1)
        return space(stereo(out * .4, .1, .7), 'outdoor', .4)
    if kind == 'fire':  # fogo crepitando (ambiência)
        n = int(d * SR); roar = filt(brown(n), 'low', 400) * .6
        crack = np.zeros(n)
        for k in range(int(d * 14)):
            i = RNG.integers(0, n - 800); crack[i:i + 800] += filt(white(800), 'band', [1500, 6000]) * expdecay(800, .004) * RNG.uniform(.2, 1)
        return space(stereo(roar + crack * .6, -.1, .6), 'outdoor', .4)
    if kind == 'bubbles':  # bolhas / debaixo d'água
        n = int(d * SR); out = filt(brown(n), 'low', 250) * .5
        for k in range(int(d * 9)):
            i = RNG.integers(0, n - 3000); q = 3000; u = t_(q / SR)[:q]; f = RNG.uniform(400, 1200)
            out[i:i + q] += np.sin(2 * np.pi * f * (1 + 2 * u) * u) * expdecay(q, .015) * .4
        return space(stereo(filt(out, 'low', 1600), 0, .5), 'room', .4)
    if kind == 'clank':  # baque metálico (trava da bomba, peça pesada)
        m = int(1.5 * SR); tt = t_(1.5)[:m]
        return space(stereo(sum(np.sin(2 * np.pi * f * tt) * a for f, a in ((180, 1), (530, .6), (1270, .4), (2710, .25))) * expdecay(m, .18) * .4 + filt(white(m), 'band', [1000, 6000]) * expdecay(m, .01), .1), 'room', .3)
    if kind == 'casings':  # cápsulas caindo no convés
        m = int(1.6 * SR); out = np.zeros(m)
        for k in range(10):
            i = int((.05 + k * .09 + RNG.random() * .05) * SR); q = int(.25 * SR); u = t_(.25)[:q]
            out[i:i + q] += sum(np.sin(2 * np.pi * f * u) for f in (RNG.uniform(3800, 4600), RNG.uniform(6200, 7400))) * expdecay(q, .03) * .3
        return space(stereo(out, .3, .5), 'outdoor', .3)
    if kind == 'paper':  # papel deslizando
        m = int(.8 * SR); tt = t_(.8)[:m]
        return stereo(filt(white(m), 'band', [1500, 8000]) * np.sin(np.pi * tt / .8) ** 2 * (.6 + .4 * np.sin(2 * np.pi * 23 * tt)) * .3, 0, .4)
    if kind == 'scribble':  # risco de caneta / traço vermelho
        m = int(.45 * SR); tt = t_(.45)[:m]
        return space(stereo(filt(white(m), 'band', [2500, 9000]) * np.sin(np.pi * tt / .45) * (.6 + .4 * np.sin(2 * np.pi * 45 * tt)) * .4 + np.sin(2 * np.pi * (200 - 150 * tt) * tt) * expdecay(m, .15) * .5, 0, .3), 'room', .2)
    return None


# níveis-alvo da "mesa": ambiências por RMS, golpes por pico (dBFS, antes da masterização)
BED_RMS = {'waves': -27, 'crickets': -33, 'flame': -40, 'drone': -31, 'wind': -30, 'engines': -27, 'cockpit': -25, 'teletype': -30,
           'radarhum': -37, 'roomtone': -42, 'crowd': -32, 'siren': -29, 'dive': -23, 'drone_low': -34,
           'servo': -36, 'crtwhine': -40, 'gulls': -34, 'flag': -33, 'static': -33, 'fire': -28, 'bubbles': -30,
           'projector': -36, 'oldcar': -30, 'bells': -32, 'artillery': -28, 'riser': -26}
HIT_PEAK = {'boom': -2, 'impact': -4, 'gunburst': -5, 'splash': -8, 'whistle': -11, 'ping': -19, 'ring': -13, 'click': -15,
            'bugle': -9, 'morse': -17, 'tock': -32, 'cut': -20, 'whoosh': -18, 'pop': -21, 'low': -8, 'shimmer': -18,
            'horn': -8, 'shipbell': -16, 'flyby': -5, 'pistol': -1, 'grenade': -2, 'pin': -18, 'flashlight': -20, 'stamp': -10, 'string': -20, 'sub': -6, 'enginestart': -8, 'debris': -10, 'clank': -9, 'casings': -16, 'paper': -20, 'scribble': -12, 'static': -18}
def level(s, kind, is_bed):
    if is_bed:
        r = np.sqrt((s ** 2).mean()) + 1e-12; return s * 10 ** (BED_RMS.get(kind, -30) / 20) / r
    p = np.abs(s).max() + 1e-12; return s * 10 ** (HIT_PEAK.get(kind, -12) / 20) / p


def render(events, total):
    out = np.zeros((int(total * SR) + SR, 2))
    for e in events:
        k, t0, d = e['k'], e['t'], e.get('d', 0)
        if k == 'file':  # som gravado real (sfx/<nome>.wav)
            s = from_file(e['name'], e.get('off', 0), e.get('d') or None, e.get('gain', -12))
            if 'pan' in e: s = stereo(s.mean(1), e['pan'], .2)
            i = int(t0 * SR); j = min(i + len(s), len(out)); out[i:j] += s[:j - i]; continue
        if k == 'music': continue
        if d < 0 or (d and d < .25) or k.startswith('fx_'): continue   # trechos inválidos e efeitos de mixagem
        s = bed(k, d) if d else hit(k)
        if s is None: s = extra(k, d)
        if s is None: s = doc(k, d)
        if s is None: continue
        s = level(s, k, bool(d) and k in BED_RMS)
        if d:  # entrada e saída suaves das ambiências
            f = min(.8, d / 3); fade = np.clip(t_(len(s) / SR)[:len(s)] / f, 0, 1) * np.clip((d - t_(len(s) / SR)[:len(s)]) / f, 0, 1); s = s * fade[:, None]
        if 'pan' in e: s = stereo(s.mean(1), e['pan'], .2)
        i = int(t0 * SR); j = min(i + len(s), len(out)); out[i:j] += s[:j - i]
    return out[:int(total * SR)]



# ───────────────────────── documentário (v4) ─────────────────────────
def doc(kind, d=0):
    if kind == 'projector':  # projetor: obturador a 24 q/s + motor + chiado da película
        n = int(d * SR); tt = t_(d)[:n]; out = filt(pink(n), 'band', [150, 900]) * .25 + np.sin(2 * np.pi * 120 * tt) * .03
        clicks = np.zeros(n)
        for k in range(int(d * 24)):
            i = int(k / 24 * SR + RNG.integers(0, 60)); q = 300
            if i + q < n: clicks[i:i + q] += filt(white(q), 'band', [1500, 6000]) * expdecay(q, .002) * RNG.uniform(.5, 1)
        return space(stereo(out + clicks * .7, .1, .5), 'room', .25)
    if kind == 'oldcar':  # motor de carro de 1914 em marcha lenta
        n = int(d * SR); tt = t_(d)[:n]; f = 11 + .6 * np.sin(2 * np.pi * .2 * tt)
        pulses = np.zeros(n); ph = np.cumsum(f) / SR
        idx = np.where(np.diff(np.floor(ph)) > 0)[0]
        for i in idx:
            q = min(1400, n - i); pulses[i:i + q] += filt(white(q), 'low', 500) * expdecay(q, .02) + np.sin(2 * np.pi * 70 * t_(q / SR)[:q]) * expdecay(q, .03) * .6
        return space(stereo(pulses * .5, -.2, .4), 'outdoor', .3)
    if kind == 'bells':  # sinos de igreja distantes
        n = int(d * SR); out = np.zeros(n)
        for k in range(int(d / 1.6)):
            i = int(k * 1.6 * SR); q = n - i; u = t_(q / SR)[:q]; f0 = (392, 330, 294)[k % 3]
            out[i:] += sum(np.sin(2 * np.pi * f0 * r * u) * a for r, a in ((.5, .6), (1, 1), (1.19, .5), (1.5, .4), (2, .35), (2.67, .2))) * expdecay(q, 2.2) * .2
        return space(stereo(filt(out, 'low', 3000), .4, .3), 'outdoor', .6)
    if kind == 'artillery':  # artilharia distante
        n = int(d * SR); out = np.zeros(n)
        for k in range(int(d * 1.3)):
            i = RNG.integers(0, max(1, n - SR)); q = min(int(1.5 * SR), n - i); u = t_(q / SR)[:q]
            out[i:i + q] += (np.sin(2 * np.pi * (45 * np.exp(-u * 3) + 25) * u) + filt(brown(q), 'low', 150)) * expdecay(q, .5) * RNG.uniform(.3, 1)
        return space(stereo(filt(out, 'low', 400), 0, .7), 'outdoor', .7)
    if kind == 'pistol':  # pistola: estalo seco + corpo médio + eco de rua
        m = int(2.5 * SR); tt = t_(2.5)[:m]
        crack = filt(white(m), 'high', 1200) * expdecay(m, .006)
        body = filt(white(m), 'band', [200, 1500]) * expdecay(m, .03) + np.sin(2 * np.pi * (180 * np.exp(-tt * 30) + 60) * tt) * expdecay(m, .05)
        return space(stereo(sat(crack * 1.2 + body, 2.5) * .7, 0, .3), 'outdoor', .55)
    if kind == 'grenade':
        m = int(4 * SR); tt = t_(4)[:m]
        blast = sat(filt(white(m), 'low', 3000) * expdecay(m, .08) + np.sin(2 * np.pi * (60 * np.exp(-tt * 3) + 30) * tt) * expdecay(m, .5) * 1.4 + filt(brown(m), 'low', 200) * expdecay(m, 1.0), 2.4)
        return space(stereo(blast * .6, -.1, .4), 'outdoor', .55)
    if kind == 'pin':  # alfinete cravado na cortiça
        m = int(.25 * SR); tt = t_(.25)[:m]
        return space(stereo(filt(white(m), 'band', [800, 4000]) * expdecay(m, .008) * .6 + np.sin(2 * np.pi * 300 * tt) * expdecay(m, .02) * .3, .1), 'room', .2)
    if kind == 'flashlight':
        m = int(.15 * SR); return stereo(filt(white(m), 'band', [2000, 8000]) * expdecay(m, .004) * .5, .3)
    if kind == 'stamp':  # carimbo batendo no papel
        m = int(.6 * SR); tt = t_(.6)[:m]
        return space(stereo(np.sin(2 * np.pi * (110 * np.exp(-tt * 20) + 60) * tt) * expdecay(m, .06) + filt(white(m), 'band', [300, 3000]) * expdecay(m, .015) * .6, 0), 'room', .3)
    if kind == 'string':  # barbante esticado
        m = int(.7 * SR); tt = t_(.7)[:m]; f = 260 + 140 * tt
        return stereo(np.sin(2 * np.pi * np.cumsum(f) / SR) * filt(white(m), 'low', 40) * 3 * np.sin(np.pi * tt / .7) * .15 + filt(white(m), 'band', [2000, 6000]) * .03, .2, .3)
    if kind == 'riser':  # subida de tensão (cordas sintéticas + ruído)
        m = int(max(d, 1) * SR); tt = t_(m / SR)[:m]; p = tt / tt[-1]
        tone = sum(np.sin(2 * np.pi * f * (1 + .5 * p) * tt + k) for k, f in enumerate((110, 164.8, 220, 261.6))) * .1
        return space(stereo((tone + filt(pink(m), 'band', [300, 6000]) * .3) * p ** 2, 0, .6), 'hall', .4)
    if kind == 'sub':  # golpe grave de corte
        m = int(2.5 * SR); tt = t_(2.5)[:m]
        return space(stereo(np.sin(2 * np.pi * (55 * np.exp(-tt * 1.8) + 22) * tt) * expdecay(m, .9), 0), 'hall', .3)
    return None


FILE_CACHE = {}
def from_file(name, off=0.0, d=None, gain_db=0.0, fade=.08):
    import os
    if name not in FILE_CACHE:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sfx', name + '.wav')
        a, sr = sf.read(path, dtype='float64'); a = a if a.ndim > 1 else np.stack([a, a], 1); assert sr == SR, (name, sr); FILE_CACHE[name] = a
    a = FILE_CACHE[name]; i = int(off * SR); j = len(a) if d is None else min(len(a), i + int(d * SR)); s = a[i:j].copy()
    f = min(int(fade * SR), len(s) // 2); r = np.linspace(0, 1, f)
    s[:f] *= r[:, None]; s[-f:] *= r[::-1, None]
    return s / (np.abs(s).max() + 1e-9) * 10 ** (gain_db / 20)

if __name__ == '__main__':
    ev = json.load(open(sys.argv[1])); total = float(sys.argv[3])
    y = render(ev, total)
    sf.write(sys.argv[2], y.astype(np.float32), SR, subtype='FLOAT')
    print(f'{len(ev)} eventos → {sys.argv[2]} ({total:.1f}s, pico {np.abs(y).max():.2f})')
