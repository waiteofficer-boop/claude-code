import numpy as np, wave, sys
R=44100; out=sys.argv[1]; L=float(sys.argv[2]); rng=np.random.default_rng(1)
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
BPM=96; beat=60/BPM; s16=beat/4
N=int(R*L); mix=np.zeros(N)
def put(x,at,g=1.0):
    i=int(at*R); j=min(N,i+len(x));
    if i<N: mix[i:j]+=x[:j-i]*g
# instrumentos
tz=t(0.45); zab=np.sin(2*np.pi*np.cumsum(70*np.exp(-tz*5)+48)/R)*env(len(tz),0.002,0.16)
tr=t(0.06); rim=reson(rng.standard_normal(len(tr)),900,4)*env(len(tr),0.001,0.02)
def tri(open_):
    d=0.5 if open_ else 0.07; tt=t(d)
    return sum(np.sin(2*np.pi*f*tt)*a for f,a in [(4200,1),(6100,.6),(7900,.4)])*env(len(tt),0.001,0.18 if open_ else 0.02)
def reed(freqs,d):
    tt=t(d); y=0
    for f in freqs:
        for det in (1,1.004):
            ph=(f*det*tt)%1; y=y+(np.where(ph<0.3,1,-0.43))
    y=reson(y,1400,1.2)*0.3+y*0.05
    return y*env(len(tt),0.03,d*2)*np.minimum(1,(d-tt)*8+0.0)
G=[196,246.9,293.7]; D=[146.8,185,220,293.7]; C=[130.8,164.8,196,261.6]; Em=[164.8,196,246.9]
prog=[G,G,D,D,C,C,D,G]
bars=int(L/(beat*4))+1
for b in range(bars):
    t0=b*beat*4
    # zabumba (baião): 1, "e" do 2 (dotted), 3 ... + bacalhau (rim) no contratempo
    for p,g in [(0,1),(1.5,0.8),(2,0.9),(3.5,0.7)]: put(zab,t0+p*beat,g)
    for p in [1,3]: put(rim,t0+p*beat,0.5)
    # triângulo: fechado/aberto em semicolcheias
    pat=[0,1,1,0, 0,1,1,0, 0,1,1,0, 0,1,1,0]
    for k,o in enumerate(pat): put(tri(o),t0+k*s16,0.12 if o else 0.08)
    # sanfona
    ch=prog[b%len(prog)]
    for p in [0,1.5,2,3]: put(reed(ch,beat*0.9),t0+p*beat,0.18)
fade=np.ones(N); fade[-int(R*2):]=np.linspace(1,0,int(R*2)); fade[:int(R*0.5)]=np.linspace(0,1,int(R*0.5))
save("baiao", np.tanh(mix*fade*1.2), 0.8)
# efeitos
tt=t(0.5); n=rng.standard_normal(len(tt)); y=np.zeros_like(n)
for s in range(0,len(n),441): y[s:s+441]=reson(n[s:s+441],600+2400*(s/len(n)),2)
save("flip", y*np.sin(np.pi*tt/0.5)**1.5)
tt=t(0.6); save("bang", np.tanh(3*(reson(rng.standard_normal(len(tt)),220,1.2)*env(len(tt),0.001,0.09)+0.4*np.sin(2*np.pi*55*tt)*env(len(tt),0.001,0.2))))
tt=t(3.0); n=rng.standard_normal(len(tt)); w=np.zeros_like(n)
for s in range(0,len(n),2205): w[s:s+2205]=reson(n[s:s+2205],500+300*np.sin(s/30000),3)
save("wind", w*np.sin(np.pi*tt/3.0), 0.6)
tt=t(0.35); save("carimbo", (np.sin(2*np.pi*80*tt)+0.6*reson(rng.standard_normal(len(tt)),400,2))*env(len(tt),0.001,0.06))
print("ok")
