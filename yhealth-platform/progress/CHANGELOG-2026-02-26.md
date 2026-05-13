# Changelog - February 26, 2026

## 3D Avatar System - Premium AAA Enhancement

### 1. Full Avatar Animation System (NEW)

Complete procedural animation pipeline for VRM 3D avatar in the Voice Assistant tab.

**New Files Created:**
- `client/lib/avatar/emotionModulation.ts` — Per-emotion animation parameters (amplitude, frequency, posture, blink rate, eye behavior, finger curl)
- `client/lib/avatar/vrmPoses.ts` — Rest poses, state pose targets, idle animation channels, speaking gestures, finger channels, emotion hand offsets
- `client/lib/avatar/vrmMappings.ts` — VRM bone/expression mappings, voice state mapping, emotion-to-expression tables
- `client/lib/avatar/smoothing.ts` — lerp, clamp, attackRelease utilities for smooth animation transitions
- `client/hooks/useThreeVrm.ts` — Main animation hook with 12-step RAF loop pipeline
- `client/hooks/useEyeMovement.ts` — Procedural eye saccade system with gaze patterns
- `client/hooks/useLipSync.ts` — Frequency-weighted viseme selection using audio analysis
- `client/hooks/useExpressions.ts` — Expression crossfade system
- `client/components/avatar/AvatarLayer.tsx` — Wires all hooks together, imperative handle API

**Modified Files:**
- `client/app/(pages)/dashboard/components/tabs/VoiceAssistantTab.tsx` — Connected backend emotion detection to avatar expression + body language

### 2. Premium AAA Arm/Hand Positioning (Fixed)

**Problem 1:** Arms/hands rotating backward behind the torso during speaking state.
**Root Cause:** `STATE_POSE_OFFSETS` quaternions applied via `multiply` (local bone space). After rest pose rotates arms 65 degrees down, local axes are tilted, causing forward rotations to go backward.
**Fix:** Created `applyStatePose()` using `slerp(restQuat, absoluteTarget, blend)` instead of multiply. Added `space: "parent"` with `premultiply` for animation channels.

**Problem 2:** Arms spread wide like T-pose during speaking.
**Root Cause:** Absolute target `eulerDegToQuat(20, 0, -35)` put arms only 35 degrees below horizontal (too raised).
**Fix:** Changed speaking targets to `eulerDegToQuat(25, 0, -62)` — only 3 degrees more outward than rest Z=-65 degrees.

### 3. Premium AAA Animation Tuning

Implemented detailed natural conversation preset per specification:

| Parameter | Value |
|-----------|-------|
| **Idle Rest Pose** | 15 degrees shoulder forward, 30 degrees elbow bend, 8 degrees wrist curl |
| **Speaking Pose** | +10 degrees more forward, +10 degrees more elbow bend (subtle) |
| **Idle Sway** | 0.006-0.008 rad amplitude (barely perceptible), asymmetric L/R |
| **Breathing** | 0.004 rad clavicle oscillation at 0.75 Hz |
| **Speaking Gesture** | 0.035 rad primary pulse at 0.4 Hz (~2.5s loop) |
| **Speaking Fingers** | 0.02-0.04 rad subtle curl, asymmetric timing |
| **Symmetry Breaking** | Different amplitudes, frequencies, and phases for left vs right |

**Golden Rules Applied:**
- Hands stay inside invisible box in front of chest (shoulder width, chest-to-navel height)
- No big swings, no overacting — "if users notice it, it's too much"
- Elbows never fully straight, hands never cross behind torso
- No perfectly symmetrical robotic motion

### 4. Eye Movement System (NEW)

- Saccadic shifts every 0.5-2s with smooth interpolation
- 70% eye contact, 20% look-away, 10% look-down distribution
- State-linked behavior: listening=more eye contact, speaking=allow look-away, thinking=bias downward
- Emotion-modulated saccade amplitude and interval

### 5. Emotion-Modulated Animation (NEW)

