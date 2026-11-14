---
name: explainer-cutout-animation
description: Cria vídeos narrados no estilo "explainer bíblico/histórico" em animação 2D cut-out (bonecos recortados) — câmera virtual sempre em movimento, parallax, glow divino, etiquetas de referência em pergaminho e legenda karaokê. Use quando o usuário pedir para planejar, roteirizar, decupar, animar ou renderizar um vídeo nesse estilo (TikTok/Reels/Shorts/YouTube), ou para analisar um vídeo de referência parecido.
---

# Explainer cut-out animado (estilo "narrador + câmera viva")

Estilo extraído de um vídeo de referência de 58 s (1280×720, 25 fps) que explica o
1º selo do Apocalipse. A decupagem cena a cena está em
`references/breakdown.md`; os números de câmera/movimento em
`references/motion-spec.md`. Leia os dois antes de animar.

## A ideia em uma frase

**A narração manda em tudo**: cada frase da locução gera um *beat* visual
(um elemento entra, a câmera anda, uma palavra-chave vira etiqueta) e a câmera
**nunca fica parada** — ela deriva, empurra ou panoramiza o tempo todo, ligando
as cenas como se fosse um plano-sequência.

## Fluxo de trabalho

1. **Roteiro de locução** (pt-BR, falado, 2ª pessoa: "eu te mostro", "grava isso").
   Estrutura que funciona:
   - *Gancho* (0–8 s): um detalhe "que quase ninguém repara" mostrado num objeto (livro, mapa).
   - *Promessa*: "antes você precisa ver a cena comigo" → transição para o mundo.
   - *Contexto*: quem, onde, referência (ex.: João → Patmos → Ap 1:9).
   - *Conflito*: o problema ("ninguém conseguia abrir").
   - *Revelação*: o protagonista ("só um conseguiu: o Cordeiro") + frase-cartão ("QUEM ABRE: O CORDEIRO").
   - *Ação*: o evento principal (selo quebra → criatura grita "VEM!" → cavaleiro).
   - *Tensão/loop*: a polêmica ("o que mais divide") + split-screen com "?" para prender até o próximo vídeo.
2. **Decupagem**: quebre a locução em beats de 1,5–4 s. Para cada beat preencha:
   `tempo | texto falado | plano/câmera | elementos que entram | texto na tela | SFX`.
   Use o template em `references/breakdown.md` (seção "Template de decupagem").
3. **Assets** (ver "Direção de arte"): cenários em camadas separadas para parallax
   e personagens com partes soltas (cabeça, tronco, braços, pernas, capa, cauda).
4. **Animação**: aplique as receitas de `references/motion-spec.md`
   (drift de câmera, push-in, pop-in com overshoot, ciclo de galope, idle).
5. **Texto e legenda**: etiquetas e legenda karaokê sincronizadas palavra a palavra.
6. **Pós**: glow/bloom, raios de luz, grão de papel, vinheta, desfoque de
   primeiro plano; mix de VO + trilha + SFX.
7. **Verificação**: rode `scripts/analyze_reference.sh <video>` no seu render
   e compare a folha de contato com a referência (ritmo de cortes, movimento
   contínuo, frames sem câmera parada).

## Regras de câmera (resumo)

- **Sempre em movimento.** Drift lento (zoom 100→104 % e/ou pan de 2–4 % da
  largura) em todo plano "parado". Nunca um frame congelado por mais de ~0,5 s.
- **Push-in na palavra-chave.** Quando a locução diz o termo importante
  ("Cordeiro", "primeiro", "vem!"), a câmera empurra 10–25 % com ease-in-out.
- **Pan para revelar.** Novos elementos entram porque a câmera *anda até eles*
  (livro → janela; selo → trono; trono → criaturas).
- **Tilt para cima = céu/divino.** Ir da terra para o céu é um tilt/pan vertical.
- **Transições são movimento + dissolve**, não cortes secos: a câmera acelera
  num push/pan e um crossfade de 8–12 frames troca de cenário no meio do movimento.
  O impacto vem de luz, não de corte: clarões de relâmpago (frame quase branco
  por 2–3 frames) e onda de choque marcam os picos.
- **Split-screen** só no final, para comparação/pergunta.

## Regras de personagem (resumo)

