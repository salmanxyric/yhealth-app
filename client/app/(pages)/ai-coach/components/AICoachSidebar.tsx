"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Trash2, Archive, MoreVertical, PanelLeftClose, CheckSquare, Square, X } from "lucide-react";
import Image from "next/image";
import type { RAGConversation } from "@/src/shared/services/rag-chat.service";
import { getConversationDisplayTitle } from "@/src/shared/utils/coach-message-display";

interface AICoachSidebarProps {
  conversations: RAGConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  dropdownOpen: string | null;
  showSidebar: boolean;
  multiSelectMode: boolean;
  selectedConversationIds: Set<string>;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onArchiveConversation: (id: string) => void;
  onSetDropdownOpen: (id: string | null) => void;
  onCloseSidebar: () => void;
  onSetMultiSelectMode: (on: boolean) => void;
  onToggleSelectConversation: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onExitMultiSelect: () => void;
}

export function AICoachSidebar({
  conversations,
  activeConversationId,
  isLoading,
  dropdownOpen,
  showSidebar,
  multiSelectMode,
  selectedConversationIds,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onArchiveConversation,
  onSetDropdownOpen,
  onCloseSidebar,
  onSetMultiSelectMode,
  onToggleSelectConversation,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onExitMultiSelect,
}: AICoachSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onCloseSidebar}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop: wrapper div that animates width so main content smoothly expands/shrinks */}
      <motion.div
        className="hidden lg:block shrink-0 overflow-hidden"
        animate={{ width: showSidebar ? 316 : 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        <aside className="w-[316px] h-full bg-[#080615] rounded-tr-[32px] rounded-br-[32px] flex flex-col overflow-hidden">
          <SidebarContent
            conversations={conversations}
            activeConversationId={activeConversationId}
            isLoading={isLoading}
            dropdownOpen={dropdownOpen}
            multiSelectMode={multiSelectMode}
            selectedConversationIds={selectedConversationIds}
            onSelectConversation={onSelectConversation}
            onNewChat={onNewChat}
            onDeleteConversation={onDeleteConversation}
            onArchiveConversation={onArchiveConversation}
            onSetDropdownOpen={onSetDropdownOpen}
            onCloseSidebar={onCloseSidebar}
            onSetMultiSelectMode={onSetMultiSelectMode}
            onToggleSelectConversation={onToggleSelectConversation}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            onDeleteSelected={onDeleteSelected}
            onExitMultiSelect={onExitMultiSelect}
          />
        </aside>
      </motion.div>

      {/* Mobile: slides in from left as overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -316 }}
            animate={{ x: 0 }}
            exit={{ x: -316 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed lg:hidden inset-y-0 left-0 z-50 w-[316px] bg-[#080615] rounded-tr-[32px] rounded-br-[32px] flex flex-col overflow-hidden"
          >
            <SidebarContent
              conversations={conversations}
              activeConversationId={activeConversationId}
              isLoading={isLoading}
              dropdownOpen={dropdownOpen}
              multiSelectMode={multiSelectMode}
              selectedConversationIds={selectedConversationIds}
              onSelectConversation={onSelectConversation}
              onNewChat={onNewChat}
              onDeleteConversation={onDeleteConversation}
              onArchiveConversation={onArchiveConversation}
              onSetDropdownOpen={onSetDropdownOpen}
              onCloseSidebar={onCloseSidebar}
              onSetMultiSelectMode={onSetMultiSelectMode}
              onToggleSelectConversation={onToggleSelectConversation}
              onSelectAll={onSelectAll}
              onDeselectAll={onDeselectAll}
              onDeleteSelected={onDeleteSelected}
              onExitMultiSelect={onExitMultiSelect}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

/* Extracted inner content to avoid duplication between desktop/mobile */
function SidebarContent({
  conversations,
  activeConversationId,
  isLoading,
  dropdownOpen,
  multiSelectMode,
  selectedConversationIds,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onArchiveConversation,
  onSetDropdownOpen,
  onCloseSidebar,
  onSetMultiSelectMode,
  onToggleSelectConversation,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onExitMultiSelect,
}: Omit<AICoachSidebarProps, "showSidebar">) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selectedCount = selectedConversationIds.size;
  const allSelected = conversations.length > 0 && selectedCount === conversations.length;

  return (
    <>
      {/* Logo + Toggle */}
      <div className="flex items-center justify-between px-4 pt-[28px]">
        <div className="flex items-center gap-2">
          <Image src="/logo1.png" alt="Balencia" width={33} height={25} className="object-contain" />
          <span className="text-[25px] font-semibold text-white tracking-[0.25px] font-[family-name:var(--font-montserrat),Montserrat,sans-serif]">
            Balencia
          </span>
        </div>
        <button
          onClick={onCloseSidebar}
          className="p-2 rounded-[10px] hover:bg-white/10 text-white/50 hover:text-white/70 transition-all"
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>
      </div>

      {/* Separator */}
      <div className="mx-4 mt-6 border-b border-white/10" />

      {/* New Chat Button */}
      <div className="px-4 mt-6">
        <button
          onClick={onNewChat}
          className="flex items-center justify-center gap-2 w-full h-[49px] bg-[#059669] rounded-[10px] border border-white/20 text-white text-[18px] font-medium hover:brightness-110 transition-all"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.17) 0%, transparent 70%)",
          }}
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Recent Chat Label + Select toggle */}
      <div className="flex flex-col mt-6 px-4 flex-1 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <p className="text-[#999] text-[18px] font-normal">
            Recent Chat
          </p>
          {conversations.length > 0 && !multiSelectMode && (
            <button
              onClick={() => onSetMultiSelectMode(true)}
              className="text-white/40 hover:text-white/70 text-xs px-2 py-1 rounded hover:bg-white/5 transition-all"
            >
              Select
            </button>
          )}
          {multiSelectMode && (
            <button
              onClick={onExitMultiSelect}
              className="text-white/40 hover:text-white/70 p-1 rounded hover:bg-white/5 transition-all"
              aria-label="Exit select mode"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Multi-select toolbar */}
        <AnimatePresence>
          {multiSelectMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between py-3">
                <button
                  onClick={allSelected ? onDeselectAll : onSelectAll}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
                <span className="text-xs text-white/40">
                  {selectedCount} selected
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto mt-[13px] space-y-[13px] scrollbar-hide">
          {isLoading && conversations.length === 0 ? (
            <div className="space-y-[13px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center rounded-[8px] px-[10px] py-[8px] animate-pulse">
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-4 bg-white/[0.07] rounded-md"
                      style={{ width: `${60 + (i % 3) * 15}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-white/50 text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConversationIds.has(conv.id);
              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-center rounded-[8px] px-[10px] py-[8px] cursor-pointer transition-colors ${
                    multiSelectMode && isSelected
                      ? "bg-[rgba(5,150,105,0.15)]"
                      : activeConversationId === conv.id
                        ? "bg-[rgba(255,255,255,0.07)]"
                        : "hover:bg-[rgba(255,255,255,0.04)]"
                  }`}
                  onClick={() =>
                    multiSelectMode
                      ? onToggleSelectConversation(conv.id)
                      : onSelectConversation(conv.id)
                  }
                >
                  {/* Checkbox in multi-select mode */}
                  {multiSelectMode && (
                    <div className="shrink-0 mr-2">
                      {isSelected ? (
                        <CheckSquare className="w-[18px] h-[18px] text-emerald-400" />
                      ) : (
                        <Square className="w-[18px] h-[18px] text-white/30" />
                      )}
                    </div>
                  )}

                  <p className="text-white text-[16px] font-normal leading-[24px] opacity-80 truncate flex-1 min-w-0">
                    {getConversationDisplayTitle(conv)}
                  </p>

                  {/* Context menu (hidden in multi-select mode) */}
                  {!multiSelectMode && (
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetDropdownOpen(dropdownOpen === conv.id ? null : conv.id);
                        }}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                      >
                        <MoreVertical className="w-4 h-4 text-white/40" />
                      </button>
                      {dropdownOpen === conv.id && (
                        <div className="absolute right-0 top-8 z-50 w-36 bg-[#1a1a2e] rounded-lg border border-white/10 shadow-xl py-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onArchiveConversation(conv.id); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                          >
                            <Archive className="w-4 h-4" /> Archive
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sticky bulk-delete footer */}
      <AnimatePresence>
        {multiSelectMode && selectedCount > 0 && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="px-4 pb-6 pt-3 border-t border-white/10"
          >
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center gap-2 w-full h-[44px] bg-red-600/80 hover:bg-red-600 rounded-[10px] text-white text-[15px] font-medium transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedCount} chat{selectedCount !== 1 ? "s" : ""}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-[44px] rounded-[10px] border border-white/20 text-white/70 text-[14px] font-medium hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConfirmDelete(false);
                    onDeleteSelected();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 h-[44px] bg-red-600 hover:bg-red-700 rounded-[10px] text-white text-[14px] font-medium transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Confirm
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
