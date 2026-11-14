# uso: python3 -I lupa.py <foto> <saida_prefixo> <aspecto w/h> <cx> <cy> <raio(fração da largura)> <força> [níveis]
import sys, subprocess, json, numpy as np
src, outp, asp, cx, cy, rad, k = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:8])
L = int(sys.argv[8]) if len(sys.argv) > 8 else 16
info = json.loads(subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',src],capture_output=True,check=True).stdout)['streams'][0]
W0, H0 = info['width'], info['height']
# recorte central no aspecto de exibição (igual object-fit: cover)
if W0 / H0 > asp: cw, ch = int(H0 * asp), H0
else: cw, ch = W0, int(W0 / asp)
x0, y0 = (W0 - cw) // 2, (H0 - ch) // 2
raw = subprocess.run(['ffmpeg','-v','error','-i',src,'-vf',f'crop={cw}:{ch}:{x0}:{y0}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True,check=True).stdout
img = np.frombuffer(raw, np.uint8).reshape(ch, cw, 3).astype(np.float32)
H, W = ch, cw; R = rad * W; Cx, Cy = cx * W, cy * H
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dx, dy = xx - Cx, yy - Cy; r = np.sqrt(dx*dx + dy*dy) / R
fall = np.where(r < 1, np.clip(1 - r*r, 0, 1) ** 1.6, 0)
def bilinear(sx, sy):
    sx = np.clip(sx, 0, W - 1.001); sy = np.clip(sy, 0, H - 1.001)
    x0i, y0i = sx.astype(int), sy.astype(int); fx, fy = (sx - x0i)[..., None], (sy - y0i)[..., None]
    a = img[y0i, x0i]; b = img[y0i, x0i + 1]; c = img[y0i + 1, x0i]; d = img[y0i + 1, x0i + 1]
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy
for i in range(L):
    s = k * i / (L - 1)
    m = 1 - s * fall                        # <1 perto do centro = amplia (lente)
    out = bilinear(Cx + dx * m, Cy + dy * m).clip(0, 255).astype(np.uint8)
    subprocess.run(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-i','-','-q:v','3',f'{outp}-{i:02d}.jpg'],input=out.tobytes(),check=True)
print(W, H, L)
