# Pearl Harbor — The Last Minutes (vídeo vertical 9:16)

| Versão | Arquivo | Duração | Planos | Voz |
|---|---|---|---|---|
| **Português** (com bloco de armamentos) | `pearl-harbor-ultimos-minutos.mp4` | 2 min 17 s | **33** | Piper `pt_BR-cadu-medium`, tom −18 % (~111 Hz), fala 15 % mais lenta, estilo `sabio` |
| Inglês | `pearl-harbor-last-minutes.mp4` | 1 min 14 s | 23 | Piper `en_US-norman-medium`, estilo `sabio` (~107 Hz) |

Os dois roteiros ficam em `script_pt.json` e `script_en.json`, com a fala, os textos da tela (`strings`) e as palavras que disparam cada animação (`cues`). O motor é o mesmo: `index.html?lang=pt` ou `?lang=en`, e no render use `VLANG=pt|en`.

## Novidades da versão em português

- **Sem barras de progresso no topo.**
- **Kamikazes:** a fala "também não eram kamikazes" vem com um plano 2D de "KAMIKAZE?" riscado e uma linha do tempo de dezembro de 1941 a outubro de 1944. Os ataques suicidas organizados só começaram em outubro de 1944. Em Pearl Harbor, os aviões atacavam e voltavam ao porta-aviões.
- **Aviões refeitos:**
  - fuselagem torneada (LatheGeometry), asas e cauda com perfil afunilado e ponta arredondada;
  - capota de vidro com armação, hélice de 3 pás com disco de movimento, escapamentos e antena;
  - pintura em textura com linhas de painel, rebites, desgaste e manchas de escapamento, mais hinomarus e código de cauda (AI-102 etc.);
  - material com brilho especular, **luz principal quente com sombras suaves e luz de contorno fria**;
  - o Val tem trem fixo com carenagem e freios de mergulho.
- **Luz de explosões e telas em quem está perto:**
  - **Zero:** uma luz pontual pisca na asa a cada rajada;
  - **explosão na Ilha Ford (3D, novo):** bola de fogo, luz pontual laranja que ilumina hangares e encouraçados, reflexo na água, fumaça subindo e tremor de câmera;
  - **reação (2D, novo):** close de um marinheiro com o rosto iluminado de laranja pelo lado da explosão e em sombra do outro, com brilho nos olhos, cintilação do fogo e uma segunda explosão;
  - **artilheiro do Ward:** iluminado pelo clarão do canhão, com a luz decaindo aos poucos;
  - **operador do radar:** rosto verde pela tela do osciloscópio.

A técnica de luz 2D (`litFigure`) recorta um gradiente radial pela silhueta (blend *screen*) e escurece o lado oposto (blend *multiply*).

## Bloco de armamentos (só na versão em português, entre as 6h00 e as 6h45)

Em 1941 **não existiam mísseis**. O vídeo começa esse bloco corrigindo isso e depois detalha a 1ª onda, com 183 aviões:

| Plano | Técnica | O que mostra |
|---|---|---|
| "MÍSSEIS?" riscado | 2D | Em 1941 as armas eram torpedos, bombas e metralhadoras (um ícone para cada) |
| **A6M Zero** · caça · ×43 | 3D | Câmera faz um arco em volta; disparos com traçantes dos **2 canhões de 20 mm** (nas asas) e das **2 metralhadoras de 7,7 mm** (sobre o motor) |
| **D3A Val** · bombardeiro de mergulho · ×51 | 3D | Entra em mergulho; **trem de pouso fixo**; o **braço** gira a **bomba de 250 kg** para longe da hélice antes de soltá-la |
| **B5N Kate** · torpedeiro · ×40 | 3D | Voo rasante; solta o **torpedo Tipo 91**, que bate na água e segue com rastro |
| Torpedo em corte | 2D | **Aletas de madeira**: sem elas o torpedo afunda na **lama** de um porto com **~12 m de fundo**; com elas, nivela e segue |
| **B5N Kate** · bombardeiro · ×49 | 3D | Formação em altitude com a **bomba perfurante de 800 kg** sob a fuselagem |
| Projétil → bomba | 2D | A bomba de 800 kg foi feita a partir de um **projétil naval de 41 cm**, de canhão de encouraçado |

