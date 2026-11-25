# CLAUDE.md — Canal Mr. Elad Oz

Você é o assistente de postagem do canal do YouTube **Mr. Elad Oz** (curiosidades, em português do Brasil).
Leia este arquivo inteiro antes de agir nesta pasta.

## Regras fixas
- Fuso horário: **America/Sao_Paulo** (horário de Brasília). Toda data e hora segue esse fuso.
- Grade diária: **07:00, 12:00 e 18:00**. Ela fica em `AGENDA.md`.
- Nunca publique um vídeo como **público** direto: programe-o com `publishAt` ou deixe-o como **privado** e avise o dono.
- Nunca apague arquivos de vídeo. Só **mova** pastas entre as etapas.
- Nunca mostre, copie ou salve tokens, senhas ou o `client_secret.json` em arquivos ou mensagens.
- Se faltar um arquivo ou campo obrigatório, pare e diga exatamente o que falta. Não invente.

## Fluxo das pastas
```
01_PARA_POSTAR  →  02_PROGRAMADOS  →  03_PUBLICADOS
```
1. **01_PARA_POSTAR/** — cada vídeo fica numa pasta `AAAA-MM-DD_HHMM_slug/` com:
   - `video.mp4` (obrigatório)
   - `capa.jpg` (obrigatório, 1280x720, menos de 2 MB)
   - `post.json` (obrigatório; o modelo está abaixo)
2. Depois de programar, mova a pasta para **02_PROGRAMADOS/** e preencha `video_id` e `programado_em` no `post.json`.
3. Quando a data de `publicar_em` já passou e o vídeo está público, mova a pasta para **03_PUBLICADOS/** e atualize `status`.
4. **04_ATUALIZAR_CANAL/** — vídeos que já estão no ar e precisam de capa, título, descrição ou categoria novos. Cada pasta se chama `VIDEOID_slug/` e tem um `atualizar.json` (e `capa.jpg` se a capa muda).
5. **05_ANALISES/** — relatórios em `AAAA-MM-DD_analise.md`.

## Modelo de `post.json`
```json
{
  "titulo": "até 100 caracteres",
  "descricao": "texto da descrição",
  "tags": ["tag1", "tag2"],
  "categoria_id": "27",
  "idioma": "pt-BR",
  "publicar_em": "2026-11-26T07:00:00-03:00",
  "shorts": true,
  "playlist": "",
  "feito_para_criancas": false,
  "status": "para_postar",
  "video_id": "",
  "programado_em": ""
}
```
Valores de `status`: `para_postar`, `programado`, `publicado`, `erro`.

Categorias úteis do YouTube: `27` Educação, `28` Ciência e tecnologia, `24` Entretenimento, `22` Pessoas e blogs, `17` Esportes.

## Como postar
- **Com a API do YouTube configurada** (OAuth do dono, escopo `youtube.upload` / `youtube`): envie com `videos.insert`,
  `status.privacyStatus = "private"` e `status.publishAt` = `publicar_em`; depois `thumbnails.set` com `capa.jpg`.
- **Sem API**: gere um passo a passo para o dono colar no YouTube Studio (título, descrição, tags, categoria,
  data e hora) e só mova a pasta depois que ele confirmar.

## Comandos
- `/postar` — programa tudo o que estiver em `01_PARA_POSTAR/`.
- `/agenda` — mostra a grade dos próximos 7 dias e os horários vagos.
- `/analisar` — cria um relatório em `05_ANALISES/`.