- Per-emotion parameters: amplitude scale, frequency scale, posture lean, shoulder offset
- Happy: bouncy/wide sway (1.3x amplitude, 1.2x frequency)
- Sad: slow/small movement (0.6x amplitude, 0.7x frequency)
- Angry: tense/restricted (fist curl, tight sway)
- Smooth ~1s transitions between emotion states via lerp

### 6. Enhanced Blink System (NEW)

- Emotion-modulated blink interval (excited=faster, relaxed=slower)
- Double-blink probability per emotion (0.05-0.3 chance)
- Queue-based blink scheduling (max 2 entries, 250ms spacing)

### 7. Frequency-Weighted Lip Sync (NEW)

- Replaced time-based viseme cycling with audio frequency analysis
- Low band (80-400 Hz) maps to open vowels (aa, oh)
- Mid band (400-2000 Hz) maps to rounded (ou)
- High band (2000-6000 Hz) maps to narrow (ee, ih)
- Fallback to time-cycling when frequency data unavailable

### 8. Backend Emotion Connection (NEW)

- Wired `data.emotion` at VoiceAssistantTab.tsx to `avatarRef.current.setEmotionFromBackend()`
- AI response emotion now drives avatar facial expression + full-body animation changes
- Maps via EMOTION_TO_EXPRESSION for expression blending

---

## Other Changes

### Chat UI Skeleton Loading
- Replaced spinner loading with skeleton placeholders for chat page, chat list, and messages view
- WhatsApp-style skeleton with emerald theming

### Nutrition Tab Improvements
- Enhanced MealCard component and nutrition constants
- Updated TodayTab display

### Workout Analytics
- Improved WorkoutAnalytics component

### Server Enhancements
- Updated AI coach service with improved context handling
- Enhanced LangGraph chatbot service
- Improved message service, daily analysis, and comprehensive user context services
- Updated schedule automation and activity automation services
- Added new database migrations: cross-pillar contradictions, gamification upgrade, user classification, user interventions
- New services: achievement-tree, commitment-tracker, cross-pillar-intelligence, daily-pledge, inconsistency-detection, intelligent-intervention, personality-mode, team-competition, user-classification, variable-reward

---

## Build & Test Results

| Target | Result |
|--------|--------|
| **Server Build** (`tsc + tsc-alias`) | Clean compilation |
| **Server Tests** | 35 suites, 749 tests passed |
| **Client Tests** | 20 suites, 411 tests passed |
| **Client TypeScript** | Clean (only pre-existing TourOverlay.test.tsx issue) |
| **Total** | **55 suites, 1,160 tests — all passing** |

---

## Technical Architecture

### Animation Pipeline (RAF Loop)
```
1.  vrm.update(delta)                    — spring bones
2.  Reset all bones to rest-pose         — clean slate
3.  State pose slerp                     — speaking/thinking/listening targets
3b. Emotion posture modulation           — spine lean + shoulder offset
4.  Idle channels (emotion-modulated)    — amplitude x emotionMod scale
4b. Finger idle channels                 — scaled by fingerMicroScale
4c. Emotion hand pose offsets            — fist/open/limp per emotion
5.  Speaking gestures + fingers          — micro-pulse channels
6.  Enhanced blink                       — emotion-modulated, double-blink
7.  Tick hooks: lipSync + expressions + eyeMovement
8.  Apply emotion expressions            — crossfade blending
9.  Apply viseme values                  — frequency-weighted
10. Apply eye gaze values                — lookLeft/Right/Up/Down
11. Lerp emotion modulators              — smooth ~1s transitions
12. renderer.render()
```

### Key Design Decisions
- **Absolute targets over multiply offsets** — slerp(rest, target, blend) for predictable arm positioning
- **Parent space for arm channels** — premultiply avoids tilted local-axis issues
- **Shared ref architecture** — all hooks communicate via MutableRefObject for zero React re-renders
- **60fps maintained** — all computations are O(1) per frame
