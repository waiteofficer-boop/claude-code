#!/usr/bin/env bash
# Analisa um vídeo (referência ou render) para comparar com o estilo:
#   - metadados (resolução, fps, duração)
#   - folhas de contato a 1 fps (4x4 por imagem)
#   - cortes secos (scene > 0.3)
#   - % de frames "parados" (diferença média < 0.15) -> câmera viva deve dar ~0 %
# Uso: analyze_reference.sh <video> [pasta_saida]
set -euo pipefail
V="$1"; OUT="${2:-./analysis}"
mkdir -p "$OUT"

echo "== Metadados"
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate \
  -of compact "$V"

echo "== Folhas de contato (1 fps) em $OUT"
ffmpeg -v error -y -i "$V" -vf "fps=1,scale=320:-1,tile=4x4" "$OUT/sheet_%02d.jpg"

echo "== Cortes secos (scene > 0.3)"
ffmpeg -v info -i "$V" -an -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 \
  | grep -o 'pts_time:[0-9.]*' | sed 's/pts_time:/  /' || echo "  nenhum"

echo "== Movimento quadro a quadro"
ffmpeg -v error -i "$V" -an \
  -vf "scale=320:-1,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=$OUT/diff.txt" \
  -f null -
grep -o 'YAVG=[0-9.]*' "$OUT/diff.txt" | cut -d= -f2 | awk '
  { n++; if ($1 < 0.15) still++; if ($1 > max) { max=$1; at=n } }
  END { printf "  frames: %d | parados: %.1f%% | maior salto no frame %d (%.2f)\n",
        n, 100*still/n, at, max }'
