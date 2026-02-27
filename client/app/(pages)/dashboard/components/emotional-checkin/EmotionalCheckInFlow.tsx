"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Heart, Sparkles, Camera, Brain, Zap } from "lucide-react";
import { emotionalCheckInService, type EmotionalCheckInSession } from "@/src/shared/services/emotional-checkin.service";
import { CheckInQuestion } from "./CheckInQuestion";
import { CheckInResults } from "./CheckInResults";
import { CrisisResourcesModal } from "./CrisisResourcesModal";
import { TensorFlowEmotionAnalyzer } from "./TensorFlowEmotionAnalyzer";
import toast from "react-hot-toast";

interface Insight {
  category: string;
  description: string;
  severity: 'mild' | 'moderate' | 'significant';
  trend?: 'improving' | 'stable' | 'declining';
}

interface CheckInInsights {
  summary: string;
  details: Insight[];
  patterns?: Record<string, unknown>;
}

interface CheckInSession {
  id: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  questionCount: number;
  screeningType: string;
  overallAnxietyScore?: number;
  overallMoodScore?: number;
  riskLevel: string;
  crisisDetected: boolean;
  insights: CheckInInsights;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    duration?: number;
  }>;
}

interface Question {
  id: string;
  question: string;
  type: "scale" | "frequency" | "text";
  options?: string[];
  scaleRange?: { min: number; max: number; labels?: string[] };
}

interface ConversationMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

/**
 * Convert service session type to component session type
 * Handles the transformation of insights from Record<string, any> to CheckInInsights
 */
function convertSession(serviceSession: EmotionalCheckInSession): CheckInSession {
  // Transform insights if they exist, otherwise provide defaults
  let insights: CheckInInsights;
  
  if (serviceSession.insights && typeof serviceSession.insights === 'object') {
    // Check if it's already in the correct format
    if ('summary' in serviceSession.insights && 'details' in serviceSession.insights) {
      insights = serviceSession.insights as unknown as CheckInInsights;
    } else {
      // Transform from Record format to CheckInInsights format
      const insightsRecord = serviceSession.insights as Record<string, unknown>;
      insights = {
        summary: typeof insightsRecord.summary === 'string' 
          ? insightsRecord.summary 
          : 'Your check-in is complete.',
        details: Array.isArray(insightsRecord.details)
          ? (insightsRecord.details as Insight[])
          : [],
        patterns: insightsRecord.patterns as Record<string, unknown> | undefined,
      };
    }
  } else {
    // Default empty insights
    insights = {
      summary: 'Your check-in is complete.',
      details: [],
    };
  }

  return {
    id: serviceSession.id,
    userId: serviceSession.userId,
    startedAt: serviceSession.startedAt,
    completedAt: serviceSession.completedAt,
    questionCount: serviceSession.questionCount,
    screeningType: serviceSession.screeningType,
    overallAnxietyScore: serviceSession.overallAnxietyScore,
    overallMoodScore: serviceSession.overallMoodScore,
    riskLevel: serviceSession.riskLevel,
    crisisDetected: serviceSession.crisisDetected,
    insights,
    recommendations: serviceSession.recommendations,
  };
}

