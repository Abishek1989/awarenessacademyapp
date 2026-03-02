#!/bin/bash

# Script to create reversed versions of hero videos using ffmpeg
# Usage: bash create-reversed-videos.sh

echo "Creating reversed hero videos..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}ffmpeg is not installed. Install it with:${NC}"
    echo "Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "macOS: brew install ffmpeg"
    echo "Windows: Download from https://ffmpeg.org/download.html"
    exit 1
fi

# Create reversed desktop video
if [ -f "hero-cinematic.mp4" ]; then
    echo "Creating hero-cinematic-reverse.mp4..."
    ffmpeg -i hero-cinematic.mp4 -vf "reverse" -af "areverse" hero-cinematic-reverse.mp4
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ hero-cinematic-reverse.mp4 created successfully${NC}"
    else
        echo -e "${YELLOW}✗ Failed to create hero-cinematic-reverse.mp4${NC}"
    fi
else
    echo -e "${YELLOW}⚠ hero-cinematic.mp4 not found${NC}"
fi

# Create reversed mobile video
if [ -f "hero-mobile.mp4" ]; then
    echo "Creating hero-mobile-reverse.mp4..."
    ffmpeg -i hero-mobile.mp4 -vf "reverse" -af "areverse" hero-mobile-reverse.mp4
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ hero-mobile-reverse.mp4 created successfully${NC}"
    else
        echo -e "${YELLOW}✗ Failed to create hero-mobile-reverse.mp4${NC}"
    fi
else
    echo -e "${YELLOW}⚠ hero-mobile.mp4 not found${NC}"
fi

echo -e "${GREEN}Done!${NC}"
echo "Reversed videos are ready to use."
