# uso: python3 -I narracao_neural.py <tts.py> <voz> <taxa> <roteiro.json> <saida.wav> <timeline.json>
# "~palavra" = gaguejada YTP (repete o começo da palavra 3x)
import json, subprocess, sys, os, tempfile, re, unicodedata
import numpy as np
TTS, VOICE, RATE, ROT, OUT, TL = sys.argv[1:7]
R = 24000; GAP = 0.16; D = tempfile.mkdtemp()
norm = lambda w: re.sub(r'[^\w]', '', unicodedata.normalize('NFC', w.lower()))
S = json.load(open(ROT)); audio = []; t = 0.0; out = []; stut = []
for i, (txt, sc) in enumerate(S):
    clean = txt.replace('~', '').replace('*', '')
    mp3, wj = f"{D}/{i}.mp3", f"{D}/{i}.json"
    subprocess.run([sys.executable, '-I', TTS, VOICE, RATE, clean, mp3, wj], check=True)
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '1', '-ar', str(R), '-f', 's16le', '-'], check=True, capture_output=True).stdout
    a = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    words = json.load(open(wj))
    last = words[-1]; a = a[:int((last['s'] + last['d'] + 0.1) * R)]  # corta silêncio do fim
    marks = [norm(x[1:]) for x in txt.split() if x.startswith('~')]
    shift = 0.0; pieces = []; cur = 0
    for w in words:
        w['s'] += shift
        if marks and norm(w['w']) == marks[0]:
            marks.pop(0)
            s0 = int((w['s'] - shift) * R); L = int(min(0.15, w['d'] * 0.42) * R)
            seg = a[s0:s0 + L] * np.hanning(L * 2)[L:] ** 0.3
            pieces.append(a[cur:s0]); cur = s0
            rep = np.concatenate([np.concatenate([seg, np.zeros(int(0.035 * R))]) for _ in range(3)])
            pieces.append(rep)
            stut.append({'s': round(t + w['s'], 3), 'seg': round(len(rep) / R / 3, 3), 'n': 3, 'w': w['w']})
            ins = len(rep) / R; shift += ins; w['s'] += ins
    pieces.append(a[cur:]); a = np.concatenate(pieces)
    dur = len(a) / R
    out.append({'text': clean, 'scene': sc, 'start': round(t, 3), 'end': round(t + dur, 3),
                'words': [{'w': w['w'], 's': round(t + w['s'], 3)} for w in words]})
    audio += [a, np.zeros(int(GAP * R))]; t += dur + GAP
full = np.concatenate(audio + [np.zeros(int(1.0 * R))])
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(R), '-ac', '1', '-i', '-', OUT], input=(np.clip(full, -1, 1) * 32767).astype(np.int16).tobytes(), check=True)
json.dump({'fps': 30, 'total': round(t + 1.0, 3), 'sentences': out, 'stutters': stut}, open(TL, 'w'), ensure_ascii=False, indent=1)
print('total', round(t, 2)); [print(i, s['scene'], s['start']) for i, s in enumerate(out)]; print(stut)
