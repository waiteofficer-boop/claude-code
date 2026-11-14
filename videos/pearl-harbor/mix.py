"""Mixagem final: voz + efeitos com ducking por envelope, reverb leve na voz e masterização.

Uso: python3 mix.py narration.wav sfx.wav saida.m4a [lufs=-14]
- ducking: os efeitos abaixam até ~9 dB enquanto a voz fala (ataque 40 ms, soltura 450 ms), voltando suave
- voz: centro, com um toque de sala (6 %) para não soar "colada"
- master: limitador + loudnorm (-14 LUFS, pico real -1,5 dB), AAC 256 kbps 48 kHz
"""
import sys, subprocess, numpy as np, soundfile as sf
from scipy.signal import fftconvolve
import sound_design as sd

SR = 48000


def envelope(x, attack=.04, release=.45):
    a, r = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR)); e = np.zeros_like(x); v = 0.0
    xs = np.abs(x)
    for i in range(0, len(x), 64):  # passo de 64 amostras (rápido e suficiente)
        blk = xs[i:i + 64].max(); c = a if blk > v else r; v = c * v + (1 - c) * blk; e[i:i + 64] = v
    return e


def main(nar_p, sfx_p, out_p, lufs=-14):
    v, sr1 = sf.read(nar_p, dtype='float64'); fx, sr2 = sf.read(sfx_p, dtype='float64'); assert sr1 == sr2 == SR
    if v.ndim > 1: v = v.mean(1)
    n = max(len(v), len(fx)); v = np.pad(v, (0, n - len(v))); fx = np.pad(fx, ((0, n - len(fx)), (0, 0)))
    v = v / (np.sqrt((v[np.abs(v) > .01] ** 2).mean()) + 1e-9) * 10 ** (-20 / 20)   # voz a -20 dBFS RMS (efeitos ficam abaixo)
    e = envelope(v); duck = 1 - .65 * np.clip(e / .12, 0, 1)          # até ~-9 dB
    fx = fx * 1.0 * duck[:, None]                                       # níveis já balanceados em sound_design.BED_RMS/HIT_PEAK
    vs = np.stack([v, v], 1)
    room = np.stack([fftconvolve(v, sd.IRS['room'][:, c])[:n] for c in range(2)], 1)
    mixd = vs + room * .06 + fx
    tmp = out_p + '.tmp.wav'; sf.write(tmp, (mixd / (np.abs(mixd).max() + 1e-9) * .9).astype(np.float32), SR, subtype='FLOAT')
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"alimiter=limit=0.89:attack=5:release=60,loudnorm=I={lufs}:TP=-1.5:LRA=11,aresample={SR}",
                    "-c:a", "aac", "-b:a", "256k", out_p], check=True)
    print(f"mix → {out_p}")


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else -14)
