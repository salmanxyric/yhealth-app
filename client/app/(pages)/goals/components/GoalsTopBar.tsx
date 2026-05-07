"use client";

import {
  Target,
  Plus,
  Sparkles,
  Search,
  BarChart3,
  LayoutGrid,
  List,
} from "lucide-react";

interface GoalsTopBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchExpanded: boolean;
  onSearchExpandedToggle: () => void;
  boardView: "board" | "list";
  onBoardViewChange: (view: "board" | "list") => void;
  showAnalytics: boolean;
  onShowAnalyticsToggle: () => void;
  onOpenAIModal: () => void;
  onOpenCreateModal: () => void;
}

export function GoalsTopBar({
  searchQuery,
  onSearchQueryChange,
  searchExpanded,
  onSearchExpandedToggle,
  boardView,
  onBoardViewChange,
  showAnalytics,
  onShowAnalyticsToggle,
  onOpenAIModal,
  onOpenCreateModal,
}: GoalsTopBarProps) {
  return (
    <div className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center justify-between h-14 gap-3">
        {/* Left: Badge + Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Target className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <h1 className="text-lg font-bold text-white whitespace-nowrap">
            My <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">Goals</span>
          </h1>
        </div>

        {/* Right: Search + View Toggle + AI + New */}
        <div className="flex items-center gap-2">
          {/* Search - expandable on mobile */}
          <div className={`relative transition-all ${searchExpanded ? "w-48 sm:w-56" : "w-8 sm:w-48"}`}>
            <button
              onClick={onSearchExpandedToggle}
              className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 z-10 cursor-pointer"
            >
              <Search className="w-4 h-4 text-slate-400" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all ${
                searchExpanded ? "opacity-100" : "opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto"
              }`}
            />
            <Search className="hidden sm:block absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/[0.06]">
            <button
              onClick={() => onBoardViewChange("board")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                boardView === "board" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-white"
              }`}
              aria-label="Board view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onBoardViewChange("list")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                boardView === "list" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-white"
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Analytics */}
          <button
            onClick={onShowAnalyticsToggle}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              showAnalytics
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                : "bg-white/5 border-white/[0.06] text-slate-400 hover:text-white"
            }`}
            aria-label="Toggle analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* AI Create */}
          <button
            onClick={onOpenAIModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">AI</span>
          </button>

          {/* + New Goal */}
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-sky-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Goal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
