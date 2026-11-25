---
description: Programa os vídeos de 01_PARA_POSTAR no YouTube
---
Siga o CLAUDE.md desta pasta.

1. Liste as pastas de `01_PARA_POSTAR/` em ordem de nome.
2. Em cada uma, confira se existem `video.mp4`, `capa.jpg` e um `post.json` válido. Confira também se `publicar_em` está no futuro e cai em 07:00, 12:00 ou 18:00 (horário de Brasília). Se algo falhar, anote o erro e pule a pasta.
3. Antes de enviar, mostre uma tabela (pasta, título, data e hora) e peça confirmação.
4. Programe cada vídeo como manda a seção "Como postar" do CLAUDE.md (privado com `publishAt`, depois a capa).
5. Preencha `video_id`, `programado_em` e `status: "programado"` no `post.json` e mova a pasta para `02_PROGRAMADOS/`.
6. Atualize `AGENDA.md` e termine com um resumo: programados, com erro e o que falta.

$ARGUMENTS
