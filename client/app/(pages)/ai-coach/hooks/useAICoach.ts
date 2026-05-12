"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ragChatService,
  RAGConversation,
  RAGChatMessage,
  ActionCommand,
  StreamEvent,
} from "@/src/shared/services/rag-chat.service";
import { parseActionsFromResponse, executeActions, ActionExecutionResult } from "@/src/shared/services/action-handler.service";
import { isMCQAnswerMessage } from "@/src/shared/utils/coach-message-display";
import { api } from "@/lib/api-client";
import toast from "react-hot-toast";
import type { RoutingChip as RoutingChipData } from "@/app/(pages)/life-areas/types";
import type { Artifact } from "../components/ArtifactCard";

function getAIErrorMessage(code?: string, fallbackMessage?: string): string {
  switch (code) {
    case "AI_PROVIDER_QUOTA":
      return "The AI service quota has been reached. Please try again later or contact support.";
    case "AI_PROVIDER_AUTH_ERROR":
      return "There is an issue with the AI service configuration. Please contact support.";
    case "AI_ALL_PROVIDERS_DOWN":
      return "All AI services are currently unavailable. Please try again in a few minutes.";
    case "GEMINI_RATE_LIMITED":
    case "OPENAI_RATE_LIMITED":
      return "The AI service is busy right now. Please wait a moment and try again.";
    case "GEMINI_TIMEOUT":
    case "OPENAI_TIMEOUT":
    case "AI_PROVIDER_TIMEOUT":
      return "The AI service took too long to respond. Please try again.";
    case "AI_PROVIDER_ERROR":
      return "The AI coach is temporarily unavailable. Please try again shortly.";
    default:
      return fallbackMessage || "I'm sorry, I encountered an error. Please try again.";
  }
}

export interface AnalysisStepEvent {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "failed";
  durationMs?: number;
  resultSummary?: string;
}

