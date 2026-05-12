"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAICoach } from "./hooks/useAICoach";
import { useIntelligenceFiles } from "./hooks/useIntelligenceFiles";
import { AICoachSidebar } from "./components/AICoachSidebar";
import { AICoachHeader } from "./components/AICoachHeader";
import { AICoachWelcome } from "./components/AICoachWelcome";
import { AICoachInput } from "./components/AICoachInput";
import { AICoachMessages } from "./components/AICoachMessages";
import { IntelligenceFilesDrawer } from "./components/IntelligenceFilesDrawer";
import { ImageAnalysisModal } from "../dashboard/components/modals/ImageAnalysisModal";
import { UpgradeModal } from "@/components/common/upgrade-modal";

export default function AICoachPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/ai-coach");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#02000f]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-xl"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-slate-400">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <AICoachLayout />;
}

function AICoachLayout() {
  const coach = useAICoach();
  const intelligence = useIntelligenceFiles();

  return (
    <div className="h-screen bg-[#02000f] flex overflow-hidden">
      {/* Sidebar */}
      <AICoachSidebar
        conversations={coach.conversations}
        activeConversationId={coach.activeConversationId}
        isLoading={coach.isLoading}
        dropdownOpen={coach.dropdownOpen}
        showSidebar={coach.showSidebar}
        multiSelectMode={coach.multiSelectMode}
        selectedConversationIds={coach.selectedConversationIds}
        onSelectConversation={coach.loadConversation}
        onNewChat={coach.startNewConversation}
        onDeleteConversation={coach.deleteConversation}
        onArchiveConversation={coach.archiveConversation}
        onSetDropdownOpen={coach.setDropdownOpen}
        onCloseSidebar={() => coach.setShowSidebar(false)}
        onSetMultiSelectMode={coach.setMultiSelectMode}
        onToggleSelectConversation={coach.toggleSelectConversation}
        onSelectAll={coach.selectAllConversations}
        onDeselectAll={coach.deselectAllConversations}
        onDeleteSelected={coach.deleteSelectedConversations}
        onExitMultiSelect={coach.exitMultiSelectMode}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AICoachHeader onToggleSidebar={() => coach.setShowSidebar((prev) => !prev)} isSidebarOpen={coach.showSidebar} onOpenIntelligence={intelligence.openDrawer} />

        {/* Main container with gradient border */}
        <div className="flex-1 flex flex-col min-h-0 mx-2 sm:mx-4 mt-2 sm:mt-3 mb-0 overflow-hidden">
          <div
            className="flex-1 flex flex-col min-h-0 rounded-t-[32px] rounded-b-none border border-b-0 border-white/[0.17] overflow-hidden"
            style={{
              backgroundImage:
                "linear-gradient(173.75deg, rgba(2, 132, 199, 0) 2.64%, rgba(2, 132, 199, 0.1) 98.73%)",
            }}
          >
            {/* Content: Welcome, Skeleton, or Messages */}
            {coach.isLoading && coach.messages.length === 0 && coach.activeConversationId ? (
              <AICoachMessages
                messages={[]}
                isSending={false}
                isLoadingConversation
                executingActions={coach.executingActions}
                actionResults={coach.actionResults}
                messagesEndRef={coach.messagesEndRef}
                onRegenerateMessage={coach.regenerateMessage}
                onOpenWikiPage={intelligence.openWikiPage}
              />
            ) : coach.messages.length === 0 ? (
              <div className="flex-1 overflow-y-auto">
                <AICoachWelcome onSuggestionClick={(text) => coach.sendMessage(text)} />
              </div>
            ) : (
              <AICoachMessages
                messages={coach.messages}
                isSending={coach.isSending}
                executingActions={coach.executingActions}
                actionResults={coach.actionResults}
                messagesEndRef={coach.messagesEndRef}
                onRegenerateMessage={coach.regenerateMessage}
                onEditUserMessage={coach.editUserMessage}
                onOpenWikiPage={intelligence.openWikiPage}
                isThinking={coach.isThinking}
                thinkingLabel={coach.thinkingLabel}
                liveTimelineEvents={coach.liveTimelineEvents}
                onUndoTimelineEvent={coach.undoTimelineEvent}
                liveAnalysisSteps={coach.liveAnalysisSteps}
              />
            )}

            {/* Input */}
            <AICoachInput
              inputMessage={coach.inputMessage}
              isSending={coach.isSending}
              inputRef={coach.inputRef}
              onInputChange={coach.setInputMessage}
              onSend={() => coach.sendMessage()}
              onKeyDown={coach.handleKeyDown}
              onAttach={() => {
                coach.setImageModalMode("upload");
                coach.setShowImageModal(true);
              }}
              onCamera={() => {
                coach.setImageModalMode("camera");
                coach.setShowImageModal(true);
              }}
              pendingImage={coach.pendingImage}
              onAttachImage={coach.attachImage}
              onClearImage={coach.clearPendingImage}
            />
          </div>
        </div>
      </div>

      {/* Intelligence Files Drawer */}
      <IntelligenceFilesDrawer hook={intelligence} />

      {/* Image Analysis Modal */}
      <ImageAnalysisModal
        isOpen={coach.showImageModal}
        onClose={() => coach.setShowImageModal(false)}
        onAnalysisComplete={coach.handleImageAnalysisComplete}
        mode={coach.imageModalMode}
        conversationId={coach.activeConversationId || undefined}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={coach.showUpgradeModal}
        onClose={() => coach.setShowUpgradeModal(false)}
        reason={coach.upgradeReason}
      />
    </div>
  );
}
