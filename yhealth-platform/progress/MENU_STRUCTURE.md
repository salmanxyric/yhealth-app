# Menu Structure Documentation

## Overview
This document tracks the navigation menu structure for the yHealth application, including all menu items, their organization, and any missing items.

**Last Updated:** 2026-02-16

## Main Navigation Menu Structure

The main navigation menu is located in `client/app/(pages)/dashboard/components/DashboardSidebar.tsx` and is organized into the following sections:

### 1. Dashboard Section
- **Overview** (`/dashboard`) - Main dashboard view
- **Goals** (`/goals`) - User goals management

### 2. Fitness & Health Section
- **Workouts** (`/workouts`) - AI-powered workout plans
- **Nutrition** (`/nutrition`) - AI-powered nutrition tracking
- **Progress** (`/progress`) - Progress tracking and analytics
- **Activity** (`/activity`) - Activity logging and tracking
- **Activity Status** (`/activity-status`) - Activity status calendar
- **WHOOP** (`/whoop`) - WHOOP device integration
- **Achievements** (`/achievements`) - User achievements and badges
- **Leaderboard** (`/leaderboard`) - Global leaderboard and rankings ⭐ *Added 2026-02-16*
- **Competitions** (`/competitions`) - Active competitions ⭐ *Added 2026-02-16* (Updated to separate page 2026-02-16)

### 3. Wellness Section
- **Wellbeing** (`/wellbeing`) - Wellbeing tracking and resources

### 4. Communication Section
- **AI Coach** (`/ai-coach`) - AI-powered coaching assistant
- **Chat** (`/chat`) - Real-time chat with AI
- **Chat History** (`/chat-history`) - Chat conversation history
- **Voice Assistant** (`/voice-assistant`) - Voice-based AI assistant
- **Call Coach** (`/voice-call`) - Voice call with coach
- **Notifications** (`/notifications`) - User notifications

### 5. Account Section
- **Profile** (`/profile`) - User profile management
- **Preferences** (`/dashboard?tab=preferences`) - User preferences
- **Settings** (`/settings`) - Application settings

## Mobile Navigation

The mobile bottom navigation (`MobileBottomNav`) includes:
- Home (Dashboard Overview)
- Workouts
- Nutrition
- Progress
- Profile

**Note:** Leaderboard is accessible via the full sidebar menu on mobile, but not in the bottom navigation bar.

## Pages Not in Main Menu (Intentional)

The following pages exist but are intentionally not in the main navigation menu:

### Public/Informational Pages
- `/about` - About page
- `/blogs` - Blog listing (public)
- `/careers` - Careers page
- `/community` - Community page (public)
- `/contact` - Contact page
- `/cookies` - Cookie policy
- `/help` - Help center (public)
- `/hipaa` - HIPAA information
- `/plans` - Pricing plans
- `/press` - Press page
- `/privacy` - Privacy policy
- `/security` - Security information
- `/subscription` - Subscription management (accessed via settings)
- `/terms` - Terms of service
- `/webinars` - Webinars (public)

### Authentication Pages
- `/onboarding` - User onboarding flow
- `/reset-password` - Password reset

### Admin Pages
- `/admin/*` - Admin panel (uses separate AdminSidebar)

### Other
- `/messages` - Messages (integrated into chat functionality)

## Recent Changes

### 2026-02-16
- ✅ Added **Leaderboard** menu item to Fitness & Health section
- ✅ Added **Competitions** menu item to Fitness & Health section
- ✅ Updated leaderboard layout to include DashboardSidebar
- ✅ Updated DashboardLayout to handle leaderboard routes
- ✅ Updated active route detection for leaderboard and competitions
- ✅ Created separate `/competitions` page (replacing query parameter approach)
- ✅ Updated menu to point to `/competitions` instead of `/leaderboard?view=competitions`

## Menu Item Configuration

Each menu item includes:
- `id`: Unique identifier
- `label`: Display name
- `icon`: Lucide React icon component
- `href`: Route path
- `color`: Gradient color classes for active state
- `badge`: Optional badge (e.g., "AI", "NEW")
- `unreadCount`: Optional unread count for notifications

## Active Route Detection

The sidebar uses pathname matching to determine the active menu item:
- Exact matches for root paths (e.g., `/dashboard`, `/goals`)
- Prefix matches for nested routes (e.g., `/activity-status` before `/activity`)
- Query parameter support for special views (e.g., `/leaderboard?view=competitions`)

## Implementation Files

- **Sidebar Component**: `client/app/(pages)/dashboard/components/DashboardSidebar.tsx`
- **Layout Wrapper**: `client/components/layout/DashboardLayout.tsx`
- **Leaderboard Layout**: `client/app/(pages)/leaderboard/layout.tsx`

## Future Considerations

### Potential Additions
- Consider adding "Messages" as a separate menu item if it becomes a standalone feature
- Consider adding "Community" to the main menu if it becomes a core feature
- Consider adding "Help" to the main menu for easier access

### Mobile Navigation
- Consider adding Leaderboard to mobile bottom navigation if it becomes a frequently accessed feature
- Consider adding Achievements to mobile bottom navigation

## Notes

- The leaderboard page now includes the full sidebar navigation
- Competitions are accessed via the leaderboard page with a query parameter
- All menu items support active state highlighting with gradient backgrounds
- The sidebar is collapsible on desktop and shows as a bottom navigation on mobile

