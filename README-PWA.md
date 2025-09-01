# AI Voice Interview Assistant - PWA Setup

This application has been converted to a **Progressive Web Application (PWA)** with offline capabilities, installable experience, and native app-like features.

## 🚀 PWA Features Implemented

### ✅ Core PWA Features
- **Offline Functionality**: Interview sessions work without internet connection
- **App Installation**: Install on mobile/desktop devices like a native app
- **Service Worker**: Caches resources for faster loading and offline access
- **Web App Manifest**: Proper app metadata for installation prompts
- **Responsive Design**: Works seamlessly on all device sizes

### ✅ AI-Powered Features  
- **Real-time Speech Recognition**: Web Speech API integration
- **Text-to-Speech AI Interviewer**: Questions read aloud with customizable voice settings
- **AI Response Evaluation**: OpenAI-powered feedback with detailed scoring
- **Smart Question Generation**: Dynamic interview questions based on role and difficulty

### ✅ Offline Storage
- **Local Session Storage**: Complete interview sessions saved locally
- **Cached Questions**: Pre-loaded question templates for offline use
- **User Preferences**: Voice settings and preferences persist offline
- **Export/Import**: Backup and restore interview data

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

Add your OpenAI API key:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Generate PWA Icons
Run the icon generator script:
```bash
node scripts/generate-icons.js
```

**Important**: Generate proper icon files from the created SVG template using:
- [PWA Asset Generator](https://github.com/pwa-builder/pwabuilder-image-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- Any SVG to PNG/ICO converter

Required icon sizes:
- `16x16`, `32x32` (favicon)
- `72x72`, `96x96`, `128x128`, `144x144`, `152x152`
- `192x192`, `384x384`, `512x512` (Android)
- `favicon.ico` (browser tab)

### 4. Run Development Server
```bash
npm run dev
```

### 5. Test PWA Features

#### Desktop Testing:
1. Open Chrome DevTools → Application → Service Workers
2. Check "Offline" to test offline functionality
3. Look for install prompt in address bar

#### Mobile Testing:
1. Access via HTTPS (required for PWA features)
2. Look for "Add to Home Screen" prompt
3. Test offline functionality by disabling network

## 📱 PWA Installation

### Chrome/Edge (Desktop)
1. Visit the app in Chrome/Edge
2. Click the install icon in the address bar
3. Or use "Install [App Name]" from the menu

### Chrome/Safari (Mobile)
1. Visit the app in mobile browser
2. Tap the share/menu button
3. Select "Add to Home Screen"
4. Follow the installation prompts

### iOS Safari Specific
- Shows custom install instructions
- Guides users through "Add to Home Screen" process
- Respects iOS design guidelines

## 🔧 PWA Configuration

### Manifest.json Features
- **App Name**: "AI Voice Interview Assistant"
- **Short Name**: "InterviewAI"
- **Display Mode**: Standalone (full-screen app experience)
- **Theme Colors**: Purple gradient matching app design
- **Shortcuts**: Quick access to Practice and Dashboard
- **Categories**: Education, Productivity, Business

### Service Worker Caching
- **Static Assets**: CSS, JS, images cached with StaleWhileRevalidate
- **API Responses**: OpenAI calls cached for 5 minutes
- **Google Fonts**: Cached for 1 year
- **Pages**: Cached for 24 hours with NetworkFirst strategy

## 🌐 Offline Capabilities

### What Works Offline:
- ✅ Browse interview templates
- ✅ Start new interview sessions
- ✅ Record voice responses (local storage)
- ✅ View past interview sessions
- ✅ Export interview data
- ✅ Change app settings

### What Requires Internet:
- ❌ AI-generated questions (falls back to cached questions)
- ❌ Real-time AI feedback (can be queued for later)
- ❌ New template downloads
- ❌ Account synchronization

## 📊 Storage Management

### Local Storage Usage:
- Interview sessions with responses
- Cached questions and templates
- User preferences and settings
- Audio transcripts and metadata

### Storage APIs Used:
- **localStorage**: User preferences and app settings
- **IndexedDB**: Large interview session data (future enhancement)
- **Cache API**: Service Worker resource caching

## 🔒 Privacy & Security

- All voice data processed locally when possible
- Interview responses stored locally on device
- OpenAI API calls only when online and consented
- No tracking or analytics in offline mode
- Export/import for user data control

## 🚀 Deployment for PWA

### Requirements for Production:
1. **HTTPS**: PWAs require secure connections
2. **Valid SSL Certificate**: For service worker registration
3. **Proper Headers**: Set correct MIME types for manifest
4. **Icon Files**: All sizes properly generated

### Recommended Hosting:
- **Vercel**: Automatic HTTPS and PWA support
- **Netlify**: Built-in PWA optimization
- **GitHub Pages**: With custom domain and SSL
- **Firebase Hosting**: Google's PWA-optimized platform

### Build for Production:
```bash
npm run build
npm start
```

## 🧪 Testing PWA Features

### Lighthouse PWA Audit:
1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Run PWA audit
4. Ensure all PWA criteria pass

### PWA Checklist:
- [ ] Service worker registered
- [ ] Web app manifest present
- [ ] HTTPS served
- [ ] Responsive design
- [ ] Offline functionality
- [ ] Install prompts work
- [ ] App shortcuts functional

## 📈 Performance Optimizations

- **Code Splitting**: Pages loaded on demand
- **Image Optimization**: Next.js automatic image optimization  
- **Bundle Analysis**: Webpack bundle analyzer for size optimization
- **Caching Strategy**: Aggressive caching for static assets
- **Lazy Loading**: Components loaded when needed

## 🐛 Troubleshooting

### Service Worker Issues:
```bash
# Clear service worker cache in DevTools
Application → Storage → Clear Storage

# Or programmatically
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister())
})
```

### PWA Install Not Showing:
- Ensure HTTPS (required for PWA)
- Check manifest.json is valid
- Verify service worker is registered
- Clear browser cache and reload

### Offline Features Not Working:
- Check service worker registration
- Verify cache strategies in network tab
- Ensure offline storage is working in DevTools

## 📞 Support

For PWA-specific issues:
1. Check browser compatibility
2. Verify HTTPS requirements
3. Test service worker in DevTools
4. Review manifest.json validation

---

## 🎯 Next Steps

After PWA setup:
1. Generate proper app icons
2. Test installation on multiple devices
3. Configure push notifications (future feature)
4. Set up background sync for offline actions
5. Add app shortcuts for common actions

The AI Voice Interview Assistant is now a full-featured PWA ready for installation and offline use! 🎉
