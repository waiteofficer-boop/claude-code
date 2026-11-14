---
name: video-explicativo
description: Cria vídeos verticais (9:16, Shorts/TikTok/Reels) de curiosidade explicada, com animação em código (Remotion), narração por IA, letreiros animados, câmera passando por uma folha de papel e efeitos sonoros sintetizados. Use quando o usuário pedir "faz um vídeo nesse estilo", der um tema de curiosidade ("por que a galinha cacareja", "sabia que os porcos não suam?") ou quiser outro vídeo no mesmo formato.
---

# Vídeo explicativo animado (estilo "papel + letreiros")

Pipeline 100% local, sem programas de edição. Exemplo completo e funcional: `template/src/exemplo-galinha.jsx` (vídeo "Por que a galinha cacareja depois de botar ovo?"). Copie-o e troque cenas, letreiros, câmera e sons.

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
10. **Paleta:** padrão é fundo papel claro + azul `#2c5bd8`. Se o usuário der uma marca, extraia a paleta da imagem e aplique em tudo (fundo, destaques, etiquetas, letreiros), mantendo o mesmo estilo de animação.

## Setup (sessão nova)

```bash
P=<scratchpad>/studio && mkdir -p $P/src $P/public/sfx && cp -r .claude/skills/video-explicativo/template/* $P/
cd $P && npm i --silent
pip install -q faster-whisper yt-dlp piper-tts
mkdir -p $P/voice && cd $P/voice && for f in pt_BR-faber-medium.onnx pt_BR-faber-medium.onnx.json; do curl -sSL -o $f "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/$f"; done
python3 -I $P/scripts/sfx_base.py $P/public/sfx && python3 -I $P/scripts/sfx_extra.py $P/public/sfx
```

- Navegador para renderizar: `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell` (veja `ls /opt/pw-browsers`).
- `faster-whisper`: o `av` instalado não aceita `metadata_errors`; converta o áudio com ffmpeg para PCM 16k mono e passe o array numpy.

## Fluxo

1. **Pesquisar o tema** (WebSearch) e só afirmar o que tem fonte. Se a ciência não tem resposta fechada, dizer "hipóteses".
2. **Roteiro** em frases curtas, cada uma com o id da cena: editar a lista `S` em `scripts/narracao.py` (`*palavra*` marca destaque). Rodar `python3 -I scripts/narracao.py <voz.onnx> <studio>/public` → gera `public/voz.wav` e `src/timeline.json` com o tempo de cada frase.
3. **Cenas**: um componente por cena (`SceneXxx`), posicionado em coordenadas 1080×1920; elementos entram com `<Pop at={frame}>`. Use `sAt(i)` (início da frase i) para sincronizar com a fala.
4. **Letreiros** em `LETS`, **câmera** em `camKeys` + `OFF`, **sons** em `buildSfx`.
5. **Prévia antes do render completo**: renderize quadros soltos (`npx remotion still ... --frame=N --scale=0.3`) e junte com `ffmpeg ... tile=6x2` para revisar. Corrija sobreposições e cortes.
6. **Render completo em segundo plano** (`run_in_background`): `npx remotion render src/index.jsx <Id> out/video.mp4 --crf=22 --browser-executable=...` (~3 min para 50 s).
7. Confira duração e alguns quadros com ffmpeg e envie o MP4 com SendUserFile.

## Fotos e gráficos

- Fotos só de fontes com licença livre (Openverse/Wikimedia: CC0, domínio público ou CC BY com crédito). Guarde em `public/img/` e anote a licença; dê os créditos ao usuário.
- Fotos entram como "recortes colados no papel" (borda branca, sombra, leve rotação) e podem ter zoom lento (Ken Burns).
- Gráficos animados em SVG (barras crescendo, linha desenhando), só com números que tenham fonte.

## Pendências comuns

- Voz Piper é um pouco robótica; ofereça trocar por gravação do usuário (sincronizar com faster-whisper) ou ElevenLabs (precisa de chave).
- Música de fundo: só se o usuário fornecer uma trilha livre.
