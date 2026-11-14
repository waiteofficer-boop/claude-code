---
name: video-explicativo
description: Cria vídeos verticais (9:16, Shorts/TikTok/Reels) de curiosidade explicada, com animação em código (Remotion), narração por IA, letreiros animados, câmera passando por uma folha de papel e efeitos sonoros sintetizados. Use quando o usuário pedir "faz um vídeo nesse estilo", der um tema de curiosidade ("por que a galinha cacareja", "sabia que os porcos não suam?") ou quiser outro vídeo no mesmo formato.
---

# Vídeo explicativo animado (estilo "papel + letreiros")

Pipeline 100% local, sem programas de edição. Dois exemplos completos e funcionais:

- `template/src/exemplo-galinha.jsx`: "Por que a galinha cacareja depois de botar ovo?" (paleta padrão, personagem animado, ovo com física).
- `template/src/exemplo-porcos-marca.jsx`: "Sabia que os porcos não suam?" (paleta de marca azul/amarelo, fotos coladas no papel, gráficos animados, letreiro em tarjas, memes).
- `template/src/exemplo-porcos-ytpbr.jsx`: a mesma versão mesclada com estilo **YTPBR** (YouTube Poop Brasil) e voz neural. **É a versão mais recente e a base padrão.**

Copie o exemplo mais próximo para `src/<nome>.jsx` e troque cenas, letreiros, câmera e sons.

## Regras de estilo (pedidas pelo usuário, não quebrar)

1. **Sem legenda transcrevendo a fala.** Usar **letreiros**: textos curtos que fazem parte da animação (linha pequena em caixa alta em cima + frase grande com a palavra-chave destacada). Ex.: `['HIPÓTESE 1', 'despistar *predadores*']`.
2. **Sem cabeçalho, sem rodapé, sem barra/linha horizontal de progresso, sem linha vertical lateral e sem bolinha/avatar fixo.**
3. **Um estilo visual só do começo ao fim.** Não mudar a cor do fundo por cena, sem cena escura no meio, a menos que o usuário peça.
4. **Bounce suave.** Springs com damping ~18–20, entrada com escala 0.82–0.85 → 1 e deslocamento ≤ 22px. Nada de elástico exagerado.
5. **Câmera "passando pelo papel".** Todas as cenas ficam desenhadas numa folha grande (posições em `OFF`). Dentro da cena a câmera faz zoom/pan suave (`camKeys`). Na troca de cena ela desliza pela folha até a próxima, afastando ~34% e inclinando ~2.5° no meio do caminho (`canvasCam`). Textura de papel e grade quadriculada no mesmo layer da câmera.
6. **Personagens animados.** Piscar, balançar a cabeça, bater asas quando falam ou cacarejam, agachar antes de "botar"/soltar algo.
7. **Objetos com física.** Ex.: ovo caindo com gravidade, amassando no impacto, quique pequeno e sombra (`FallingEgg`).
8. **Efeito sonoro em tudo que aparece:** pop em 4 tons nas bolinhas e cards, `popk` na palavra-chave, `whoosh` na passagem de cena, `hit`/`stamp` em impactos, `ding`/`sparkle` em conclusões, `type` em listas e sons do personagem (ex.: `cacarejo`, `co`, `cluck`).
9. **Gancho de curiosidade** nos 3 primeiros segundos e promessa curta ("me dá X segundos"), depois etapas numeradas (etiqueta azul "01 Título" + contador "01 / 05") e fechamento com pergunta para comentar.
10. **Paleta:** padrão é fundo papel claro + azul `#2c5bd8`. Se o usuário der uma marca, extraia a paleta da imagem e aplique em tudo (fundo, destaques, etiquetas, letreiros), mantendo o mesmo estilo de animação. Letreiro "de marca": tarja amarela com texto azul (frase curta) + tarja azul com texto branco em caixa alta (Montserrat 900), palavra-chave em amarelo, as tarjas entram com wipe da esquerda.
11. **Fotos e gráficos** quando pedidos: fotos como recortes colados (borda branca, fita amarela, zoom lento); gráficos SVG animados com a fonte escrita no card.
12. **Volume:** pops/bolinhas BAIXOS (o usuário reclamou): o `add()` do exemplo YTPBR já multiplica pops e `popk` por 0.35. Som do personagem/animal em toda cena (ex.: `snort`, `grunt`, `oink`, `oink_hi`, `squeal`, `laugh`).
13. **Mistura YTPBR** (quando pedir meme/caos): gaguejada no áudio (`~palavra` no roteiro → "su-su-su-suando") com zoom de soco a cada repetição; "imagem frita" (contraste/saturação estourados + vinheta vermelha + emoji 🤨😳💀🗿) com `boom`; `<Freeze>` + inversão de cor + `scratch` na virada; meme entra esticando com `boing`; `airhorn` no perigo. Usar 3–5 momentos, não o vídeo inteiro (lista `FX`).
14. **Memes** quando pedidos: foto engraçada de licença livre do bicho do tema com texto clássico de meme (Anton, branco com contorno preto, em cima e embaixo), entra com `hit` por ~1,5–2,5 s num momento de piada e sai antes da próxima informação (`MEMES` no exemplo dos porcos). Nunca usar personagens com direitos autorais (ex.: Peppa) nem templates de meme com pessoas reais.

