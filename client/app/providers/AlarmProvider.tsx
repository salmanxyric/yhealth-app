'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAlarmSocket } from '@/app/(pages)/dashboard/hooks/useAlarmSocket';
import { AlarmModal } from '@/app/(pages)/dashboard/components/alarms/AlarmModal';

/** Deep link: Overview tab → Alarms */
export const ALARMS_OVERVIEW_PATH =
  '/dashboard?tab=overview&overviewSub=alarms' as const;

type AlarmRingContextValue = { isRinging: boolean };

const AlarmRingContext = createContext<AlarmRingContextValue>({
  isRinging: false,
});

export function useAlarmRing(): AlarmRingContextValue {
  return useContext(AlarmRingContext);
}

/**
 * Global Alarm Provider
 * Manages alarm socket connection and displays alarm modal on any page
 */
export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const prevConnectionState = useRef<boolean | null>(null);
  const prevAlarmState = useRef<string | null>(null);
  const lastNavigatedAlarmId = useRef<string | null>(null);

  // Handle navigation to workout page when alarm action is clicked
  const handleNavigateToWorkout = (workoutPlanId: string) => {
    if (process.env.NODE_ENV === 'development') {
       
      console.log('[AlarmProvider] Navigating to workout', { workoutPlanId });
    }
    router.push(`/workouts${workoutPlanId ? `?planId=${workoutPlanId}` : ''}`);
  };

  // Use alarm socket hook to establish global connection
  const {
    isConnected: isAlarmSocketConnected,
    activeAlarm,
    dismissAlarm,
    snoozeAlarm,
  } = useAlarmSocket(handleNavigateToWorkout);

  // Log connection state changes (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (prevConnectionState.current !== isAlarmSocketConnected) {
       
      console.log('[AlarmProvider] Connection state changed', {
        isConnected: isAlarmSocketConnected,
        previousState: prevConnectionState.current,
      });
      prevConnectionState.current = isAlarmSocketConnected;
    }
  }, [isAlarmSocketConnected]);

  // Log alarm state changes (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const currentAlarmId = activeAlarm?.alarmId || null;
    if (prevAlarmState.current !== currentAlarmId) {
      if (activeAlarm) {
         
        console.log('[AlarmProvider] Alarm activated', {
          alarmId: activeAlarm.alarmId,
          title: activeAlarm.title,
          workoutPlanId: activeAlarm.workoutPlanId,
          isConnected: isAlarmSocketConnected,
        });
      } else if (prevAlarmState.current !== null) {
         
        console.log('[AlarmProvider] Alarm dismissed', {
          previousAlarmId: prevAlarmState.current,
        });
      }
      prevAlarmState.current = currentAlarmId;
    }
  }, [activeAlarm, isAlarmSocketConnected]);

  // When an alarm fires, open Overview > Alarms behind the global modal
  useEffect(() => {
    if (!activeAlarm) {
      lastNavigatedAlarmId.current = null;
      return;
    }
    const id = activeAlarm.alarmId;
    if (lastNavigatedAlarmId.current === id) return;
    lastNavigatedAlarmId.current = id;
    router.replace(ALARMS_OVERVIEW_PATH, { scroll: false });
  }, [activeAlarm, router]);

  // Log connection health periodically (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        console.log('[AlarmProvider] Connection health check', {
          isConnected: isAlarmSocketConnected,
          hasActiveAlarm: !!activeAlarm,
          activeAlarmId: activeAlarm?.alarmId || null,
        });
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAlarmSocketConnected, activeAlarm]);

  const isRinging = !!activeAlarm;

  return (
    <AlarmRingContext.Provider value={{ isRinging }}>
      {children}
      <AlarmModal
        isOpen={!!activeAlarm}
        alarm={activeAlarm}
        onDismiss={dismissAlarm}
        onSnooze={snoozeAlarm}
        onAction={activeAlarm?.workoutPlanId ? handleNavigateToWorkout : undefined}
      />
    </AlarmRingContext.Provider>
  );
}

