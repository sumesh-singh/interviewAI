To complete the PWA setup:
1. Generate proper icons from the icon.svg using tools like:
   - PWA Asset Generator (https://github.com/pwa-builder/pwabuilder-image-generator)
   - RealFaviconGenerator (https://realfavicongenerator.net/)
   - Or use any SVG to PNG/ICO converter

2. Generate these icon sizes:
   - 16x16, 32x32 (favicon)
   - 72x72, 96x96, 128x128, 144x144, 152x152 (various device sizes)
   - 192x192, 384x384, 512x512 (Android)
   - favicon.ico (for browser tab)

3. Place all generated icons in the /public/icons/ directory

For now, you can use the generated icon.svg as a placeholder.