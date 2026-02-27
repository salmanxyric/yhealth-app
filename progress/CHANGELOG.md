# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Git workflow and CI/CD pipeline
- Documentation structure
- Leaderboard and Competitions menu items to main navigation sidebar (2026-02-16)
- Menu structure documentation in `progress/MENU_STRUCTURE.md`
- 3D Avatar animation system: procedural VRM animation pipeline with 12-step RAF loop (2026-02-26)
- Eye movement system: saccadic shifts, gaze patterns, state-linked behavior (2026-02-26)
- Emotion-modulated animation: per-emotion amplitude/frequency/posture/blink parameters (2026-02-26)
- Frequency-weighted lip sync: audio frequency analysis replacing time-based viseme cycling (2026-02-26)
- Enhanced blink system: emotion-modulated intervals, double-blink support (2026-02-26)
- Backend emotion connection: AI emotion detection drives avatar expression + body language (2026-02-26)
- New server services: achievement-tree, commitment-tracker, cross-pillar-intelligence, daily-pledge, inconsistency-detection, intelligent-intervention, personality-mode, team-competition, user-classification, variable-reward (2026-02-26)
- New database migrations: cross-pillar contradictions, gamification upgrade, user classification, user interventions (2026-02-26)

### Changed
- Updated leaderboard layout to include DashboardSidebar navigation (2026-02-16)
- Updated DashboardLayout to handle leaderboard and competitions routes (2026-02-16)
- Enhanced active route detection to support leaderboard and competitions views (2026-02-16)
- Changed competitions from query parameter (`/leaderboard?view=competitions`) to separate page (`/competitions`) (2026-02-16)
- Premium AAA arm/hand tuning: absolute target poses, parent-space channels, subtle micro-pulse gestures (2026-02-26)
- Chat UI: replaced spinner with WhatsApp-style skeleton loading (2026-02-26)
- Nutrition tab: enhanced MealCard and TodayTab components (2026-02-26)
- Server: improved AI coach, LangGraph chatbot, daily analysis, message, and automation services (2026-02-26)

### Fixed
- Avatar arms rotating backward behind torso: switched from multiply to slerp absolute targets (2026-02-26)
- Avatar arms spread wide like T-pose: corrected Z-rotation from -35deg to -62deg for natural positioning (2026-02-26)

## [1.0.0] - TBD

### Added
- Initial release

---

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

