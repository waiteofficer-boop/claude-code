# Decupagem do vídeo de referência

Arquivo: 57,8 s · 1280×720 · 25 fps · AAC estéreo 44,1 kHz · publicado no TikTok.
Medição de movimento quadro a quadro: a diferença entre frames nunca zera
→ câmera e personagens interpolados a cada frame (sem "hold" de animação).
Detecção de cena com limiar 0,3 não achou nenhum corte seco: tudo é ligado
por movimento de câmera + dissolve.

| Tempo | Locução (resumo) | Câmera | O que se move / entra | Texto na tela |
|---|---|---|---|---|
| 0–2 s | "…se repete nos quatro… e que quase ninguém repara" | Close num livro aberto, lupa deslizando sobre a fileira de 7 selos | Lupa varre da direita p/ esquerda; ilustrações de 4 cavalos na página esquerda | 3 barras de progresso no topo; frase pequena em serifa no topo |
| 2–4 s | "Quando você enxerga ela, o capítulo inteiro muda de cara" | Pull-back lento revelando escrivaninha, lamparina, janela com lua | God rays surgem atrás do livro e giram devagar | — |
| 4–8 s | "Eu te mostro daqui a pouco, porque antes você precisa…" | Drift contínuo (zoom out leve + pan p/ direita) | Pena entra no canto inferior direito; chama da lamparina tremula | — |
| 8–10 s | "…ver a cena comigo" | **Push-in + pan para a direita** até a fileira de selos e a janela/lua | Livro passa pela tela; estrelas cintilam | — |
| 10–11 s | (transição) | Crossfade *durante* o movimento: livro → ilha | Mar ondula, nuvens derivam, aves | — |
| 11–14 s | "Quem está contando é João, que foi parar numa ilha chamada Patmos por causa da…" | Plano geral com drift lento; leve push-in | João no rochedo com idle (respira, balança); espuma no pé da rocha | Rótulo "JOÃO" pop-in sobre a cabeça; cartão-mapa "PATMOS" pop-in canto sup. direito |
| 14–15 s | "…palavra" | Mantém | Raios de luz explodem atrás da etiqueta | "APOCALIPSE 1:9" (cartão creme, versalete) |
| 15–20 s | "E lá ele vê, no céu, um livro em forma de rolo, fechado com sete selos" | **Tilt para cima**: João desce para o canto inferior, céu roxo ocupa a tela | Rolo com 7 selos vermelhos desce; brilho forte cresce atrás | "7 SELOS" rótulo inclinado |
| 20–23 s | "…que ninguém conseguia abrir, nem no céu, nem na terra" | Leve push-in no rolo | Braços brilhantes entram pelos lados tentando alcançar; depois braços sobem de baixo | Itálicos "nem no céu", "nem na terra"; anel de luz pulsa no rolo |
| 23–26 s | "Só um conseguiu: o Cordeiro" | Dissolve para o trono nas nuvens; drift | Cordeiro entra como **fantasma cinza** e ganha cor + glow quando o nome é dito | "Cordeiro" em dourado na legenda |
| 26–29 s | "Então grava isso, porque vai fazer toda a diferença lá no final" | Push-in lento no Cordeiro | **Anel dourado se desenha** em volta do Cordeiro; raios giram | "APOCALIPSE 5" com burst |
| 29–33 s | "Quem abre cada selo dessa história é o Cordeiro" | Mantém | Caixa escura entra pela direita | "QUEM ABRE:" → depois "O CORDEIRO" em dourado |
| 33–35 s | "Ele abre o primeiro" | **Push-in forte** até close no rolo desenrolado (selos numerados 1–7) | Selo 1 racha e **explode** com onda de choque circular (pico de movimento em 35,3 s) | — |
| 35–37 s | (continua) | Drift curto, depois dissolve para o trono | — | "1º SELO" título grande com glow |
| 37–40 s | "Uma das quatro criaturas que ficam em volta do trono…" | Plano do trono, drift | 4 criaturas aladas fazem **pop-in escalonado** (1 de cada vez); asas em idle | "APOCALIPSE 6:1" |
| 40–42 s | "…grita com voz de trovão:" | **Push-in** em 2 criaturas | **Dois clarões de relâmpago** (41,3 s e 42,3 s — os maiores picos de diferença do vídeo, ~25× o normal), raio desenhado no fundo | etiqueta some no 1º clarão |
| 42–43 s | "vem!" | Mantém | Criatura abre a boca | "VEM!" grande serifado junto à boca, com glow |
| 43–48 s | "E sai um cavalo branco. O cavaleiro tem um arco na mão, recebe uma coroa…" | Câmera acompanha o cavalo (tracking) com **parallax**: mato desfocado na frente passa rápido, montanhas devagar | Ciclo de galope; capa e cauda tremulando com atraso; contorno brilhante no cavaleiro | "APOCALIPSE 6:2", "UM ARCO", "UMA COROA" empilhados; coroa dourada surge na cabeça com brilho |
| 48–51 s | "…e sai vencendo e pra vencer" | Leve push-in | Galope continua | "VENCENDO / E PRA VENCER" título grande translúcido |
| 51–56 s | "E aqui eu preciso ser honesto com você, porque esse é o cavaleiro que mais divide quem estuda a Bíblia" | Plano geral; cavaleiro pequeno no céu dentro de halo; dois grupos de encapuzados com livros | Rachadura dourada nasce no chão entre os grupos; livros acendem | "O QUE MAIS DIVIDE" cartão branco |
| 56–58 s | "Tem gente séria que vê nele o próprio Cristo, já…" | **Split-screen** vertical: céu claro × cidade escura em ruína com "?" | Nuvens derivam; "?" pulsa | "Cristo" em dourado; termina em aberto (gancho p/ parte 2) |

## Ritmo

- ~14 beats visuais em 58 s → um beat novo a cada **~4 s**, e algum elemento
  novo (rótulo, glow, partícula) a cada **1,5–2 s**.
- Cada troca de mundo acontece numa *frase de transição* da locução
  ("ver a cena comigo", "e lá ele vê", "e sai…").
- O "momento uau" (selo explodindo → relâmpagos → "VEM!") está em ~60–75 % do vídeo.
- Só ~2,4 % dos frames são "parados" (diferença < 0,15): câmera viva de verdade.

## Template de decupagem

```
| # | Tempo | Locução | Plano/câmera (início → fim, easing) | Camadas visíveis | Entradas/animação | Texto na tela | SFX |
|---|-------|---------|-------------------------------------|------------------|-------------------|---------------|-----|
| 1 | 0:00–0:02 | … | close livro, drift zoom 100→103% linear | bg mesa, livro, lupa | lupa desliza x 70%→30% easeInOut | "…" topo | papel |
```
