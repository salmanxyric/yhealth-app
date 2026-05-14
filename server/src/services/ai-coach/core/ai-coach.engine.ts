import { AIProvider } from './ai-provider.js';
import { ImageAnalysisService } from '../image/image-analysis.service.js';
import { SessionService } from '../session/session.service.js';
import { GoalGeneratorService } from '../planning/goal-generator.service.js';
import { ConversationService } from '../conversation/conversation.service.js';
import { MCQGeneratorService } from '../assessment/mcq-generator.service.js';
import { BatchMCQService } from '../assessment/batch-mcq.service.js';
import { LifeCoachService } from '../assessment/life-coach.service.js';
import type {
  GoalCategory,
  SupportedLanguage,
  ChatMessage,
  ConversationContext,
  ExtractedInsight,
  AICoachResponse,
  AICoachSession,
  ConversationPhase,
  HealthImageType,
  ImageValidationResult,
  ImageAnalysisResult,
  UploadedHealthImage,
  GenerateGoalsRequest,
  GenerateGoalsResponse,
  DietPlanRequest,
  GeneratedDietPlan,
  MCQOption,
  MCQGenerationRequest,
  MCQGenerationResponse,
  BatchMCQRequest,
  BatchMCQResponse,
  LifeCoachQuestionsRequest,
  LifeCoachQuestionsResponse,
} from '../types/index.js';

export class AICoachEngine {
  private imageModule: ImageAnalysisService;
  private sessionModule: SessionService;
  private goalModule: GoalGeneratorService;
  private conversationModule: ConversationService;
  private mcqModule: MCQGeneratorService;
  private batchMcqModule: BatchMCQService;
  private lifeCoachModule: LifeCoachService;

  constructor() {
    const provider = new AIProvider();
    this.imageModule = new ImageAnalysisService(provider);
    this.sessionModule = new SessionService();
    this.goalModule = new GoalGeneratorService(provider);
    this.conversationModule = new ConversationService(provider);
    this.mcqModule = new MCQGeneratorService(provider);
    this.batchMcqModule = new BatchMCQService(provider);
    this.lifeCoachModule = new LifeCoachService(provider);
  }

  // --- Image ---

  isAvailable(): boolean {
    return this.imageModule.isAvailable();
  }

  async validateHealthImage(buffer: Buffer, mimeType: string, originalName: string): Promise<ImageValidationResult> {
    return this.imageModule.validateHealthImage(buffer, mimeType, originalName);
  }

  async uploadHealthImage(userId: string, buffer: Buffer, mimeType: string, originalName: string): Promise<UploadedHealthImage> {
    return this.imageModule.uploadHealthImage(userId, buffer, mimeType, originalName);
  }

  async analyzeHealthImage(
    imageUrlOrBuffer: string | Buffer,
    imageType: HealthImageType,
    userContext?: { goal?: GoalCategory; question?: string },
    mimeType?: string
  ): Promise<ImageAnalysisResult> {
    return this.imageModule.analyzeHealthImage(imageUrlOrBuffer, imageType, userContext, mimeType);
  }

  async processImageMessage(
    userId: string,
    imageBuffer: Buffer,
    mimeType: string,
    originalName: string,
    userQuestion?: string,
    goal?: GoalCategory
  ): Promise<{ image: UploadedHealthImage; analysis: ImageAnalysisResult; response: string }> {
    return this.imageModule.processImageMessage(userId, imageBuffer, mimeType, originalName, userQuestion, goal);
  }

  // --- Session ---

  async getPreviousSessions(userId: string, limit?: number): Promise<AICoachSession[]> {
    return this.sessionModule.getPreviousSessions(userId, limit);
  }

  async getActiveSession(userId: string, goal?: GoalCategory, sessionType?: string): Promise<AICoachSession | null> {
    return this.sessionModule.getActiveSession(userId, goal, sessionType);
  }

  async getSessionById(userId: string, sessionId: string): Promise<AICoachSession | null> {
    return this.sessionModule.getSessionById(userId, sessionId);
  }

  async createSession(userId: string, goal: GoalCategory, sessionType: string): Promise<AICoachSession> {
    return this.sessionModule.createSession(userId, goal, sessionType);
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    return this.sessionModule.deleteSession(userId, sessionId);
  }

  async addMessageToSession(
    sessionId: string,
    message: ChatMessage,
    insights?: ExtractedInsight[],
    phase?: ConversationPhase,
    isComplete?: boolean
  ): Promise<void> {
    return this.sessionModule.addMessageToSession(sessionId, message, insights, phase, isComplete);
  }

  async buildHistoricalContext(userId: string): Promise<string> {
    return this.sessionModule.buildHistoricalContext(userId);
  }

  async generateDietPlan(request: DietPlanRequest): Promise<GeneratedDietPlan> {
    return this.sessionModule.generateDietPlan(request);
  }

  async saveDietPlan(userId: string, plan: GeneratedDietPlan, goal: GoalCategory): Promise<string> {
    return this.sessionModule.saveDietPlan(userId, plan, goal);
  }

  async getActiveDietPlan(userId: string): Promise<Record<string, unknown> | null> {
    return this.sessionModule.getActiveDietPlan(userId);
  }

  // --- Planning ---

  async generateGoals(request: GenerateGoalsRequest): Promise<GenerateGoalsResponse> {
    return this.goalModule.generateGoals(request);
  }

  // --- Conversation ---

  async getUserName(userId: string): Promise<string | null> {
    return this.conversationModule.getUserName(userId);
  }

  async generateOpeningMessage(
    goal: GoalCategory,
    userName?: string,
    language?: SupportedLanguage,
    userId?: string,
    isOnboarding?: boolean
  ): Promise<AICoachResponse> {
    return this.conversationModule.generateOpeningMessage(goal, userName, language, userId, isOnboarding);
  }

  async generateResponse(
    context: ConversationContext,
    history?: ChatMessage[],
    message?: string
  ): Promise<AICoachResponse> {
    return this.conversationModule.generateResponse(context, history, message);
  }

  // --- Assessment ---

  async generateMCQQuestion(request: MCQGenerationRequest): Promise<MCQGenerationResponse> {
    return this.mcqModule.generateMCQQuestion(request);
  }

  async processMCQAnswer(questionId: string, selectedOptions: MCQOption[], goal: GoalCategory): Promise<ExtractedInsight[]> {
    return this.mcqModule.processMCQAnswer(questionId, selectedOptions, goal);
  }

  async generateBatchMCQQuestions(request: BatchMCQRequest): Promise<BatchMCQResponse> {
    return this.batchMcqModule.generateBatchMCQQuestions(request);
  }

  async generateLifeCoachQuestions(request: LifeCoachQuestionsRequest): Promise<LifeCoachQuestionsResponse> {
    return this.lifeCoachModule.generateLifeCoachQuestions(request);
  }
}

export const aiCoachService = new AICoachEngine();