- Animação **cut-out interpolada a cada frame** (não é "on twos"): movimento
  liso, tipo Moho/After Effects + Duik/Rubberhose.
- **Idle** sempre ligado: respiração (escala Y 100↔101,5 %), leve balanço de
  cabeça (±2°), piscadas a cada 2–4 s. Personagem parado = morto.
- **Entrada**: pop-in com escala 0→110→100 % em ~8 frames, ou fade de
  "fantasma" dessaturado → cor plena com glow (para o personagem sagrado).
- **Grupos entram escalonados** (stagger de 4–6 frames entre cada um).
- **Ação principal em ciclo**: galope em loop de ~12 frames com corpo subindo
  e descendo, capa e cauda com atraso (secondary motion), rider com contra-movimento.
- Personagens simples: cabeça grande, olhos de ponto, traço marrom-escuro,
  pouca anatomia; rostos neutros — a emoção vem da câmera, luz e música.

## Direção de arte (resumo)

- 2D vetorial chapado, **contorno marrom-escuro** (#2b1d16-ish), não preto puro.
- Paleta quente e dessaturada; cada ato tem uma cor dominante:
  interior marrom/âmbar → pôr-do-sol rosa/laranja → céu roxo-lavanda → deserto bege/lilás.
- Nuvens estilizadas em "carneirinho" com contorno, sempre derivando devagar.
- Elementos sagrados: **bloom forte**, halo circular, raios de luz (god rays)
  girando lentamente atrás.
- Hachura leve para sombra (ex.: no cavalo), grão/papel por cima de tudo,
  vinheta escura nas bordas.
- Profundidade: primeiro plano desfocado (mato seco, nuvens), meio nítido,
  fundo com montanhas lisas e sol/lua grande.

## Texto na tela

- **Etiqueta de referência** ("APOCALIPSE 6:2"): serifada em versalete
  (Cormorant SC / EB Garamond SC), cartão creme com borda marrom, canto superior,
  entra com pop + raios de luz atrás.
- **Rótulo de personagem/objeto** ("JOÃO", "UM ARCO", "UMA COROA", "7 SELOS"):
  cartão branco pequeno com borda preta, levemente inclinado (±3°), pop-in;
  vários rótulos empilham.
- **Frase-cartão** ("QUEM ABRE: / O CORDEIRO"): caixa escura translúcida,
  1ª linha branca, 2ª linha dourada entrando depois.
- **Título grande** ("VENCENDO E PRA VENCER", "1º SELO"): serifada grande,
  branca com glow, fade + leve scale-up.
- **Texto falado em itálico** pequeno junto ao elemento ("nem no céu", "nem na terra").
- **Legenda karaokê** inferior central, serifada branca com sombra;
  palavras ainda não ditas em cinza 50 %, a palavra atual acende;
  palavras-chave mudam para dourado (#e6b84a).
- Em 16:9 deixe ~12 % de margem segura embaixo/direita para a marca d'água da plataforma.

## Som

- Locução próxima e calma, ritmo de conversa (~150 palavras/min).
- Trilha orquestral/ambient baixa (-20 a -24 LUFS sob a voz), crescendo nas revelações.
- SFX em todo pop-in (tick/whoosh suave), selo quebrando (crack + impacto grave),
  trovão no "VEM!", galope, vento no deserto.

## Ferramentas

Qualquer ferramenta de cut-out serve. Recomendações:
- **After Effects** + Duik Ángela (rig) + plugins de glow (Deep Glow) — padrão de mercado.
- **Moho Pro** — rig de ossos e ciclos de caminhada/galope mais rápidos.
- **Código** (quando o usuário quer gerar por script): Motion Canvas ou Remotion
  com SVGs em camadas; implemente a câmera como um único `group` com
  `scale/position` animados e as camadas de parallax como filhos com fator de
  deslocamento (fundo 0,2 · meio 0,6 · frente 1,0 · primeiro plano desfocado 1,4).
- Legenda karaokê: gere timestamps por palavra com Whisper (`word_timestamps=True`)
  e anime opacidade/cor por palavra.

Ao entregar, inclua sempre: roteiro, decupagem em tabela, lista de assets
por camada, e o arquivo/projeto da animação (ou código) — e diga o que ficou
de fora (ex.: trilha licenciada, dublagem).
