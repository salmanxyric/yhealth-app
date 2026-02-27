# Chat Health Profile Modal

## Overview

The Chat Health Profile Modal is a WHOOP-style health metrics display that allows users to view each other's daily health data within chat conversations. This feature provides a comprehensive view of key health metrics in an elegant, modern interface inspired by the WHOOP fitness tracker app.

## Features

### Health Metrics Displayed

The modal displays 6 key health metrics:

1. **Sleep**
   - Quality score (percentage)
   - Duration (hours and minutes)
   - Sleep efficiency percentage

2. **Recovery**
   - Recovery score (percentage)
   - HRV (Heart Rate Variability) in milliseconds
   - Resting Heart Rate (RHR) in bpm

3. **Strain**
   - Daily strain score (0-21 scale)
   - Normalized strain value

4. **Stress**
   - Stress level (0-100%)
   - Calculated from recovery data or direct stress measurements
   - Color-coded indicators (Low/Moderate/High)

5. **Water Intake**
   - Daily consumption in ml/L
   - Target amount
   - Progress percentage

6. **Heart Rate**
   - Resting heart rate (bpm)
   - Average heart rate (bpm)
   - Maximum heart rate (bpm)

7. **Temperature**
   - Body temperature in Celsius
   - Status indicator (Low/Normal/Elevated)

## User Interface

### Design Features

- **WHOOP-Style Circular Progress Indicators**: Large, color-coded circular progress rings that match the WHOOP app aesthetic
- **Dark Gradient Background**: Modern dark theme with gradient backgrounds
- **Color-Coded Metrics**: 
  - Green (≥75%): Excellent
  - Blue (50-74%): Good
  - Amber (25-49%): Fair
  - Red (<25%): Poor
- **Responsive Grid Layout**: Adapts from 1 column (mobile) to 3 columns (desktop)
- **Smooth Animations**: Transitions and hover effects for better UX
- **Additional Details Cards**: Expandable detail cards below main metrics

### Accessing the Modal

Users can open the health profile modal by:
1. Clicking on a user's avatar in a chat message
2. Clicking on a user's name in group chats
3. The modal automatically fetches the latest daily health data

## Privacy & Security

### Access Control

- **Chat-Based Privacy**: Users can only view health profiles of people they have active chat conversations with
- **Backend Verification**: The API endpoint verifies that both users are participants in the same chat before returning data
- **Daily Data Only**: Only today's health metrics are displayed (not historical data)

### Data Sources

- **WHOOP Integration**: Sleep, recovery, strain, heart rate, and temperature data from WHOOP device
- **Water Intake Logs**: Daily water consumption from the water intake tracking system
- **Stress Calculation**: Stress level calculated from recovery score (inverse relationship) or direct stress measurements

## Technical Implementation

### Backend

**Service**: `server/src/services/whoop-analytics.service.ts`

```typescript
getUserHealthProfile(userId: string, startDate: Date, endDate: Date): Promise<{
  currentRecovery: { score, hrv, rhr, skinTemp, timestamp } | null;
  currentSleep: { duration, quality, efficiency, timestamp } | null;
  todayStrain: { score, normalized, avgHeartRate, maxHeartRate, timestamp } | null;
  waterIntake: { mlConsumed, targetMl, percentage, timestamp } | null;
  stress: { level, timestamp } | null;
}>
```

**API Endpoint**: `GET /api/whoop/analytics/user-profile?userId={userId}`

**Privacy Check**: Verifies users are in a chat together before returning data

### Frontend

**Component**: `client/app/(pages)/chat/components/UserHealthProfileModal.tsx`

**Key Features**:
- Uses `useFetch` hook for data fetching
- Circular progress component with dynamic color coding
- Responsive grid layout
- Error handling and loading states
- Empty state when no data is available

**Integration Points**:
- `ChatMessageItem.tsx`: Handles user avatar/name clicks
- `MessagesView.tsx`: Manages modal state and user selection
- `ChatHeader.tsx`: Can trigger modal for other chat participants

## Data Flow

1. User clicks on another user's avatar/name in chat
2. `MessagesView` component sets `selectedUser` state
3. `UserHealthProfileModal` component mounts and fetches data
4. API endpoint verifies chat relationship
5. Service queries:
   - `health_data_records` table for WHOOP data
   - `water_intake_logs` table for water consumption
6. Data is formatted and returned
7. Modal displays metrics with circular progress indicators

## Styling

### Color Scheme

- **Background**: Dark gradient (`from-slate-950 via-slate-900 to-slate-950`)
- **Borders**: Subtle slate borders with opacity
- **Text**: White for headings, slate-400 for secondary text
- **Progress Colors**: Dynamic based on metric performance

### Typography

- **Title**: 3xl font-bold
- **Labels**: Uppercase, tracking-wider, font-semibold
- **Values**: Large, bold numbers with color matching progress

### Layout

- **Modal Size**: Max width 5xl, max height 95vh
- **Grid**: Responsive 1/2/3 column layout
- **Spacing**: Generous padding and gaps for readability

## Future Enhancements

Potential improvements:
- Historical data view (7-day, 30-day trends)
- Comparison with previous days
- Export health profile as PDF
- Share health profile link
- Customizable metric display
- Integration with more health data sources

## Related Documentation

- [WHOOP Integration Guide](../client/docs/WHOOP_CLIENT_AUTH_GUIDE.md)
- [Chat System Architecture](./voice_call_system_design.md)
- [API Documentation](../server/docs/README.md)

## Support

For issues or questions:
- Check the API endpoint logs for data fetching errors
- Verify WHOOP integration is active and syncing
- Ensure users have an active chat conversation
- Check water intake logs are being recorded

