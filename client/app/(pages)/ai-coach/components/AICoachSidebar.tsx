"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, MessageSquare, Trash2, Archive, MoreVertical, PanelLeftClose } from "lucide-react";
import Image from "next/image";
import type { RAGConversation } from "@/src/shared/services/rag-chat.service";

interface AICoachSidebarProps {
  conversations: RAGConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  dropdownOpen: string | null;
  showSidebar: boolean;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onArchiveConversation: (id: string) => void;
  onSetDropdownOpen: (id: string | null) => void;
  onCloseSidebar: () => void;
}

export function AICoachSidebar({
  conversations,
  activeConversationId,
  isLoading,
  dropdownOpen,
  showSidebar,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onArchiveConversation,
  onSetDropdownOpen,
  onCloseSidebar,
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
            onSelectConversation={onSelectConversation}
            onNewChat={onNewChat}
            onDeleteConversation={onDeleteConversation}
            onArchiveConversation={onArchiveConversation}
            onSetDropdownOpen={onSetDropdownOpen}
            onCloseSidebar={onCloseSidebar}
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
              onSelectConversation={onSelectConversation}
              onNewChat={onNewChat}
              onDeleteConversation={onDeleteConversation}
              onArchiveConversation={onArchiveConversation}
              onSetDropdownOpen={onSetDropdownOpen}
              onCloseSidebar={onCloseSidebar}
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
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onArchiveConversation,
  onSetDropdownOpen,
  onCloseSidebar,
}: Omit<AICoachSidebarProps, "showSidebar">) {
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

      {/* Recent Chat Label + List */}
      <div className="flex flex-col mt-6 px-4 flex-1 overflow-hidden">
        <p className="text-[#999] text-[18px] font-normal pb-4 border-b border-white/10">
          Recent Chat
        </p>

        <div className="flex-1 overflow-y-auto mt-[13px] space-y-[13px] scrollbar-hide">
          {isLoading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-white/50 text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative flex items-center rounded-[8px] px-[10px] py-[8px] cursor-pointer transition-colors ${
                  activeConversationId === conv.id
                    ? "bg-[rgba(255,255,255,0.07)]"
                    : "hover:bg-[rgba(255,255,255,0.04)]"
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <p className="text-white text-[16px] font-normal leading-[24px] opacity-80 truncate flex-1 min-w-0">
                  {conv.title || conv.lastMessagePreview || (conv.messageCount > 0 ? `Chat (${conv.messageCount})` : "New Chat")}
                </p>

                {/* Context menu */}
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
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