Totais da 1ª onda: 43 Zeros + 51 Vals + 40 Kates com torpedo + 49 Kates com bomba = **183**.

Efeitos sonoros do bloco: impacto no "mísseis", rajadas dos canhões e metralhadoras, ronco do mergulho, clique e assobio da bomba, splash do torpedo.

Na versão em português, as distâncias estão em km (≈ 370 km e ~210 km) e o relógio usa o formato 06h45. Os documentos reais, a mensagem do Ward e a "AIR RAID PEARL HARBOR X THIS IS NOT DRILL", continuam no original em inglês, e a narração traduz.

`pearl-harbor-last-minutes.mp4`: 1080×1920, 25 fps, 74,5 s, em inglês.
O áudio tem narração com voz de idoso sábio (Piper `en_US-norman-medium`, tom +6 %, fala 20 % mais lenta, estilo `sabio`) e efeitos sonoros. Não tem música.

O vídeo tem **23 planos** e mistura três técnicas no mesmo motor (`index.html`):
- **3D:** three.js com sombreamento "toon" (cores em faixas chapadas) e contorno marrom, para combinar com o estilo cut-out.
- **2.5D:** camadas 2D pintadas em canvas e posicionadas em profundidade dentro do 3D. Como a câmera é real, o parallax também é real.
- **2D:** cenas chapadas em SVG.

## Roteiro e decupagem (horário do Havaí, 7/12/1941)

| # | Tempo | Técnica | Plano e câmera | Locução / texto na tela |
|---|---|---|---|---|
| 1 | 0,0 s | 3D | Oceano à noite com lua; a câmera avança rente às ondas e sobe | "December seventh, 1941" · título DECEMBER 7 / 1941 |
| 2 | 3,8 s | 2.5D | Oahu à noite: montanhas, luzes do porto, palmeiras. A câmera avança e sobe | "A quiet Sunday morning in Hawaii" · OAHU, HAWAII |
| 3 | 6,6 s | 2.5D | Caça-minas cruzando a entrada do porto; a câmera acompanha de lado | relógio **3:42 AM** |
| 4 | 9,0 s | 2D | Visão pelo binóculo, com tremor de câmera na mão; periscópio deixando rastro | *a periscope?* |
| 5 | 12,7 s | 2D | Mapa: zoom dos porta-aviões até Oahu, com linha tracejada | ≈ 230 MILES |
| 6 | 14,1 s | 3D | Seis porta-aviões virando contra o vento; a câmera gira em volta | 6 CARRIERS |
| 7 | 18,0 s | 3D | Câmera baixa no convés; aviões decolam passando pela câmera; tripulante sinalizando | relógio **6:00 AM** |
| 8 | 20,8 s | 3D | Formação de 45 aviões vindo em direção à câmera, que recua e inclina | 183 PLANES |
| 9 | 23,5 s | 2.5D | Destroyer Ward ao amanhecer e torre do minissubmarino | relógio **6:45 AM** · USS WARD |
| 10 | 26,0 s | 2D | Canhão do Ward: dois disparos com clarão, tremor e coice | — |
| 11 | 28,1 s | 2.5D | Coluna de água, anéis na superfície e torre afundando | THE FIRST AMERICAN SHOTS / OF THE PACIFIC WAR |
| 12 | 30,9 s | 2D | Teletipo datilografando a mensagem real do Ward (06:53) | *…and nobody hurries* |
| 13 | 33,2 s | 3D | Radar de Opana girando no morro ao nascer do sol; a câmera faz um arco em volta | relógio **7:02 AM** · OPANA POINT RADAR |
| 14 | 36,5 s | 2D | Osciloscópio: o pico ("blip") cresce, com zoom | 50+ PLANES · ~130 MILES |
| 15 | 42,1 s | 2.5D | Centro de informações: mapa de plotagem e oficial ao telefone; a câmera desliza de lado | EXPECTED: B-17s FROM CALIFORNIA |
| 16 | 46,7 s | 2D | Telefone sendo colocado no gancho | "DON'T WORRY / ABOUT IT." |
| 17 | 49,1 s | 3D | Acima das nuvens, ao lado da formação; a costa de Oahu aparece | relógio **7:40 AM** |
| 18 | 52,2 s | 3D | Vista aérea do porto: Ford Island e os 8 encouraçados; a câmera desce e se aproxima | BATTLESHIP ROW |
| 19 | 55,6 s | 2.5D | Câmera baixa no convés: marinheiros, depois sobe até a bandeira de 48 estrelas tremulando | MORNING COLORS · 8:00 |
| 20 | 58,9 s | 2D | Cabine do avião: piloto, porto visto pelo para-brisa, mão no telégrafo | relógio **7:49 AM** · *to… to… to…* · ATTACK |
| 21 | 61,9 s | 2D | "TORA!" três vezes, com ondas de rádio e tremor | *surprise achieved* |
| 22 | 64,3 s | 3D | Câmera atrás de três aviões em mergulho sobre o porto | relógio **7:55 AM** |
| 23 | 66,1 s | 2D | Mensagem naval sendo datilografada: AIR RAID PEARL HARBOR X THIS IS NOT DRILL | relógio **7:58 AM** · fade para preto |

