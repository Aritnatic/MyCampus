#!/bin/sh
# Rebuilds the phone app's icons from the SVGs in this folder. Needs rsvg-convert (brew install librsvg) and Python with Pillow.
set -e
cd "$(dirname "$0")"
STU=../student-app/assets
rsvg-convert -w 1024 -h 1024 app-icon.svg -o $STU/icon.png
rsvg-convert -w 1024 -h 1024 app-icon-rounded.svg -o $STU/splash-icon.png
rsvg-convert -w 48 -h 48 app-icon-rounded.svg -o $STU/favicon.png
rsvg-convert -w 512 -h 512 android-foreground.svg -o $STU/android-icon-foreground.png
rsvg-convert -w 432 -h 432 android-monochrome.svg -o $STU/android-icon-monochrome.png
python3 -c "from PIL import Image; Image.new('RGB', (512, 512), (0x7C, 0x3A, 0xED)).save('$STU/android-icon-background.png')"
cp app-icon-rounded.svg ../admin-page/public/favicon.svg
echo "Icons rebuilt."
