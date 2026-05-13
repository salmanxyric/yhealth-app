# Changelog - January 13, 2026

## 🎯 Major Features & Improvements

### 1. Emotional Check-In System
- **Comprehensive Screening**: Added full emotional check-in feature with LLM-powered question generation
- **Camera Emotion Detection**: Integrated TensorFlow.js for real-time facial emotion analysis during check-ins
- **Risk Assessment**: Multi-level risk detection (none, low, moderate, high, critical) with crisis detection
- **Session Tracking**: Complete session management with duration, question count, and completion tracking
- **Insights & Trends**: Advanced analytics service for emotional patterns and trends over time
- **Crisis Resources**: Automatic crisis resource modal for high-risk situations
- **Question Engine**: Dynamic question generation based on screening type (light, standard, deep)
- **Response Tracking**: Detailed response logging with emotional state and context
- **Backend Services**:
  - `emotional-checkin.service.ts`: Core check-in logic and session management
  - `emotional-checkin-questions.service.ts`: LLM-powered question generation
  - `emotional-checkin-insights.service.ts`: Pattern analysis and insights
  - `emotional-checkin-trends.service.ts`: Trend analysis over time
  - `camera-emotion.service.ts`: Facial emotion detection using TensorFlow
- **Frontend Components**:
  - `EmotionalCheckInFlow.tsx`: Main check-in flow component
  - `CheckInQuestion.tsx`: Question display and response capture
  - `CheckInResults.tsx`: Results summary and recommendations
  - `CameraAnalysis.tsx`: Camera integration for emotion detection
  - `TensorFlowEmotionAnalyzer.tsx`: Real-time emotion analysis
  - `CrisisResourcesModal.tsx`: Crisis support resources
- **Database**: New tables for sessions, responses, and tracking
- **Routes**: `/api/emotional-checkin/*` endpoints for all check-in operations

### 2. Breathing Tests & Exercises
- **Lung Capacity Testing**: Added breathing test system with multiple test types
- **Test Types**: Support for breath hold, box breathing, 4-7-8, relaxation, and custom patterns
- **Lung Health Analytics**: Automatic lung capacity estimation (poor, fair, good, excellent)
- **Progress Tracking**: Baseline comparison and improvement tracking over time
- **Visual Feedback**: Animated lung visualization and breathing charts
- **History Tracking**: Complete history of breathing tests with trends
- **Backend Services**:
  - `wellbeing/breathing.service.ts`: Complete breathing test management
- **Frontend Components**:
  - `BreathingTest.tsx`: Main test interface
  - `BreathingChart.tsx`: Visual progress charts
  - `BreathingHistory.tsx`: Historical test data
  - `LungAnimation.tsx`: Animated lung visualization
- **Database**: New `breathing_tests` table with comprehensive tracking
- **Routes**: `/api/wellbeing/breathing/*` endpoints

### 3. Real-Time Health Monitoring
- **Real-Time Heart Rate**: Added real-time WHOOP heart rate monitoring with 10-second polling
- **Real-Time Activity**: Live activity tracking card with connection status
- **Connection Status**: Visual indicators for WHOOP device connection
- **Manual Refresh**: User-triggered refresh with timestamp tracking
- **Data Merging**: Intelligent merging of real-time WHOOP data with existing metrics
- **Frontend Components**:
  - `RealTimeHeartRateCard.tsx`: Live heart rate display with chart
  - `RealTimeActivityCard.tsx`: Activity monitoring card
  - `useWhoopRealtime.ts`: Custom hook for real-time data polling
- **Enhanced Dashboard**: Updated `UnifiedHealthDashboard` with real-time capabilities

### 4. WHOOP Stress Monitoring
- **Stress Detection**: Multi-signal stress detection and monitoring
- **Stress Visualization**: Visual stress level indicators
- **Integration**: Seamless integration with WHOOP data
- **Frontend Component**: `StressMonitor.tsx` for stress visualization

### 5. Wellbeing Page Enhancements
- **Feature Navigation**: Beautiful grid layout for all wellbeing features
- **New Routes**: Added `/wellbeing/breathing` and `/wellbeing/emotional-checkin` pages
- **Enhanced UI**: Modern gradient cards with hover effects and animations
- **Feature Discovery**: Clear descriptions and navigation to all wellbeing tools

