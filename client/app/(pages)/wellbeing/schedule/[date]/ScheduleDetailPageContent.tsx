"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { Loader2, ArrowLeft, Calendar as CalendarIcon, Plus, Link2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { DashboardLayout } from "@/components/layout";
import { scheduleService, type DailySchedule, type ScheduleItem, type ScheduleLink } from "@/src/shared/services/schedule.service";
import { ActivityFormModal } from "@/app/(pages)/dashboard/components/wellbeing/schedule/ActivityFormModal";
import { ConfirmModal } from "@/app/(pages)/dashboard/components/wellbeing/schedule/ConfirmModal";
import { AlertModal } from "@/app/(pages)/dashboard/components/wellbeing/schedule/AlertModal";
import ScheduleWorkflow from "@/app/(pages)/dashboard/components/wellbeing/schedule/ScheduleWorkflow";
import { ApiError } from "@/lib/api-client";

function ScheduleDetailLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
        <p className="text-slate-400">Loading schedule...</p>
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};



// Helper function to convert hex to rgba with opacity
const _hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper function to format time for display (converts HH:mm:ss or HH:mm to 12-hour format)
const _formatTimeForDisplay = (time: string): string => {
  if (!time) return '';
  // Handle both HH:mm:ss and HH:mm formats
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time;

  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Helper function to convert time string (HH:mm:ss or HH:mm) to minutes
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

// Helper function to calculate duration in minutes from start and end time
const _calculateDuration = (startTime: string, endTime?: string, durationMinutes?: number): number | null => {
  if (endTime) {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const duration = end - start;
    return duration > 0 ? duration : null;
  }
  return durationMinutes || null;
};


function ScheduleDetailContent() {
  const router = useRouter();
  const params = useParams();
  const dateParam = params.date as string;
  const [schedule, setSchedule] = useState<DailySchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [linkSource, setLinkSource] = useState<ScheduleItem | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemPositions, setItemPositions] = useState<Record<string, { x: number; y: number }>>({});
  const itemsRef = useRef<ScheduleItem[]>([]);

  // Confirmation and Alert modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: "success" | "info" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Helper functions to show modals
  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    variant: "danger" | "warning" | "info" | "success" = "danger"
  ) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, variant });
  }, []);

  const showAlert = useCallback((
    title: string,
    message: string,
    variant: "success" | "info" | "warning" = "info"
  ) => {
    setAlertModal({ isOpen: true, title, message, variant });
  }, []);


  // Parse date from URL
  let scheduleDate: string;
  try {
    const parsedDate = parseISO(dateParam);
    scheduleDate = format(parsedDate, "yyyy-MM-dd");
  } catch {
    scheduleDate = format(new Date(), "yyyy-MM-dd");
  }

  const formattedDate = format(parseISO(scheduleDate), "EEEE, MMMM d, yyyy");

  useEffect(() => {
    loadSchedule(true); // Force fresh load on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleDate]);

  const loadSchedule = async (forceFresh = false) => {
    setIsLoading(true);
    try {
      // If forceFresh, add timestamp to bypass any client-side caching
      const dateStr = forceFresh ? `${scheduleDate}?_t=${Date.now()}` : scheduleDate;
      const result = await scheduleService.getScheduleByDate(dateStr);
      if (result.success && result.data) {
        setSchedule(result.data.schedule);
        if (result.data.schedule) {
          itemsRef.current = result.data.schedule.items;
          // Load saved positions from metadata
          const positions: Record<string, { x: number; y: number }> = {};
          result.data.schedule.items.forEach((item) => {
            const metadata = item.metadata as { x?: number; y?: number } | undefined;
            if (metadata && typeof metadata.x === 'number' && typeof metadata.y === 'number') {
              positions[item.id] = { x: metadata.x, y: metadata.y };
              console.log(`Loaded position for item ${item.id}:`, { x: metadata.x, y: metadata.y });
            }
          });
          console.log(`Loaded ${Object.keys(positions).length} saved positions from database`);
          setItemPositions(positions);
        }
      } else {
        setSchedule(null);
        itemsRef.current = [];
        setItemPositions({});
      }
    } catch (err) {
      console.error("Failed to load schedule:", err);
      setSchedule(null);
      itemsRef.current = [];
      setItemPositions({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      // First check if schedule already exists
      const existingResult = await scheduleService.getScheduleByDate(scheduleDate);
      if (existingResult.success && existingResult.data?.schedule) {
        // Schedule already exists, just load it
        setSchedule(existingResult.data.schedule);
        itemsRef.current = existingResult.data.schedule.items;
        return;
      }

      // Create new schedule if it doesn't exist
      const result = await scheduleService.createSchedule({
        schedule_date: scheduleDate,
      });
      if (result.success && result.data) {
        setSchedule(result.data.schedule);
        itemsRef.current = result.data.schedule.items;
      }
    } catch (err: unknown) {
      console.error("Failed to create schedule:", err);
      // If error is "already exists", try to load it
      const errorMessage = err instanceof ApiError || err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("already exists") || errorMessage.includes("Schedule already exists")) {
        try {
          const existingResult = await scheduleService.getScheduleByDate(scheduleDate);
          if (existingResult.success && existingResult.data?.schedule) {
            setSchedule(existingResult.data.schedule);
            itemsRef.current = existingResult.data.schedule.items;
          }
        } catch (loadErr) {
          console.error("Failed to load existing schedule:", loadErr);
        }
      }
    }
  };

  const handleAddItem = async () => {
    if (!schedule) {
      await handleCreateSchedule();
      // Wait a bit for schedule to be created/loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      // Reload to get the updated schedule
      await loadSchedule();
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = Math.floor(now.getMinutes() / 30) * 30;

    try {
      const result = await scheduleService.addScheduleItem(schedule.id, {
        title: "New Activity",
        start_time: `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`,
        duration_minutes: 30,
        position: schedule.items.length,
        metadata: {
          x: 100,
          y: 100,
        },
      });

      if (result.success && result.data?.item) {
        // Update state directly instead of reloading
        const newItem = result.data.item;
        setSchedule((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: [...prev.items, newItem],
          };
        });
        itemsRef.current = [...itemsRef.current, newItem];
        // Load position from metadata
        const metadata = newItem.metadata as { x?: number; y?: number } | undefined;
        if (metadata && typeof metadata.x === 'number' && typeof metadata.y === 'number') {
          setItemPositions((prev) => ({
            ...prev,
            [newItem.id]: { x: metadata.x!, y: metadata.y! },
          }));
        }
      }
    } catch (err) {
      console.error("Failed to add item:", err);
    }
  };

  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (item: ScheduleItem) => {
    showConfirm(
      "Delete Activity",
      `Are you sure you want to delete "${item.title}"? This will also remove all connections to this activity.`,
      async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const result = await scheduleService.deleteScheduleItem(item.id);
          if (result.success) {
            // Update state immediately - this will trigger React Flow to remove the node
            setSchedule((prev) => {
              if (!prev) return null;
              // Remove item and all links connected to it
              const updatedItems = prev.items.filter((i) => i.id !== item.id);
              const updatedLinks = prev.links.filter(
                (link) => link.sourceItemId !== item.id && link.targetItemId !== item.id
              );
              return {
                ...prev,
                items: updatedItems,
                links: updatedLinks,
              };
            });
            // Update refs immediately
            itemsRef.current = itemsRef.current.filter((i) => i.id !== item.id);
            // Remove position from state
            setItemPositions((prev) => {
              const updated = { ...prev };
              delete updated[item.id];
              return updated;
            });
            showAlert("Success", "Activity deleted successfully", "success");
          } else {
            showAlert("Error", "Failed to delete activity. Please try again.", "warning");
          }
        } catch (err) {
          console.error("Failed to delete item:", err);
          showAlert("Error", "Failed to delete activity. Please try again.", "warning");
        }
      },
      "danger"
    );
  };

  const _handleStartLinking = (item: ScheduleItem) => {
    if (!isLinking) {
      setIsLinking(true);
    }
    setLinkSource(item);
  };

  const _handleCreateLink = async (targetItem: ScheduleItem) => {
    if (!schedule || !linkSource || linkSource.id === targetItem.id) {
      setIsLinking(false);
      setLinkSource(null);
      return;
    }

    // Check if link already exists
    const linkExists = schedule.links.some(
      (l) =>
        (l.sourceItemId === linkSource.id && l.targetItemId === targetItem.id) ||
        (l.sourceItemId === targetItem.id && l.targetItemId === linkSource.id)
    );

    if (linkExists) {
      showAlert("Link Exists", "A link already exists between these activities.", "info");
      setIsLinking(false);
      setLinkSource(null);
      return;
    }

    try {
      const result = await scheduleService.createScheduleLink(schedule.id, {
        source_item_id: linkSource.id,
        target_item_id: targetItem.id,
        link_type: "sequential",
      });

      if (result.success && result.data) {
        // Update state directly instead of reloading
        setSchedule((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            links: [...prev.links, result.data!.link],
          };
        });
      }
    } catch (err) {
      console.error("Failed to create link:", err);
    } finally {
      setIsLinking(false);
      setLinkSource(null);
    }
  };

  const _handleDeleteLink = async (link: ScheduleLink) => {
    if (!schedule) return;

    const sourceItem = schedule.items.find((i) => i.id === link.sourceItemId);
    const targetItem = schedule.items.find((i) => i.id === link.targetItemId);
    const sourceTitle = sourceItem?.title || "Activity";
    const targetTitle = targetItem?.title || "Activity";

    showConfirm(
      "Delete Connection",
      `Are you sure you want to delete the connection between "${sourceTitle}" and "${targetTitle}"?`,
      async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const result = await scheduleService.deleteScheduleLink(link.id);
          if (result.success) {
            setSchedule({
              ...schedule,
              links: schedule.links.filter((l) => l.id !== link.id),
            });
            showAlert("Connection Deleted", "The connection has been removed.", "success");
          } else {
            showAlert("Error", "Failed to delete connection. Please try again.", "warning");
          }
        } catch (err) {
          console.error("Failed to delete link:", err);
          showAlert("Error", "Failed to delete connection. Please try again.", "warning");
        }
      },
      "danger"
    );
  };

  const handlePositionChange = useCallback(async (itemId: string, position: { x: number; y: number }) => {
    if (!schedule) return;

    const item = schedule.items.find((i) => i.id === itemId);
    if (!item) return;

    // Use absolute position directly (React Flow provides absolute positions)
    const newX = Math.max(0, position.x);
    const newY = Math.max(0, position.y);

    // Update local state immediately for smooth UX
    setItemPositions((prev) => ({
      ...prev,
      [itemId]: { x: newX, y: newY },
    }));

    // Save to database
    try {
      // Ensure we merge with existing metadata properly
      const existingMetadata = (item.metadata as Record<string, unknown>) || {};
      const updatedMetadata = {
        ...existingMetadata,
        x: newX,
        y: newY,
      };

      console.log(`Saving position for item ${itemId}:`, { x: newX, y: newY });

      const result = await scheduleService.updateScheduleItem(itemId, {
        metadata: updatedMetadata,
      });

      // Update the item in schedule to reflect the new metadata
      if (result.success && result.data?.item) {
        console.log(`Position saved successfully for item ${itemId}`);
        setSchedule((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.id === itemId ? result.data!.item : i
            ),
          };
        });
      } else {
        console.error("Failed to save position: API returned unsuccessful response");
      }
    } catch (err) {
      console.error("Failed to update position:", err);
      // Revert on error - remove from itemPositions to fall back to default
      setItemPositions((prev) => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, itemPositions]);

  // Helper function to convert time string (HH:mm) to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to get end time of an activity
  const getEndTime = (item: ScheduleItem): number => {
    const startMinutes = timeToMinutes(item.startTime);
    if (item.endTime) {
      return timeToMinutes(item.endTime);
    }
    if (item.durationMinutes) {
      return startMinutes + item.durationMinutes;
    }
    // Default 30 minutes if no duration specified
    return startMinutes + 30;
  };

  // Helper function to get item position (saved position or time-based default)
  const getItemPosition = useCallback((item: ScheduleItem) => {
    // First check if we have a saved position in state (highest priority)
    if (itemPositions[item.id]) {
      return itemPositions[item.id];
    }

    // Check metadata for saved position (from database)
    const savedPos = (item.metadata as { x?: number; y?: number }) || {};
    if (savedPos.x !== undefined && savedPos.y !== undefined) {
      // Also update state to keep it in sync
      setItemPositions((prev) => {
        if (prev[item.id]) return prev; // Don't overwrite if already set
        return {
          ...prev,
          [item.id]: { x: savedPos.x!, y: savedPos.y! },
        };
      });
      return { x: savedPos.x, y: savedPos.y };
    }

    // Fallback to time-based positioning
    if (!schedule || schedule.items.length === 0) {
      return { x: 100, y: 100 };
    }

    // Find earliest and latest times
    const allTimes = schedule.items.flatMap((i) => {
      const start = timeToMinutes(i.startTime);
      const end = getEndTime(i);
      return [start, end];
    });
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    const timeRange = maxTime - minTime || 1440; // Default to 24 hours if same time

    // Calculate X position based on start time (time flows left to right)
    const startMinutes = timeToMinutes(item.startTime);
    const timeProgress = (startMinutes - minTime) / timeRange;
    const canvasWidth = 1400; // Available canvas width
    const x = 150 + timeProgress * canvasWidth;

    // Calculate Y position - group items that overlap in time
    const overlappingGroups: ScheduleItem[][] = [];
    const processed = new Set<string>();

    schedule.items.forEach((currentItem) => {
      if (processed.has(currentItem.id)) return;

      const currentStart = timeToMinutes(currentItem.startTime);
      const currentEnd = getEndTime(currentItem);
      const group = [currentItem];
      processed.add(currentItem.id);

      schedule.items.forEach((otherItem) => {
        if (processed.has(otherItem.id)) return;

        const otherStart = timeToMinutes(otherItem.startTime);
        const otherEnd = getEndTime(otherItem);

        // Check if items overlap in time
        if (
          (otherStart >= currentStart && otherStart < currentEnd) ||
          (otherEnd > currentStart && otherEnd <= currentEnd) ||
          (otherStart <= currentStart && otherEnd >= currentEnd)
        ) {
          group.push(otherItem);
          processed.add(otherItem.id);
        }
      });

      overlappingGroups.push(group);
    });

    // Find which group this item belongs to
    const itemGroup = overlappingGroups.find((group) =>
      group.some((i) => i.id === item.id)
    );
    const groupIndex = overlappingGroups.indexOf(itemGroup || []);
    const itemIndexInGroup = itemGroup?.findIndex((i) => i.id === item.id) || 0;

    // Position items in the same time group vertically
    const ySpacing = 200;
    const y = 150 + groupIndex * ySpacing + itemIndexInGroup * 180;

    return { x, y };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemPositions, schedule]);

  // Auto-generate connections based on time relationships
  const generateTimeBasedConnections = () => {
    if (!schedule || schedule.items.length < 2) return;

    const newLinks: Array<{ sourceId: string; targetId: string; delay: number }> = [];

    schedule.items.forEach((sourceItem) => {
      const sourceEnd = getEndTime(sourceItem);

      schedule.items.forEach((targetItem) => {
        if (sourceItem.id === targetItem.id) return;

        const targetStart = timeToMinutes(targetItem.startTime);
        const timeGap = targetStart - sourceEnd;

        // Connect if activities are sequential (target starts right after source ends)
        // or if there's a small gap (less than 30 minutes)
        if (timeGap >= 0 && timeGap <= 30) {
          // Check if link already exists
          const linkExists = schedule.links.some(
            (l) =>
              (l.sourceItemId === sourceItem.id && l.targetItemId === targetItem.id) ||
              (l.sourceItemId === targetItem.id && l.targetItemId === sourceItem.id)
          );

          if (!linkExists) {
            newLinks.push({
              sourceId: sourceItem.id,
              targetId: targetItem.id,
              delay: timeGap,
            });
          }
        }
      });
    });

    return newLinks;
  };

  const _getLinkPath = (link: ScheduleLink) => {
    const sourceItem = schedule?.items.find((i) => i.id === link.sourceItemId);
    const targetItem = schedule?.items.find((i) => i.id === link.targetItemId);
    if (!sourceItem || !targetItem || !schedule) return null;

    const sourcePos = getItemPosition(sourceItem);
    const targetPos = getItemPosition(targetItem);

    // Calculate connection points based on time flow
    const sourceEnd = getEndTime(sourceItem);
    const targetStart = timeToMinutes(targetItem.startTime);
    const timeGap = targetStart - sourceEnd;

    // Connection point on source (right side)
    const sourceConnectionX = sourcePos.x + 240; // Card width ~240px
    const sourceConnectionY = sourcePos.y + 60; // Middle of card

    // Connection point on target (left side)
    const targetConnectionX = targetPos.x;
    const targetConnectionY = targetPos.y + 60; // Middle of card

    // Calculate bezier curve control points for smooth flow
    const dx = targetConnectionX - sourceConnectionX;

    // Control points create a smooth curve following time flow
    const controlPoint1X = sourceConnectionX + Math.max(dx * 0.3, 50);
    const controlPoint1Y = sourceConnectionY;
    const controlPoint2X = targetConnectionX - Math.max(dx * 0.3, 50);
    const controlPoint2Y = targetConnectionY;

    // Adjust curve based on time gap
    const gapFactor = Math.min(timeGap / 30, 1); // Normalize gap (0-30 min)
    const curveHeight = gapFactor * 30; // More curve for larger gaps

    return {
      path: `M ${sourceConnectionX} ${sourceConnectionY} C ${controlPoint1X} ${controlPoint1Y - curveHeight}, ${controlPoint2X} ${controlPoint2Y - curveHeight}, ${targetConnectionX} ${targetConnectionY}`,
      sourcePos,
      targetPos,
      sourceConnection: { x: sourceConnectionX, y: sourceConnectionY },
      targetConnection: { x: targetConnectionX, y: targetConnectionY },
      timeGap,
    };
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="wellbeing">
      <div className="max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Back Button */}
          <motion.div variants={cardVariants}>
            <motion.button
              onClick={() => router.push("/wellbeing/schedule")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all group mb-4"
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Calendar</span>
            </motion.button>
          </motion.div>

          {/* Header */}
          <motion.div
            variants={cardVariants}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 blur-3xl rounded-full" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/30"
                >
                  <CalendarIcon className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent">
                    {formattedDate}
                  </h1>
                  <p className="text-slate-400 mt-1 text-lg">
                    Plan your day with time-based activities
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={async () => {
                    if (!schedule || schedule.items.length < 2) {
                      showAlert("Not Enough Activities", "You need at least 2 activities to auto-connect.", "warning");
                      return;
                    }

                    const timeConnections = generateTimeBasedConnections();
                    if (!timeConnections || timeConnections.length === 0) {
                      showAlert("No Connections Found", "No time-based connections found. Activities may not be sequential.", "info");
                      return;
                    }

                    try {
                      const linkPromises = timeConnections.map((conn) =>
                        scheduleService.createScheduleLink(schedule.id, {
                          source_item_id: conn.sourceId,
                          target_item_id: conn.targetId,
                          link_type: "sequential",
                          delay_minutes: conn.delay,
                        })
                      );

                      const results = await Promise.all(linkPromises);
                      const successfulLinks = results
                        .filter((r) => r.success && r.data?.link)
                        .map((r) => r.data!.link);

                      if (successfulLinks.length > 0) {
                        // Update state directly instead of reloading
                        setSchedule((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            links: [...prev.links, ...successfulLinks],
                          };
                        });
                        showAlert("Success", `Successfully created ${successfulLinks.length} time-based connection(s)!`, "success");
                      }
                    } catch (err) {
                      console.error("Failed to create time connections:", err);
                      showAlert("Error", "Failed to create some connections. Some may already exist.", "warning");
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-medium transition-all bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-500/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link2 className="w-4 h-4 inline mr-2" />
                  Auto-Connect by Time
                </motion.button>
                <motion.button
                  onClick={() => {
                    if (isLinking) {
                      setIsLinking(false);
                      setLinkSource(null);
                    } else {
                      if (schedule && schedule.items.length < 2) {
                        showAlert("Not Enough Activities", "You need at least 2 activities to create a link.", "warning");
                        return;
                      }
                      setIsLinking(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isLinking
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link2 className="w-4 h-4 inline mr-2" />
                  {isLinking ? "Cancel Linking" : "Manual Link"}
                </motion.button>
                <motion.button
                  onClick={handleAddItem}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  Add Activity
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Workflow Canvas */}
          <motion.div variants={cardVariants}>
            {!schedule || schedule.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-center p-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="p-6 rounded-full bg-emerald-500/10 mb-4"
                >
                  <Sparkles className="w-12 h-12 text-emerald-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">No Schedule Yet</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-sm">
                  Create your first activity to start building your daily schedule
                </p>
                <motion.button
                  onClick={handleCreateSchedule}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  Create Schedule
                </motion.button>
              </div>
            ) : (
              <ScheduleWorkflow
                schedule={schedule}
                onNodeEdit={handleEditItem}
                onNodeDelete={handleDeleteItem}
                onNodeCreate={async (position: { x: number; y: number }) => {
                  if (!schedule) {
                    await handleCreateSchedule();
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await loadSchedule();
                    return;
                  }

                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinute = Math.floor(now.getMinutes() / 30) * 30;

                  try {
                    const result = await scheduleService.addScheduleItem(schedule.id, {
                      title: "New Activity",
                      start_time: `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`,
                      duration_minutes: 30,
                      position: schedule.items.length,
                      metadata: {
                        x: position.x,
                        y: position.y,
                      },
                    });

                    if (result.success && result.data) {
                      setSchedule((prev) => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          items: [...prev.items, result.data!.item],
                        };
                      });
                      itemsRef.current = [...itemsRef.current, result.data!.item];
                      // Load position from metadata
                      const metadata = result.data.item.metadata as { x?: number; y?: number } | undefined;
                      if (metadata && typeof metadata.x === 'number' && typeof metadata.y === 'number') {
                        setItemPositions((prev) => ({
                          ...prev,
                          [result.data!.item.id]: { x: metadata.x!, y: metadata.y! },
                        }));
                      }
                    }
                  } catch (err) {
                    console.error("Failed to create item:", err);
                    showAlert("Error", "Failed to create activity. Please try again.", "warning");
                  }
                }}
                onNodePositionChange={handlePositionChange}
                onEdgeCreate={async (sourceId: string, targetId: string) => {
                  if (!schedule) return;

                  // Check if link already exists
                  const linkExists = schedule.links.some(
                    (l) =>
                      (l.sourceItemId === sourceId && l.targetItemId === targetId) ||
                      (l.sourceItemId === targetId && l.targetItemId === sourceId)
                  );

                  if (linkExists) {
                    showAlert("Link Exists", "A link already exists between these activities.", "info");
                    return;
                  }

                  try {
                    const result = await scheduleService.createScheduleLink(schedule.id, {
                      source_item_id: sourceId,
                      target_item_id: targetId,
                      link_type: "sequential",
                    });

                    if (result.success && result.data) {
                      setSchedule((prev) => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          links: [...prev.links, result.data!.link],
                        };
                      });
                    }
                  } catch (err) {
                    console.error("Failed to create link:", err);
                    showAlert("Error", "Failed to create connection. Please try again.", "warning");
                  }
                }}
                onEdgeDelete={async (linkId: string) => {
                  if (!schedule) return;

                  const link = schedule.links.find((l) => l.id === linkId);
                  if (!link) return;

                  const sourceItem = schedule.items.find((i) => i.id === link.sourceItemId);
                  const targetItem = schedule.items.find((i) => i.id === link.targetItemId);
                  const sourceTitle = sourceItem?.title || "Activity";
                  const targetTitle = targetItem?.title || "Activity";

                  showConfirm(
                    "Delete Connection",
                    `Are you sure you want to delete the connection between "${sourceTitle}" and "${targetTitle}"?`,
                    async () => {
                      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                      try {
                        const result = await scheduleService.deleteScheduleLink(linkId);
                        if (result.success) {
                          setSchedule((prev) => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              links: prev.links.filter((l) => l.id !== linkId),
                            };
                          });
                          showAlert("Connection Deleted", "The connection has been removed.", "success");
                        } else {
                          showAlert("Error", "Failed to delete connection. Please try again.", "warning");
                        }
                      } catch (err) {
                        console.error("Failed to delete link:", err);
                        showAlert("Error", "Failed to delete connection. Please try again.", "warning");
                      }
                    },
                    "danger"
                  );
                }}
                onAutoConnect={async () => {
                  if (!schedule || schedule.items.length < 2) return;

                  const timeConnections = generateTimeBasedConnections();
                  if (!timeConnections || timeConnections.length === 0) return;

                  try {
                    const linkPromises = timeConnections.map((conn) =>
                      scheduleService.createScheduleLink(schedule.id, {
                        source_item_id: conn.sourceId,
                        target_item_id: conn.targetId,
                        link_type: "sequential",
                        delay_minutes: conn.delay,
                      })
                    );

                    const results = await Promise.all(linkPromises);
                    const successfulLinks = results
                      .filter((r) => r.success && r.data?.link)
                      .map((r) => r.data!.link);

                    if (successfulLinks.length > 0) {
                      setSchedule((prev) => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          links: [...prev.links, ...successfulLinks],
                        };
                      });
                    }
                  } catch (err) {
                    console.error("Failed to create time connections:", err);
                  }
                }}
              />
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <ActivityFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        activity={editingItem}
        onSave={(updatedItem) => {
          if (updatedItem) {
            // Update state directly instead of reloading
            if (editingItem) {
              // Update existing item
              setSchedule((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  items: prev.items.map((item) =>
                    item.id === updatedItem.id ? updatedItem : item
                  ),
                };
              });
              itemsRef.current = itemsRef.current.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
              );
              // Update position if metadata changed
              const metadata = updatedItem.metadata as { x?: number; y?: number } | undefined;
              if (metadata && typeof metadata.x === 'number' && typeof metadata.y === 'number') {
                setItemPositions((prev) => ({
                  ...prev,
                  [updatedItem.id]: { x: metadata.x!, y: metadata.y! },
                }));
              }
            } else {
              // Add new item
              setSchedule((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  items: [...prev.items, updatedItem],
                };
              });
              itemsRef.current = [...itemsRef.current, updatedItem];
              // Load position from metadata
              const metadata = updatedItem.metadata as { x?: number; y?: number } | undefined;
              if (metadata && typeof metadata.x === 'number' && typeof metadata.y === 'number') {
                setItemPositions((prev) => ({
                  ...prev,
                  [updatedItem.id]: { x: metadata.x!, y: metadata.y! },
                }));
              }
            }
          } else {
            // Fallback to reload if no item returned
            loadSchedule();
          }
        }}
        scheduleId={schedule?.id}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.variant === "danger" ? "Delete" : "Confirm"}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </DashboardLayout>
  );
}

export default function ScheduleDetailPageContent() {
  return (
    <Suspense fallback={<ScheduleDetailLoading />}>
      <ScheduleDetailContent />
    </Suspense>
  );
}
