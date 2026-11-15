# O Estopim — Sarajevo, 28 de junho de 1914

Documentário vertical (9:16, 1080×1920, 25 fps), com cerca de 2 min 10 s, sobre o atentado que desencadeou a Primeira Guerra Mundial.
Arquivo: `o-estopim-sarajevo-1914.mp4`.

**Estilo:** fotos de época em sépia escura com movimento de câmera (Ken Burns), anotações de caneta vermelha e recortes datilografados, uma **parede de investigação em 3D** (cortiça, alfinetes, barbantes vermelhos, iluminada por uma lanterna com sombras reais) e acabamento de filme antigo (borda escura pesada, granulado, cintilação, poeira, riscos de película, vazamento de luz).

## Créditos — incluir na descrição ao publicar

**Música:** Kevin MacLeod (incompetech.com), licença Creative Commons Attribution 4.0 (http://creativecommons.org/licenses/by/4.0/):
- "Lost Frontier"
- "Impending Boom"
- "Oppressive Gloom"
- "For the Fallen"

**Sons gravados:**
- "WWS Typewriter" e "Heartbeat speedsup", do Wikimedia Commons, licença CC BY 4.0.
- "Clock ticking", em domínio público.
- "typewriter-ding" (stubb), em CC0.
- Os demais efeitos são gerados por código (`sound_design.py`).

**Fotos:** Wikimedia Commons, em domínio público ou CC0. A lista com o arquivo de origem de cada uma está em `photos/credits.json`.
- *Le Petit Journal* (12/07/1914), *New York Times* (29/06/1914), telegrama da declaração de guerra (28/07/1914), mapa oficial do atentado (Arquivo do Estado da BiH);
- fotos do casal em Sarajevo, retratos, julgamento, Berlim em agosto de 1914 e trincheiras.

**Narração:** do usuário, gerada no ElevenLabs v3 com audio tags. Está em `narration/narracao_pt_elevenlabs.mp3` e foi alinhada pelo Whisper com 93 % de concordância.

## Por que não Splice

A Splice só libera sons para conta logada com créditos de assinatura, e a licença fica vinculada à conta de quem baixa. Se você tiver Splice, baixe os loops ou sons e coloque em `sfx/` ou `build/`; o motor já toca arquivos (`{k:'file'}` e `{k:'music'}`). Pixabay, Freesound e Musopen bloqueiam acesso automatizado deste ambiente.

## Fatos usados (conferidos)

- **Visita:** Sarajevo, 28/06/1914. O arquiduque Francisco Ferdinando, herdeiro da Áustria-Hungria, e Sofia, duquesa de Hohenberg.
- **Conspiradores:** jovens da Jovem Bósnia, armados com apoio da Mão Negra ("Unificação ou Morte"), liderada por Dragutin Dimitrijević, o "Apis".
- **10h10, a granada:** Nedeljko Čabrinović joga a granada no cais Appel. Ela ricocheteia no carro e explode sob o carro seguinte, com cerca de 20 feridos.
- **A fuga de Čabrinović:** ele toma cianeto vencido e pula no rio Miljacka, que tinha cerca de 13 cm de água.
- **A mudança de rota:** depois da prefeitura, o arquiduque decide ir ao hospital, mas o motorista não é avisado da nova rota. Na Ponte Latina, o carro entra na Rua Francisco José, para e engata a ré.
- **~10h50, os tiros:** Gavrilo Princip, de 19 anos, atira a cerca de 1,5 m. Sofia é atingida no abdômen e Francisco Ferdinando no pescoço; os dois morrem em minutos.
- **A foto famosa:** a foto da "prisão de Princip" mostra, segundo a identificação aceita hoje, Ferdinand Behr, um espectador.
- **A crise de julho:**
  - 28/07, a Áustria-Hungria declara guerra à Sérvia por telegrama;
  - 30–31/07, a Rússia se mobiliza;
  - 01/08, a Alemanha declara guerra à Rússia;
  - 03/08, a Alemanha declara guerra à França;
  - 04/08, a Alemanha invade a Bélgica e a Grã-Bretanha entra na guerra.
- **Mortos:** cerca de 20 milhões, entre militares e civis. As estimativas variam de 15 a 22 milhões.

## Como gerar de novo

```bash
npm i && pip install kokoro-onnx faster-whisper scipy soundfile
python3 build_voice.py script_pt.json <pasta_kokoro> build pm_alex+pm_santa 0.84 0.86   # ou: python3 align_recording.py script_pt.json minha_voz.mp3 build
node render.js frames 25 4            # gera também frames/sfx_events.json (efeitos + trilha)
python3 sound_design.py frames/sfx_events.json build/sfx.wav <duração>
python3 mix.py build/narration.wav build/sfx.wav build/mix_pt.m4a frames/sfx_events.json
ffmpeg -framerate 25 -i frames/f_%05d.jpg -i build/mix_pt.m4a -c:v libx264 -crf 23 -pix_fmt yuv420p -shortest o-estopim-sarajevo-1914.mp4
```
As trilhas precisam estar em `build/<Nome_Da_Faixa>.wav` (48 kHz), convertidas a partir de `music/*.mp3`.

## v2: câmera mais informativa e o drama dos tiros

- **Câmera viva:** cada foto tem várias etapas de movimento sincronizadas com palavras da narração, além de câmera na mão (deriva suave) e "socos" de zoom nas palavras-chave. Os cortes entram em chicote, com desfoque horizontal e deslocamento. São 24 planos.
- **Mais informação na tela:**
  - fichas de **dossiê** datilografadas: arquiduque, Sofia, Apis, Čabrinović, o motorista Leopold Lojka e Princip;
  - **chamadas** com linha apontando detalhes: Ordem do Tosão de Ouro, cais Appel, prefeitura, Ponte Latina;
  - a **linha do tempo da crise de julho** (28 jun → 4 ago), que se acende a cada declaração de guerra.
- **Os tiros:**
  - dois disparos com tremor e clarão vermelho sobre a ilustração;
  - **multidão gritando em pânico**, com vozes sintetizadas por formantes (`sound_design.voice`/`screams`) e o murmúrio crescendo;
  - um homem gritando no "Alguém grita";
  - os sons do mundo ficam abafados com zumbido no ouvido, e a narração continua limpa.
- **Gritos reais:** o Commons só tem o "Wilhelm Scream", um clichê cômico, ou gritos CC BY-SA, licença que contaminaria o vídeo. Para gritos realistas, gere no **ElevenLabs Sound Effects** e coloque em `sfx/` como `{k:'file'}`.

## v3: o que é dito aparece na tela

- **Mapa da Europa de 1914 animado** (`mapdata.js`). Os países atuais do Natural Earth (domínio público) foram agrupados nos impérios da época; é uma simplificação: a Polônia e a Ucrânia aparecem dentro da Rússia, e as fronteiras são aproximadas.
  - Sarajevo é marcada no início, na Bósnia anexada pela Áustria-Hungria.
  - O "império" da fala acende no mapa, com 52 milhões de habitantes.
  - Áustria-Hungria e Sérvia acendem quando são ditas.
  - A seta de "GUERRA" entre Áustria-Hungria e Sérvia aparece em 28/07.
  - O dominó segue a fala, um país por vez: a Rússia defende a Sérvia, a Alemanha declara guerra à Rússia e à França e invade a Bélgica, e a Grã-Bretanha entra.
  - Nas "alianças", aparecem os blocos, com os Impérios Centrais em vermelho e a Entente em azul.
  - Na "Europa", o continente inteiro acende e a câmera mergulha em Sarajevo com a faísca.
- **Sequência de fotos do arquiduque** no início: retrato, foto de família, chegada a Sarajevo, medalhas e o mapa do império.
- **Revisão frase a frase:**
  - armas ("6 bombas · 4 pistolas · cápsulas de cianeto");
  - o rio Miljacka no "rio quase seco";
  - "hospital militar" como novo destino;
  - o grito "motorista, errado!";
  - a foto famosa com círculo e depois a **comparação lado a lado** com o verdadeiro Princip ("NÃO É ELE");
  - "uma curva errada?" de volta ao mapa da rota.
- São 37 planos, e o mapa tem som próprio: golpe grave a cada país que acende, whoosh nas setas e explosões na invasão da Bélgica.
