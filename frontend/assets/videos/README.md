# Hero Section Video Implementation

## Overview
The hero section has been converted from a frame-by-frame canvas animation to a video-based implementation for improved performance and efficiency.

## Video Files

### Desktop Video
- **File**: `hero-cinematic.mp4`
- **Usage**: Displayed on devices with width > 768px
- **Recommended Specs**:
  - Resolution: 1920x1080 (Full HD) or higher
  - Codec: H.264 (MP4)
  - Frame Rate: 24-30 fps
  - Bitrate: 5-10 Mbps
  - Duration: 10-20 seconds (looped)

### Mobile Video
- **File**: `hero-mobile.mp4`
- **Usage**: Displayed on devices with width ≤ 768px
- **Recommended Specs**:
  - Resolution: 720x1280 (Portrait) or 1080x1920
  - Codec: H.264 (MP4)
  - Frame Rate: 24-30 fps
  - Bitrate: 2-5 Mbps
  - Duration: 10-20 seconds (looped)

## Performance Benefits
✅ **Reduced initial load time** - No need to load 192+ individual frames
✅ **Better compression** - Video codecs provide superior compression vs individual images
✅ **Smoother playback** - Hardware-accelerated video decoding
✅ **Mobile-friendly** - Automatic switching between desktop and mobile videos
✅ **Reduced memory usage** - No canvas rendering overhead

## Features Implemented
- ✅ Smooth scroll-triggered fade-in of hero content
- ✅ Parallax effect on video for depth
- ✅ Responsive video switching (desktop/mobile)
- ✅ Scroll indicator with smooth fade-out
- ✅ Intersection Observer for video pause/play (performance)
- ✅ Automatic video loop
- ✅ Fallback for autoplay failures

## Animation Details
The hero section uses GSAP ScrollTrigger to:
1. Pin the video container while scrolling
2. Gradually fade in the overlay content (title, subtitle, buttons)
3. Fade out the scroll indicator
4. Apply subtle parallax scaling to the video

## Legacy Frame-Based Animation
The old frame-based animation files are preserved in:
- `frames/` - Desktop frames (192 WebP images)
- `frames-mobile/` - Mobile frames (192 WebP images)

These can be removed if no longer needed to save disk space.

## Browser Compatibility
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Future Improvements
- [ ] Add WebM format for better compression in supported browsers
- [ ] Implement lazy loading for mobile video
- [ ] Add poster image for faster initial render
- [ ] Consider using smaller video file sizes with adaptive quality

---
**Last Updated**: March 2, 2026
**Status**: ✅ Fully Implemented
