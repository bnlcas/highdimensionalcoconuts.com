#!/usr/bin/env bash
# Cut and shrink a drone clip for the web.
#
#   tools/make_clip.sh -i assets/overlook_traffic.mp4 -s 4 -t 12
#
# Writes assets/output.mp4 (and assets/output.jpg with -p). The page plays media/drone.mp4,
# so copy the result there only once you've decided the footage belongs on the page.
#
# Always: H.264 8-bit 4:2:0, no audio, no subtitle/data tracks, no metadata.
# DJI clips carry a subtitle track with GPS and altitude per frame. Dropping it keeps
# your launch point off the public web.
set -euo pipefail

in="" start=0 dur="" width=1280 crf=28 fps=24 out="assets/output.mp4" sat=1 poster=0

usage(){ cat <<EOF
usage: $0 -i INPUT [options]
  -i FILE   input clip (required)
  -s SEC    start time in seconds or hh:mm:ss (default 0)
  -t SEC    duration (default: to the end)
  -w PX     output width, height follows (default 1280)
  -q CRF    quality, 18 = near-lossless, 28 = small, 32 = smaller (default 28)
  -f FPS    frame rate (default 24)
  -c SAT    color saturation, 1 = unchanged, 0.6 = muted toward the page's palette (default 1)
  -o FILE   output path (default assets/output.mp4)
  -p        also write a poster frame (first frame) next to the output, as .jpg
EOF
exit 1; }

while getopts "i:s:t:w:q:f:c:o:ph" o; do
  case $o in
    i) in=$OPTARG;; s) start=$OPTARG;; t) dur=$OPTARG;; w) width=$OPTARG;; q) crf=$OPTARG;;
    f) fps=$OPTARG;; c) sat=$OPTARG;; o) out=$OPTARG;; p) poster=1;; *) usage;;
  esac
done
[[ -n $in && -f $in ]] || usage

vf="fps=${fps},scale=${width}:-2:flags=lanczos,eq=saturation=${sat},format=yuv420p"
durarg=(); [[ -n $dur ]] && durarg=(-t "$dur")

mkdir -p "$(dirname "$out")"
ffmpeg -v warning -stats -y -ss "$start" "${durarg[@]}" -i "$in" \
  -map 0:v:0 -an -sn -dn -map_metadata -1 -map_chapters -1 \
  -vf "$vf" -c:v libx264 -preset slow -crf "$crf" -profile:v high -level 4.0 \
  -g $((fps*2)) -movflags +faststart "$out"

if (( poster )); then
  ffmpeg -v error -y -i "$out" -frames:v 1 -q:v 3 -map_metadata -1 "${out%.*}.jpg"
fi

printf '%s  %s\n' "$(du -h "$out" | cut -f1)" "$out"
