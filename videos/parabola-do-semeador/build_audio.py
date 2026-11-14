"""Gera narração (Piper, local), timeline com tempo por palavra, trilha e SFX.

Uso: python3 build_audio.py <script_xx.json> <voz.onnx> <pasta_saida> [fator_de_tom=1.0]
  fator_de_tom < 1 deixa a voz mais grave sem mudar a duração (ex.: 0.92).
Saídas: narration.wav, music.wav, timeline.json; e timeline_<lang>.js/.json ao lado deste arquivo.
SFX:  python3 build_audio.py --sfx sfx_events.json saida.wav duracao
"""
import json, subprocess, sys, wave, re, pathlib
import numpy as np

HERE = pathlib.Path(__file__).parent
SR = 22050


def synth(model, text, out, pitch=1.0):
    subprocess.run([sys.executable, "-m", "piper", "-m", model, "-f", out,
                    "--length-scale", "1.08", "--sentence-silence", "0.25"],
                   input=text.encode(), check=True, capture_output=True)
    if pitch != 1.0:  # abaixa/sobe o tom mantendo a duração
        tmp = out + ".raw.wav"; pathlib.Path(out).rename(tmp)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af",
                        f"asetrate={SR}*{pitch},aresample={SR},atempo={1 / pitch:.5f}", "-ar", str(SR), "-ac", "1", out], check=True)
        pathlib.Path(tmp).unlink()
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


def _noise(rng, n, smooth):
    return np.convolve(rng.standard_normal(n), np.ones(smooth) / smooth, "same")


def _bed(kind, d, rng):
    """Ambiências longas (com fade de entrada/saída)."""
    n = int(d * SR); tt = np.arange(n) / SR
    if kind == "crickets":
        s = np.zeros(n)
        for f0, rate, ph in ((4300, 2.6, 0), (4700, 3.1, 1.3), (3900, 2.2, 2.1)):
            gate = (np.sin(2 * np.pi * rate * tt + ph) > .55) * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * tt) > .2)
            s += np.sin(2 * np.pi * f0 * tt) * gate * .018
    elif kind == "flame":
        s = _noise(rng, n, 6) * (0.4 + 0.6 * np.abs(_noise(rng, n, 4000)) * 8) * .05
    elif kind == "waves":
        swell = 0.5 + 0.5 * np.sin(2 * np.pi * tt / 3.4) ** 2
        s = _noise(rng, n, 40) * swell * .45 + _noise(rng, n, 8) * swell ** 3 * .12
    elif kind == "crowd":
        s = sum(_noise(rng, n, 30) * np.sin(2 * np.pi * f * tt) for f in (180, 240, 310)) * .25 + _noise(rng, n, 60) * .3
        s *= 0.6 + 0.4 * np.sin(2 * np.pi * tt / 2.3)
    elif kind == "wind":
        gust = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 6.3) * np.sin(2 * np.pi * tt / 2.9))
        s = _noise(rng, n, 120) * gust * 1.1
    elif kind == "sizzle":
        s = _noise(rng, n, 2) * np.linspace(0, 1, n) ** 2 * .05
    elif kind == "creak":
        f = 90 + 60 * np.sin(2 * np.pi * 1.7 * tt)
        s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * _noise(rng, n, 200) * 2 * .08
    elif kind == "rustle":
        s = _noise(rng, n, 5) * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 1.9)) * .07
    elif kind == "drone":
        s = sum(np.sin(2 * np.pi * f * tt) for f in (55, 82.4, 110.2)) * .05 * (0.8 + 0.2 * np.sin(2 * np.pi * tt / 5))
    else:
        return None
    fade = np.clip(tt / .6, 0, 1) * np.clip((d - tt) / .6, 0, 1)
    return s * fade