## Voz

- **Padrão: voz neural** `pt-BR-AntonioNeural` (edge-tts, `+12%`), bem menos robótica que a Piper. `scripts/tts.py` já aponta o edge-tts para o CA do proxy (`/root/.ccr/ca-bundle.crt`), sem desligar a verificação. `scripts/narracao_neural.py <tts.py> pt-BR-AntonioNeural +12% roteiro.json public/<nome>/voz.wav src/timeline-<nome>.json` gera voz, tempo real de cada palavra (`wAt(i,'palavra')`), gaguejadas (`stutters`) e corta o silêncio do fim de cada frase.
- Outras vozes: `pt-BR-FranciscaNeural`, `pt-BR-ThalitaMultilingualNeural`. Piper (`narracao.py`) fica como alternativa offline.

## Setup (sessão nova)

```bash
P=<scratchpad>/studio && mkdir -p $P/src $P/public/sfx && cp -r .claude/skills/video-explicativo/template/* $P/
cd $P && npm i --silent
pip install -q faster-whisper yt-dlp piper-tts edge-tts
mkdir -p $P/voice && cd $P/voice && for f in pt_BR-faber-medium.onnx pt_BR-faber-medium.onnx.json; do curl -sSL -o $f "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/$f"; done
for s in sfx_base sfx_extra sfx_animais sfx_ytpbr; do python3 -I $P/scripts/$s.py $P/public/sfx; done
```

- Navegador para renderizar: `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell` (veja `ls /opt/pw-browsers`).
- `faster-whisper`: o `av` instalado não aceita `metadata_errors`; converta o áudio com ffmpeg para PCM 16k mono e passe o array numpy.

## Fluxo

1. **Pesquisar o tema** (WebSearch) e só afirmar o que tem fonte. Se a ciência não tem resposta fechada, dizer "hipóteses".
2. **Roteiro** em frases curtas, cada uma com o id da cena, num JSON (veja `scripts/roteiro-exemplo-porcos.json`; `*palavra*` marca destaque). Rodar `python3 -I scripts/narracao.py <voz.onnx> roteiro.json public/<nome>/voz.wav src/timeline-<nome>.json` → gera a voz e o tempo de cada frase (imprime o índice e o início de cada frase para usar em `sAt(i)`).
3. **Cenas**: um componente por cena (`SceneXxx`), posicionado em coordenadas 1080×1920; elementos entram com `<Pop at={frame}>`. Use `sAt(i)` (início da frase i) para sincronizar com a fala.
4. **Letreiros** em `LETS`, **câmera** em `camKeys` + `OFF`, **sons** em `buildSfx`.
5. **Prévia antes do render completo**: renderize quadros soltos (`npx remotion still ... --frame=N --scale=0.3`) e junte com `ffmpeg ... tile=6x2` para revisar. Corrija sobreposições e cortes.
6. **Render completo em segundo plano** (`run_in_background`): `npx remotion render src/<nome>.jsx <Id> out/video.mp4 --crf=22 --browser-executable=...` (~3 min para 50 s).
7. Confira duração e alguns quadros com ffmpeg e envie o MP4 com SendUserFile.

## Fotos e gráficos

- Fotos só de fontes com licença livre. A API do Openverse funciona sem chave: `curl -s -A "edu-video-script/1.0" "https://api.openverse.org/v1/images/?q=<termo>&license=cc0,pdm,by&page_size=12"` (campos `url`, `license`, `creator`). As do USDA no Flickr são domínio público. Baixe numa pasta própria, monte uma folha de contato com ffmpeg para escolher, copie para `public/img/` e passe os créditos ao usuário. A API da Wikimedia costuma bloquear (429) por IP compartilhado.
- Fotos entram como "recortes colados no papel" (borda branca, sombra, leve rotação) e podem ter zoom lento (Ken Burns).
- Gráficos animados em SVG (barras crescendo, linha desenhando), só com números que tenham fonte.

## Referências do YouTube

- `yt-dlp --flat-playlist --print "%(title)s | %(channel)s | %(view_count)s | %(url)s" "ytsearch8:<termo>"` funciona para pesquisar. O download de vídeo costuma ser bloqueado ("Sign in to confirm you're not a bot"): não contornar; usar miniaturas `https://i.ytimg.com/vi/<id>/hqdefault.jpg` + conhecimento do estilo, ou pedir para o usuário enviar o arquivo.

## Pendências comuns

- Voz Piper é um pouco robótica; ofereça trocar por gravação do usuário (sincronizar com faster-whisper) ou ElevenLabs (precisa de chave).
- Música de fundo: só se o usuário fornecer uma trilha livre.
