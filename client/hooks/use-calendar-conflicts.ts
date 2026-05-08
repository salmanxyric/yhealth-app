'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  scheduleService,
  type ScheduleConflict,
  type ConflictResolution,
} from '@/src/shared/services/schedule.service';
import {
  initSocket,
  subscribeToNotificationEvents,
  type NotificationEvent,
} from '@/lib/socket-client';
import { useAuth } from '@/app/context/AuthContext';

export function useCalendarConflicts(date?: string) {
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConflict, setActiveConflict] = useState<ScheduleConflict | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchConflicts = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await scheduleService.getPendingConflicts(date);
      setConflicts(res.data?.conflicts ?? []);
    } catch {
      // Silently fail — conflicts are non-critical
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, date]);

  const resolveConflict = useCallback(
    async (notificationId: string, resolution: ConflictResolution) => {
      try {
        await scheduleService.resolveConflict(notificationId, resolution);
        setConflicts((prev) => prev.filter((c) => c.notificationId !== notificationId));
        setIsModalOpen(false);
        setActiveConflict(null);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const openConflictModal = useCallback((conflict: ScheduleConflict) => {
    setActiveConflict(conflict);
    setIsModalOpen(true);
  }, []);

  const closeConflictModal = useCallback(() => {
    setIsModalOpen(false);
    setActiveConflict(null);
  }, []);

  // Fetch on mount and date change
  useEffect(() => {
    fetchConflicts();
  }, [fetchConflicts]);

  // Listen for new conflict notifications via Socket.IO
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = initSocket();
    if (!socket) return;

    const unsub = subscribeToNotificationEvents({
      onNew: (data: NotificationEvent) => {
        if ((data as any).category === 'schedule_conflict' || data.type === 'warning') {
          const metadata = (data as any).metadata;
          let newConflict: ScheduleConflict | null = null;

          if (metadata?.conflictSource === 'plan' && metadata?.planItem && metadata?.existingItem) {
            newConflict = {
              notificationId: data.id,
              date: metadata.date,
              conflictSource: 'plan',
              planItem: metadata.planItem,
              existingItem: metadata.existingItem,
            };
          } else if (metadata?.googleEvent && metadata?.manualItem) {
            newConflict = {
              notificationId: data.id,
              date: metadata.date,
              conflictSource: 'google',
              googleEvent: metadata.googleEvent,
              manualItem: metadata.manualItem,
            };
          }

          if (newConflict) {
            const conflict = newConflict;
            setConflicts((prev) => {
              if (prev.some((c) => c.notificationId === data.id)) return prev;
              return [conflict, ...prev];
            });
            setActiveConflict(conflict);
            setIsModalOpen(true);
          }
        }
      },
    });

    return unsub;
  }, [isAuthenticated]);

  return {
    conflicts,
    isLoading,
    activeConflict,
    isModalOpen,
    fetchConflicts,
    resolveConflict,
    openConflictModal,
    closeConflictModal,
  };
}