def sfx(total, events):
    out = np.zeros(int(total * SR))
    rng = np.random.default_rng(7)
    for ev in events:
        kind, at, d = ev if len(ev) == 3 else (*ev, 0)
        i = int(at * SR)
        if d:
            s = _bed(kind, d, rng)
            if s is not None:
                j = min(i + len(s), len(out)); out[i:j] += s[: j - i]
                continue
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
        elif kind == "step":
            n = int(.12 * SR); tt = np.arange(n) / SR
            s = _noise(rng, n, 12) * np.exp(-tt * 40) * .35
        elif kind == "toss":
            n = int(.35 * SR); tt = np.arange(n) / SR
            s = _noise(rng, n, 10) * np.sin(np.pi * tt / tt[-1]) * .3
        elif kind == "patter":
            n = int(.05 * SR); tt = np.arange(n) / SR
            s = _noise(rng, n, 3) * np.exp(-tt * 90) * .25
        elif kind == "flutter":
            n = int(1.6 * SR); tt = np.arange(n) / SR
            s = _noise(rng, n, 25) * (np.sin(2 * np.pi * 14 * tt) > 0) * np.sin(np.pi * tt / tt[-1]) * .35
        elif kind == "grow":
            n = int(.6 * SR); tt = np.arange(n) / SR
            s = np.sin(2 * np.pi * (300 + 900 * tt) * tt) * np.sin(np.pi * tt / tt[-1]) * .08
        elif kind == "low":
            n = int(1.5 * SR); tt = np.arange(n) / SR
            s = np.sin(2 * np.pi * (70 - 25 * tt) * tt) * np.exp(-tt * 2.2) * .5
        elif kind == "tick":
            n = int(.08 * SR); tt = np.arange(n) / SR
            s = np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 60) * .2
        elif kind == "drop":
            n = int(.5 * SR); tt = np.arange(n) / SR
            s = np.sin(2 * np.pi * (900 * np.exp(-tt * 9) + 120) * tt) * np.exp(-tt * 8) * .3
        elif kind == "heartbeat":
            n = int(.5 * SR); tt = np.arange(n) / SR
            thump = lambda o: np.sin(2 * np.pi * 52 * (tt - o)) * np.exp(-np.clip(tt - o, 0, None) * 18) * (tt >= o)
            s = (thump(0) + .7 * thump(.22)) * .55
        else:
            continue
        j = min(i + len(s), len(out)); out[i:j] += s[: j - i]
    return out


def main(script, model, outdir, pitch=1.0):
    outdir = pathlib.Path(outdir); outdir.mkdir(parents=True, exist_ok=True)
    cfg = json.loads(pathlib.Path(script).read_text())
    pieces, segs, t = [np.zeros(int(cfg["lead_in"] * SR))], [], cfg["lead_in"]
    for s in cfg["segments"]:
        a, sr = synth(model, s["text"], str(outdir / f"{s['id']}.wav"), pitch)
        assert sr == SR, sr
        a = trim(a); d = len(a) / SR
        segs.append({"id": s["id"], "text": s["text"], "s": round(t, 3), "e": round(t + d, 3),
                     "words": word_times(s["text"], t, d)})
        pieces += [a, np.zeros(int(cfg["gap"] * SR))]; t += d + cfg["gap"]
    pieces.append(np.zeros(int(cfg["tail"] * SR)))
    nar = np.concatenate(pieces); total = len(nar) / SR
    write(outdir / "narration.wav", nar * 0.95)
    write(outdir / "music.wav", music(total))
    lang = cfg["lang"]
    timeline = {"duration": round(total, 3), "lang": lang, "keywords": cfg["keywords"], "segments": segs,
                "strings": cfg["strings"], "cues": cfg["cues"]}
    (outdir / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1))
    (HERE / f"timeline_{lang}.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1))
    (HERE / f"timeline_{lang}.js").write_text("window.TL = " + json.dumps(timeline, ensure_ascii=False) + ";\n")
    print(f"duração {total:.2f}s")
    for s in segs:
        print(f"{s['id']:>4} {s['s']:6.2f}–{s['e']:6.2f}  {s['text'][:60]}")


if __name__ == "__main__":
    if sys.argv[1] == "--sfx":  # build_audio.py --sfx sfx_events.json saida.wav duracao
        ev = json.loads(pathlib.Path(sys.argv[2]).read_text())
        write(sys.argv[3], sfx(float(sys.argv[4]), [(e["k"], e["t"], e.get("d", 0)) for e in ev]))
    else:
        main(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 1.0)
