# Changelog - January 8, 2026

## 🎯 Major Features & Improvements

### 7. Chat Health Profile Modal (WHOOP-Style)
- **User Health Profiles**: Added health profile modal accessible by clicking user avatars in chat
- **WHOOP-Style Design**: Modern circular progress indicators matching WHOOP app aesthetic
- **Comprehensive Metrics**: Displays 6 key health metrics:
  - **Sleep**: Quality score, duration, and efficiency
  - **Recovery**: Score with HRV and resting heart rate
  - **Strain**: Daily strain score with normalized value
  - **Stress**: Stress level indicator (calculated from recovery or direct data)
  - **Water Intake**: Daily consumption with target and percentage
  - **Heart Rate**: Resting, average, and max heart rate
  - **Temperature**: Body temperature with status indicator
- **Backend Integration**: Enhanced `getUserHealthProfile` service to include water intake and stress data
- **Privacy Controls**: Only users in a chat together can view each other's health profiles
- **Real-time Data**: Fetches latest daily health metrics from WHOOP and water intake logs
- **Responsive Design**: Beautiful dark gradient UI with smooth animations and color-coded metrics

### 1. Voice Assistant Avatar System
- **Custom Avatar Upload**: Users can now upload custom images as their voice assistant avatar
- **Animated Eyes Avatar**: Added a fallback animated avatar with moving eyes and mouth animation during speech
- **3D Avatar Effects**: Implemented 3D visual effects with perspective, shadows, and hover animations
- **Database Migration**: Added `voice_assistant_avatar_url` column to `user_preferences` table
- **Upload Endpoint**: Created `/api/upload/voice-assistant-avatar` endpoint with file validation (max 5MB, JPEG/PNG/WebP)
- **Avatar Management**: Added edit button (top-right) for easy avatar updates

### 2. Image Analysis & Camera Integration
- **Inline Camera**: Integrated camera and image upload directly into Voice Assistant UI (top-right)
- **Human Detection**: Added `HumanDetectionService` to detect and analyze humans in images
- **AI Image Analysis**: Enhanced OpenAI Vision API integration for comprehensive health/fitness analysis
- **Auto-Capture Timer**: Implemented 3-second countdown timer for voice-triggered photo capture
- **Image Description**: Added optional description field for targeted image analysis
- **Analysis Types**: Support for body progress, food/nutrition, exercise form, and general health images

### 3. Voice Assistant Enhancements
- **Improved Error Handling**: Enhanced speech recognition error recovery (network, audio-capture, no-speech)
- **Browser TTS Improvements**: Better error logging and recovery for text-to-speech
- **Voice Recognition Stability**: Fixed issues with voice recognition not working intermittently
- **Camera Voice Commands**: Added voice commands to open camera and take pictures
- **Action Execution**: Improved action parsing and execution for app navigation

### 4. AI Coach Improvements
- **Topic Detection**: Refined topic relevance detection to allow general lifestyle questions
- **Comprehensive Analysis**: Enhanced image analysis to provide detailed fitness, workout, nutrition, and wellness recommendations
- **Context Awareness**: Improved context retrieval from user history, activity logs, and mood data
- **Action Support**: Added support for app control actions (navigation, updates, etc.)

### 5. Progress Page Fixes
- **JSONB Parsing**: Fixed critical JSONB parsing issues for weight, measurements, and progress photos
- **Data Display**: Resolved issues with progress data not showing on the progress page
- **Error Handling**: Added comprehensive error handling and user feedback for data loading failures

### 6. Voice Call System Fixes
- **Call History**: Fixed API response parsing for paginated call history
- **Call Status Polling**: Implemented real-time call status updates
- **Call Initiation**: Fixed call initiation and data flow between components
- **Call Ending**: Improved call termination handling

### 7. Language Selector Improvements
- **Scroll Fix**: Fixed scrolling issues in language dropdown
- **Selection Fix**: Resolved dropdown closing when selecting a language
- **UI/UX**: Improved language selector interaction and responsiveness