export interface ToolTimelineEvent {
  operationId: string;
  toolName: string;
  label: string;
  icon?: string;
  status: "pending" | "completed" | "failed" | "undone";
  success?: boolean;
  delta?: string;
  undoable?: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  routingChip?: RoutingChipData | null;
  agentTurnId?: string;
  timelineEvents?: ToolTimelineEvent[];
  thinkingLabel?: string;
  thinkingDurationMs?: number;
  artifacts?: Artifact[];
  analysisSteps?: AnalysisStepEvent[];
  imageUrl?: string;
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
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);
  // Agentic timeline state
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState("");
  const [liveTimelineEvents, setLiveTimelineEvents] = useState<ToolTimelineEvent[]>([]);
  const [liveAnalysisSteps, setLiveAnalysisSteps] = useState<AnalysisStepEvent[]>([]);
  const streamAbortRef = useRef<AbortController | null>(null);
  const [imageModalMode, setImageModalMode] = useState<"camera" | "upload">("upload");
  const [isNewChat, setIsNewChat] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"feature_disabled" | "credits_exhausted" | "limit_reached">("feature_disabled");

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
      setConversations(
        (result.conversations || []).filter(
          (c) => !isMCQAnswerMessage(c.title) && !isMCQAnswerMessage(c.lastMessagePreview)
        )
      );
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
          .filter((msg: RAGChatMessage) => (msg.role as string) !== "system" && !isMCQAnswerMessage(msg.content))
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

  const attachImage = useCallback((file: File) => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
  }, [pendingImage]);

  const clearPendingImage = useCallback(() => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  }, [pendingImage]);

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

  const reconcileSavedMessageIds = useCallback((conversationId: string) => {
    window.setTimeout(async () => {
      try {
        const result = await ragChatService.getConversation(conversationId, 100);
        const savedMessages = (result.messages || [])
          .filter((msg: RAGChatMessage) => (msg.role as string) !== "system" && !isMCQAnswerMessage(msg.content));

        setMessages((prev) => {
          let cursor = 0;
          return prev.map((message) => {
            const matchIndex = savedMessages.findIndex((saved, index) =>
              index >= cursor &&
              saved.role === message.role &&
              saved.content === message.content
            );

            if (matchIndex < 0) return message;
            cursor = matchIndex + 1;
            const saved = savedMessages[matchIndex];
            return {
              ...message,
              id: saved.id,
              timestamp: new Date(saved.createdAt),
            };
          });
        });
      } catch {
        // Keep optimistic temp IDs; copy still works and edit falls back locally.
      }
    }, 350);
  }, []);

  const undoTimelineEvent = useCallback(async (messageId: string, operationId: string) => {
    try {
      const result = await ragChatService.undoOperation(operationId);
      if (result.success) {
        setMessages((prev) => prev.map((m) => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            timelineEvents: m.timelineEvents?.map((ev) =>
              ev.operationId === operationId ? { ...ev, status: "undone" as const } : ev,
            ),
          };
        }));
        toast.success("Action undone");
      } else {
        toast.error(result.error || "Failed to undo");
      }
    } catch {
      toast.error("Failed to undo action");
    }
  }, []);

  const sendMessage = async (overrideMessage?: string) => {
    const text = overrideMessage || inputMessage.trim();
    if ((!text && !pendingImage) || isSending) return;

    const messageText = text || "Analyze this image";
    const attachedImage = pendingImage;

    let imageBase64: string | undefined;
    if (attachedImage) {
      try {
        const buffer = await attachedImage.file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        imageBase64 = btoa(binary);
      } catch {
        imageBase64 = undefined;
      }
    }

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
      imageUrl: attachedImage?.previewUrl,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.previewUrl);
      setPendingImage(null);
    }
    setIsSending(true);
    setIsThinking(false);
    setThinkingLabel("");
    setLiveTimelineEvents([]);

    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    let accumulatedContent = "";
    const timelineEvents: ToolTimelineEvent[] = [];
    const artifacts: Artifact[] = [];
    const analysisSteps: AnalysisStepEvent[] = [];
    let conversationId = activeConversationId || undefined;
    const streamingMsgId = `streaming-${Date.now()}`;
    let streamingMsgCreated = false;
    let savedThinkingLabel = "";
    let savedThinkingDuration = 0;

    const MAX_RETRIES = 2;
    const BACKOFF_BASE_MS = 1500;
    let sendStart = 0;
    let ttfbRecorded = false;

    const attemptSend = async (attempt: number): Promise<void> => {
      sendStart = performance.now();
      ttfbRecorded = false;

      try {
        await ragChatService.sendMessageStreaming({
          message: userMessage.content,
          conversationId,
          imageBase64,
          signal: abortController.signal,
          onEvent: (event: StreamEvent) => {
            // Track TTFB on first token
            if (!ttfbRecorded && (event.type === "token" || event.type === "thinking_start")) {
              ttfbRecorded = true;
              const ttfb = Math.round(performance.now() - sendStart);
              if (typeof window !== "undefined") {
                console.debug(`[AI Coach] TTFB: ${ttfb}ms`);
              }
            }

            switch (event.type) {
              case "thinking_start":
              savedThinkingLabel = event.label;
              setIsThinking(true);
              setThinkingLabel(event.label);
              break;

            case "thinking_end":
              savedThinkingDuration = event.durationMs;
              setIsThinking(false);
              break;

            case "tool_call": {
              const toolEvent: ToolTimelineEvent = {
                operationId: event.operationId,
                toolName: event.toolName,
                label: event.label,
                icon: event.icon,
                status: "pending",
              };
              timelineEvents.push(toolEvent);
              setLiveTimelineEvents([...timelineEvents]);
              break;
            }

            case "tool_result": {
              const idx = timelineEvents.findIndex((e) => e.operationId === event.operationId);
              if (idx >= 0) {
                timelineEvents[idx] = {
                  ...timelineEvents[idx],
                  status: event.success ? "completed" : "failed",
                  success: event.success,
                  delta: event.delta,
                  undoable: event.undoable,
                  label: event.label || timelineEvents[idx].label,
                };
              }
              setLiveTimelineEvents([...timelineEvents]);
              break;
            }

            case "artifact":
              artifacts.push(event.artifact as unknown as Artifact);
              break;

            case "analysis_step": {
              const step = event.step as AnalysisStepEvent;
              const existingIdx = analysisSteps.findIndex(s => s.id === step.id);
              if (existingIdx >= 0) {
                analysisSteps[existingIdx] = step;
              } else {
                analysisSteps.push(step);
              }
              setLiveAnalysisSteps([...analysisSteps]);
              break;
            }

            case "token":
              accumulatedContent += event.content;
              if (!streamingMsgCreated) {
                streamingMsgCreated = true;
                setMessages((prev) => [...prev, {
                  id: streamingMsgId,
                  role: "assistant",
                  content: accumulatedContent,
                  timestamp: new Date(),
                  timelineEvents: timelineEvents.length > 0 ? [...timelineEvents] : undefined,
                }]);
              } else {
                setMessages((prev) => prev.map((m) =>
                  m.id === streamingMsgId
                    ? { ...m, content: accumulatedContent, timelineEvents: timelineEvents.length > 0 ? [...timelineEvents] : undefined }
                    : m,
                ));
              }
              break;

            case "conversation_id":
              conversationId = event.conversationId;
              if (!activeConversationId) {
                setActiveConversationId(event.conversationId);
                setIsNewChat(false);
                fetchConversations();
              }
              break;

            case "done": {
              const finalContent = event.message || accumulatedContent;

              const assistantMessage: Message = {
                id: event.messageId || `resp-${Date.now()}`,
                role: "assistant",
                content: finalContent,
                timestamp: new Date(),
                agentTurnId: event.agentTurnId,
                timelineEvents: timelineEvents.length > 0 ? [...timelineEvents] : undefined,
                thinkingLabel: savedThinkingLabel || undefined,
                thinkingDurationMs: savedThinkingDuration || undefined,
                artifacts: artifacts.length > 0 ? [...artifacts] : undefined,
                analysisSteps: analysisSteps.length > 0 ? [...analysisSteps] : undefined,
              };

              if (streamingMsgCreated) {
                setMessages((prev) => prev.map((m) =>
                  m.id === streamingMsgId ? assistantMessage : m,
                ));
              } else {
                setMessages((prev) => [...prev, assistantMessage]);
              }
              reconcileSavedMessageIds(event.conversationId);
              setLiveTimelineEvents([]);
              setLiveAnalysisSteps([]);

              if (event.toolCalls?.length) {
                const journalTools = ["createJournalEntry", "updateJournalEntry", "deleteJournalEntry"];
                const checkinTools = ["createDailyCheckin"];
                if (event.toolCalls.some((tc) => journalTools.includes(tc.tool))) window.dispatchEvent(new Event("journal-logged"));
                if (event.toolCalls.some((tc) => checkinTools.includes(tc.tool))) window.dispatchEvent(new Event("checkin-completed"));
              }

              const rawActions = event.actions || parseActionsFromResponse(finalContent);
              if (rawActions && rawActions.length > 0) {
                const safeActions = rawActions.filter((a) => a.type !== "navigate");
                if (safeActions.length > 0) setTimeout(() => executeActionsAsync(safeActions), 500);
              }
              break;
            }

            case "error": {
              console.error("[AI Coach] Stream error:", event.error, event.code);

              const userMessage = getAIErrorMessage(event.code, event.error);
              if (event.retryable === false) {
                toast.error(userMessage, { duration: 6000 });
              } else if (event.code) {
                toast.error(userMessage, { duration: 4000 });
              }

              const errorContent = userMessage;
              if (streamingMsgCreated) {
                setMessages((prev) => prev.map((m) =>
                  m.id === streamingMsgId
                    ? { ...m, content: errorContent }
                    : m,
                ));
              } else {
                streamingMsgCreated = true;
                setMessages((prev) => [...prev, {
                  id: streamingMsgId,
                  role: "assistant",
                  content: errorContent,
                  timestamp: new Date(),
                }]);
              }
              break;
            }
          }
        },
      });
    } catch (error: unknown) {
      if (abortController.signal.aborted) return;

      const status = error && typeof error === "object" && "statusCode" in error ? (error as unknown as { statusCode: number }).statusCode : 0;
      if (status === 503 && attempt < MAX_RETRIES) {
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
        console.warn(`[AI Coach] Server busy (503), retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        return attemptSend(attempt + 1);
      }

      throw error;
    }
    };

    try {
      await attemptSend(0);
    } catch (error) {
      if (abortController.signal.aborted) return;

      const errObj = error as Record<string, unknown> | null;
      const statusCode = errObj && typeof errObj === "object" && "statusCode" in errObj ? Number(errObj.statusCode) : 0;
      const errCode = errObj && typeof errObj === "object" && "code" in errObj ? String(errObj.code) : "";

      if (statusCode === 402 || statusCode === 429) {
        const reason =
          errCode === "CREDITS_EXHAUSTED" ? "credits_exhausted" as const :
          errCode === "FEATURE_LIMIT_REACHED" ? "limit_reached" as const :
          "feature_disabled" as const;
        setUpgradeReason(reason);
        setShowUpgradeModal(true);
        return;
      }

      const isNetworkError = errCode === "NETWORK_ERROR";
      if (!isNetworkError) console.error("Failed to send message:", error);

      const errorMessage = isNetworkError
        ? "Unable to connect to the server. Please ensure the server is running and try again."
        : getAIErrorMessage(errCode, error instanceof Error ? error.message : undefined);

      toast.error(errorMessage, { duration: 5000 });

      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
      }]);
    } finally {
      setIsSending(false);
      setIsThinking(false);
      setThinkingLabel("");
      streamAbortRef.current = null;
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

  const editUserMessage = useCallback(async (messageId: string, nextContent: string) => {
    const trimmed = nextContent.trim();
    if (!trimmed || isSending) return;

    const messageIndex = messages.findIndex((m) => m.id === messageId && m.role === "user");
    if (messageIndex < 0) return;

    const canPersistRewind = activeConversationId && !messageId.startsWith("temp-");
    try {
      if (canPersistRewind) {
        await ragChatService.truncateConversationFromMessage(activeConversationId, messageId);
      }

      setMessages((prev) => prev.slice(0, messageIndex));
      await sendMessage(trimmed);
    } catch (error) {
      console.error("Failed to edit message:", error);
      toast.error("Couldn't edit this message. Please try again.");
      throw error;
    }
  }, [activeConversationId, isSending, messages, sendMessage]);

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

  const toggleSelectConversation = (id: string) => {
    setSelectedConversationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllConversations = () => {
    setSelectedConversationIds(new Set(conversations.map((c) => c.id)));
  };

  const deselectAllConversations = () => {
    setSelectedConversationIds(new Set());
  };

  const exitMultiSelectMode = () => {
    setMultiSelectMode(false);
    setSelectedConversationIds(new Set());
  };

  const deleteSelectedConversations = async () => {
    const ids = Array.from(selectedConversationIds);
    if (ids.length === 0) return;
    try {
      await ragChatService.deleteConversations(ids);
      setConversations((prev) => prev.filter((c) => !selectedConversationIds.has(c.id)));
      if (activeConversationId && selectedConversationIds.has(activeConversationId)) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to bulk delete conversations:", error);
    }
    exitMultiSelectMode();
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
    pendingImage,
    // Agentic timeline state
    isThinking,
    thinkingLabel,
    liveTimelineEvents,
    liveAnalysisSteps,
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
    editUserMessage,
    handleKeyDown,
    startNewConversation,
    loadConversation,
    deleteConversation,
    archiveConversation,
    handleImageAnalysisComplete,
    attachImage,
    clearPendingImage,
    undoTimelineEvent,
    // Multi-select
    multiSelectMode,
    selectedConversationIds,
    setMultiSelectMode,
    toggleSelectConversation,
    selectAllConversations,
    deselectAllConversations,
    exitMultiSelectMode,
    deleteSelectedConversations,
    // Upgrade modal
    showUpgradeModal,
    setShowUpgradeModal,
    upgradeReason,
  };
}