### 6. AI Coach Service Enhancements
- **Recipe Generation**: Enhanced image analysis with recipe generation from food photos
- **Custom Prompts**: Support for custom user questions in image analysis
- **JSON Output**: Structured JSON responses for recipes and analysis
- **Enhanced Analysis**: Improved prompts with markdown headers and detailed insights
- **Token Management**: Dynamic token limits based on analysis type (1500-3000 tokens)

### 7. LangGraph Chatbot Improvements
- **Coaching Memory**: Added comprehensive coaching memory section building
- **User Context**: Enhanced concise user context summary with high-signal information
- **Profile Integration**: Support for comprehensive user coaching profiles (when available)
- **Wellbeing Context**: Better integration of wellbeing data into conversations

### 8. Adaptive Nutrition System ⭐ NEW
- **Intelligent Calorie Redistribution**: Smart calorie adjustment system when users deviate from targets
- **Deviation Classification**: Automatic classification of nutrition deviations (on_target, minor_under/over, significant_under/over, severe_under/over, missed_day)
- **Adjustment Strategies**: Four redistribution strategies:
  - `next_day`: Shift calories to next day
  - `redistribute`: Spread across multiple days
  - `gradual`: Gradual adjustment over time
  - `skip`: Skip adjustment (user choice)
- **WHOOP Integration**: Factors in workout calories, recovery score, and strain for intelligent adjustments
- **Safety Limits**: Built-in safety limits to prevent extreme calorie adjustments
- **User Preferences**: Comprehensive preference system for adjustment behavior
- **Pattern Recognition**: Advanced pattern detection service for adherence patterns:
  - Day-of-week patterns (e.g., "always under on Mondays")
  - Meal-type patterns (e.g., "skips breakfast consistently")
  - Workout-day patterns (e.g., "undereats on workout days")
  - Recovery-level patterns
  - Time-of-day patterns
  - Streak tracking
  - Blocker identification
- **Daily Analysis**: Automated daily nutrition analysis with:
  - Target vs actual comparison
  - Deviation percentage calculation
  - WHOOP context integration
  - AI-powered insights and recommendations
  - User feedback collection
- **Adherence Patterns**: Visual charts and analytics for nutrition adherence patterns
- **Daily Insights**: Comprehensive daily nutrition insights dashboard
- **Backend Services**:
  - `adaptive-calorie.service.ts`: Core calorie redistribution logic (900+ lines)
  - `nutrition-analysis.service.ts`: Daily analysis and deviation tracking (800+ lines)
  - `nutrition-learning.service.ts`: Pattern recognition and learning (800+ lines)
- **Frontend Components**:
  - `InsightsTab.tsx`: Nutrition insights dashboard with charts
  - `DailyNutritionInsights.tsx`: Daily analysis display
  - `AdherencePatternsChart.tsx`: Visual pattern charts
- **Database Tables**:
  - `nutrition_daily_analysis`: Daily analysis results
  - `nutrition_calorie_adjustments`: Adjustment tracking
  - `nutrition_adherence_patterns`: Pattern storage
  - `nutrition_user_preferences`: User preferences
- **Automated Jobs**: Background job for daily nutrition analysis
- **Routes**: `/api/nutrition-adaptive/*` endpoints for all adaptive features

### 9. AI-Powered Progress Photo Comparison ⭐ NEW
- **Photo Comparison**: Side-by-side comparison of progress photos with AI analysis
- **AI Analysis**: Comprehensive AI analysis of body changes:
  - Overall progress assessment (significant, moderate, minimal, none)
  - Progress score (0-100)
  - Detailed observations
  - Improvement areas
  - Recommendations
  - Muscle group analysis
  - Posture assessment
- **Visual Interface**: Beautiful comparison interface with:
  - Before/after photo display
  - Toggle visibility controls
  - Full-screen mode
  - Date tracking
  - Photo type filtering (front, side, back)
- **Frontend Component**: `PhotoComparisonWithAI.tsx` for progress tracking

## 🔧 Technical Changes

### Frontend (`client/`)
- **New Services**:
  - `emotional-checkin.service.ts`: Client-side check-in service
- **New Components**:
  - Emotional check-in flow components (6 new components)
  - Breathing test components (4 new components)
  - Real-time monitoring components (2 new components)
  - Stress monitor component
  - Nutrition insights components (3 new components)
  - AI photo comparison component