## 🔧 Technical Changes

### Frontend (`client/`)
- **New Services**:
  - `upload.service.ts`: Handles voice assistant avatar uploads
  - `action-handler.service.ts`: Parses and executes AI assistant actions
- **New Components**:
  - `ImageAnalysisModal.tsx`: Modal for camera/image analysis (later integrated inline)
  - `AnimatedEyesAvatar`: Animated avatar component with eye tracking
  - `UserHealthProfileModal.tsx`: WHOOP-style health profile modal for chat users
- **Modified Components**:
  - `VoiceAssistantTab.tsx`: Major refactor with inline camera, avatar system, improved error handling
  - `AICoachTab.tsx`: Enhanced with action execution and image analysis
  - `VoiceCallTab.tsx`: Fixed call status polling and real-time updates
  - `CallHistory.tsx`: Fixed API response parsing
  - `CallCoachButton.tsx`: Improved call initiation flow
  - `ProgressTab.tsx`: Fixed data display and error handling
  - `language-selector.tsx`: Fixed scrolling and selection issues

### Backend (`server/`)
- **New Services**:
  - `human-detection.service.ts`: Detects humans in images using OpenAI Vision API
- **New Migrations**:
  - `add-voice-assistant-avatar.sql`: Adds avatar URL column to user_preferences
- **Modified Services**:
  - `ai-coach.service.ts`: Enhanced image analysis with comprehensive health/fitness recommendations
  - `langgraph-chatbot.service.ts`: Improved topic detection, action generation, and context retrieval
  - `progress.service.ts`: Fixed JSONB parsing for all progress data types
  - `whoop-analytics.service.ts`: Enhanced `getUserHealthProfile` to include water intake and stress metrics
- **Modified Controllers**:
  - `upload.controller.ts`: Added `uploadVoiceAssistantAvatar` endpoint
  - `preferences.controller.ts`: Added avatar URL handling
  - `rag-chatbot.controller.ts`: Minor improvements
  - `whoop-analytics.controller.ts`: Updated `getUserHealthProfile` endpoint to return water intake and stress data
- **Modified Routes**:
  - `upload.routes.ts`: Added voice assistant avatar upload route
- **Modified Validators**:
  - `preferences.validator.ts`: Added voice assistant avatar URL validation
- **Database Schema**:
  - `05-user-preferences.sql`: Added `voice_assistant_avatar_url` column
  - `user.schemas.ts`: Updated TypeScript interfaces

## 🐛 Bug Fixes

1. **Voice Recognition Errors**: Fixed "network" and "no-speech" error handling
2. **Browser TTS Errors**: Improved error logging and recovery
3. **Camera Issues**: Fixed camera opening/closing repeatedly, black screen issues
4. **useEffect Dependencies**: Fixed dependency array size changes causing React warnings
5. **Progress Page**: Fixed data not displaying due to JSONB parsing errors
6. **Call System**: Fixed call history, status updates, and call flow
7. **Language Selector**: Fixed scrolling and selection issues
8. **Database Migration**: Ran migration to add missing `voice_assistant_avatar_url` column

## 📊 Statistics

- **Files Changed**: 20 files modified, 7 new files
- **Lines Added**: ~3,500+ insertions
- **Lines Removed**: ~400+ deletions
- **Net Change**: +3,100+ lines

## 🎨 UI/UX Improvements

- Avatar with 3D effects and animations
- Inline camera integration in Voice Assistant
- Improved error messages and user feedback
- Better visual feedback for actions and loading states
- Enhanced language selector interaction

## 🔐 Security & Validation

- File upload validation (type, size limits)
- Avatar URL validation in preferences
- Proper error handling and sanitization

## 📝 Notes

- All changes maintain backward compatibility
- Database migration is idempotent (safe to run multiple times)
- Avatar upload requires authentication
- Image analysis respects user privacy and focuses on health/fitness context

