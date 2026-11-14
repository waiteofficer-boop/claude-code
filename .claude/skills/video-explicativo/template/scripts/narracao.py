import json, subprocess, sys, os, re, wave
D=os.path.dirname(os.path.abspath(__file__)); V=sys.argv[1]; PUB=sys.argv[2]
S=[("Toda galinha faz um *escândalo* depois de botar um ovo.","hook"),
("Mas não é *orgulho*.","hook"),
("Me dá *quarenta* segundos que eu te explico.","timer"),
("Primeiro, botar ovo é um momento de *risco*.","risk"),
("A galinha se afasta do *bando* e fica parada no ninho, sozinha.","risk"),
("Hipótese um: despistar *predadores*.","pred"),
("Ela sai do ninho e faz *barulho* longe dele.","pred"),
("O predador vai atrás do *som*, e não do ovo.","pred"),
("Hipótese dois: chamar o *bando*.","flock"),
("O cacarejo avisa onde ela está, e as outras galinhas costumam *responder*.","flock"),
("Hipótese três, a mais *curiosa*.","rooster"),
("Logo depois da postura é a pior hora pra *fecundação*.","rooster"),
("E o cacarejo faz os machos darem *menos* atenção a ela.","rooster"),
("E não, não é *dor*.","myth"),
("Não há evidência forte de que botar ovo doa.","myth"),
("E nem toda galinha *cacareja*.","myth"),
("Não é orgulho.","end"),
("É *estratégia* de sobrevivência.","end"),
("A ciência ainda não fechou a resposta.","cta"),
("Qual você acha que é? *Comenta* aí.","cta")]
GAP=0.22; FPS=30; t=0.0; out=[]; parts=[]
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
    parts.append((w,dur)); t+=dur+GAP
# concat with gaps
lst=f"{D}/list.txt"; sil=f"{D}/sil.wav"
subprocess.run(["ffmpeg","-v","error","-y","-f","lavfi","-i",f"anullsrc=r={rate}:cl=mono","-t",str(GAP),sil],check=True)
open(lst,"w").write("".join(f"file '{w}'\nfile '{sil}'\n" for w,_ in parts))
subprocess.run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",lst,"-af","apad=pad_dur=1.2",f"{PUB}/voz.wav"],check=True)
json.dump({"fps":FPS,"total":round(t+1.2,3),"sentences":out},open(f"{PUB}/../src/timeline.json","w"),ensure_ascii=False,indent=1)
print("total",round(t,2))
