"""Narração neural (Kokoro) + alinhamento palavra a palavra (Whisper) → narration.wav e timeline_<lang>.js

Uso: python3 build_voice.py script_pt.json <pasta_kokoro> <saida> [voz=pm_alex+pm_santa] [speed=.86] [pitch=.82]
- voz: nome ou mistura "a+b" de estilos Kokoro (média dos vetores de estilo)
- pitch: fator de tom aplicado com rubberband preservando formantes (voz mais grave sem soar robótica)
- por segmento: 'say' = grafia de pronúncia (nomes estrangeiros); 'phonemes' = IPA direto (ex.: "tˈoɾa")
- o tempo de cada palavra vem do Whisper; palavras que ele escreve diferente (números) são interpoladas
"""
import json, sys, re, difflib, subprocess, pathlib, unicodedata
import numpy as np, soundfile as sf
from scipy.signal import resample_poly

HERE = pathlib.Path(__file__).parent
SR = 48000


def norm(w):
    w = unicodedata.normalize('NFD', w.lower()); w = ''.join(c for c in w if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', w)


def process_voice(src, dst, pitch):
    af = [f"rubberband=pitch={pitch}:formant=preserved:pitchq=quality" if pitch != 1 else "anull",
          "highpass=f=70", "equalizer=f=160:t=q:w=1:g=2.5", "equalizer=f=320:t=q:w=1.4:g=-1.5",
          "equalizer=f=3200:t=q:w=1.2:g=2", "deesser=i=0.4:m=0.5:f=0.5", "acompressor=threshold=0.12:ratio=2.5:attack=8:release=120:makeup=1.5",
          f"aresample={SR}"]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", ",".join(af), "-ac", "1", dst], check=True)


def trim(a, thr=.008, pad=.06):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx): return a
    p = int(pad * SR); return a[max(idx[0] - p, 0): idx[-1] + p]


def align(script_words, wh_words, t0, dur):
    """mapeia as palavras do roteiro nos tempos do Whisper; lacunas são interpoladas pelo tamanho das palavras."""
    A = [norm(w) for w in script_words]; B = [norm(w['w']) for w in wh_words]
    times = [None] * len(A)
    for blk in difflib.SequenceMatcher(None, A, B, autojunk=False).get_matching_blocks():
        for k in range(blk.size): times[blk.a + k] = (wh_words[blk.b + k]['s'], wh_words[blk.b + k]['e'])
    i = 0
    while i < len(A):
        if times[i] is not None: i += 1; continue
        j = i
        while j < len(A) and times[j] is None: j += 1
        start = times[i - 1][1] if i > 0 else 0.0
        end = times[j][0] if j < len(A) else dur
        wts = [len(A[k]) + 1 for k in range(i, j)]; tot = sum(wts); cur = start
        for k, wt in zip(range(i, j), wts):
            d = (end - start) * wt / tot; times[k] = (cur, cur + d * .92); cur += d
        i = j
    return [{"w": w, "s": round(t0 + s, 3), "e": round(t0 + e, 3)} for w, (s, e) in zip(script_words, times)]


def main(script, kdir, outdir, voice="pm_alex+pm_santa", speed=.86, pitch=.82):
    from kokoro_onnx import Kokoro
    from faster_whisper import WhisperModel
    cfg = json.loads(pathlib.Path(script).read_text()); out = pathlib.Path(outdir); out.mkdir(parents=True, exist_ok=True)
    k = Kokoro(f"{kdir}/kokoro-v1.0.onnx", f"{kdir}/voices-v1.0.bin")
    style = np.mean([k.get_voice_style(v) for v in voice.split('+')], axis=0)
    wm = WhisperModel('small', device='cpu', compute_type='int8')
    lang = {'pt': 'pt-br', 'en': 'en-us'}[cfg['lang']]
    pieces, segs, t = [np.zeros(int(cfg['lead_in'] * SR))], [], cfg['lead_in']
    for s in cfg['segments']:
        a, sr = (k.create(s['phonemes'], voice=style, speed=speed, lang=lang, is_phonemes=True) if 'phonemes' in s else  # fonemas IPA diretos (ex.: japonês)
                 k.create(s.get('say', s['text']), voice=style, speed=speed, lang=lang))  # 'say' = grafia de pronúncia (nomes estrangeiros)
        raw, proc = out / f"{s['id']}_raw.wav", out / f"{s['id']}.wav"
        sf.write(raw, a, sr); process_voice(str(raw), str(proc), pitch)
        a, _ = sf.read(proc, dtype='float32'); a = trim(a); dur = len(a) / SR
        a16 = resample_poly(a, 1, 3).astype(np.float32)
        res, _ = wm.transcribe(a16, language=cfg['lang'], word_timestamps=True)
        wh = [{"w": w.word.strip(), "s": w.start, "e": w.end} for seg in res for w in seg.words]
        words = align(s['text'].split(), wh, t, dur)
        segs.append({"id": s['id'], "text": s['text'], "s": round(t, 3), "e": round(t + dur, 3), "words": words})
        heard = ' '.join(w['w'] for w in wh)
        print(f"{s['id']:>4} {t:6.2f}–{t + dur:6.2f}  ouvido: {heard[:70]}")
        pieces += [a, np.zeros(int(cfg['gap'] * SR))]; t += dur + cfg['gap']
    pieces.append(np.zeros(int(cfg['tail'] * SR)))
    nar = np.concatenate(pieces); total = len(nar) / SR
    sf.write(out / 'narration.wav', nar, SR, subtype='FLOAT')
    tl = {"duration": round(total, 3), "lang": cfg['lang'], "keywords": cfg['keywords'], "segments": segs,
          "strings": cfg['strings'], "cues": cfg['cues'], "clockFmt": cfg.get('clockFmt', 'en'),
          "voice": {"engine": "kokoro", "style": voice, "speed": speed, "pitch": pitch}}
    (HERE / f"timeline_{cfg['lang']}.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    (HERE / f"timeline_{cfg['lang']}.js").write_text("window.TL = " + json.dumps(tl, ensure_ascii=False) + ";\n")
    print(f"duração {total:.2f}s")


if __name__ == '__main__':
    a = sys.argv + [None] * 6
    main(a[1], a[2], a[3], a[4] or "pm_alex+pm_santa", float(a[5] or .86), float(a[6] or .82))