O relógio no topo é o fio condutor do vídeo: ele aparece com um "pop" a cada horário citado e o ponteiro de segundos fica correndo.

**Efeitos sonoros**, todos gerados em código: ondas, grilos, motor do caça-minas, vento, motores radiais, dois tiros de canhão, splash, teletipo, zumbido e "ping" do radar, telefone, clique do gancho, corneta, Morse, três impactos no "Tora", ronco de mergulho, sirene e o tique-taque do relógio. O volume dos efeitos abaixa sozinho quando a voz fala.

## Precisão histórica

Os horários são os aceitos pela historiografia:
- 3h42: o caça-minas Condor avista um periscópio.
- 6h00: decolagem da 1ª onda, com 183 aviões.
- 6h45: o destroyer Ward atira contra o minissubmarino.
- 7h02: o radar de Opana detecta os aviões.
- 7h40: os aviões chegam à costa de Oahu.
- 7h49: sinal de ataque ("to, to, to").
- 7h53: "Tora, Tora, Tora".
- 7h55: início do ataque.
- 7h58: a mensagem "AIR RAID PEARL HARBOR X THIS IS NOT DRILL".

A distância da frota varia entre as fontes, por isso aparece como ≈ 230 milhas. A frase "Don't worry about it" é a resposta atribuída ao tenente Kermit Tyler.

**O que é simplificado:**
- O ataque começou com a frase "Tora" às 7h53, um pouco antes das 7h55. Na narração as duas coisas aparecem juntas.
- Os modelos de navios e aviões são estilizados, não são réplicas.
- O vídeo termina no início do ataque, de propósito, sem mostrar destruição nem mortes.

## Como gerar de novo

```bash
npm i                      # three@0.149.0 (tem o build three.min.js, que funciona via file://)
pip install piper-tts numpy
python3 build_audio.py script_pt.json pt_BR-cadu-medium.onnx build 0.82 1.15 sabio      # português
python3 build_audio.py script_en.json en_US-norman-medium.onnx build 1.06 1.2 sabio   # inglês
VLANG=pt node render.js frames 25 4                       # ~4 min; RANGE=t0,t1 re-renderiza só um trecho
python3 build_audio.py --sfx frames/sfx_events.json build/sfx.wav <duração>
# mixagem: narração + SFX com sidechain (ver comando no histórico do README da parábola) → build/mix_en.m4a
ffmpeg -framerate 25 -i frames/f_%05d.jpg -i build/mix_en.m4a -c:v libx264 -crf 19 -pix_fmt yuv420p -shortest pearl-harbor-last-minutes.mp4
```

Para ver ao vivo, abra o `index.html` num navegador (depois do `npm i`) e clique para tocar o áudio.
