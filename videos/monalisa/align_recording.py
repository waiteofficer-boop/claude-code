"""Usa uma narração GRAVADA (ou gerada fora, ex.: ElevenLabs) no lugar da voz sintética.

Transcreve o arquivo inteiro com Whisper (tempo por palavra), alinha com as palavras do roteiro
(difflib; números e nomes que o Whisper escreve diferente são interpolados) e gera
narration.wav (48 kHz) + timeline_<lang>.js/json no mesmo formato de build_voice.py.

Uso: python3 align_recording.py script_pt.json gravacao.mp3 <saida> [lead_in=0.6] [tail=3.0]
Também imprime, por frase, o que foi ouvido — para conferir se a gravação seguiu o roteiro.
"""
import json, sys, subprocess, pathlib
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from build_voice import norm, align, HERE

SR = 48000


def main(script, rec, outdir, lead=.6, tail=3.0):
    from faster_whisper import WhisperModel
    cfg = json.loads(pathlib.Path(script).read_text()); out = pathlib.Path(outdir); out.mkdir(parents=True, exist_ok=True)
    wav = out / 'rec48.wav'
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", rec, "-ar", str(SR), "-ac", "1", "-c:a", "pcm_f32le", str(wav)], check=True)
    a, _ = sf.read(wav, dtype='float32')
    a = np.concatenate([np.zeros(int(lead * SR), np.float32), a, np.zeros(int(tail * SR), np.float32)])
    wm = WhisperModel('small', device='cpu', compute_type='int8')
    # sem initial_prompt (provoca alucinação em trechos sussurrados) e com VAD
    res, _ = wm.transcribe(resample_poly(a, 1, 3).astype(np.float32), language=cfg['lang'], word_timestamps=True, vad_filter=True,
                           condition_on_previous_text=False)
    wh = [{"w": w.word.strip(), "s": w.start, "e": w.end} for seg in res for w in seg.words]
    script_words = [(s['id'], w) for s in cfg['segments'] for w in s['text'].split()]
    words = align([w for _, w in script_words], wh, 0.0, len(a) / SR)
    segs, k = [], 0
    for s in cfg['segments']:
        n = len(s['text'].split()); ws = words[k:k + n]; k += n
        segs.append({"id": s['id'], "text": s['text'], "s": ws[0]['s'], "e": ws[-1]['e'], "words": ws})
    # conferência: palavras do roteiro que o Whisper não ouviu (ou ouviu diferente)
    A = [norm(w) for _, w in script_words]; B = [norm(w['w']) for w in wh]
    import difflib
    sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
    print(f"concordância roteiro × gravação: {sm.ratio():.2f}")
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op != 'equal': print(f"  {op:8s} roteiro: {' '.join(w for _, w in script_words[i1:i2])!r:50.50} | ouvido: {' '.join(w['w'] for w in wh[j1:j2])!r}")
    sf.write(out / 'narration.wav', a, SR, subtype='FLOAT')
    total = len(a) / SR
    tl = {"duration": round(total, 3), "lang": cfg['lang'], "keywords": cfg['keywords'], "segments": segs,
          "strings": cfg['strings'], "cues": cfg['cues'], "clockFmt": cfg.get('clockFmt', 'en'), "voice": {"engine": "recording", "file": pathlib.Path(rec).name}}
    (HERE / f"timeline_{cfg['lang']}.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    (HERE / f"timeline_{cfg['lang']}.js").write_text("window.TL = " + json.dumps(tl, ensure_ascii=False) + ";\n")
    for s in segs: print(f"{s['id']:>4} {s['s']:7.2f}–{s['e']:7.2f}  {s['text'][:60]}")
    print(f"duração {total:.2f}s")


if __name__ == '__main__':
    a = sys.argv + [None] * 3
    main(a[1], a[2], a[3], float(a[4] or .6), float(a[5] or 3.0))