- **Modified Components**:
  - `UnifiedHealthDashboard.tsx`: Added real-time WHOOP integration
  - `WellbeingTab.tsx`: Enhanced with new features
  - `AICoachTab.tsx`: Improved image analysis
  - `NutritionTab.tsx`: Added insights tab and enhanced analytics
  - `TodayTab.tsx`: Enhanced with daily insights
  - `ChatContainer.tsx`: Enhanced chat functionality
  - `ConversationSidebar.tsx`: Improved sidebar
  - `ProgressTab.tsx`: Added AI photo comparison
  - `UploadPhotoModal.tsx`: Enhanced with comparison features
  - `DashboardSidebar.tsx`: Updated navigation
  - `GoalsTab.tsx`: Enhanced analytics
  - `ActivityTab.tsx`: Improved tracking
  - `OverviewTab.tsx`: Enhanced overview
  - `ScoringTab.tsx`: Improved scoring display
  - `AnalyticsTab.tsx`: Enhanced analytics
- **New Hooks**:
  - `useWhoopRealtime.ts`: Real-time data polling hook
- **Package Updates**: Added TensorFlow.js dependencies for emotion detection

### Backend (`server/`)
- **New Services**:
  - `emotional-checkin.service.ts`: Core check-in service (1300+ lines)
  - `emotional-checkin-questions.service.ts`: Question generation
  - `emotional-checkin-insights.service.ts`: Insights analysis
  - `emotional-checkin-trends.service.ts`: Trend analysis
  - `camera-emotion.service.ts`: Emotion detection
  - `wellbeing/breathing.service.ts`: Breathing test management
  - `whoop-stress.service.ts`: Stress monitoring
  - `adaptive-calorie.service.ts`: Calorie redistribution (900+ lines)
  - `nutrition-analysis.service.ts`: Daily analysis (800+ lines)
  - `nutrition-learning.service.ts`: Pattern recognition (800+ lines)
- **New Controllers**:
  - `emotional-checkin.controller.ts`: Check-in API endpoints
  - `wellbeing/breathing.controller.ts`: Breathing test endpoints
- **New Routes**:
  - `emotional-checkin.routes.ts`: Check-in routes
  - `nutrition-adaptive.routes.ts`: Adaptive nutrition routes
  - Updated `wellbeing.routes.ts`: Added breathing routes
  - Updated `whoop-analytics.routes.ts`: Enhanced stress monitoring
  - Updated `progress.routes.ts`: Enhanced with AI comparison
  - Updated `alarm.routes.ts`: Enhanced alarm functionality
  - Updated `index.ts`: Added new route registrations
- **New Jobs**:
  - `nutrition-analysis.job.ts`: Automated daily nutrition analysis
- **New Migrations**:
  - `add-emotional-checkin-session-tracking.sql`
  - `add-emotional-checkin-responses.sql`
  - `add-breathing-tests.sql`
- **New Database Tables**:
  - `60-emotional-checkin-sessions.sql`: Session tracking
  - `59-breathing-tests.sql`: Breathing test data
  - `61-nutrition-daily-analysis.sql`: Daily nutrition analysis
  - `62-nutrition-calorie-adjustments.sql`: Calorie adjustment tracking
  - `63-nutrition-adherence-patterns.sql`: Adherence pattern storage
  - `64-nutrition-user-preferences.sql`: User nutrition preferences
- **New Migrations**:
  - `adaptive-nutrition-tables.sql`: Complete nutrition system migration
- **Modified Services**:
  - `ai-coach.service.ts`: Enhanced image analysis with recipe generation
  - `langgraph-chatbot.service.ts`: Added coaching memory and context building
  - `wellbeing-auto-tracker.service.ts`: Enhanced auto-tracking
  - `wellbeing-context.service.ts`: Improved context management
  - `whoop-analytics.service.ts`: Enhanced with nutrition integration
  - `whoop-analytics.controller.ts`: Enhanced stress monitoring
  - `progress.service.ts`: Enhanced with AI photo comparison
  - `mental-recovery-score.service.ts`: Improved recovery tracking
  - `activity.controller.ts`: Enhanced activity tracking
  - `stats.controller.ts`: Enhanced statistics
- **Modified Services**:
  - `nutrition.service.ts`: Enhanced client-side service with new endpoints
