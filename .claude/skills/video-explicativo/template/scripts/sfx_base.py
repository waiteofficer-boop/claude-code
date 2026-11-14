import numpy as np, wave, sys
R=44100; out=sys.argv[1]; rng=np.random.default_rng(7)
def save(n,x):
    x=x/ (np.abs(x).max()+1e-9)*0.9
    with wave.open(f"{out}/{n}.wav","w") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(R);w.writeframes((x*32767).astype(np.int16).tobytes())
def t(d): return np.arange(int(R*d))/R
def env(n,a,d):
    e=np.ones(n); A=int(R*a); e[:A]=np.linspace(0,1,A); e[A:]=np.exp(-np.arange(n-A)/(R*d)); return e
def reson(x,f,q):  # 2-pole resonator
    r=np.exp(-np.pi*f/q/R); c=2*r*np.cos(2*np.pi*f/R); y=np.zeros_like(x)
    for i in range(2,len(x)): y[i]=x[i]+c*y[i-1]-r*r*y[i-2]
    return y
# pop (bolinha): sine with fast upward sweep
tt=t(0.12); f=300+900*(1-np.exp(-tt*60)); ph=2*np.pi*np.cumsum(f)/R
save("pop", np.sin(ph)*env(len(tt),0.002,0.03))
# tick (palavra destacada)
tt=t(0.05); save("tick", (np.sin(2*np.pi*2400*tt)+0.4*rng.standard_normal(len(tt)))*env(len(tt),0.0005,0.008)*0.6)
# whoosh (troca de cena)
tt=t(0.45); n=rng.standard_normal(len(tt)); 
fc=np.linspace(400,3000,len(tt)); y=np.zeros_like(n)
for s in range(0,len(n),2205):  # piecewise resonator sweep
    seg=n[s:s+2205]; y[s:s+2205]=reson(seg,fc[s],2.5)
save("whoosh", y*np.sin(np.pi*tt/tt[-1])**2)
# stamp (carimbo)
tt=t(0.25); save("stamp", (np.sin(2*np.pi*90*tt)*1.2+reson(rng.standard_normal(len(tt)),300,3)*0.3)*env(len(tt),0.001,0.05))
# ding
tt=t(0.9); save("ding", (np.sin(2*np.pi*1318*tt)+0.5*np.sin(2*np.pi*2637*tt)+0.2*np.sin(2*np.pi*3951*tt))*env(len(tt),0.002,0.25))
# galinha
def cluck(d,f0,f1,vib=0):
    tt=t(d); f=np.linspace(f0,f1,len(tt))+vib*np.sin(2*np.pi*28*tt)
    ph=2*np.pi*np.cumsum(f)/R
    src=sum(np.sin(k*ph)/k for k in range(1,14)) + 0.25*rng.standard_normal(len(tt))
    y=reson(src,1100,4)+0.7*reson(src,2300,5)+0.3*reson(src,3500,6)
    return y*env(len(tt),0.006,d*0.35)
gap=lambda d: np.zeros(int(R*d))
save("cluck", cluck(0.11,620,430))
save("co", np.concatenate([cluck(0.09,600,450),gap(0.06),cluck(0.09,620,460)]))
seq=[cluck(0.09,600,450),gap(0.07),cluck(0.09,610,460),gap(0.07),cluck(0.09,600,450),gap(0.08)]
tt=t(0.42); f=np.interp(tt,[0,0.12,0.42],[650,950,600]); 
long=cluck(0.42,650,600,vib=40)
save("cacarejo", np.concatenate(seq+[long]))
print("ok")
