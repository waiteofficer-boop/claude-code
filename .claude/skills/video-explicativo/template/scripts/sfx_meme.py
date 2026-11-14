import numpy as np, wave, sys
R=44100; out=sys.argv[1]; rng=np.random.default_rng(3)
def save(n,x,peak=0.9):
    x=x/(np.abs(x).max()+1e-9)*peak
    with wave.open(f"{out}/{n}.wav","w") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(R);w.writeframes((x*32767).astype(np.int16).tobytes())
def t(d): return np.arange(int(R*d))/R
def env(n,a,d):
    e=np.ones(n); A=max(1,int(R*a)); e[:A]=np.linspace(0,1,A); e[A:]=np.exp(-np.arange(n-A)/(R*d)); return e
def reson(x,f,q):
    r=np.exp(-np.pi*f/q/R); c=2*r*np.cos(2*np.pi*f/R); y=np.zeros_like(x)
    for i in range(2,len(x)): y[i]=x[i]+c*y[i-1]-r*r*y[i-2]
    return y
def brass(f,d):
    tt=t(d); ph=2*np.pi*f*tt*(1+0.004*np.sin(2*np.pi*5*tt))
    saw=sum(np.sin(k*ph)/k for k in range(1,18))
    return np.tanh(1.8*saw)*env(len(tt),0.02,d*0.5)
gap=lambda d: np.zeros(int(R*d))
# "dun dun duuun" dramático
save("dramatic", np.concatenate([brass(146.8,0.32),gap(0.03),brass(130.8,0.32),gap(0.03),brass(110,1.4)]))
# ronco (inspira/expira)
tt=t(2.6); n=rng.standard_normal(len(tt)); breath=np.clip(np.sin(2*np.pi*tt/1.3),0,1)**2
rumble=(np.sin(2*np.pi*np.cumsum(70+20*np.sin(2*np.pi*31*tt))/R)>0.3).astype(float)
save("snore", (reson(n,300,2)*0.6+reson(rumble,180,3))*breath, 0.7)
# mastigar (crocante)
y=np.zeros(int(R*1.6))
for i in range(8):
    s=int(R*(i*0.19+rng.uniform(0,0.02))); d=t(0.09)
    y[s:s+len(d)]+=reson(rng.standard_normal(len(d)),rng.uniform(1500,3500),2)*env(len(d),0.002,0.02)
save("chew", y, 0.7)
print("ok")
