"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ragChatService, RAGConversation, RAGChatMessage, ActionCommand } from "@/src/shared/services/rag-chat.service";
import { parseActionsFromResponse, executeActions, ActionExecutionResult } from "@/src/shared/services/action-handler.service";
import { api } from "@/lib/api-client";
import toast from "react-hot-toast";
import type { RoutingChip as RoutingChipData } from "@/app/(pages)/life-areas/types";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  routingChip?: RoutingChipData | null;
}

export function useAICoach() {
  const router = useRouter();

  const [conversations, setConversations] = useState<RAGConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [actionResults, setActionResults] = useState<Map<string, ActionExecutionResult>>(new Map());
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalMode, setImageModalMode] = useState<"camera" | "upload">("upload");
  const [isNewChat, setIsNewChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setShowSidebar(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Auto-load last conversation (skip if user explicitly started a new chat)
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId && messages.length === 0 && !isLoading && !isNewChat) {
      loadConversation(conversations[0].id);
    }
  }, [conversations, activeConversationId, messages.length, isLoading, isNewChat]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [inputMessage]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const result = await ragChatService.getConversations({ limit: 50 });
      setConversations(result.conversations || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    setIsLoading(true);
    setIsNewChat(false);
    try {
      const result = await ragChatService.getConversation(conversationId, 100);
      setActiveConversationId(conversationId);
      setMessages(
        (result.messages || [])
          .filter((msg: RAGChatMessage) => (msg.role as string) !== "system")
          .map((msg: RAGChatMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }))
      );
      if (window.innerWidth < 1024) setShowSidebar(false);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setIsNewChat(true);
    if (window.innerWidth < 1024) setShowSidebar(false);
  };

  // Action handlers
  const handleNavigate = useCallback((tabId: string) => {
    if (tabId === "ai-coach") router.push("/ai-coach");
    else if (tabId === "activity-status") router.push("/activity-status");
    else if (tabId.startsWith("wellbeing/") || tabId === "wellbeing") router.push(`/${tabId}`);
    else router.push(`/dashboard?tab=${tabId}`);
  }, [router]);

  const handleUpdate = useCallback(async (target: string, params?: Record<string, unknown>): Promise<boolean> => {
    try {
      if (target === "workout_plan" || target === "workout plan") {
        const planId = params?.planId;
        if (!planId) {
          const plansResponse = await api.get<{ plans?: Array<{ id: string; status?: string }> }>("/workouts/plans");
          const activePlan = plansResponse.data?.plans?.find((p) => p.status === "active");
          if (!activePlan) { toast.error("No active workout plan found"); return false; }
          const updateParams = { ...params }; delete updateParams.planId;
          const response = await api.patch(`/workouts/plans/${activePlan.id}`, updateParams);
          if (response.success) { toast.success("Workout plan updated successfully"); return true; }
        } else {
          const updateParams = { ...params }; delete updateParams.planId;
          const response = await api.patch(`/workouts/plans/${planId}`, updateParams);
          if (response.success) { toast.success("Workout plan updated successfully"); return true; }
        }
      } else if (target === "diet_plan" || target === "diet plan" || target === "nutrition plan") {
        const planId = params?.planId;
        if (!planId) {
          const plansResponse = await api.get<{ plans?: Array<{ id: string }> }>("/diet-plans?status=active");
          const activePlan = plansResponse.data?.plans?.[0];
          if (!activePlan) { toast.error("No active diet plan found"); return false; }
          const updateParams = { ...params }; delete updateParams.planId;
          const response = await api.patch(`/diet-plans/${activePlan.id}`, updateParams);
          if (response.success) { toast.success("Diet plan updated successfully"); return true; }
        } else {
          const updateParams = { ...params }; delete updateParams.planId;
          const response = await api.patch(`/diet-plans/${planId}`, updateParams);
          if (response.success) { toast.success("Diet plan updated successfully"); return true; }
        }
      } else if (target === "goal") {
        const goalId = params?.goalId;
        if (!goalId) { toast.error("Goal ID required for update"); return false; }
        const updateParams = { ...params }; delete updateParams.goalId;
        const response = await api.patch(`/goals/${goalId}`, updateParams);
        if (response.success) { toast.success("Goal updated successfully"); return true; }
      } else if (target === "journal_entry" || target === "journal") {
        const entryId = (params?.entryId || params?.id) as string;
        if (!entryId) { toast.error("Entry ID required"); return false; }
        const updateParams = { ...params }; delete updateParams.entryId; delete updateParams.id;
        const response = await api.put(`/v1/wellbeing/journal/${entryId}`, updateParams);
        if (response.success) { window.dispatchEvent(new Event("journal-logged")); toast.success("Journal entry updated"); return true; }
      }
      return false;
    } catch (error) {
      console.error("Failed to update:", error);
      toast.error("Failed to update. Please try again.");
      return false;
    }
  }, []);

  const handleCreate = useCallback(async (target: string, params?: Record<string, unknown>): Promise<boolean> => {
    try {
      if (target === "workout_plan" || target === "workout plan") {
        const response = await api.post("/workouts/plans", params || {});
        if (response.success) { toast.success("Workout plan created successfully"); return true; }
      } else if (target === "diet_plan" || target === "diet plan" || target === "nutrition plan") {
        const response = await api.post("/diet-plans", params || {});
        if (response.success) { toast.success("Diet plan created successfully"); return true; }
      } else if (target === "goal") {
        const response = await api.post("/goals", params || {});
        if (response.success) { toast.success("Goal created successfully"); return true; }
      } else if (target === "journal_entry" || target === "journal") {
        const response = await api.post("/v1/wellbeing/journal", params || {});
        if (response.success) { window.dispatchEvent(new Event("journal-logged")); toast.success("Journal entry created"); return true; }
      } else if (target === "daily_checkin" || target === "checkin") {
        const response = await api.post("/v1/journal/checkin", params || {});
        if (response.success) { window.dispatchEvent(new Event("checkin-completed")); toast.success("Daily check-in saved"); return true; }
      }
      return false;
    } catch (error) {
      console.error("Failed to create:", error);
      toast.error("Failed to create. Please try again.");
      return false;
    }
  }, []);

  const handleDelete = useCallback(async (target: string, params?: Record<string, unknown>): Promise<boolean> => {
    try {
      const id = params?.id || params?.planId || params?.goalId;
      if (!id) { toast.error(`${target} ID required for deletion`); return false; }

      const { confirm: confirmAction } = await import("@/components/common/ConfirmDialog");
      const confirmed = await confirmAction({
        title: `Delete ${target.charAt(0).toUpperCase() + target.slice(1)}`,
        description: `Are you sure you want to delete this ${target}? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        variant: "destructive",
      });
      if (!confirmed) return false;

      if (target.includes("workout") || target === "workout_plan") {
        const response = await api.delete(`/workouts/plans/${id}`);
        if (response.success) { toast.success("Workout plan deleted"); return true; }
      } else if (target.includes("diet") || target.includes("nutrition") || target === "diet_plan") {
        const response = await api.delete(`/diet-plans/${id}`);
        if (response.success) { toast.success("Diet plan deleted"); return true; }
      } else if (target === "goal") {
        const response = await api.delete(`/goals/${id}`);
        if (response.success) { toast.success("Goal deleted"); return true; }
      } else if (target === "journal_entry" || target === "journal") {
        const response = await api.delete(`/v1/wellbeing/journal/${id}`);
        if (response.success) { window.dispatchEvent(new Event("journal-logged")); toast.success("Journal entry deleted"); return true; }
      }
      return false;
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete. Please try again.");
      return false;
    }
  }, []);

  const handleOpenModal = useCallback(async (target: string): Promise<boolean> => {
    if (target === "camera") { setImageModalMode("camera"); setShowImageModal(true); return true; }
    if (target === "image_upload") { setImageModalMode("upload"); setShowImageModal(true); return true; }
    if (target === "log_weight") { router.push("/progress"); toast.success("Navigate to Progress tab to log your weight"); return true; }
    if (target === "log_measurement") { router.push("/progress"); toast.success("Navigate to Progress tab to log your measurements"); return true; }
    return false;
  }, [router]);

  const handleImageAnalysisComplete = useCallback(async (analysis: string) => {
    if (analysis) {
      setMessages((prev) => [...prev, {
        id: `analysis-${Date.now()}`,
        role: "assistant",
        content: analysis,
        timestamp: new Date(),
      }]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  const executeActionsAsync = useCallback(async (actions: ActionCommand[]) => {
    for (const action of actions) {
      const actionId = `${action.type}-${action.target}-${Date.now()}`;
      setExecutingActions((prev) => new Set(prev).add(actionId));
      try {
        const result = await executeActions([action], router, {
          onNavigate: handleNavigate,
          onUpdate: handleUpdate,
          onCreate: handleCreate,
          onDelete: handleDelete,
          onOpenModal: handleOpenModal,
        });
        if (result[0]) {
          setActionResults((prev) => { const m = new Map(prev); m.set(actionId, result[0]); return m; });
          if (result[0].success) toast.success(result[0].message || `${action.type} completed`);
          else toast.error(result[0].error || result[0].message || "Action failed");
        }
      } catch (error) {
        console.error("Error executing action:", error);
        toast.error("Failed to execute action");
      } finally {
        setExecutingActions((prev) => { const s = new Set(prev); s.delete(actionId); return s; });
      }
      if (actions.indexOf(action) < actions.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }, [router, handleNavigate, handleUpdate, handleCreate, handleDelete, handleOpenModal]);

  const sendMessage = async (overrideMessage?: string) => {
    const text = overrideMessage || inputMessage.trim();
    if (!text || isSending) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsSending(true);

    try {
      const response = await ragChatService.sendMessage({
        message: userMessage.content,
        conversationId: activeConversationId || undefined,
      });

      if (!activeConversationId && response.conversationId) {
        setActiveConversationId(response.conversationId);
        setIsNewChat(false);
        fetchConversations();
      }

      const assistantMessage: Message = {
        id: response.messageId || `resp-${Date.now()}`,
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        routingChip: (response as { routingChip?: RoutingChipData | null }).routingChip ?? null,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.toolCalls?.length) {
        const journalTools = ["createJournalEntry", "updateJournalEntry", "deleteJournalEntry"];
        const checkinTools = ["createDailyCheckin"];
        if (response.toolCalls.some((tc) => journalTools.includes(tc.tool))) window.dispatchEvent(new Event("journal-logged"));
        if (response.toolCalls.some((tc) => checkinTools.includes(tc.tool))) window.dispatchEvent(new Event("checkin-completed"));
      }

      const rawActions = response.actions || parseActionsFromResponse(response.message);
      if (rawActions && rawActions.length > 0) {
        const safeActions = rawActions.filter((a) => a.type !== "navigate");
        if (safeActions.length > 0) setTimeout(() => executeActionsAsync(safeActions), 500);
      }
    } catch (error) {
      const isNetworkError = error && typeof error === "object" && "code" in error && error.code === "NETWORK_ERROR";
      if (!isNetworkError) console.error("Failed to send message:", error);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: isNetworkError
          ? "Unable to connect to the server. Please ensure the server is running and try again."
          : "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const regenerateMessage = useCallback(async (assistantMessageId: string) => {
    if (isSending) return;
    // Find the user message that preceded this assistant message
    const idx = messages.findIndex((m) => m.id === assistantMessageId);
    if (idx <= 0) return;
    const userMsg = messages.slice(0, idx).reverse().find((m) => m.role === "user");
    if (!userMsg) return;
    // Remove the assistant message so sendMessage appends the new one
    setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
    await sendMessage(userMsg.content);
  }, [messages, isSending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await ragChatService.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) { setActiveConversationId(null); setMessages([]); }
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "statusCode" in error && error.statusCode === 404) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeConversationId === conversationId) { setActiveConversationId(null); setMessages([]); }
      } else {
        console.error("Failed to delete conversation:", error);
      }
    }
    setDropdownOpen(null);
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      await ragChatService.archiveConversation(conversationId);
      fetchConversations();
    } catch (error) {
      console.error("Failed to archive conversation:", error);
    }
    setDropdownOpen(null);
  };

  return {
    // State
    conversations,
    activeConversationId,
    messages,
    inputMessage,
    isLoading,
    isSending,
    showSidebar,
    dropdownOpen,
    executingActions,
    actionResults,
    showImageModal,
    imageModalMode,
    // Refs
    messagesEndRef,
    inputRef,
    // Setters
    setInputMessage,
    setShowSidebar,
    setDropdownOpen,
    setShowImageModal,
    setImageModalMode,
    // Actions
    sendMessage,
    regenerateMessage,
    handleKeyDown,
    startNewConversation,
    loadConversation,
    deleteConversation,
    archiveConversation,
    handleImageAnalysisComplete,
  };
}
