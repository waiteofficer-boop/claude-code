"""Mixagem final: voz + efeitos com ducking, efeitos de processamento por trecho e masterização.

Uso: python3 mix.py narration.wav sfx.wav saida.m4a [eventos.json] [lufs=-14]
Trilha: eventos {k:'music', name (build/<name>.wav), t, off, d, gain (dBFS RMS), fin, fout} — ducking ~7 dB sob a voz.
Trechos especiais vêm da lista de eventos (mesma de sound_design.py), com tipos:
  fx_phone  {t, d}  voz como telefone (300–3400 Hz, saturação leve)
  fx_radio  {t, d}  voz como rádio (450–2800 Hz, saturação, estática por baixo)
  fx_shock  {t, d}  "choque" de explosão: mundo abafado (passa-baixas ~350 Hz voltando aos poucos)
                    + zumbido no ouvido (~6,2 kHz) que some — a narração fica limpa
- ducking: efeitos abaixam até ~9 dB quando a voz fala (ataque 40 ms, soltura 450 ms)
- master: limitador + loudnorm (-14 LUFS, pico real -1,5 dB), AAC 256 kbps 48 kHz
"""
import sys, json, subprocess, numpy as np, soundfile as sf
from scipy.signal import fftconvolve
import sound_design as sd

SR = 48000


def envelope(x, attack=.04, release=.45):
    a, r = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR)); e = np.zeros_like(x); v = 0.0
    xs = np.abs(x)
    for i in range(0, len(x), 64):
        blk = xs[i:i + 64].max(); c = a if blk > v else r; v = c * v + (1 - c) * blk; e[i:i + 64] = v
    return e


def window(n, t0, d, fade=.04):
    """máscara 0..1 do trecho [t0, t0+d] com bordas suaves."""
    tt = np.arange(n) / SR
    return np.clip((tt - t0) / fade, 0, 1) * np.clip((t0 + d - tt) / fade, 0, 1)


def phone(x): return sd.sat(sd.filt(x, 'band', [300, 3400], 6) * 2.2, 2.0) * .55
def radio(x):
    y = sd.sat(sd.filt(x, 'band', [450, 2800], 6) * 2.8, 2.6) * .5
    return y + sd.filt(sd.white(len(x)), 'band', [800, 3000]) * .012


def main(nar_p, sfx_p, out_p, ev_p=None, lufs=-14):
    v, sr1 = sf.read(nar_p, dtype='float64'); fx, sr2 = sf.read(sfx_p, dtype='float64'); assert sr1 == sr2 == SR
    if v.ndim > 1: v = v.mean(1)
    n = max(len(v), len(fx)); v = np.pad(v, (0, n - len(v))); fx = np.pad(fx, ((0, n - len(fx)), (0, 0)))
    v = sd.filt(v, 'high', 60, 2)
    v = v / (np.sqrt((v[np.abs(v) > .01] ** 2).mean()) + 1e-9) * 10 ** (-20 / 20)   # voz a -20 dBFS RMS
    events = json.load(open(ev_p)) if ev_p else []
    # ── efeitos de processamento na voz (telefone / rádio) ──
    for e in events:
        if e['k'] in ('fx_phone', 'fx_radio'):
            w = window(n, e['t'], e['d']); proc = phone(v) if e['k'] == 'fx_phone' else radio(v)
            v = v * (1 - w) + proc * w
    e_v = envelope(v); duck = 1 - .65 * np.clip(e_v / .12, 0, 1)
    fx = fx * duck[:, None]
    # ── choque de explosão: abafa o mundo (não a narração) e entra o zumbido ──
    tin = np.zeros(n)
    for e in events:
        if e['k'] == 'fx_shock':
            tt = np.arange(n) / SR; q = np.clip((tt - e['t']) / e['d'], 0, 1); on = (tt >= e['t']) & (tt <= e['t'] + e['d'])
            amt = np.where(on, (1 - q) ** 1.5, 0)                                   # 1 → 0 ao longo do trecho
            muffled = np.stack([sd.filt(fx[:, c], 'low', 350, 4) for c in range(2)], 1) * 1.4
            fx = fx * (1 - amt[:, None]) + muffled * amt[:, None]
            ring = np.sin(2 * np.pi * 6200 * tt) * np.where(on, np.clip((tt - e['t']) / .05, 0, 1) * (1 - q) ** 2, 0)
            tin += ring * 10 ** (-24 / 20)
    # ── trilha musical: entradas {k:'music', name, t, off, d, gain, fin, fout}, abaixa ~7 dB sob a voz ──
    import os
    mus = np.zeros((n, 2))
    for e in events:
        if e['k'] != 'music': continue
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build', e['name'] + '.wav')
        a, sr = sf.read(path, dtype='float64'); assert sr == SR
        i0 = int(e.get('off', 0) * SR); seg = a[i0:i0 + int(e['d'] * SR)].copy()
        fi, fo = int(e.get('fin', 1.5) * SR), int(e.get('fout', 2.0) * SR)
        seg[:fi] *= np.linspace(0, 1, min(fi, len(seg)))[:, None][:len(seg[:fi])]
        if fo: seg[-fo:] *= np.linspace(1, 0, min(fo, len(seg)))[:, None][-len(seg[-fo:]):]
        rms = np.sqrt((seg ** 2).mean()) + 1e-9; seg = seg / rms * 10 ** (e.get('gain', -24) / 20)
        j = int(e['t'] * SR); k = min(j + len(seg), n); mus[j:k] += seg[:k - j]
    mus *= (1 - .55 * np.clip(e_v / .12, 0, 1))[:, None]
    fx = fx + mus
    vs = np.stack([v, v], 1)
    room = np.stack([fftconvolve(v, sd.IRS['room'][:, c])[:n] for c in range(2)], 1)
    mixd = vs + room * .05 + fx + np.stack([tin, tin * .9], 1)
    tmp = out_p + '.tmp.wav'; sf.write(tmp, (mixd / (np.abs(mixd).max() + 1e-9) * .9).astype(np.float32), SR, subtype='FLOAT')
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"alimiter=limit=0.89:attack=5:release=60,loudnorm=I={lufs}:TP=-1.5:LRA=11,aresample={SR}",
                    "-c:a", "aac", "-b:a", "256k", out_p], check=True)
    print(f"mix → {out_p}  (efeitos de trecho: {sum(e['k'].startswith('fx_') for e in events)})")


if __name__ == '__main__':
    a = sys.argv + [None] * 2
    main(a[1], a[2], a[3], a[4], float(a[5]) if a[5] else -14)
