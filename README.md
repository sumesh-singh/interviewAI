# AI Voice Interview Assistant

The AI Voice Interview Assistant is a professional-grade Progressive Web App (PWA) that helps users practice for interviews. It features AI-powered question generation, real-time speech-to-text, and text-to-speech AI interviewers.

## Key Features

- **AI-Powered Question Generation**: Dynamically generates interview questions based on role and difficulty.
- **Speech-to-Text**: Integrates the Web Speech API for real-time transcription with noise suppression.
- **Text-to-Speech AI Interviewer**: Reads questions aloud with customizable voice settings.
- **Real-Time AI Feedback**: Provides instant response analysis and a detailed breakdown of performance.
- **Comprehensive Scoring System**: Scores users on 8 different dimensions and provides detailed improvement plans.
- **Session Recording & Playback**: Supports audio/video recording with synchronized transcripts.
- **Follow-Up Question Logic**: Generates AI-powered follow-up questions based on user responses.
- **Export & Sharing**: Allows users to export interview sessions in multiple formats, including JSON, PDF, and Markdown.
- **Interview Templates**: Includes 7 pre-built templates for different roles that can be customized.
- **Progressive Web App (PWA)**: Offers full offline functionality and can be installed on mobile and desktop devices.
- **Progress Tracking & Analytics**: Provides a comprehensive analytics dashboard with performance tracking and goal-setting features.

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible component library
- **Recharts**: Data visualization

### AI & Voice Processing
- **OpenAI GPT-4**: Question generation and evaluation
- **Web Speech API**: Real-time speech recognition
- **Speech Synthesis API**: Text-to-speech functionality

### PWA Technologies
- **Service Workers**: Offline caching and background sync
- **Web App Manifest**: Installation and app metadata
- **Cache API**: Resource caching
- **IndexedDB**: Local data storage

## Setup Instructions

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then, add your `OPENAI_API_KEY` to the `.env.local` file.

3. **Generate PWA icons**
   ```bash
   node scripts/generate-icons.js
   ```
   Use the generated SVG to create the required icon files.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```