- **Database Setup**: Updated `setup.ts` to include new nutrition tables
- **Auto-Migrate**: Updated `auto-migrate.ts` with nutrition tables
- **Schema**: Updated `schema.sql` with nutrition table references
- **Index**: Updated `index.ts` with new route registrations

### Database
- **New Tables**:
  - `emotional_checkin_sessions`: Complete session tracking
  - `emotional_checkin_responses`: Individual response tracking
  - `breathing_tests`: Comprehensive breathing test data
  - `nutrition_daily_analysis`: Daily nutrition analysis results
  - `nutrition_calorie_adjustments`: Calorie adjustment proposals and tracking
  - `nutrition_adherence_patterns`: Pattern recognition data
  - `nutrition_user_preferences`: User preferences for adaptive system
- **Triggers**: Updated `99-triggers.sql` with new trigger logic

## 🐛 Bug Fixes

1. **Merge Conflicts**: Resolved all merge conflicts from rebase
2. **Type Safety**: Fixed TypeScript type issues in UnifiedHealthDashboard
3. **Deleted Files**: Properly handled deleted files (GoalCalendarView.tsx, user-coaching-profile.service.ts)
4. **Package Scripts**: Added missing migration scripts to package.json
5. **Database Setup**: Fixed table loading order in setup.ts

## 📊 Statistics

### Session 1 (Morning)
- **Files Changed**: 62 files modified, 36 new files
- **Lines Added**: ~13,667 insertions
- **Lines Removed**: ~120 deletions
- **Net Change**: +13,547 lines
- **New Features**: 2 major features (Emotional Check-In, Breathing Tests)
- **New Components**: 13 new React components
- **New Services**: 7 new backend services
- **New Database Tables**: 2 major tables with related tracking

### Session 2 (Afternoon) ⭐ NEW
- **Files Changed**: 46 files modified, 14 new files
- **Lines Added**: ~9,203 insertions
- **Lines Removed**: ~1,590 deletions
- **Net Change**: +7,613 lines
- **New Features**: 2 major features (Adaptive Nutrition System, AI Photo Comparison)
- **New Components**: 4 new React components
- **New Services**: 3 new backend services (2,500+ lines total)
- **New Database Tables**: 4 major tables for nutrition system
- **New Jobs**: 1 automated background job

### Total for January 13, 2026
- **Total Files Changed**: 108 files modified, 50 new files
- **Total Lines Added**: ~22,870 insertions
- **Total Lines Removed**: ~1,710 deletions
- **Total Net Change**: +21,160 lines
- **Total New Features**: 4 major features
- **Total New Components**: 17 new React components
- **Total New Services**: 10 new backend services
- **Total New Database Tables**: 6 major tables

## 🎨 UI/UX Improvements

- Beautiful gradient cards for wellbeing features
- Real-time connection status indicators
- Animated lung visualization for breathing tests
- Smooth transitions and hover effects
- Crisis resource modal with helpful links
- Enhanced dashboard with real-time data
- Modern card layouts with glassmorphism effects

## 🔐 Security & Validation

- Crisis detection and resource provision
- Proper session tracking and privacy
- Input validation for all check-in responses
- Secure camera access for emotion detection
- Rate limiting on check-in endpoints

## 📝 Notes

- Emotional check-in system is production-ready with comprehensive error handling
- Breathing tests include baseline tracking for progress monitoring
- Real-time monitoring requires WHOOP device connection
- TensorFlow.js emotion detection runs client-side for privacy
- All new features integrate seamlessly with existing wellbeing pillar
- Database migrations are idempotent and safe to run multiple times

## 🚀 Next Steps

- [ ] Add emotional check-in notifications and reminders
- [ ] Enhance breathing exercise library with guided sessions
- [ ] Add social sharing for breathing test achievements
- [ ] Implement emotional check-in insights dashboard
- [ ] Add breathing test recommendations based on results
- [ ] Enhance crisis detection with more sophisticated algorithms
- [ ] Add nutrition adjustment notifications and reminders
- [ ] Implement nutrition pattern-based meal suggestions
- [ ] Add social sharing for nutrition achievements
- [ ] Enhance AI photo comparison with more detailed analysis
- [ ] Add nutrition goal recommendations based on patterns
- [ ] Implement nutrition coaching based on adherence patterns

