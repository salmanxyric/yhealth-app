"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  RotateCcw,
  Lightbulb,
  Star,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useGoals } from "./hooks/useGoals";
import { KANBAN_COLUMNS } from "./goals-constants";
import { GoalsTopBar } from "./components/GoalsTopBar";
import { GoalsStatsRow } from "./components/GoalsStatsRow";
import { KanbanColumn } from "./components/KanbanColumn";
import { DraggableGoalCard } from "./components/DraggableGoalCard";
import { GoalCardOverlay } from "./components/GoalCardOverlay";
import { GoalDetailModal } from "./components/GoalDetailModal";
import { CreateGoalModal } from "./components/CreateGoalModal";
import { EditGoalModal } from "./components/EditGoalModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { GoalListView } from "./components/GoalListView";
import { AIGoalModal } from "./components/AIGoalModal";
import { GoalsAnalytics } from "./components/GoalsAnalytics";
import TaskProgressModal from "./components/TaskProgressModal";

export default function GoalsPageContent() {
  const {
    authLoading,
    goals,
    setGoals,
    filteredGoals,
    kanbanColumns,
    stats,
    activeGoal,
    isLoading,
    error,
    isUpdating,
    isCreating,
    isDeleting,
    isBulkProcessing,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    searchExpanded,
    setSearchExpanded,
    boardView,
    setBoardView,
    showAnalytics,
    setShowAnalytics,
    expandedGoal,
    setExpandedGoal,
    selectedGoals,
    isSelectionMode,
    setIsSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
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
    fetchGoals,
    handleCreateGoal,
    handleStatusChange,
    handleDelete,
    handleEditGoal,
    handleBulkDelete,
    handleBulkUpdateStatus,
    handleAIGoalAccept,
    getPlanForGoal,
    sensors,
    handleDragStart,
    handleDragEnd,
  } = useGoals();

  // --- Loading / Error States ---

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-600 to-sky-600 blur-xl opacity-40 animate-pulse" />
          </div>
          <p className="text-slate-400 animate-pulse">Loading your goals...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <button
            onClick={fetchGoals}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  // --- Render ---

  return (
    <DashboardLayout activeTab="goals">
      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/[0.07] rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-sky-500/[0.07] rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-500/[0.04] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <GoalsTopBar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchExpanded={searchExpanded}
            onSearchExpandedToggle={() => setSearchExpanded(!searchExpanded)}
            boardView={boardView}
            onBoardViewChange={setBoardView}
            showAnalytics={showAnalytics}
            onShowAnalyticsToggle={() => setShowAnalytics(!showAnalytics)}
            onOpenAIModal={() => setIsAIModalOpen(true)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />

          <GoalsStatsRow
            total={stats.total}
            active={stats.active}
            completed={stats.completed}
            paused={stats.paused}
            avgProgress={stats.avgProgress}
          />

          {/* ============ PRIMARY GOAL CARD ============ */}
          {stats.primaryGoal && (
            <div className="mb-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wide">Primary Goal</span>
                      <h3 className="text-sm font-semibold text-white truncate">{stats.primaryGoal.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{stats.primaryGoal.progress}%</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGoal(stats.primaryGoal!);
                        setIsProgressModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors text-xs font-medium cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.primaryGoal.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ ANALYTICS SECTION ============ */}
          <AnimatePresence>
            {showAnalytics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <GoalsAnalytics goals={goals} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============ KANBAN BOARD (default view) ============ */}
          {boardView === "board" && (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-3 pb-8 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {KANBAN_COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    columnId={col.id}
                    label={col.label}
                    color={col.color}
                    icon={col.icon}
                    goals={kanbanColumns[col.id]}
                  >
                    {kanbanColumns[col.id].map((goal) => (
                      <DraggableGoalCard
                        key={goal.id}
                        goal={goal}
                        onUpdateProgress={(g) => {
                          setSelectedGoal(g);
                          setIsProgressModalOpen(true);
                        }}
                        onEdit={(g) => {
                          setSelectedGoal(g);
                          setIsEditModalOpen(true);
                        }}
                        onDelete={(g) => {
                          setSelectedGoal(g);
                          setIsDeleteModalOpen(true);
                        }}
                        onStatusChange={handleStatusChange}
                        onExpand={setExpandedGoal}
                        onViewDetails={(g) => {
                          setSelectedGoal(g);
                          setIsDetailModalOpen(true);
                        }}
                        isExpanded={expandedGoal === goal.id}
                      />
                    ))}
                  </KanbanColumn>
                ))}
              </div>

              <DragOverlay dropAnimation={null}>
                {activeGoal ? <GoalCardOverlay goal={activeGoal} /> : null}
              </DragOverlay>
            </DndContext>
          )}

          {/* ============ LIST VIEW ============ */}
          {boardView === "list" && (
            <GoalListView
              filteredGoals={filteredGoals}
              filter={filter}
              onFilterChange={setFilter}
              isSelectionMode={isSelectionMode}
              onSelectionModeToggle={() => {
                if (isSelectionMode) {
                  clearSelection();
                } else {
                  setIsSelectionMode(true);
                  selectAll();
                }
              }}
              selectedGoals={selectedGoals}
              onToggleSelection={toggleSelection}
              onClearSelection={clearSelection}
              isBulkProcessing={isBulkProcessing}
              onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              expandedGoal={expandedGoal}
              onExpandToggle={setExpandedGoal}
              onUpdateProgress={(g) => {
                setSelectedGoal(g);
                setIsProgressModalOpen(true);
              }}
              onEdit={(g) => {
                setSelectedGoal(g);
                setIsEditModalOpen(true);
              }}
              onDelete={(g) => {
                setSelectedGoal(g);
                setIsDeleteModalOpen(true);
              }}
              onStatusChange={handleStatusChange}
              onCreateGoal={() => setIsCreateModalOpen(true)}
              getPlanForGoal={getPlanForGoal}
            />
          )}

          {/* Pro Tip */}
          {goals.length > 0 && goals.length < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 mb-8 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-sky-500/10 border border-emerald-500/20"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 shrink-0">
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">Pro Tip</h3>
                  <p className="text-xs text-slate-400">
                    Having 2-3 goals across different pillars leads to better success. Consider adding goals in fitness, nutrition, or wellbeing!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ============ MODALS ============ */}
        <GoalDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedGoal(null);
          }}
          goal={selectedGoal}
          onEdit={() => {
            setIsDetailModalOpen(false);
            setIsEditModalOpen(true);
          }}
          onUpdateProgress={() => {
            setIsDetailModalOpen(false);
            setIsProgressModalOpen(true);
          }}
        />

        <CreateGoalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateGoal}
          isLoading={isCreating}
        />

        <AIGoalModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onAccept={handleAIGoalAccept}
          isLoading={isCreating}
        />

        <EditGoalModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedGoal(null);
          }}
          onSave={handleEditGoal}
          goal={selectedGoal}
          isLoading={isUpdating}
        />

        {/* Task-based progress modal (replaces old number input) */}
        {selectedGoal && (
          <TaskProgressModal
            key={selectedGoal?.id || "task-progress-modal"}
            goal={selectedGoal}
            isOpen={isProgressModalOpen}
            onClose={() => {
              setIsProgressModalOpen(false);
              setSelectedGoal(null);
            }}
            onProgressUpdated={(goalId, progress, currentValue) => {
              setGoals(prev =>
                prev.map(g =>
                  g.id === goalId
                    ? { ...g, currentValue, progress, ...(progress >= 100 ? { status: "completed" } : {}) }
                    : g
                )
              );
            }}
          />
        )}

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedGoal(null);
          }}
          onConfirm={handleDelete}
          title="Delete Goal"
          message={`Delete "${selectedGoal?.title}"? This cannot be undone.`}
          isLoading={isDeleting}
        />

        <ConfirmModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDelete}
          title="Delete Selected Goals"
          message={`Delete ${selectedGoals.size} selected goal${selectedGoals.size > 1 ? "s" : ""}? This cannot be undone.`}
          isLoading={isBulkProcessing}
        />

      </div>
    </DashboardLayout>
  );
}
