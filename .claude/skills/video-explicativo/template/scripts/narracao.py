# uso: python3 -I narracao.py <voz.onnx> <roteiro.json> <saida.wav> <timeline.json>
import json, subprocess, sys, os, wave, tempfile
V, ROT, OUT, TL = sys.argv[1:5]
S = json.load(open(ROT)); D = tempfile.mkdtemp()
GAP=0.22; FPS=30; t=0.0; out=[]; parts=[]; rate=22050
for i,(txt,sc) in enumerate(S):
    clean=txt.replace("*","")
    w=f"{D}/s{i:02d}.wav"
    subprocess.run([sys.executable,"-m","piper","-m",V,"-f",w,"--length-scale","0.9"],input=clean.encode(),check=True,capture_output=True)
    with wave.open(w) as f: dur=f.getnframes()/f.getframerate(); rate=f.getframerate()
    toks=txt.split(); L=sum(len(x.replace('*','')) for x in toks); c=0; words=[]
    for x in toks:
        n=len(x.replace('*','')); s0=t+0.05+(dur-0.15)*c/L; c+=n
        words.append({"w":x.replace('*',''),"k":x.startswith('*'),"s":round(s0,3)})
    out.append({"text":clean,"scene":sc,"start":round(t,3),"end":round(t+dur,3),"words":words})
    parts.append(w); t+=dur+GAP
sil=f"{D}/sil.wav"; lst=f"{D}/list.txt"
subprocess.run(["ffmpeg","-v","error","-y","-f","lavfi","-i",f"anullsrc=r={rate}:cl=mono","-t",str(GAP),sil],check=True)
open(lst,"w").write("".join(f"file '{w}'\nfile '{sil}'\n" for w in parts))
subprocess.run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",lst,"-af","apad=pad_dur=1.2",OUT],check=True)
json.dump({"fps":FPS,"total":round(t+1.2,3),"sentences":out},open(TL,"w"),ensure_ascii=False,indent=1)
print("total",round(t,2))
for i,s in enumerate(out): print(i,s["scene"],s["start"])
