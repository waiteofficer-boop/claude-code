"""Gera narração (Piper, local), timeline com tempo por palavra, trilha e SFX.

Uso: python3 build_audio.py <voz.onnx> <pasta_saida>
Saídas: narration.wav, music.wav, sfx.wav, timeline.json (também copiado ao lado deste arquivo).
"""
import json, subprocess, sys, wave, re, pathlib
import numpy as np

HERE = pathlib.Path(__file__).parent
SR = 22050


def synth(model, text, out):
    subprocess.run([sys.executable, "-m", "piper", "-m", model, "-f", out,
                    "--length-scale", "1.08", "--sentence-silence", "0.25"],
                   input=text.encode(), check=True, capture_output=True)
    with wave.open(out) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        return a, w.getframerate()


def trim(a, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    return a[max(idx[0] - 200, 0): idx[-1] + 400] if len(idx) else a


def word_times(text, start, dur):
    """Distribui o tempo do segmento pelas palavras, proporcional às letras + pausas de pontuação."""
    words = text.split()
    weights = []
    for w in words:
        wt = len(re.sub(r"\W", "", w)) + 1.5
        pause = 4.5 if w[-1] in ".:?" else 2.5 if w[-1] == "," else 0
        weights.append((wt, pause))
    total = sum(a + b for a, b in weights)
    t, out = start, []
    for w, (wt, pause) in zip(words, weights):
        d = dur * wt / total
        out.append({"w": w, "s": round(t, 3), "e": round(t + d, 3)})
        t += d + dur * pause / total
    return out


def write(path, a, sr=SR):
    a = np.clip(a, -1, 1)
    with wave.open(str(path), "w") as w:
        w.setnchannels(1 if a.ndim == 1 else 2); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((a * 32767).astype(np.int16).tobytes())


def music(total):
    """Pad ambiente: acordes lentos (Ré maior / Si menor / Sol / Lá) com sopro de ar."""
    t = np.arange(int(total * SR)) / SR
    chords = [[146.8, 220.0, 293.7, 370.0], [123.5, 185.0, 246.9, 293.7],
              [98.0, 196.0, 246.9, 293.7], [110.0, 220.0, 277.2, 329.6]]
    seg = 8.0
    out = np.zeros_like(t)
    for i in range(int(total / seg) + 2):
        c = chords[i % 4]
        env = np.clip(1 - np.abs((t - i * seg - seg / 2) / (seg * 0.75)), 0, 1) ** 1.5
        for f in c:
            out += env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.001 * t)) * 0.05
    rng = np.random.default_rng(1)
    air = np.convolve(rng.standard_normal(len(t)), np.ones(400) / 400, "same") * 0.15
    out += air * (0.5 + 0.5 * np.sin(2 * np.pi * t / 11))
    swell = 0.6 + 0.4 * np.clip((t - total * 0.55) / (total * 0.2), 0, 1)  # cresce na revelação
    fade = np.clip(t / 2, 0, 1) * np.clip((total - t) / 2.5, 0, 1)
    return out * swell * fade * 0.5


def sfx(total, events):
    out = np.zeros(int(total * SR))
    rng = np.random.default_rng(7)
    for kind, at in events:
        i = int(at * SR)
        if kind == "pop":
            n = int(0.09 * SR); tt = np.arange(n) / SR
            s = np.sin(2 * np.pi * (900 - 4000 * tt) * tt) * np.exp(-tt * 45) * 0.25
        elif kind == "whoosh":
            n = int(0.7 * SR); tt = np.arange(n) / SR
            noise = np.convolve(rng.standard_normal(n), np.ones(30) / 30, "same")
            s = noise * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.35
        elif kind == "shimmer":
            n = int(1.6 * SR); tt = np.arange(n) / SR
            s = sum(np.sin(2 * np.pi * f * tt) for f in (1318, 1568, 1976, 2637)) * np.exp(-tt * 2.5) * 0.04
        elif kind == "birds":
            n = int(1.2 * SR); tt = np.arange(n) / SR
            s = np.zeros(n)
            for k in range(5):
                o = int(k * 0.22 * SR); m = int(0.08 * SR); u = np.arange(m) / SR
                s[o:o + m] += np.sin(2 * np.pi * (2600 + 1800 * np.sin(2 * np.pi * 25 * u)) * u) * np.exp(-u * 30) * 0.12
        else:
            continue
        j = min(i + len(s), len(out)); out[i:j] += s[: j - i]
    return out


def main(model, outdir):
    outdir = pathlib.Path(outdir); outdir.mkdir(parents=True, exist_ok=True)
    cfg = json.loads((HERE / "script.json").read_text())
    pieces, segs, t = [np.zeros(int(cfg["lead_in"] * SR))], [], cfg["lead_in"]
    for s in cfg["segments"]:
        a, sr = synth(model, s["text"], str(outdir / f"{s['id']}.wav"))
        assert sr == SR, sr
        a = trim(a); d = len(a) / SR
        segs.append({"id": s["id"], "text": s["text"], "s": round(t, 3), "e": round(t + d, 3),
                     "words": word_times(s["text"], t, d)})
        pieces += [a, np.zeros(int(cfg["gap"] * SR))]; t += d + cfg["gap"]
    pieces.append(np.zeros(int(cfg["tail"] * SR)))
    nar = np.concatenate(pieces); total = len(nar) / SR
    write(outdir / "narration.wav", nar * 0.95)
    write(outdir / "music.wav", music(total))
    timeline = {"duration": round(total, 3), "keywords": cfg["keywords"], "segments": segs}
    (outdir / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1))
    (HERE / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1))
    (HERE / "timeline.js").write_text("window.TL = " + json.dumps(timeline, ensure_ascii=False) + ";\n")
    print(f"duração {total:.2f}s")
    for s in segs:
        print(f"{s['id']:>4} {s['s']:6.2f}–{s['e']:6.2f}  {s['text'][:60]}")


if __name__ == "__main__":
    if sys.argv[1] == "--sfx":  # build_audio.py --sfx sfx_events.json saida.wav duracao
        ev = json.loads(pathlib.Path(sys.argv[2]).read_text())
        write(sys.argv[3], sfx(float(sys.argv[4]), [(e["k"], e["t"]) for e in ev]))
    else:
        main(sys.argv[1], sys.argv[2])
