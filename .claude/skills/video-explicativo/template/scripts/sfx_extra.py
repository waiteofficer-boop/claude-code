import numpy as np, wave, sys
R=44100; out=sys.argv[1]; rng=np.random.default_rng(11)
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
# pop variants (bolinhas com tons diferentes)
for name,(a,b) in {"pop_a":(260,1000),"pop_b":(340,1250),"pop_c":(220,820),"pop_d":(420,1500),"popk":(500,1900)}.items():
    tt=t(0.11); f=a+b*(1-np.exp(-tt*70)); ph=2*np.pi*np.cumsum(f)/R
    save(name,(np.sin(ph)+0.15*np.sin(2*ph))*env(len(tt),0.0015,0.028))
# whip (chicote de câmera)
tt=t(0.22); n=rng.standard_normal(len(tt)); y=np.zeros_like(n); fc=np.linspace(5000,700,len(tt))
for s in range(0,len(n),441): y[s:s+441]=reson(n[s:s+441],fc[s],3)
save("whip", y*np.sin(np.pi*tt/tt[-1])**3)
# hit (impacto grave)
tt=t(0.5); f=110*np.exp(-tt*6)+45; ph=2*np.pi*np.cumsum(f)/R
save("hit",(np.sin(ph)+0.3*reson(rng.standard_normal(len(tt)),180,2)*np.exp(-tt*40))*env(len(tt),0.002,0.14))
# sparkle (brilho)
y=np.zeros(int(R*0.9))
for i,fq in enumerate([2093,2637,3136,4186,3520]):
    s=int(R*i*0.07); tt=t(0.4); y[s:s+len(tt)]+=np.sin(2*np.pi*fq*tt)*env(len(tt),0.002,0.08)
save("sparkle",y)
# type (digitação)
y=np.zeros(int(R*0.35))
for i in range(5):
    s=int(R*(i*0.06+rng.uniform(0,0.015))); tt=t(0.03)
    y[s:s+len(tt)]+=reson(rng.standard_normal(len(tt)),rng.uniform(1800,3200),8)*env(len(tt),0.0005,0.006)
save("type",y)
# bubble (bolha d'água)
tt=t(0.09); f=600+1400*tt/tt[-1]; ph=2*np.pi*np.cumsum(f)/R
save("bubble",np.sin(ph)*np.sin(np.pi*tt/tt[-1]))
print("ok")
