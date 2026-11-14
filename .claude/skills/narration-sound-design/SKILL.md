---
name: narration-sound-design
description: Áudio de vídeos narrados (explainers, documentários curtos, TikTok/Reels/Shorts) feito localmente e sem samples licenciados — voz neural (Kokoro) com tom ajustado por rubberband, tempo exato de cada palavra via Whisper para legenda karaokê e animação, design de som procedural em camadas (convolução, Doppler, estéreo), mesa com níveis-alvo, ducking e masterização em -14 LUFS. Use quando o usuário pedir para melhorar o áudio, trocar/gerar narração, sincronizar legenda com a fala, criar efeitos sonoros ou mixar/masterizar um vídeo.
---

# Narração + design de som (pipeline local)

Implementação de referência: `videos/pearl-harbor/` → `build_voice.py`, `sound_design.py`, `mix.py`.

## 1. Voz

1. **Motor:** Kokoro (`pip install kokoro-onnx`; modelos `kokoro-v1.0.onnx` + `voices-v1.0.bin` nos releases de `thewh1teagle/kokoro-onnx`). Vozes PT-BR: `pm_alex`, `pm_santa` (masc.), `pf_dora` (fem.). Misture estilos tirando a média dos vetores (`np.mean([k.get_voice_style(a), k.get_voice_style(b)], 0)`).
   - Piper só como plano B: soa mais robótico e o Whisper entende ~20 pontos a menos.
2. **Ritmo e tom:** `speed` 0,85–0,9 para narrador calmo. Para envelhecer/engrossar, **rubberband com formantes preservados** (`rubberband=pitch=0.82:formant=preserved`) — não use `asetrate`/vibrato, que deixam a voz robótica.
   - Alvos de tom (mediana F0): homem adulto ~120–140 Hz; "senhor sábio" ~105–118 Hz; abaixo de ~90 Hz soa grave demais (o usuário reclamou).
3. **Cadeia de voz (ffmpeg):** highpass 70 Hz → +2,5 dB @160 Hz (calor) → −1,5 dB @320 Hz (tira o "embolado") → +2 dB @3,2 kHz (presença) → `deesser` → compressor 2,5:1.
4. **Pronúncia de nomes estrangeiros** — nunca confie no TTS; verifique com o Whisper (passo 2) e corrija por segmento:
   - `"say"`: grafia fonética só para a voz (a legenda continua usando `"text"`). Ex.: Kate → "Kêit", Pearl Harbor → "Pérl Rárbor".
   - Reescrever a frase às vezes resolve (Oahu isolado sai "ao AU"; "à ilha de Oahu" sai certo).
   - `"phonemes"`: IPA direto (`k.create(..., is_phonemes=True)`) quando o espeak erra a vogal. Ex.: "Tora" → `tˈoɾa` (o espeak gera `tˈɔɾæ`, que soa "Torres").
   - Para palavras de outra língua, valide transcrevendo com o Whisper **naquela língua** (ex.: `language='ja'` → とら).

## 1b. Narração gravada pelo usuário (ou feita em outro serviço)

Prefira sempre a voz que o usuário trouxer. `align_recording.py roteiro.json gravacao.mp3 saida` transcreve o arquivo inteiro com Whisper (com o roteiro como `initial_prompt`), alinha as palavras ao roteiro e imprime as divergências (concordância esperada > 0,9). Não reprocesse a voz além de um passa-altas de 60 Hz. Depois, renderize de novo: os tempos mudam.

## 2. Tempo de cada palavra (legenda karaokê e animações)

- `faster-whisper` modelo `small`, `compute_type='int8'`, `word_timestamps=True`, `language=` do roteiro.
- Passe o áudio como array 16 kHz (`resample_poly`) — a versão do PyAV daqui quebra ao abrir arquivo.
- **Alinhe** as palavras do roteiro às do Whisper com `difflib.SequenceMatcher` sobre palavras normalizadas (sem acento/pontuação); palavras que o Whisper escreve diferente (números: "6 e 45") recebem tempo interpolado pelo tamanho entre os vizinhos alinhados.
- Imprima "ouvido: …" por segmento — é o seu ouvido para revisar pronúncia.

