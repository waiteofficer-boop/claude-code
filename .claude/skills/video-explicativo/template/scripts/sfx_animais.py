import numpy as np, wave, sys
R=44100; out=sys.argv[1]; rng=np.random.default_rng(5)
def save(n,x):
    x=x/(np.abs(x).max()+1e-9)*0.9
    with wave.open(f"{out}/{n}.wav","w") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(R);w.writeframes((x*32767).astype(np.int16).tobytes())
def t(d): return np.arange(int(R*d))/R
def env(n,a,d):
    e=np.ones(n); A=max(1,int(R*a)); e[:A]=np.linspace(0,1,A); e[A:]=np.exp(-np.arange(n-A)/(R*d)); return e
def reson(x,f,q):
    r=np.exp(-np.pi*f/q/R); c=2*r*np.cos(2*np.pi*f/R); y=np.zeros_like(x)
    for i in range(2,len(x)): y[i]=x[i]+c*y[i-1]-r*r*y[i-2]
    return y
def grunt(d,f0,f1):
    tt=t(d); f=np.interp(tt,[0,d*0.3,d],[f0,f1,f0*0.8])
    ph=2*np.pi*np.cumsum(f)/R
    pulses=(np.sin(ph)>0.6).astype(float)              # som pulsado (nasal)
    src=pulses+0.35*rng.standard_normal(len(tt))
    y=reson(src,420,5)+0.8*reson(src,900,6)+0.3*reson(src,2200,8)
    am=0.6+0.4*np.sin(2*np.pi*38*tt)
    return y*am*np.sin(np.pi*tt/d)**0.6
gap=lambda d: np.zeros(int(R*d))
save("oink", np.concatenate([grunt(0.22,140,210),gap(0.07),grunt(0.17,150,190)]))
save("grunt", grunt(0.2,120,160))
# splash (lama)
tt=t(0.6); n=rng.standard_normal(len(tt))
y=reson(n,350,1.5)*env(len(tt),0.003,0.12)
for k in range(9):
    s=int(R*rng.uniform(0.05,0.4)); bt=t(rng.uniform(0.03,0.06)); fq=rng.uniform(300,900)
    b=np.sin(2*np.pi*np.cumsum(fq*(1+bt*8))/R)*np.sin(np.pi*bt/bt[-1])*0.4
    y[s:s+len(b)]+=b[:len(y)-s]
save("splash",y)
# gota
tt=t(0.12); f=900+2200*(tt/tt[-1])**0.5; save("drip", np.sin(2*np.pi*np.cumsum(f)/R)*env(len(tt),0.002,0.04))
# fita colando foto
tt=t(0.28); n=rng.standard_normal(len(tt)); y=np.zeros_like(n)
for s in range(0,len(n),441): y[s:s+441]=reson(n[s:s+441],2000+1500*np.sin(s/2000),3)*rng.uniform(0.3,1)
save("tape", y*env(len(tt),0.01,0.09))
print("ok")
