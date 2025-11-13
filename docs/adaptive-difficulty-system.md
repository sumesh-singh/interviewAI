# Adaptive Difficulty System

This document describes the adaptive difficulty system implemented for the interview coaching platform.

## Overview

The adaptive difficulty system personalizes interview difficulty progression based on user performance metrics and goals. It analyzes user performance across multiple dimensions and provides intelligent recommendations for interview type, difficulty level, and focus areas.

## Architecture

### Core Components

1. **Analytics Service** (`lib/analytics-service.ts`)
   - Tracks user performance metrics
   - Calculates performance trends
   - Maintains user performance profiles
   - Provides benchmark data for comparison

2. **Adaptive Difficulty Engine** (`lib/adaptive-difficulty-engine.ts`)
   - Implements rule-based recommendation system
   - Generates personalized interview configurations
   - Learns from user choices and outcomes
   - Calculates recommendation confidence

3. **Enhanced Session Manager** (`lib/session-manager.ts`)
   - Integrates adaptive recommendations
   - Tracks session completion and performance
   - Provides adaptive session creation methods

4. **Adaptive Interview Setup** (`components/interview-setup-adaptive.tsx`)
   - Displays personalized recommendations
   - Shows rationale and confidence levels
   - Provides alternative options
   - Tracks user overrides

### Data Flow

```
User completes session → Performance metrics stored → Analytics processed → 
Rules applied → Recommendation generated → UI displays → User chooses → 
Choice recorded → System learns → Next recommendation improved
```

## Features

### 1. Performance Tracking

The system tracks multiple performance dimensions:

- **Technical Accuracy**: Domain knowledge and technical correctness
- **Communication Skills**: Clarity, pace, and articulation
- **Problem Solving**: Analytical thinking and structured approach
- **Confidence**: Delivery and conviction
- **Relevance**: Directness and focus
- **Clarity**: Communication precision
- **Structure**: Organization and logical flow
- **Examples**: Use of concrete evidence

### 2. Adaptive Rules

The recommendation engine uses priority-based rules:

- **High Performer Advancement** (Priority: 100)
  - Advances users with consistent high scores (>85%)
  - Increases difficulty to maintain challenge

- **Struggling User Support** (Priority: 90)
  - Simplifies difficulty for users with low scores (<60%)
  - Focuses on building confidence

- **Technical Weakness Focus** (Priority: 80)
  - Recommends technical questions for users weak in technical areas
  - Identifies specific focus areas

- **Communication Weakness Focus** (Priority: 75)
  - Recommends behavioral questions for communication improvement
  - Targets clarity and confidence issues

- **Balanced Approach** (Priority: 50)
  - Suggests mixed interviews for users with balanced skills
  - Provides comprehensive practice

- **Type Specialization** (Priority: 40)
  - Focuses on stronger areas to build confidence
  - Addresses weaker areas later

### 3. Recommendation System

Each recommendation includes:

- **Primary Configuration**: Recommended type and difficulty
- **Confidence Score**: 0-100% confidence in recommendation
- **Rationale**: Primary reason and supporting evidence
- **Alternative Options**: Other valid configurations with reasons
- **Focus Areas**: Specific skills to work on
- **Estimated Difficulty**: How challenging the session will feel

### 4. Learning System

The system learns from user behavior:

- **Choice Tracking**: Records when users follow or override recommendations
- **Outcome Correlation**: Links choices to session outcomes
- **Accuracy Metrics**: Tracks recommendation effectiveness
- **Preference Learning**: Adapts to user preferences over time

## API Endpoints

### Get Adaptive Configuration
```
GET /api/adaptive-config?userId={userId}
```
Returns personalized recommendation for the user.

### Record User Choice
```
POST /api/adaptive-config
{
  "userId": "user123",
  "userChoice": {
    "type": "technical",
    "difficulty": "medium"
  }
}
```
Records user's choice for learning.

### Get Performance Data
```
GET /api/performance?userId={userId}
```
Returns user's performance profile and recommendation accuracy.

### Complete Session
```
POST /api/performance
{
  "userId": "user123",
  "sessionId": "session123",
  "role": "Software Engineer"
}
```
Completes session and updates performance metrics.

## Usage Examples

### Basic Usage

```typescript
import { useAdaptiveInterview } from '@/hooks/use-adaptive-interview'

function MyComponent() {
  const { 
    recommendation, 
    performance, 
    createAdaptiveSession 
  } = useAdaptiveInterview('user123')

  const handleStart = async () => {
    const result = await createAdaptiveSession({
      duration: 30,
      useRecommendation: true
    })
    // Start interview with result.session
  }
}
```

### Direct API Usage

```typescript
import { sessionManager } from '@/lib/session-manager'

// Get recommendation
const recommendation = sessionManager.getAdaptiveConfig('user123')

// Create adaptive session
const { session } = await sessionManager.createAdaptiveSession('user123', {
  duration: 30,
  useRecommendation: true
})

// Complete session
const result = sessionManager.completeSession('user123', session.id)
```

## Configuration

### Benchmark Data

The system uses benchmark data for comparison. Benchmarks are defined per difficulty and interview type:

```typescript
const benchmarkData = {
  difficulty: 'medium',
  interviewType: 'technical',
  averageScores: {
    technicalAccuracy: 70,
    communicationSkills: 70,
    // ... other metrics
  },
  averageOverallScore: 69,
  percentile: { 25th: 58, 50th: 69, 75th: 78, 90th: 86 }
}
```

### Custom Rules

New adaptive rules can be added by extending the rules array:

```typescript
const customRule: AdaptiveRule = {
  id: 'custom-rule',
  name: 'Custom Logic',
  priority: 60,
  condition: (profile, recentScores) => {
    // Custom condition logic
    return true
  },
  action: (profile, recentScores) => {
    // Return partial recommendation
    return {
      recommendedDifficulty: 'hard',
      rationale: {
        primary: 'Custom recommendation',
        supporting: ['Supporting evidence']
      }
    }
  }
}
```

## Testing

### Demo Script

Run the demo script to test the system:

```bash
node scripts/test-adaptive-system.js
```

This simulates different user scenarios and tests recommendation accuracy.

### Manual Testing

Visit `/adaptive-demo` to interactively test the adaptive system with a simulated user.

## Performance Considerations

- **Storage**: Performance data is stored in localStorage (client-side)
- **Caching**: Recommendations are cached to avoid recalculation
- **Limits**: Only last 50 sessions are kept to manage storage
- **Privacy**: All data is stored locally on the user's device

## Future Enhancements

1. **Server-side Storage**: Move performance data to a database for persistence
2. **Machine Learning**: Replace rule-based system with ML models
3. **Advanced Analytics**: Add more sophisticated trend analysis
4. **Personalization**: Incorporate user goals and preferences
5. **A/B Testing**: Test different recommendation strategies

## Troubleshooting

### Common Issues

1. **No Recommendations Available**
   - User needs to complete at least 2-3 sessions
   - Check if performance data is being stored correctly

2. **Low Confidence Scores**
   - System needs more data points
   - Performance might be inconsistent

3. **Inaccurate Recommendations**
   - Check rule priorities and conditions
   - Verify performance metric calculations

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('adaptive-debug', 'true')
```

This will log detailed information about recommendation calculations.

## Contributing

When contributing to the adaptive system:

1. Test with the demo script
2. Verify recommendations make logical sense
3. Check performance impact
4. Update documentation
5. Add appropriate tests

## License

This adaptive difficulty system is part of the interview coaching platform and follows the same license terms.