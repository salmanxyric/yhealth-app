"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils,
  Plus,
  Clock,
  Flame,
  Apple,
  Beef,
  Wheat,
  Sparkles,
  CheckCircle2,
  Leaf,
  X,
  Save,
  Search,
  Loader2,
  Wand2,
  Camera,
  Upload,
  Image as ImageIcon,
  VideoOff,
  AlertCircle,
  Tag,
  Edit3,
  Minus,
} from "lucide-react";
import Image from "next/image";
import type { MealFood } from "@/src/shared/services";
import type { FoodAnalysisResult, NutritionLabelData } from "../types";
import NutritionLabelResult from "../NutritionLabelResult";
import { PRESET_FOODS, FOOD_CATEGORY_ICONS, getFoodIcon } from "../constants";
import { DashboardUnderlineTabs } from "../../../DashboardUnderlineTabs";
import type { LucideIcon } from "lucide-react";

// ============================================
// TYPES
// ============================================

interface MealIconItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface MealFormDataInternal {
  name: string;
  time: string;
  icon: "breakfast" | "lunch" | "dinner" | "snack";
  items: (MealFood & { eaten?: boolean })[];
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  manualMacros?: boolean;
}

interface FormTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface CustomFoodDraft {
  name: string;
  portion: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

interface CreateMealModalProps {
  isOpen: boolean;
  editingMeal: unknown;
  mealFormData: MealFormDataInternal;
  setMealFormData: React.Dispatch<React.SetStateAction<MealFormDataInternal>>;
  mealIconsList: MealIconItem[];
  mealInputMode: "manual" | "ai" | "image";
  setMealInputMode: (mode: "manual" | "ai" | "image") => void;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  showCustomFood: boolean;
  setShowCustomFood: (show: boolean) => void;
  customFoodDraft: CustomFoodDraft;
  setCustomFoodDraft: React.Dispatch<React.SetStateAction<CustomFoodDraft>>;
  formTotals: FormTotals;
  isMealFormValid: boolean;
  filteredFoods: Record<string, MealFood[]>;
  foodSearch: string;
  setFoodSearch: (search: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  mealsSaving: boolean;
  // AI generation
  aiMealDescription: string;
  setAiMealDescription: (desc: string) => void;
  aiMealGenerating: boolean;
  aiMealError: string | null;
  setAiMealError: (error: string | null) => void;
  generateMealWithAI: () => void;
  // Image capture
  imageCaptureMode: "camera" | "upload";
  setImageCaptureMode: (mode: "camera" | "upload") => void;
  capturedImage: string | null;
  setCapturedImage: (img: string | null) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  isAnalyzingImage: boolean;
  imageAnalysisResult: FoodAnalysisResult | null;
  setImageAnalysisResult: (result: FoodAnalysisResult | null) => void;
  imageAnalysisError: string | null;
  setImageAnalysisError: (error: string | null) => void;
  mealImageDescription: string;
  setMealImageDescription: (desc: string) => void;
  isCameraActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imageScanMode: "food" | "label";
  setImageScanMode: (mode: "food" | "label") => void;
  nutritionLabelData: NutritionLabelData | null;
  setNutritionLabelData: (data: NutritionLabelData | null) => void;
  startCamera: () => void;
  stopCamera: () => void;
  capturePhoto: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  analyzeFoodImage: () => void;
  analyzeNutritionLabel: () => void;
  populateMealFromLabel: (data: NutritionLabelData, servings: number) => void;
  // Actions
  addFoodItem: (food: MealFood) => void;
  addCustomFood: () => void;
  removeFoodItem: (itemId: string) => void;
  resetMealForm: () => void;
  createMeal: () => void;
  updateMeal: () => void;
  onClose: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function CreateMealModal({
  isOpen,
  editingMeal,
  mealFormData,
  setMealFormData,
  mealIconsList,
  mealInputMode,
  setMealInputMode,
  editingItemId,
  setEditingItemId,
  showCustomFood,
  setShowCustomFood,
  customFoodDraft,
  setCustomFoodDraft,
  formTotals,
  isMealFormValid,
  filteredFoods,
  foodSearch,
  setFoodSearch,
  selectedCategory,
  setSelectedCategory,
  mealsSaving,
  aiMealDescription,
  setAiMealDescription,
  aiMealGenerating,
  aiMealError,
  setAiMealError,
  generateMealWithAI,
  imageCaptureMode,
  setImageCaptureMode,
  capturedImage,
  setCapturedImage,
  imageFile: _imageFile,
  setImageFile,
  isAnalyzingImage,
  imageAnalysisResult,
  setImageAnalysisResult,
  imageAnalysisError,
  setImageAnalysisError,
  mealImageDescription,
  setMealImageDescription,
  isCameraActive,
  videoRef,
  canvasRef,
  fileInputRef,
  imageScanMode,
  setImageScanMode,
  nutritionLabelData,
  setNutritionLabelData,
  startCamera,
  stopCamera,
  capturePhoto,
  handleFileChange,
  analyzeFoodImage,
  analyzeNutritionLabel,
  populateMealFromLabel,
  addFoodItem,
  addCustomFood,
  removeFoodItem,
  resetMealForm,
  createMeal,
  updateMeal,
  onClose,
}: CreateMealModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide bg-[linear-gradient(145deg,#0f1219_0%,#0a0d14_100%)] rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[linear-gradient(180deg,rgba(15,18,25,0.98)_0%,rgba(15,18,25,0.92)_100%)] backdrop-blur-xl border-b border-white/[0.06] px-5 sm:px-8 py-4 sm:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25">
                    <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {editingMeal ? "Edit Meal" : "Log New Meal"}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      {editingMeal ? "Update your meal details and foods" : "Track what you ate with precision"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-8 flex flex-col gap-5 sm:gap-6">
              {/* Meal Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Meal Name</label>
                <input
                  type="text"
                  value={mealFormData.name}
                  onChange={(e) => setMealFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Breakfast, Post-workout Shake"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Time & Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="time"
                      value={mealFormData.time}
                      onChange={(e) => setMealFormData((prev) => ({ ...prev, time: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Meal Type</label>
                  <div className="flex gap-2">
                    {mealIconsList.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setMealFormData((prev) => ({ ...prev, icon: item.id as typeof mealFormData.icon }))}
                        className={`flex-1 p-3 rounded-xl border transition-all ${
                          mealFormData.icon === item.id
                            ? "border-emerald-500/60 bg-emerald-500/15 shadow shadow-emerald-500/20"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                        }`}
                        title={item.label}
                      >
                        <item.icon
                          className={`w-5 h-5 mx-auto transition-colors ${
                            mealFormData.icon === item.id ? "text-emerald-300" : "text-slate-400"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input Mode Tabs */}
              <DashboardUnderlineTabs
                layoutId="mealInputModeTabs"
                activeId={mealInputMode}
                onTabChange={(id) => setMealInputMode(id as typeof mealInputMode)}
                equalWidth
                tabs={[
                  { id: "manual", label: "Manual", icon: Search },
                  { id: "ai", label: "AI", icon: Sparkles },
                  { id: "image", label: "Image", icon: Camera },
                ]}
              />

              {/* Image Capture/Upload for Meal Analysis */}
              {mealInputMode === "image" && (
                <ImageCaptureSection
                  imageCaptureMode={imageCaptureMode}
                  setImageCaptureMode={setImageCaptureMode}
                  imageScanMode={imageScanMode}
                  setImageScanMode={setImageScanMode}
                  capturedImage={capturedImage}
                  setCapturedImage={setCapturedImage}
                  setImageFile={setImageFile}
                  isCameraActive={isCameraActive}
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  fileInputRef={fileInputRef}
                  startCamera={startCamera}
                  stopCamera={stopCamera}
                  capturePhoto={capturePhoto}
                  handleFileChange={handleFileChange}
                  isAnalyzingImage={isAnalyzingImage}
                  imageAnalysisResult={imageAnalysisResult}
                  setImageAnalysisResult={setImageAnalysisResult}
                  imageAnalysisError={imageAnalysisError}
                  setImageAnalysisError={setImageAnalysisError}
                  mealImageDescription={mealImageDescription}
                  setMealImageDescription={setMealImageDescription}
                  nutritionLabelData={nutritionLabelData}
                  setNutritionLabelData={setNutritionLabelData}
                  analyzeFoodImage={analyzeFoodImage}
                  analyzeNutritionLabel={analyzeNutritionLabel}
                  populateMealFromLabel={populateMealFromLabel}
                />
              )}

              {/* AI Meal Generation */}
              {mealInputMode === "ai" && (
                <AIMealSection
                  aiMealDescription={aiMealDescription}
                  setAiMealDescription={setAiMealDescription}
                  aiMealGenerating={aiMealGenerating}
                  aiMealError={aiMealError}
                  setAiMealError={setAiMealError}
                  generateMealWithAI={generateMealWithAI}
                />
              )}

              {/* Food Items Added */}
              {mealFormData.items.length > 0 && (
                <AddedFoodsSection
                  items={mealFormData.items}
                  editingItemId={editingItemId}
                  setEditingItemId={setEditingItemId}
                  setMealFormData={setMealFormData}
                  removeFoodItem={removeFoodItem}
                  formTotals={formTotals}
                  imageAnalysisResult={imageAnalysisResult}
                />
              )}

              {/* Food Search */}
              {mealInputMode === "manual" && (
                <ManualFoodSection
                  foodSearch={foodSearch}
                  setFoodSearch={setFoodSearch}
                  showCustomFood={showCustomFood}
                  setShowCustomFood={setShowCustomFood}
                  customFoodDraft={customFoodDraft}
                  setCustomFoodDraft={setCustomFoodDraft}
                  addCustomFood={addCustomFood}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  filteredFoods={filteredFoods}
                  addFoodItem={addFoodItem}
                  mealFormData={mealFormData}
                />
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[linear-gradient(0deg,rgba(15,18,25,0.98)_0%,rgba(15,18,25,0.92)_100%)] backdrop-blur-xl border-t border-white/[0.06] px-5 sm:px-8 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    resetMealForm();
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 font-semibold hover:bg-white/[0.08] hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={editingMeal ? updateMeal : createMeal}
                  disabled={!isMealFormValid || mealsSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {mealsSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingMeal ? "Update Meal" : "Log Meal"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// SUB-SECTIONS
// ============================================

function ImageCaptureSection({
  imageCaptureMode,
  setImageCaptureMode,
  imageScanMode,
  setImageScanMode,
  capturedImage,
  setCapturedImage,
  setImageFile,
  isCameraActive,
  videoRef,
  canvasRef,
  fileInputRef,
  startCamera,
  stopCamera,
  capturePhoto,
  handleFileChange,
  isAnalyzingImage,
  imageAnalysisResult,
  setImageAnalysisResult,
  imageAnalysisError,
  setImageAnalysisError,
  mealImageDescription,
  setMealImageDescription,
  nutritionLabelData,
  setNutritionLabelData,
  analyzeFoodImage,
  analyzeNutritionLabel,
  populateMealFromLabel,
}: {
  imageCaptureMode: "camera" | "upload";
  setImageCaptureMode: (mode: "camera" | "upload") => void;
  imageScanMode: "food" | "label";
  setImageScanMode: (mode: "food" | "label") => void;
  capturedImage: string | null;
  setCapturedImage: (img: string | null) => void;
  setImageFile: (file: File | null) => void;
  isCameraActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  startCamera: () => void;
  stopCamera: () => void;
  capturePhoto: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzingImage: boolean;
  imageAnalysisResult: FoodAnalysisResult | null;
  setImageAnalysisResult: (result: FoodAnalysisResult | null) => void;
  imageAnalysisError: string | null;
  setImageAnalysisError: (error: string | null) => void;
  mealImageDescription: string;
  setMealImageDescription: (desc: string) => void;
  nutritionLabelData: NutritionLabelData | null;
  setNutritionLabelData: (data: NutritionLabelData | null) => void;
  analyzeFoodImage: () => void;
  analyzeNutritionLabel: () => void;
  populateMealFromLabel: (data: NutritionLabelData, servings: number) => void;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        {imageScanMode === "label" ? (
          <Tag className="w-5 h-5 text-amber-400" />
        ) : (
          <Camera className="w-5 h-5 text-emerald-400" />
        )}
        <label
          className={`text-sm font-medium ${imageScanMode === "label" ? "text-amber-300" : "text-emerald-300"}`}
        >
          {imageScanMode === "label" ? "Scan Nutrition Label" : "Capture or Upload Food Image"}
        </label>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        {imageScanMode === "label"
          ? "Upload a photo of a product nutrition facts panel to extract exact values"
          : "Take a photo or upload an image of your meal to automatically analyze nutrition"}
      </p>

      {/* Mode Toggle */}
      <div className="flex gap-1.5 p-1 bg-slate-800/50 rounded-lg mb-3">
        <button
          onClick={() => {
            setImageCaptureMode("upload");
            setImageScanMode("food");
            stopCamera();
            if (capturedImage) {
              setCapturedImage(null);
              setImageFile(null);
            }
            setNutritionLabelData(null);
          }}
          className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
            imageCaptureMode === "upload" && imageScanMode === "food"
              ? "bg-emerald-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Upload className="w-3.5 h-3.5 inline mr-1" />
          Upload
        </button>
        <button
          onClick={() => {
            setImageCaptureMode("camera");
            setImageScanMode("food");
            setNutritionLabelData(null);
            if (!capturedImage) {
              startCamera();
            }
          }}
          className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
            imageCaptureMode === "camera" && imageScanMode === "food"
              ? "bg-emerald-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Camera className="w-3.5 h-3.5 inline mr-1" />
          Camera
        </button>
        <button
          onClick={() => {
            setImageCaptureMode("upload");
            setImageScanMode("label");
            stopCamera();
            if (capturedImage) {
              setCapturedImage(null);
              setImageFile(null);
            }
            setImageAnalysisResult(null);
          }}
          className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
            imageScanMode === "label"
              ? "bg-amber-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Tag className="w-3.5 h-3.5 inline mr-1" />
          Scan Label
        </button>
      </div>

      {/* Camera View */}
      {imageCaptureMode === "camera" && (
        <div className="space-y-3">
          {!capturedImage ? (
            <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
              {isCameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-end justify-center p-4">
                    <button
                      onClick={capturePhoto}
                      disabled={!isCameraActive}
                      className="w-14 h-14 rounded-full bg-white border-4 border-slate-300 shadow-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Camera className="w-6 h-6 text-slate-800" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <VideoOff className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <p className="text-slate-400 mb-4">Camera not active</p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm"
                    >
                      Start Camera
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
              <Image src={capturedImage} alt="Captured food" fill className="object-contain" />
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setImageFile(null);
                  setImageAnalysisResult(null);
                  setImageAnalysisError(null);
                  if (imageCaptureMode === "camera") startCamera();
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload View */}
      {imageCaptureMode === "upload" && (
        <div className="space-y-3">
          {!capturedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative aspect-[4/3] bg-slate-800/50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors ${
                imageScanMode === "label"
                  ? "border-amber-500/40 hover:border-amber-500/60"
                  : "border-slate-600 hover:border-emerald-500/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                onChange={handleFileChange}
                className="hidden"
              />
              {imageScanMode === "label" ? (
                <Tag className="w-12 h-12 mb-4 text-amber-400" />
              ) : (
                <Upload className="w-12 h-12 mb-4 text-slate-400" />
              )}
              <p className="text-slate-400 mb-1">
                {imageScanMode === "label" ? "Upload a nutrition label photo" : "Click to upload or drag and drop"}
              </p>
              <p className="text-slate-500 text-xs">JPEG, PNG, WebP, or HEIC (max 10MB)</p>
            </div>
          ) : (
            <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
              <Image src={capturedImage} alt="Uploaded food" fill className="object-contain" />
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setImageFile(null);
                  setImageAnalysisResult(null);
                  setImageAnalysisError(null);
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {imageAnalysisError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs">{imageAnalysisError}</p>
        </div>
      )}

      {/* Analysis Result Preview */}
      {imageAnalysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-emerald-400 font-medium text-xs mb-1">Analysis Complete</p>
              {imageAnalysisResult.caloriesEstimate && (
                <p className="text-slate-300 text-xs mb-1">Calories: {imageAnalysisResult.caloriesEstimate}</p>
              )}
              {imageAnalysisResult.foodsIdentified.length > 0 && (
                <p className="text-slate-400 text-xs">{imageAnalysisResult.foodsIdentified.length} food(s) identified</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Optional Meal Description (food mode only) */}
      {capturedImage && !imageAnalysisResult && !nutritionLabelData && imageScanMode === "food" && (
        <div className="mt-3">
          <input
            type="text"
            value={mealImageDescription}
            onChange={(e) => setMealImageDescription(e.target.value)}
            placeholder="Describe your meal (optional) e.g. full plate of salad"
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      )}

      {/* Nutrition Label Result */}
      {nutritionLabelData && (
        <div className="mt-3">
          <NutritionLabelResult
            data={nutritionLabelData}
            onAddToMeal={populateMealFromLabel}
            onDismiss={() => setNutritionLabelData(null)}
          />
        </div>
      )}

      {/* Analyze Button */}
      {capturedImage && !imageAnalysisResult && !nutritionLabelData && (
        <button
          onClick={imageScanMode === "label" ? analyzeNutritionLabel : analyzeFoodImage}
          disabled={isAnalyzingImage}
          className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${
            imageScanMode === "label"
              ? "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              : "from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
          } text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isAnalyzingImage ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {imageScanMode === "label" ? "Scanning Label..." : "Analyzing..."}
            </>
          ) : (
            <>
              {imageScanMode === "label" ? (
                <>
                  <Tag className="w-4 h-4" /> Scan Label
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" /> Analyze Image
                </>
              )}
            </>
          )}
        </button>
      )}
    </div>
  );
}

function AIMealSection({
  aiMealDescription,
  setAiMealDescription,
  aiMealGenerating,
  aiMealError,
  setAiMealError,
  generateMealWithAI,
}: {
  aiMealDescription: string;
  setAiMealDescription: (desc: string) => void;
  aiMealGenerating: boolean;
  aiMealError: string | null;
  setAiMealError: (error: string | null) => void;
  generateMealWithAI: () => void;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <label className="text-sm font-medium text-purple-300">Generate with AI</label>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Describe what you want to eat and AI will create the meal for you
      </p>
      <textarea
        value={aiMealDescription}
        onChange={(e) => {
          setAiMealDescription(e.target.value);
          setAiMealError(null);
        }}
        placeholder="e.g., High protein breakfast with eggs and avocado, or a healthy lunch with grilled chicken salad..."
        rows={2}
        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
      />
      {aiMealError && <p className="text-xs text-red-400 mt-2">{aiMealError}</p>}
      <button
        onClick={generateMealWithAI}
        disabled={aiMealGenerating || !aiMealDescription.trim()}
        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {aiMealGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate Meal
          </>
        )}
      </button>
    </div>
  );
}

function AddedFoodsSection({
  items,
  editingItemId,
  setEditingItemId,
  setMealFormData,
  removeFoodItem,
  formTotals,
  imageAnalysisResult,
}: {
  items: (MealFood & { eaten?: boolean })[];
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  setMealFormData: React.Dispatch<React.SetStateAction<MealFormDataInternal>>;
  removeFoodItem: (itemId: string) => void;
  formTotals: FormTotals;
  imageAnalysisResult: FoodAnalysisResult | null;
}) {
  return (
    <div className="order-last">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Added Foods</label>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">
            {items.length}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-[26rem] overflow-y-auto scrollbar-hide pr-1">
        {items.map((item) => {
          const isEditing = editingItemId === item.id;
          const muted = item.eaten === false;
          return (
            <div
              key={item.id}
              className={`group rounded-2xl border transition-all overflow-hidden ${
                muted
                  ? "bg-white/[0.02] border-white/[0.05] opacity-60"
                  : isEditing
                    ? "bg-[linear-gradient(145deg,#0f1219_0%,#0a0d14_100%)] border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                    : "bg-[linear-gradient(145deg,#0f1219_0%,#0a0d14_100%)] border-white/[0.07] hover:border-white/[0.14]"
              } ${isEditing ? "lg:col-span-2" : ""}`}
            >
              <div className="flex items-center gap-3 p-3">
                <input
                  type="checkbox"
                  checked={!muted}
                  onChange={(e) => {
                    setMealFormData((prev) => ({
                      ...prev,
                      items: prev.items.map((i) => (i.id === item.id ? { ...i, eaten: e.target.checked } : i)),
                    }));
                  }}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer shrink-0"
                />
                <span className="w-10 h-10 flex items-center justify-center text-2xl rounded-xl bg-white/[0.04] shrink-0">
                  {getFoodIcon(item.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-medium truncate ${muted ? "text-slate-500 line-through" : "text-white"}`}>
                      {item.name}
                    </p>
                    {(item.quantity || 1) > 1 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold shrink-0">
                        ×{item.quantity}
                      </span>
                    )}
                    {item.id?.startsWith("ai-") && (
                      <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[9px] font-bold uppercase tracking-wider shrink-0">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.portion}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {/* Quantity controls */}
                    <div className="inline-flex items-center gap-0 rounded-lg border border-white/[0.1] bg-white/[0.03] shrink-0 mr-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentQty = item.quantity || 1;
                          if (currentQty <= 1) {
                            if (editingItemId === item.id) setEditingItemId(null);
                            removeFoodItem(item.id);
                          } else {
                            setMealFormData((prev) => ({
                              ...prev,
                              items: prev.items.map((i) => i.id === item.id ? { ...i, quantity: currentQty - 1 } : i),
                            }));
                          }
                        }}
                        className="p-1 hover:bg-white/[0.08] rounded-l-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-[11px] font-semibold text-white min-w-[20px] text-center tabular-nums">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMealFormData((prev) => ({
                            ...prev,
                            items: prev.items.map((i) => i.id === item.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i),
                          }));
                        }}
                        className="p-1 hover:bg-white/[0.08] rounded-r-lg text-slate-400 hover:text-emerald-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Macro badges (show per-unit values × quantity) */}
                    <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto scrollbar-hide whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-200 shrink-0">
                        <Flame className="w-3 h-3" />
                        {item.calories * (item.quantity || 1)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-200 shrink-0">
                        <Beef className="w-3 h-3" />
                        {Math.round(item.protein * (item.quantity || 1) * 10) / 10}g
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-200 shrink-0">
                        <Wheat className="w-3 h-3" />
                        {Math.round(item.carbs * (item.quantity || 1) * 10) / 10}g
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-200 shrink-0">
                        <Apple className="w-3 h-3" />
                        {Math.round(item.fat * (item.quantity || 1) * 10) / 10}g
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 self-start">
                  <button
                    onClick={() => setEditingItemId(isEditing ? null : item.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isEditing
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-emerald-300"
                    }`}
                    title={isEditing ? "Done editing" : "Edit nutrition"}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (editingItemId === item.id) setEditingItemId(null);
                      removeFoodItem(item.id);
                    }}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {isEditing && (
                <div className="px-3 pb-3 pt-3 border-t border-white/[0.06] bg-white/[0.02]">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-semibold mb-2">
                    Edit nutrition for this item
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "calories", label: "Cal", icon: Flame, color: "text-orange-400", step: "1" },
                      { key: "protein", label: "Protein (g)", icon: Beef, color: "text-red-400", step: "0.1" },
                      { key: "carbs", label: "Carbs (g)", icon: Wheat, color: "text-amber-400", step: "0.1" },
                      { key: "fat", label: "Fat (g)", icon: Apple, color: "text-purple-400", step: "0.1" },
                    ].map((field) => {
                      const Icon = field.icon;
                      const val = (item as unknown as Record<string, number>)[field.key];
                      return (
                        <div key={field.key}>
                          <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">
                            {field.label}
                          </label>
                          <div className="relative">
                            <Icon className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 ${field.color}`} />
                            <input
                              type="number"
                              min="0"
                              step={field.step}
                              value={val ?? 0}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const num = raw === "" ? 0 : field.step === "1" ? parseInt(raw, 10) : parseFloat(raw);
                                if (Number.isNaN(num)) return;
                                setMealFormData((prev) => ({
                                  ...prev,
                                  items: prev.items.map((i) => (i.id === item.id ? { ...i, [field.key]: num } : i)),
                                }));
                              }}
                              className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="mt-3 space-y-3">
        {/* Macronutrients Section */}
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-medium text-emerald-400">Macronutrients</h5>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-slate-300">Calories:</span>
              <span className="text-white font-medium">{formTotals.calories} kcal</span>
            </div>
            <div className="flex items-center gap-2">
              <Beef className="w-3 h-3 text-red-400" />
              <span className="text-slate-300">Protein:</span>
              <span className="text-white font-medium">{Math.round(formTotals.protein)}g</span>
            </div>
            <div className="flex items-center gap-2">
              <Wheat className="w-3 h-3 text-amber-400" />
              <span className="text-slate-300">Carbs:</span>
              <span className="text-white font-medium">{Math.round(formTotals.carbs)}g</span>
            </div>
            <div className="flex items-center gap-2">
              <Apple className="w-3 h-3 text-purple-400" />
              <span className="text-slate-300">Fat:</span>
              <span className="text-white font-medium">{Math.round(formTotals.fat)}g</span>
            </div>
            {imageAnalysisResult?.macronutrients.fiber && (
              <div className="flex items-center gap-2 col-span-2">
                <Leaf className="w-3 h-3 text-green-400" />
                <span className="text-slate-300">Fiber:</span>
                <span className="text-white font-medium">{Math.round(imageAnalysisResult.macronutrients.fiber)}g</span>
              </div>
            )}
          </div>
        </div>

        {/* Micronutrients Section */}
        {imageAnalysisResult && imageAnalysisResult.micronutrients.length > 0 && (
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <h5 className="text-xs font-medium text-cyan-400 mb-2">Micronutrients</h5>
            <div className="flex flex-wrap gap-1.5">
              {imageAnalysisResult.micronutrients.map((nutrient, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-medium">
                  {nutrient}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ManualFoodSection({
  foodSearch,
  setFoodSearch,
  showCustomFood,
  setShowCustomFood,
  customFoodDraft,
  setCustomFoodDraft,
  addCustomFood,
  selectedCategory,
  setSelectedCategory,
  filteredFoods,
  addFoodItem,
  mealFormData,
}: {
  foodSearch: string;
  setFoodSearch: (search: string) => void;
  showCustomFood: boolean;
  setShowCustomFood: (show: boolean) => void;
  customFoodDraft: CustomFoodDraft;
  setCustomFoodDraft: React.Dispatch<React.SetStateAction<CustomFoodDraft>>;
  addCustomFood: () => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  filteredFoods: Record<string, MealFood[]>;
  addFoodItem: (food: MealFood) => void;
  mealFormData: MealFormDataInternal;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Add Foods</label>
        <button
          type="button"
          onClick={() => {
            setShowCustomFood(!showCustomFood);
            if (!showCustomFood && foodSearch.trim()) {
              setCustomFoodDraft((d) => ({ ...d, name: foodSearch.trim() }));
            }
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            showCustomFood
              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40"
              : "bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          <Plus className="w-3 h-3" />
          {showCustomFood ? "Hide custom form" : "Add custom food"}
        </button>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={foodSearch}
          onChange={(e) => setFoodSearch(e.target.value)}
          placeholder="Search foods..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Custom Food Form */}
      {showCustomFood && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25">
              <Plus className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-200">Create Custom Food</p>
              <p className="text-[11px] text-slate-400">Add your own food with exact nutrition</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              value={customFoodDraft.name}
              onChange={(e) => setCustomFoodDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Food name (e.g., Grandma's Lasagna)"
              className="sm:col-span-2 w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              value={customFoodDraft.portion}
              onChange={(e) => setCustomFoodDraft((d) => ({ ...d, portion: e.target.value }))}
              placeholder="Portion (e.g., 100g, 1 bowl)"
              className="sm:col-span-2 w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: "calories", label: "Cal", icon: Flame, color: "text-orange-400", step: "1" },
              { key: "protein", label: "Protein (g)", icon: Beef, color: "text-red-400", step: "0.1" },
              { key: "carbs", label: "Carbs (g)", icon: Wheat, color: "text-amber-400", step: "0.1" },
              { key: "fat", label: "Fat (g)", icon: Apple, color: "text-purple-400", step: "0.1" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.key}>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">{f.label}</label>
                  <div className="relative">
                    <Icon className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 ${f.color}`} />
                    <input
                      type="number"
                      min="0"
                      step={f.step}
                      value={(customFoodDraft as unknown as Record<string, string>)[f.key]}
                      onChange={(e) => setCustomFoodDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                      placeholder="0"
                      className="w-full pl-7 pr-2 py-2 rounded-lg bg-slate-900/60 border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addCustomFood}
            disabled={!customFoodDraft.name.trim()}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Add to meal
          </button>
        </motion.div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !selectedCategory ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          All
        </button>
        {Object.keys(PRESET_FOODS).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === category ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>{FOOD_CATEGORY_ICONS[category] || ""}</span>
            {category}
          </button>
        ))}
      </div>

      {/* Food List */}
      <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-hide pr-1">
        {Object.keys(filteredFoods).length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] p-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
              <Search className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="text-sm text-slate-200 font-medium">
              {foodSearch.trim() ? `No match for "${foodSearch}"` : "No foods in this category"}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 mb-3">Create it manually with your own nutrition values</p>
            <button
              type="button"
              onClick={() => {
                setShowCustomFood(true);
                if (foodSearch.trim()) {
                  setCustomFoodDraft((d) => ({ ...d, name: foodSearch.trim() }));
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow shadow-emerald-600/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add as custom food
            </button>
          </div>
        )}
        {Object.entries(filteredFoods).map(([category, foods]) => (
          <div key={category}>
            <h5 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <span className="text-sm">{FOOD_CATEGORY_ICONS[category] || ""}</span>
              {category}
              <span className="text-slate-600 font-normal normal-case tracking-normal">
                · {foods.length}
              </span>
            </h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {foods.map((food) => {
                const addedItem = mealFormData.items.find(
                  (i) => i.name.trim().toLowerCase() === food.name.trim().toLowerCase()
                );
                const isAdded = !!addedItem;
                const addedQty = addedItem?.quantity || 1;
                return (
                  <button
                    key={food.id}
                    onClick={() => addFoodItem(food)}
                    className={`group w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border ${
                      isAdded
                        ? "bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/15"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    <span
                      className={`w-10 h-10 flex items-center justify-center text-2xl rounded-xl shrink-0 transition-colors ${
                        isAdded ? "bg-emerald-500/15" : "bg-white/[0.04] group-hover:bg-white/[0.06]"
                      }`}
                    >
                      {getFoodIcon(food.name, category)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${isAdded ? "text-emerald-200" : "text-white"}`}>
                          {food.name}
                        </p>
                        {isAdded && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5 shrink-0 tabular-nums">
                            ×{addedQty}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{food.portion}</p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-300">
                        <Flame className="w-3 h-3" />
                        {food.calories}
                      </span>
                      {isAdded ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-emerald-400 font-medium">tap +1</span>
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
                          <Plus className="w-3 h-3 text-emerald-300" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
