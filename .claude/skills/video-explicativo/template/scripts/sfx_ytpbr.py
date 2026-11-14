import numpy as np, wave, sys
R=44100; out=sys.argv[1]; rng=np.random.default_rng(9)
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
def reverb(x,dec=0.5):
    y=x.copy()
    for dl,g in [(0.029,.5),(0.037,.45),(0.051,.4),(0.067,.35),(0.083,.3),(0.11,.25)]:
        k=int(dl*R); z=np.zeros_like(y); z[k:]=y[:-k]*g*dec*2; y=y+z
    return y
# vine boom
tt=t(1.6); f=95*np.exp(-tt*3)+42; ph=2*np.pi*np.cumsum(f)/R
x=(np.sin(ph)+0.5*np.sin(2*ph)+0.25*np.tanh(3*np.sin(ph)))*env(len(tt),0.004,0.45)
x[:int(R*0.03)]+=reson(rng.standard_normal(int(R*0.03)),200,1.5)*0.6
save("boom", np.tanh(reverb(x)*1.5))
# buzina (airhorn)
tt=t(0.9); y=0
for fq in [466,587,698]:
    ph=2*np.pi*np.cumsum(fq*(1+0.006*np.sin(2*np.pi*6*tt)))/R
    y=y+ (2*((ph/(2*np.pi))%1)-1)
y=reson(y,1200,2)+0.5*y
save("airhorn", np.tanh(y*env(len(tt),0.02,0.6)*np.where(tt<0.75,1,np.exp(-(tt-0.75)*30))*2))
# arranhão de disco
tt=t(0.45); fc=np.interp(tt,[0,0.15,0.3,0.45],[300,2200,500,1600]); n=rng.standard_normal(len(tt)); y=np.zeros_like(n)
for s in range(0,len(n),220): y[s:s+220]=reson(n[s:s+220],fc[s],6)
save("scratch", y*np.sin(np.pi*tt/tt[-1]))
# boing
tt=t(0.6); f=180+120*np.sin(2*np.pi*14*tt)*np.exp(-tt*4)+tt*200
save("boing", np.sin(2*np.pi*np.cumsum(f)/R)*env(len(tt),0.003,0.25))
# sons de porco
def grunt(d,f0,f1,form=(420,900,2200),pulse=0.6,am=38):
    tt=t(d); f=np.interp(tt,[0,d*0.3,d],[f0,f1,f0*0.8]); ph=2*np.pi*np.cumsum(f)/R
    src=(np.sin(ph)>pulse).astype(float)+0.35*rng.standard_normal(len(tt))
    y=reson(src,form[0],5)+0.8*reson(src,form[1],6)+0.3*reson(src,form[2],8)
    return y*(0.6+0.4*np.sin(2*np.pi*am*tt))*np.sin(np.pi*tt/d)**0.6
gap=lambda d: np.zeros(int(R*d))
save("squeal", grunt(0.7,700,1300,(1400,2600,4200),0.2,60))
tt=t(0.25); save("snort", reson(rng.standard_normal(len(tt)),500,3)*(0.5+0.5*np.sin(2*np.pi*25*tt))*np.sin(np.pi*tt/0.25))
save("oink_hi", np.concatenate([grunt(0.16,260,360,(700,1400,3000)),gap(0.05),grunt(0.13,280,340,(700,1400,3000))]))
save("laugh", np.concatenate(sum([[grunt(0.11,200+i*25,260+i*30,(600,1300,2800)),gap(0.05)] for i in range(6)],[])))
print("ok")
