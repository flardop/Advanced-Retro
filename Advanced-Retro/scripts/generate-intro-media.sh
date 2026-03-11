#!/usr/bin/env bash
set -euo pipefail

# Genera assets multimedia ligeros para Home:
# - Poster estático
# - Vídeo intro en loop (H264, faststart)
#
# Uso:
#   bash scripts/generate-intro-media.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p public/media public/images/hero

ffmpeg -y \
  -f lavfi -i "color=c=0x07101a:s=1600x900" \
  -i public/logo.png \
  -filter_complex "[0:v]drawgrid=width=80:height=80:thickness=1:color=0x1d3f5d@0.35[bg];[1:v]scale=960:-1[logo];[bg][logo]overlay=(W-w)/2:(H-h)/2,format=yuv420p" \
  -update 1 \
  -frames:v 1 \
  public/images/hero/intro-poster.jpg

ffmpeg -y \
  -loop 1 -i public/logo.png \
  -f lavfi -i "color=c=0x07101a:s=1280x720:d=10" \
  -filter_complex "[1:v]drawgrid=width=72:height=72:thickness=1:color=0x1d3f5d@0.35,format=rgba[bg];[0:v]scale=840:-1,format=rgba,zoompan=z='1.0+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=300:s=840x420:fps=30[logoz];[bg][logoz]overlay=(W-w)/2:(H-h)/2:shortest=1,drawbox=x=0:y=620:w=1280:h=100:color=0x050b14@0.6:t=fill,drawtext=text='ADVANCED RETRO':fontcolor=0x4BE4D6:fontsize=46:x=(w-text_w)/2:y=640,drawtext=text='Coleccionismo y tienda retro':fontcolor=0xD8E3F1:fontsize=24:x=(w-text_w)/2:y=688,format=yuv420p[v]" \
  -map "[v]" \
  -t 10 \
  -r 30 \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -crf 25 \
  -preset medium \
  public/media/advanced-retro-intro.mp4

ffmpeg -y \
  -f lavfi -i "sine=frequency=523:duration=0.18" \
  -f lavfi -i "sine=frequency=659:duration=0.18" \
  -f lavfi -i "sine=frequency=784:duration=0.18" \
  -f lavfi -i "sine=frequency=1046:duration=0.35" \
  -filter_complex "[0:a]volume=0.22[a0];[1:a]volume=0.22[a1];[2:a]volume=0.22[a2];[3:a]volume=0.22[a3];[a0][a1][a2][a3]concat=n=4:v=0:a=1,afade=t=out:st=0.75:d=0.15[aout]" \
  -map "[aout]" \
  -ar 44100 \
  -ac 2 \
  public/media/advanced-retro-jingle.mp3

echo "✅ Media generada:"
echo " - public/images/hero/intro-poster.jpg"
echo " - public/media/advanced-retro-intro.mp4"
echo " - public/media/advanced-retro-jingle.mp3"
