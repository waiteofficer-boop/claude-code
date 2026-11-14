# A Parábola do Semeador — vídeo vertical (9:16)

| Versão | Arquivo | Voz | Áudio |
|---|---|---|---|
| Português | `parabola-do-semeador.mp4` (57,7 s) | Piper `pt_BR-faber-medium` (~171 Hz) | voz + trilha + SFX |
| Inglês | `parable-of-the-sower.mp4` (63,8 s) | Piper `en_US-norman-medium`, tom −14 % (~88 Hz, voz grossa) + reforço de graves | voz + SFX e ambiências (os efeitos abaixam quando a voz fala), **sem trilha** |
| Inglês, narrador idoso | `parable-of-the-sower_elder.mp4` (67,0 s) | Piper `en_US-norman-medium`, tom −13 % (~84 Hz), fala 28 % mais lenta, estilo `idoso` (tremor leve, rouquidão, menos brilho) | voz + SFX e ambiências, **sem trilha** |
| Inglês, só efeitos | `parable-of-the-sower_sfx-only.mp4` (63,0 s) | **sem voz** (a história vem pela legenda) | só SFX + ambiências: grilos e lamparina, ondas e multidão, vento e passos, aves, sol, espinhos, trigo, drone, batidas de coração |

Os roteiros ficam em `script_pt.json` e `script_en.json`. Cada um tem o texto da locução, os textos da tela (`strings`) e as palavras que disparam cada animação (`cues`).

Feito com a skill `explainer-cutout-animation`.
`parabola-do-semeador.mp4`: 1080×1920, 25 fps, 57,7 s, H.264 + AAC, loudness −14 LUFS.

## Roteiro (Mateus 13:1-9, 18-23)

| # | Locução |
|---|---|
| s1 | Nessa parábola, a semente é a mesma nos quatro lugares. |
| s2 | E quase ninguém repara nisso. |
| s3 | Mas antes, vem ver a cena comigo. |
| s4 | Jesus está num barco, na beira do mar da Galileia, e a multidão inteira está na praia. |
| s5 | E ele começa assim: |
| s6 | O semeador saiu a semear. |
| s7 | Uma parte caiu à beira do caminho, e as aves vieram e comeram. |
| s8 | Outra caiu em pedregais. Brotou rápido, mas quando o sol saiu, secou, porque não tinha raiz. |
| s9 | Outra caiu entre espinhos, e os espinhos cresceram e a sufocaram. |
| s10 | E outra caiu em boa terra, e deu fruto: cem, sessenta e trinta por um. |
| s11 | Depois, o próprio Jesus explica: a semente é a Palavra. |
| s12 | O caminho é quem ouve e não entende. A pedra é quem recebe com alegria, mas não tem raiz. Os espinhos são as preocupações e a ilusão das riquezas. |
| s13 | E a boa terra é quem ouve, entende, e dá fruto. |
| s14 | Então a pergunta não é se a semente é boa. |
| s15 | É: que tipo de chão está o seu coração hoje? |

## Decupagem

| Tempo | Cena | Câmera | Entradas / animação | Texto na tela |
|---|---|---|---|---|
| 0–7,8 s | **A · Livro à noite** | Close no livro (zoom 1,85), afasta até mostrar a mesa, a lamparina e a janela, depois aproxima até a lua | Lupa passa pelas 4 vinhetas e a semente de cada uma acende; raios de luz; chama tremula | MATEUS 13 · "A MESMA SEMENTE" · "4 LUGARES" · *— quase ninguém repara —* |
| 7,8–13,6 s | **B · Mar da Galileia** | Fusão vindo do zoom anterior e afastamento; aproxima em Jesus em "começa assim" | Barco balança; Jesus parado com halo suave; multidão entra uma pessoa de cada vez; ondas e nuvens se movem | "JESUS" · *mar da Galileia* · MATEUS 13:1-2 |
| 13,6–34,5 s | **D · O campo** | A câmera acompanha o semeador e passa pelos 4 solos; aproxima na raiz | Semeador anda e lança sementes. **Caminho:** aves descem e comem. **Pedregais:** broto cresce rápido, o sol esquenta e ele murcha; corte mostrando a rocha. **Espinhos:** espinhos crescem e a tela escurece. **Boa terra:** trigo dourado, brilho e raios de luz | Título "O SEMEADOR SAIU A SEMEAR" · MATEUS 13:3 / 13:4 / 13:5-7 / 13:8 · rótulos dos solos · *sem raiz* · 100× / 60× / 30× |
| 34,5–37,9 s | **E · A Palavra** | Aproxima quando ouve "Palavra" | A semente brilhando explode e vira um livro aberto; um anel dourado se desenha em volta | MATEUS 13:19 · "A SEMENTE: / A PALAVRA" |
| 37,9–51,0 s | **F · 4 corações** | A câmera desce de painel em painel e termina com zoom na boa terra | 4 painéis entram um de cada vez; o painel ativo ganha borda dourada e os outros escurecem | MATEUS 13:18-23 · NÃO ENTENDE / SEM RAIZ / PREOCUPAÇÕES / DÁ FRUTO · "QUEM OUVE, ENTENDE E DÁ FRUTO" |
| 51,0–53,3 s | **G1 · Tela dividida** | Aproximação lenta | Em cima, trigo; embaixo, chão seco com espinhos; a semente cai na linha que divide as duas | "A SEMENTE É BOA" |
| 53,3–57,7 s | **G2 · Coração** | Afasta e depois aproxima devagar | Coração de terra; a semente cai nele; ele pulsa e brilha; aparece um "?" | "QUE CHÃO É / O SEU CORAÇÃO?" |

