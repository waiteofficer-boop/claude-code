# Especificação de movimento

Valores de partida para 25 fps (multiplique frames por 1,2 em 30 fps).
Ajuste a olho, mas não fuja muito: o estilo depende de movimento **suave e
constante**, nunca brusco, exceto nos 2–3 momentos de impacto.

## Câmera

Implemente uma única câmera (grupo pai) com `x, y, scale, rotation`.
Camadas de cenário são filhas com fator de parallax.

| Movimento | Duração | Valores | Easing |
|---|---|---|---|
| Drift de fundo (todo plano) | o plano inteiro | scale 1,00→1,04 **ou** x ±3 % da largura | linear ou sine in-out |
| Push-in em palavra-chave | 20–40 f | scale +10 a +25 %, centraliza no alvo | cubic in-out |
| Push-in de impacto ("VEM!", selo) | 8–12 f | scale +15 %, + shake 3–6 px por 6 f | expo out |
| Pull-back de revelação | 50–75 f | scale −15 a −25 % | cubic out |
| Pan de revelação | 30–60 f | 30–60 % da largura | cubic in-out |
| Tilt para o céu | 40–60 f | y 40–70 % da altura | cubic in-out |
| Transição (move + dissolve) | 10–25 f de crossfade dentro de um move de 30–50 f | — | crossfade linear, move cubic in |
| Tracking de personagem | contínuo | câmera segue x do personagem com atraso de 4–6 f | lerp 0,15/frame |

Fatores de parallax (deslocamento relativo ao da câmera):
céu/lua 0,1 · montanhas 0,25 · nuvens 0,4 · chão/meio 0,7 · personagem 1,0 ·
primeiro plano (mato, nuvem da frente, desfocado 6–10 px) 1,4.

## Personagens

| Animação | Valores |
|---|---|
| Respiração (idle) | tronco scaleY 1,000↔1,015, ciclo 60–80 f, sine |
| Balanço de cabeça | rotation ±2°, ciclo 90–120 f, defasado da respiração |
| Piscada | olho scaleY 1→0,1→1 em 4 f, a cada 50–100 f (aleatório) |
| Pop-in | scale 0→1,10 (6 f, back out) →1,00 (3 f) + opacity 0→1 (4 f) |
| Stagger de grupo | 4–6 f entre membros |
| Fantasma → revelado | saturação 0→100 %, opacity 0,5→1, glow 0→forte, 20–30 f |
| Asas (idle) | rotation ±8° em ciclo de 20 f, asa esquerda/direita espelhadas |
| Galope | ciclo de 12 f; corpo y ±12 px (2 picos por ciclo), pescoço ±4°, pernas em 4 poses chave interpoladas |
| Capa/cauda | segue o corpo com atraso de 2–3 f + ondulação (deformador de onda/puppet pins) |
| Braços que alcançam | entram pela borda em 15 f (cubic out), tremem ±2 px ao "tentar" |

## Efeitos

| Efeito | Valores |
|---|---|
| God rays | 8–14 feixes, opacity 15–30 %, rotação 3–6°/s, blend Add/Screen |
| Burst atrás de etiqueta | raios scale 0,6→1,0 + opacity 0→0,6→0,3 em 12 f |
| Glow sagrado | bloom raio 20–40 px, intensidade 1,5–2,5, cor creme #fff3d0 |
| Anel de destaque | stroke dourado 4–6 px desenhado 0→100 % em 15 f (trim path), depois pulso scale 1,00↔1,03 |
| Onda de choque (selo) | círculo stroke branco scale 0,2→3,0, opacity 1→0 em 12 f + partículas vermelhas |
| Clarão de relâmpago | exposure +150 % por 2 f, decai em 4 f; repetir 2× com ~25 f de intervalo |
| Rachadura/relâmpago | path dourado desenhado em 6–8 f com glow, flicker de opacity 2 f |
| Grão/papel | overlay 5–8 % opacity, textura animada a cada 2 f |
| Vinheta | radial, bordas −25 a −35 % de luminosidade |

## Texto

| Elemento | Entrada | Saída |
|---|---|---|
| Etiqueta de referência | pop-in + burst; segura até o fim da cena | fade 6 f |
| Rótulo branco | pop-in com rotação −3°→0 | junto com o plano |
| Título grande | fade 10 f + scale 0,95→1,00 | fade 10 f |
| Frase-cartão (2 linhas) | caixa slide 15 f; 2ª linha 10–15 f depois, dourada | fade |
| Legenda karaokê | palavra muda de cinza 50 % → branco em 2 f no timestamp; palavras-chave → dourado | troca de bloco a cada 4–7 palavras |
