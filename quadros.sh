#!/usr/bin/env bash
set -e

# ========================================
# Fatia um vídeo em quadros WebP para a rolagem (canvas + GSAP ScrollTrigger).
#
# Uso:    ./quadros.sh <video> <nome-do-exemplo> [foco]
# Ex.:    ./quadros.sh videos/testeinicial.mp4 testeinicial
#         ./quadros.sh videos/outro.mp4 outro 0.35
#
# Gera em public/<nome-do-exemplo>/quadros/:
#   d/0001.webp ...  deitado, 1280 px de largura (computador e celular deitado)
#   c/0001.webp ...  em pé, recorte na altura toda (celular em pé). Padrão 3:4; PROPORCAO muda.
#   info.json        total de quadros e tamanhos (a página lê este arquivo)
#
# foco: onde fica o centro do recorte em pé, de 0 (esquerda) a 1 (direita). Padrão 0.5.
# QUALIDADE=70 ./quadros.sh ...  muda a qualidade do WebP (padrão 60).
# PROPORCAO=1 ./quadros.sh ...    largura/altura do recorte em pé (padrão 0.75 = 3:4; 1 = quadrado).
#
# Usa o ffmpeg em container (a máquina não tem ffmpeg instalado).
# ========================================

VIDEO=$1
NOME=$2
FOCO=${3:-0.5}
QUALIDADE=${QUALIDADE:-60}
PROPORCAO=${PROPORCAO:-0.75}
IMAGEM=linuxserver/ffmpeg:latest

if [[ -z "$VIDEO" || -z "$NOME" || ! -f "$VIDEO" ]]; then
  echo "Uso: ./quadros.sh <video> <nome-do-exemplo> [foco 0..1]"
  exit 1
fi

AQUI="$(cd "$(dirname "$0")" && pwd)"
ENTRADA="$(cd "$(dirname "$VIDEO")" && pwd)"
ARQUIVO="$(basename "$VIDEO")"
SAIDA="$AQUI/public/$NOME/quadros"

rm -rf "$SAIDA"
mkdir -p "$SAIDA/d" "$SAIDA/c"

ffmpeg() {
  docker run --rm --user "$(id -u):$(id -g)" \
    -v "$ENTRADA":/entrada:ro -v "$SAIDA":/saida \
    --entrypoint ffmpeg "$IMAGEM" -hide_banner -loglevel error -y "$@"
}

echo "Deitado (1280 px)..."
ffmpeg -i "/entrada/$ARQUIVO" -an -vf "scale=1280:-2:flags=lanczos" \
  -c:v libwebp -quality "$QUALIDADE" -compression_level 6 -start_number 1 /saida/d/%04d.webp

echo "Em pé (largura/altura $PROPORCAO, foco $FOCO)..."
ffmpeg -i "/entrada/$ARQUIVO" -an \
  -vf "crop=trunc(ih*$PROPORCAO/2)*2:ih:(iw-ow)*$FOCO:0,scale=-2:'min(ih,960)':flags=lanczos" \
  -c:v libwebp -quality "$QUALIDADE" -compression_level 6 -start_number 1 /saida/c/%04d.webp

TOTAL=$(ls "$SAIDA/d" | wc -l)
echo "{ \"total\": $TOTAL }" > "$SAIDA/info.json"

echo "Pronto: $TOTAL quadros em public/$NOME/quadros"
du -sh "$SAIDA/d" "$SAIDA/c"