## Camadas de assets (todas desenhadas em código no `index.html`)

- **Fundo (parallax 0,03–0,3):** céu em gradiente, sol ou lua com brilho, nuvens contornadas e colinas.
- **Meio (0,6):** campos com árvores; mar com ondas.
- **Ação (1,0):** personagens montados com partes soltas (`person`: braços, pernas, cabeça, barba, véu, bolsa, faixa na cintura) e os solos (`rock`, `sprout`, `thorn`, `wheat`, `seed`, `bird`).
- **Primeiro plano (1,35–1,4):** tufos de mato desfocados.
- **Tela (não acompanha a câmera):** etiquetas, cartões, títulos, legenda karaokê, barras de progresso, vinheta e granulado.

## Como gerar de novo

```bash
pip install piper-tts numpy
# voz: pt_BR-faber-medium (.onnx + .onnx.json) de huggingface.co/rhasspy/piper-voices
python3 build_audio.py script_pt.json pt_BR-faber-medium.onnx build          # narração, trilha, timeline_pt.js
# inglês, voz grossa:   python3 build_audio.py script_en.json en_US-norman-medium.onnx build_en 0.86
# inglês, voz de idoso: python3 build_audio.py script_en.json en_US-norman-medium.onnx build_en 0.87 1.28 idoso
# (o timeline_en.js salvo no repositório é o da versão com voz de idoso)
node render.js frames 25 4                                     # VLANG=en para a versão em inglês (~3 min)
python3 build_audio.py --sfx frames/sfx_events.json build/sfx.wav 57.641
ffmpeg -i build/narration.wav -i build/music.wav -i build/sfx.wav -filter_complex \
  "[0:a]highpass=f=70,asplit=2[vo][key];[1:a]volume=0.55[m];[2:a]volume=0.8[fx];[m][key]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=400[md];[md][vo][fx]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map "[a]" -c:a aac -b:a 192k build/mix.m4a
ffmpeg -framerate 25 -i frames/f_%05d.jpg -i build/mix.m4a -c:v libx264 -crf 19 -pix_fmt yuv420p -shortest parabola-do-semeador.mp4
```

Para mudar o texto, edite `script_<idioma>.json` e rode tudo de novo: as cenas se ajustam ao tempo das palavras.
Para ver a animação ao vivo, abra `index.html?lang=pt` ou `index.html?lang=en` no navegador e clique para tocar o áudio.
Para a versão sem trilha, mixe só `narration.wav` e `sfx.wav`. Para a versão só com efeitos, use apenas `sfx.wav` (normalizado em −16 LUFS).

## Limitações

- **Voz:** é sintética (Piper, local). Para publicar, troque `build/narration.wav` por uma locução gravada e ajuste os tempos no `timeline.json` (por exemplo, com Whisper e timestamps por palavra).
- **Legenda karaokê:** o tempo de cada palavra é estimado pelo tamanho dela dentro da frase, então pode atrasar ou adiantar um pouco.
- **Trilha e efeitos sonoros:** são sintetizados em código, simples e sem problema de licença.
- **Fontes:** Cormorant SC e EB Garamond, ambas com licença OFL.
