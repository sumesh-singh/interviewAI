// Simple script to generate placeholder PWA icons
// In production, you should use proper icon generation tools like PWA Asset Generator

const fs = require('fs')
const path = require('path')

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// SVG template for the app icon
const iconSVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#gradient)"/>
  
  <!-- Microphone icon -->
  <rect x="226" y="180" width="60" height="100" rx="30" fill="white"/>
  <rect x="200" y="300" width="112" height="8" rx="4" fill="white"/>
  <rect x="252" y="308" width="8" height="40" fill="white"/>
  
  <!-- Sound waves -->
  <path d="M160 220 Q140 240 160 260 Q140 280 160 300" stroke="white" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M352 220 Q372 240 352 260 Q372 280 352 300" stroke="white" stroke-width="8" fill="none" stroke-linecap="round"/>
  
  <!-- AI indicator -->
  <circle cx="400" cy="150" r="40" fill="white"/>
  <text x="400" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#7c3aed">AI</text>
</svg>
`

// Write the base SVG icon
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), iconSVG.trim())

// Create browserconfig.xml for Windows tiles
const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/icons/icon-144x144.png"/>
      <TileColor>#7c3aed</TileColor>
    </tile>
  </msapplication>
</browserconfig>`

fs.writeFileSync(path.join(iconsDir, 'browserconfig.xml'), browserConfig)

// Create favicon.ico placeholder message
const faviconNote = `
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
`

fs.writeFileSync(path.join(iconsDir, 'README.txt'), faviconNote.trim())

console.log('PWA icon template and setup files created!')
console.log('Next steps:')
console.log('1. Generate actual icon files from icon.svg')
console.log('2. Add proper favicon.ico')
console.log('3. Test PWA installation on mobile devices')
