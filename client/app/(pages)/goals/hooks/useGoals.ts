"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import type { Goal, Plan, NewGoalData } from "../goals-types";
import type { KanbanColumnId } from "../goals-constants";
import { KANBAN_COLUMNS } from "../goals-constants";
import { getColumnForStatus, getStatusForColumn } from "../goals-utils";

export function useGoals() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "paused">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // View toggle
  const [boardView, setBoardView] = useState<"board" | "list">("board");

  // DnD state
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);

  // Search expanded on mobile
  const [searchExpanded, setSearchExpanded] = useState(false);

  // DnD sensors
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/goals");
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchGoals = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const [goalsResponse, plansResponse] = await Promise.all([
        api.get<{ goals: Goal[] }>("/assessment/goals"),
        api.get<{ plans: Plan[] }>("/plans"),
      ]);

      if (goalsResponse.success && goalsResponse.data) {
        setGoals(goalsResponse.data.goals || []);
      }
      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data.plans || []);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code !== "NOT_FOUND") {
          setError(err.message);
        }
      } else {
        setError("Failed to load goals");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
    }
  }, [isAuthenticated, fetchGoals]);

  // Filtered goals (used for list view and search across board)
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchesFilter = filter === "all" || goal.status === filter;
      const matchesSearch =
        !searchQuery ||
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [goals, filter, searchQuery]);

  // Goals grouped by kanban column (search-filtered)
  const kanbanColumns = useMemo(() => {
    const searchFiltered = goals.filter((goal) => {
      return (
        !searchQuery ||
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    const grouped: Record<KanbanColumnId, Goal[]> = {
      active: [],
      in_progress: [],
      paused: [],
      completed: [],
    };

    for (const goal of searchFiltered) {
      const col = getColumnForStatus(goal.status);
      grouped[col].push(goal);
    }

    return grouped;
  }, [goals, searchQuery]);

  const stats = useMemo(() => ({
    total: goals.length,
    active: goals.filter((g) => g.status === "active").length,
    completed: goals.filter((g) => g.status === "completed").length,
    paused: goals.filter((g) => g.status === "paused").length,
    avgProgress: goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0,
    primaryGoal: goals.find((g) => g.isPrimary),
  }), [goals]);

  const activeGoal = useMemo(() => {
    if (!activeGoalId) return null;
    return goals.find((g) => g.id === activeGoalId) || null;
  }, [activeGoalId, goals]);

  // --- Handlers ---

  const handleCreateGoal = async (data: NewGoalData) => {
    setIsCreating(true);
    try {
      const startDate = new Date();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + data.durationWeeks * 7);

      await api.post("/assessment/goals", {
        category: data.category,
        pillar: data.pillar,
        isPrimary: data.isPrimary,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        targetUnit: data.targetUnit,
        currentValue: data.currentValue,
        timeline: {
          startDate: startDate.toISOString(),
          targetDate: targetDate.toISOString(),
          durationWeeks: data.durationWeeks,
        },
        motivation: data.motivation,
      });

      await fetchGoals();
      setIsCreateModalOpen(false);
      toast.success("Goal created successfully!");
    } catch (err) {
      console.error("Failed to create goal:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProgress = async (newValue: number) => {
    if (!selectedGoal) return;

    setIsUpdating(true);
    try {
      await api.patch(`/assessment/goals/${selectedGoal.id}`, {
        currentValue: newValue,
      });

      const newProgress = Math.min(100, Math.round((newValue / selectedGoal.targetValue) * 100));
      const autoCompleted = newProgress >= 100 && selectedGoal.status !== "completed";

      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoal.id
            ? {
                ...g,
                currentValue: newValue,
                progress: newProgress,
                ...(autoCompleted ? { status: "completed" } : {}),
              }
            : g
        )
      );

      setIsProgressModalOpen(false);
      setSelectedGoal(null);
      if (autoCompleted) {
        toast.success("Goal completed! Progress reached 100%");
      } else {
        toast.success("Progress updated successfully!");
      }
    } catch (err) {
      console.error("Failed to update progress:", err);
      toast.error("Failed to update progress");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (goal: Goal, newStatus: string) => {
    try {
      await api.patch(`/assessment/goals/${goal.id}`, { status: newStatus });
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, status: newStatus } : g))
      );
      toast.success(`Goal ${newStatus === "active" ? "activated" : newStatus === "paused" ? "paused" : "completed"}!`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update goal status");
    }
  };

  const handleDelete = async () => {
    if (!selectedGoal) return;

    setIsDeleting(true);
    try {
      await api.delete(`/assessment/goals/${selectedGoal.id}`);
      setGoals((prev) => prev.filter((g) => g.id !== selectedGoal.id));
      setIsDeleteModalOpen(false);
      setSelectedGoal(null);
      toast.success("Goal deleted successfully");
    } catch (err) {
      console.error("Failed to delete goal:", err);
      toast.error("Failed to delete goal");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditGoal = async (data: NewGoalData) => {
    if (!selectedGoal) return;

    setIsUpdating(true);
    try {
      const startDate = new Date(selectedGoal.startDate);
      const targetDate = new Date();
      targetDate.setDate(startDate.getDate() + data.durationWeeks * 7);

      await api.patch(`/assessment/goals/${selectedGoal.id}`, {
        category: data.category,
        pillar: data.pillar,
        isPrimary: data.isPrimary,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        targetUnit: data.targetUnit,
        currentValue: data.currentValue,
        timeline: {
          startDate: startDate.toISOString(),
          targetDate: targetDate.toISOString(),
          durationWeeks: data.durationWeeks,
        },
        motivation: data.motivation,
      });

      // Update local state
      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoal.id
            ? {
                ...g,
                category: data.category,
                pillar: data.pillar,
                title: data.title,
                description: data.description,
                targetValue: data.targetValue,
                targetUnit: data.targetUnit,
                currentValue: data.currentValue,
                durationWeeks: data.durationWeeks,
                motivation: data.motivation,
                isPrimary: data.isPrimary,
                progress: Math.min(100, Math.round((data.currentValue / data.targetValue) * 100)),
              }
            : g
        )
      );

      setIsEditModalOpen(false);
      setSelectedGoal(null);
      toast.success("Goal updated successfully!");
    } catch (err) {
      console.error("Failed to update goal:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update goal");
    } finally {
      setIsUpdating(false);
    }
  };

  // Selection handlers
  const toggleSelection = (goalId: string) => {
    setSelectedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedGoals(new Set(filteredGoals.map((g) => g.id)));
    setIsSelectionMode(true);
  };

  const clearSelection = () => {
    setSelectedGoals(new Set());
    setIsSelectionMode(false);
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedGoals.size === 0) return;

    setIsBulkProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedGoals).map((id) => api.delete(`/assessment/goals/${id}`))
      );
      setGoals((prev) => prev.filter((g) => !selectedGoals.has(g.id)));
      const count = selectedGoals.size;
      clearSelection();
      setIsBulkDeleteModalOpen(false);
      toast.success(`${count} goal${count > 1 ? "s" : ""} deleted successfully`);
    } catch (err) {
      console.error("Failed to delete goals:", err);
      toast.error("Failed to delete goals");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedGoals.size === 0) return;

    setIsBulkProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedGoals).map((id) =>
          api.patch(`/assessment/goals/${id}`, { status })
        )
      );
      setGoals((prev) =>
        prev.map((g) => (selectedGoals.has(g.id) ? { ...g, status } : g))
      );
      const count = selectedGoals.size;
      clearSelection();
      toast.success(`${count} goal${count > 1 ? "s" : ""} updated successfully`);
    } catch (err) {
      console.error("Failed to update goals:", err);
      toast.error("Failed to update goals");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // AI Goal creation
  const handleAIGoalAccept = async (data: {
    category: string;
    pillar: string;
    title: string;
    description: string;
    targetValue: number;
    targetUnit: string;
    durationWeeks: number;
    motivation: string;
    isPrimary: boolean;
    milestones?: Array<{
      title: string;
      targetValue: number;
      weekNumber: number;
    }>;
  }) => {
    setIsCreating(true);
    try {
      const startDate = new Date();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + data.durationWeeks * 7);

      await api.post("/assessment/goals", {
        category: data.category,
        pillar: data.pillar,
        isPrimary: data.isPrimary,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        targetUnit: data.targetUnit,
        currentValue: 0,
        timeline: {
          startDate: startDate.toISOString(),
          targetDate: targetDate.toISOString(),
          durationWeeks: data.durationWeeks,
        },
        motivation: data.motivation,
      });

      await fetchGoals();
      setIsAIModalOpen(false);
      toast.success("AI-generated goal created successfully!");
    } catch (err) {
      console.error("Failed to create AI goal:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setIsCreating(false);
    }
  };

  const getPlanForGoal = (goalId: string) => plans.find((p) => p.goalId === goalId);

  // --- DnD Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    setActiveGoalId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveGoalId(null);

    if (!over) return;

    const goalId = active.id as string;
    const overId = over.id as string;

    // Resolve target column: over.id can be a column ID or a goal ID
    const validColumnIds: string[] = KANBAN_COLUMNS.map((c) => c.id);
    let targetColumn: string;
    if (validColumnIds.includes(overId)) {
      targetColumn = overId;
    } else {
      // Dropped on a card -- find which column that card belongs to
      const overGoal = goals.find((g) => g.id === overId);
      if (!overGoal) return;
      targetColumn = getColumnForStatus(overGoal.status);
    }

    // Find the goal
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    // Check if this is actually a new column
    const currentColumn = getColumnForStatus(goal.status);
    if (currentColumn === targetColumn) return;

    const newStatus = getStatusForColumn(targetColumn);

    // Optimistic update
    const previousGoals = [...goals];
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updated = { ...g, status: newStatus };
        // If completing, also set currentValue = targetValue
        if (newStatus === "completed") {
          updated.currentValue = g.targetValue;
          updated.progress = 100;
        }
        return updated;
      })
    );

    try {
      const patchData: Record<string, unknown> = { status: newStatus };
      if (newStatus === "completed") {
        patchData.currentValue = goal.targetValue;
      }
      await api.patch(`/assessment/goals/${goalId}`, patchData);
      toast.success(
        `Goal moved to ${targetColumn === "other" ? "Other" : targetColumn.charAt(0).toUpperCase() + targetColumn.slice(1)}`
      );
    } catch (err) {
      // Rollback
      console.error("Failed to update goal status via drag:", err);
      setGoals(previousGoals);
      toast.error("Failed to move goal");
    }
  };

  return {
    // Auth state
    authLoading,
    isAuthenticated,

    // Data
    goals,
    setGoals,
    plans,
    filteredGoals,
    kanbanColumns,
    stats,
    activeGoal,

    // Loading/error
    isLoading,
    error,
    isUpdating,
    isCreating,
    isDeleting,
    isBulkProcessing,

    // Filters & search
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    searchExpanded,
    setSearchExpanded,

    // View
    boardView,
    setBoardView,
    showAnalytics,
    setShowAnalytics,

    // Expansion
    expandedGoal,
    setExpandedGoal,

    // Selection
    selectedGoals,
    isSelectionMode,
    setIsSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,

    // Modals
    isCreateModalOpen,
    setIsCreateModalOpen,
    isAIModalOpen,
    setIsAIModalOpen,
    isProgressModalOpen,
    setIsProgressModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isBulkDeleteModalOpen,
    setIsBulkDeleteModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedGoal,
    setSelectedGoal,

    // Handlers
    fetchGoals,
    handleCreateGoal,
    handleUpdateProgress,
    handleStatusChange,
    handleDelete,
    handleEditGoal,
    handleBulkDelete,
    handleBulkUpdateStatus,
    handleAIGoalAccept,
    getPlanForGoal,

    // DnD
    sensors,
    handleDragStart,
    handleDragEnd,
  };
}