## 3. Design de som procedural

Cada som é **camadas** (transiente + corpo + cauda), não um bip:

| Som | Receita |
|---|---|
| Canhão / explosão | estalo de ruído branco passa-altas (τ 12 ms) + seno com queda de pitch 55→32 Hz + ruído marrom grave, saturação `tanh`, reverb "água" com ecos discretos |
| Motor radial | pulsos de combustão: frequência = rpm/60 × cilindros/2 (~155 Hz), 13 harmônicos com fase/amp aleatória, AM da hélice (pás × rpm), vários aviões desafinados ±3 %, pan aleatório |
| Avião passando / mergulho | `doppler()`: atraso r/c, ganho 1/r, passa-baixas longe; pan segue a posição |
| Ondas / vento | rosa/marrom filtrado + envelope de ondulação; quebras ocasionais; L/R descorrelacionados |
| Sirene antiaérea | rotor com harmônicos 1-2-3-5, sobe/desce em ~5 s, reverb ar livre forte |
| Rajada | 16 tiros a 68 ms: ruído banda 0,6–6 kHz + soco grave, saturação, eco |
| Telefone antigo | sinos 1020/1375/2830 Hz × martelo a 20 Hz |
| Corneta | aditivo com vibrato entrando aos 300 ms + filtro de formante 0,4–3,5 kHz |
| Relógio | bloco de madeira 2,1 + 3,4 kHz, τ 12 ms, bem baixo |

**Espaço:** reverb por convolução com IR sintética estéreo (`ir()`: ruído com decaimento exponencial + reflexões discretas). Use `room` (interiores), `outdoor` (ecos de colinas), `water` (ecos curtos sobre o mar), `hall` (golpes de título).

## 3b. Efeitos de processamento por trecho (eventos `fx_*` → `mix.py`)

- `fx_phone`: fala ao telefone (banda 300–3400 Hz e saturação).
- `fx_radio`: rádio ou mensagem transmitida (banda 450–2800 Hz, saturação e estática).
- `fx_shock`: depois de uma explosão perto do personagem, os sons do mundo ficam abafados (passa-baixas que volta aos poucos), com zumbido de ~6 kHz. A narração não é afetada.
- Confira medindo a energia acima de 4 kHz no trecho: deve cair 15 dB ou mais em relação à voz normal.

## 4. Mesa (níveis-alvo antes do master)

Normalize **ambiências por RMS** e **golpes por pico** — senão um canhão sai 14 dB acima e o vento some.

- Ambiências (dBFS RMS): mar −27, vento −30, motores −27, sirene −29, grilos −33, zumbidos −37, room tone −42.
- Golpes (dBFS pico): canhão −2, impacto −4, rajada −5, splash −8, corneta −9, telefone −13, pops −21, relógio −32.
- Voz a −20 dBFS RMS. **Ducking** por envelope da voz (ataque 40 ms, soltura 450 ms, até −9 dB): a ação "respira" entre as frases.

## 5. Master

`alimiter` (−1 dB) → `loudnorm I=-14:TP=-1.5:LRA=11` → AAC 256 kbps 48 kHz. Confira com `ebur128=peak=true` (alvo −14 LUFS ±1).

## Verificação (sempre)

1. Nível de cada tipo de som isolado (RMS/pico) antes de mixar.
2. Voz × efeitos por cena (dB) — efeitos contínuos devem ficar ≥ 4 dB abaixo da voz depois do ducking.
3. Loudness integrada e pico real.
4. Whisper "ouvindo" a narração final.
5. Diga ao usuário o que é sintético (voz e efeitos) e ofereça trocar por gravação real.