export function EmotionalCheckInFlow() {
  const [session, setSession] = useState<CheckInSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory]);

  // Start check-in on mount
  useEffect(() => {
    startCheckIn();
  }, []);

  const startCheckIn = async () => {
    try {
      setIsStarting(true);
      const result = await emotionalCheckInService.startCheckIn("standard");

      setSession(convertSession(result.session));
      
      // Add greeting message
      const greeting: ConversationMessage = {
        role: "assistant",
        content: result.greeting,
        timestamp: new Date(),
      };
      setConversationHistory([greeting]);

      // Set first question
      setCurrentQuestion(result.firstQuestion);
      
      const questionMessage: ConversationMessage = {
        role: "assistant",
        content: result.firstQuestion.question,
        timestamp: new Date(),
      };
      setConversationHistory((prev) => [...prev, questionMessage]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start check-in";
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleResponse = async (value: number | string, text?: string) => {
    if (!session || !currentQuestion) return;

    try {
      setIsLoading(true);

      // Add user response to conversation
      const userMessage: ConversationMessage = {
        role: "user",
        content: typeof value === "string" ? value : String(value),
        timestamp: new Date(),
      };
      setConversationHistory((prev) => [...prev, userMessage]);

      // Submit response
      const result = await emotionalCheckInService.submitResponse(
        session.id,
        currentQuestion.id,
        value,
        text,
        conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        }))
      );

      if (result.isComplete) {
        // Complete the session
        await completeSession(session.id);
      } else if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: result.nextQuestion.question,
          timestamp: new Date(),
        };
        setConversationHistory((prev) => [...prev, assistantMessage]);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit response";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const completeSession = async (sessionId: string) => {
    try {
      const completedSession = await emotionalCheckInService.completeSession(sessionId);

      setSession(convertSession(completedSession));
      setIsComplete(true);
      
      if (completedSession.crisisDetected) {
        setShowCrisisModal(true);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to complete check-in";
      toast.error(message);
    }
  };

  if (isStarting) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isComplete && session) {
    return (
      <>
        <CheckInResults session={session} />
        {showCrisisModal && (
          <CrisisResourcesModal
            open={showCrisisModal}
            onOpenChange={setShowCrisisModal}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-purple-600/5 to-pink-600/5" />
      
      <div className="relative p-6 sm:p-8">
        {/* Progress Indicator */}
        {session && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span>Question {session.questionCount + 1}</span>
              <span>~1-3 min</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(((session.questionCount + 1) / 10) * 100, 100)}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Conversation History */}
        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {conversationHistory.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-emerald-600/20 text-white"
                      : "bg-slate-700/50 text-slate-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Current Question */}
        {currentQuestion && !isLoading && (
          <div className="space-y-4">
            <CheckInQuestion
              question={currentQuestion}
              onRespond={handleResponse}
            />
            
            {/* AI Camera Analysis Option */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    AI Emotion Analysis
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                      NEW
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Get deeper insights with real-time facial expression analysis.
                    Processed entirely on your device for privacy.
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span>Fast (~20s)</span>
                    </div>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Camera className="w-3 h-3 text-blue-500" />
                      <span>On-device</span>
                    </div>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Heart className="w-3 h-3 text-pink-500" />
                      <span>Private</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCamera(true)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2 text-white text-sm font-medium"
                  >
                    <Sparkles className="w-4 h-4" />
                    Start AI Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        )}
      </div>

      {/* TensorFlow Emotion Analysis Modal */}
      {showCamera && session && (
        <TensorFlowEmotionAnalyzer
          sessionId={session.id}
          onAnalysisComplete={async (analysis) => {
            try {
              // Submit the TensorFlow analysis results to the backend
              const result = await emotionalCheckInService.submitTensorFlowAnalysis(
                session.id,
                {
                  dominant: analysis.dominant,
                  distribution: analysis.distribution,
                  engagement: analysis.engagement,
                  stressIndicators: analysis.stressIndicators,
                  averageConfidence: analysis.averageConfidence,
                  sampleCount: analysis.sampleCount,
                }
              );

              // Show insights from the analysis
              if (result.insights && result.insights.length > 0) {
                toast.success(result.insights[0], { duration: 5000 });
              } else {
                toast.success("AI analysis complete! Your emotional profile has been captured.");
              }

              // Add analysis summary to conversation
              const analysisMessage: ConversationMessage = {
                role: "assistant",
                content: `I've analyzed your facial expressions. Your dominant emotion appears to be ${analysis.dominant} with ${Math.round(analysis.engagement * 100)}% engagement. This will help me provide more personalized insights.`,
                timestamp: new Date(),
              };
              setConversationHistory((prev) => [...prev, analysisMessage]);

              setShowCamera(false);
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : "Failed to process analysis";
              toast.error(message);
              setShowCamera(false);
            }
          }}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

