"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Save,
  Loader2,
  Camera,
  Upload,
  Image as ImageIcon,
  VideoOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import type { RecipeIngredient, RecipeInstruction } from "@/src/shared/services";

// ============================================
// TYPES
// ============================================

interface RecipeFormDataInternal {
  name: string;
  description: string;
  category: string;
  cuisine: string;
  servings: number;
  caloriesPerServing: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  tags: string[];
  dietaryFlags: string[];
  imageUrl: string | null;
}

interface CreateRecipeModalProps {
  isOpen: boolean;
  editingRecipe: unknown;
  recipeFormData: RecipeFormDataInternal;
  setRecipeFormData: React.Dispatch<React.SetStateAction<RecipeFormDataInternal>>;
  recipesSaving: boolean;
  isUploadingRecipeImage: boolean;
  recipeImageInputRef: React.RefObject<HTMLInputElement | null>;
  handleRecipeImageSelect: (file: File | null) => void;
  // Image capture (recipe analysis)
  recipeImageCaptureMode: "camera" | "upload";
  setRecipeImageCaptureMode: (mode: "camera" | "upload") => void;
  recipeCapturedImage: string | null;
  setRecipeCapturedImage: (img: string | null) => void;
  recipeImageFile: File | null;
  setRecipeImageFile: (file: File | null) => void;
  isAnalyzingRecipeImage: boolean;
  recipeImageAnalysisResult: string | null;
  recipeImageAnalysisError: string | null;
  setRecipeImageAnalysisError: (error: string | null) => void;
  isRecipeCameraActive: boolean;
  recipeVideoRef: React.RefObject<HTMLVideoElement | null>;
  recipeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  recipeFileInputRef: React.RefObject<HTMLInputElement | null>;
  startRecipeCamera: () => void;
  stopRecipeCamera: () => void;
  captureRecipePhoto: () => void;
  handleRecipeFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  analyzeRecipeImage: () => void;
  // Actions
  createRecipe: () => void;
  updateRecipe: () => void;
  resetRecipeForm: () => void;
  onClose: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function CreateRecipeModal({
  isOpen,
  editingRecipe,
  recipeFormData,
  setRecipeFormData,
  recipesSaving,
  isUploadingRecipeImage,
  recipeImageInputRef,
  handleRecipeImageSelect,
  recipeImageCaptureMode,
  setRecipeImageCaptureMode,
  recipeCapturedImage,
  setRecipeCapturedImage,
  recipeImageFile: _recipeImageFile,
  setRecipeImageFile,
  isAnalyzingRecipeImage,
  recipeImageAnalysisResult,
  recipeImageAnalysisError,
  setRecipeImageAnalysisError,
  isRecipeCameraActive,
  recipeVideoRef,
  recipeCanvasRef,
  recipeFileInputRef,
  startRecipeCamera,
  stopRecipeCamera,
  captureRecipePhoto,
  handleRecipeFileChange,
  analyzeRecipeImage,
  createRecipe,
  updateRecipe,
  resetRecipeForm,
  onClose,
}: CreateRecipeModalProps) {
  const handleClose = () => {
    onClose();
    resetRecipeForm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] sm:text-base font-bold text-white">
                  {editingRecipe ? "Edit Recipe" : "Create New Recipe"}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Image Capture/Upload for Recipe Analysis */}
              <RecipeAnalysisSection
                recipeImageCaptureMode={recipeImageCaptureMode}
                setRecipeImageCaptureMode={setRecipeImageCaptureMode}
                recipeCapturedImage={recipeCapturedImage}
                setRecipeCapturedImage={setRecipeCapturedImage}
                setRecipeImageFile={setRecipeImageFile}
                isRecipeCameraActive={isRecipeCameraActive}
                recipeVideoRef={recipeVideoRef}
                recipeCanvasRef={recipeCanvasRef}
                recipeFileInputRef={recipeFileInputRef}
                startRecipeCamera={startRecipeCamera}
                stopRecipeCamera={stopRecipeCamera}
                captureRecipePhoto={captureRecipePhoto}
                handleRecipeFileChange={handleRecipeFileChange}
                isAnalyzingRecipeImage={isAnalyzingRecipeImage}
                recipeImageAnalysisResult={recipeImageAnalysisResult}
                recipeImageAnalysisError={recipeImageAnalysisError}
                setRecipeImageAnalysisError={setRecipeImageAnalysisError}
                analyzeRecipeImage={analyzeRecipeImage}
              />

              {/* Recipe Image (manual upload) */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  Recipe Image
                </label>
                <input
                  ref={recipeImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleRecipeImageSelect(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                {recipeFormData.imageUrl ? (
                  <div
                    className="relative group rounded-2xl overflow-hidden border border-white/[0.08] bg-black/40"
                    style={{ aspectRatio: "16 / 9" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={recipeFormData.imageUrl} alt="Recipe" className="w-full h-full object-cover" />
                    {isUploadingRecipeImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => recipeImageInputRef.current?.click()}
                        disabled={isUploadingRecipeImage}
                        className="px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/[0.12] text-white text-[11px] font-semibold hover:bg-black/80 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3 h-3 inline mr-1" />
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipeFormData((prev) => ({ ...prev, imageUrl: null }))}
                        disabled={isUploadingRecipeImage}
                        className="p-1.5 rounded-lg bg-red-500/80 backdrop-blur-md text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => recipeImageInputRef.current?.click()}
                    disabled={isUploadingRecipeImage}
                    className="w-full rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-emerald-500/[0.04] hover:border-emerald-500/40 text-slate-400 hover:text-emerald-300 transition-all flex flex-col items-center justify-center gap-2 py-10 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isUploadingRecipeImage ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-300" />
                        <span className="text-[12px] font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-emerald-300" />
                        </div>
                        <div className="text-center">
                          <p className="text-[13px] font-semibold text-white">Click to upload recipe photo</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">JPEG, PNG, WebP - max 10MB</p>
                        </div>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Basic Info */}
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[13px] sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Recipe Name *
                  </label>
                  <input
                    type="text"
                    value={recipeFormData.name}
                    onChange={(e) => setRecipeFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Grilled Chicken Salad"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[13px] sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Description
                  </label>
                  <textarea
                    value={recipeFormData.description}
                    onChange={(e) => setRecipeFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your recipe..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Category
                  </label>
                  <select
                    value={recipeFormData.category}
                    onChange={(e) => setRecipeFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="dessert">Dessert</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Cuisine
                  </label>
                  <input
                    type="text"
                    value={recipeFormData.cuisine}
                    onChange={(e) => setRecipeFormData((prev) => ({ ...prev, cuisine: e.target.value }))}
                    placeholder="e.g., Italian, Mexican, Asian"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Time & Servings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[13px] sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Prep (min)
                  </label>
                  <input
                    type="number"
                    value={recipeFormData.prepTimeMinutes || ""}
                    onChange={(e) =>
                      setRecipeFormData((prev) => ({ ...prev, prepTimeMinutes: parseInt(e.target.value) || 0 }))
                    }
                    placeholder="15"
                    min="0"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[13px] sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Cook (min)
                  </label>
                  <input
                    type="number"
                    value={recipeFormData.cookTimeMinutes || ""}
                    onChange={(e) =>
                      setRecipeFormData((prev) => ({ ...prev, cookTimeMinutes: parseInt(e.target.value) || 0 }))
                    }
                    placeholder="30"
                    min="0"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[13px] sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Servings
                  </label>
                  <input
                    type="number"
                    value={recipeFormData.servings}
                    onChange={(e) =>
                      setRecipeFormData((prev) => ({ ...prev, servings: parseInt(e.target.value) || 1 }))
                    }
                    min="1"
                    max="50"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[13px] sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Difficulty
                  </label>
                  <select
                    value={recipeFormData.difficulty}
                    onChange={(e) => setRecipeFormData((prev) => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[13px] sm:text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Nutrition per Serving */}
              <div>
                <h4 className="text-[13px] sm:text-sm font-medium text-slate-300 mb-3">Nutrition per Serving</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
                  {[
                    { key: "caloriesPerServing", label: "Calories", placeholder: "350" },
                    { key: "proteinGrams", label: "Protein (g)", placeholder: "25" },
                    { key: "carbsGrams", label: "Carbs (g)", placeholder: "30" },
                    { key: "fatGrams", label: "Fat (g)", placeholder: "15" },
                    { key: "fiberGrams", label: "Fiber (g)", placeholder: "5" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-slate-500 mb-1">{field.label}</label>
                      <input
                        type="number"
                        value={(recipeFormData as unknown as Record<string, number>)[field.key] || ""}
                        onChange={(e) =>
                          setRecipeFormData((prev) => ({
                            ...prev,
                            [field.key]: field.key === "caloriesPerServing" ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder={field.placeholder}
                        min="0"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <IngredientsSection
                ingredients={recipeFormData.ingredients}
                setRecipeFormData={setRecipeFormData}
              />

              {/* Instructions */}
              <InstructionsSection
                instructions={recipeFormData.instructions}
                setRecipeFormData={setRecipeFormData}
              />

              {/* Tags */}
              <TagsSection tags={recipeFormData.tags} setRecipeFormData={setRecipeFormData} />

              {/* Dietary Flags */}
              <DietaryFlagsSection dietaryFlags={recipeFormData.dietaryFlags} setRecipeFormData={setRecipeFormData} />
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingRecipe ? updateRecipe : createRecipe}
                disabled={!recipeFormData.name.trim() || recipesSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recipesSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingRecipe ? "Update Recipe" : "Create Recipe"}
              </button>
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

function RecipeAnalysisSection({
  recipeImageCaptureMode,
  setRecipeImageCaptureMode,
  recipeCapturedImage,
  setRecipeCapturedImage,
  setRecipeImageFile,
  isRecipeCameraActive,
  recipeVideoRef,
  recipeCanvasRef,
  recipeFileInputRef,
  startRecipeCamera,
  stopRecipeCamera,
  captureRecipePhoto,
  handleRecipeFileChange,
  isAnalyzingRecipeImage,
  recipeImageAnalysisResult,
  recipeImageAnalysisError,
  setRecipeImageAnalysisError,
  analyzeRecipeImage,
}: {
  recipeImageCaptureMode: "camera" | "upload";
  setRecipeImageCaptureMode: (mode: "camera" | "upload") => void;
  recipeCapturedImage: string | null;
  setRecipeCapturedImage: (img: string | null) => void;
  setRecipeImageFile: (file: File | null) => void;
  isRecipeCameraActive: boolean;
  recipeVideoRef: React.RefObject<HTMLVideoElement | null>;
  recipeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  recipeFileInputRef: React.RefObject<HTMLInputElement | null>;
  startRecipeCamera: () => void;
  stopRecipeCamera: () => void;
  captureRecipePhoto: () => void;
  handleRecipeFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzingRecipeImage: boolean;
  recipeImageAnalysisResult: string | null;
  recipeImageAnalysisError: string | null;
  setRecipeImageAnalysisError: (error: string | null) => void;
  analyzeRecipeImage: () => void;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-5 h-5 text-emerald-400" />
        <label className="text-sm font-medium text-emerald-300">Capture or Upload Recipe Image</label>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Take a photo or upload an image of your recipe to automatically analyze and populate the form
      </p>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg mb-3">
        <button
          onClick={() => {
            setRecipeImageCaptureMode("upload");
            stopRecipeCamera();
            if (recipeCapturedImage) {
              setRecipeCapturedImage(null);
              setRecipeImageFile(null);
            }
          }}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            recipeImageCaptureMode === "upload" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <Upload className="w-3.5 h-3.5 inline mr-1.5" />
          Upload
        </button>
        <button
          onClick={() => {
            setRecipeImageCaptureMode("camera");
            if (!recipeCapturedImage) startRecipeCamera();
          }}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            recipeImageCaptureMode === "camera" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <Camera className="w-3.5 h-3.5 inline mr-1.5" />
          Camera
        </button>
      </div>

      {/* Camera View */}
      {recipeImageCaptureMode === "camera" && (
        <div className="space-y-3">
          {!recipeCapturedImage ? (
            <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
              {isRecipeCameraActive ? (
                <>
                  <video ref={recipeVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={recipeCanvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-end justify-center p-4">
                    <button
                      onClick={captureRecipePhoto}
                      disabled={!isRecipeCameraActive}
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
                      onClick={startRecipeCamera}
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
              <Image src={recipeCapturedImage} alt="Captured recipe" fill className="object-contain" />
              <button
                onClick={() => {
                  setRecipeCapturedImage(null);
                  setRecipeImageFile(null);
                  setRecipeImageAnalysisError(null);
                  if (recipeImageCaptureMode === "camera") startRecipeCamera();
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
      {recipeImageCaptureMode === "upload" && (
        <div className="space-y-3">
          {!recipeCapturedImage ? (
            <div
              onClick={() => recipeFileInputRef.current?.click()}
              className="relative aspect-[4/3] bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800 transition-colors"
            >
              <input
                ref={recipeFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                onChange={handleRecipeFileChange}
                className="hidden"
              />
              <Upload className="w-12 h-12 mb-4 text-slate-400" />
              <p className="text-slate-400 mb-1">Click to upload or drag and drop</p>
              <p className="text-slate-500 text-xs">JPEG, PNG, WebP, or HEIC (max 10MB)</p>
            </div>
          ) : (
            <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
              <Image src={recipeCapturedImage} alt="Uploaded recipe" fill className="object-contain" />
              <button
                onClick={() => {
                  setRecipeCapturedImage(null);
                  setRecipeImageFile(null);
                  setRecipeImageAnalysisError(null);
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
      {recipeImageAnalysisError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs">{recipeImageAnalysisError}</p>
        </div>
      )}

      {/* Analysis Result Preview */}
      {recipeImageAnalysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-emerald-400 font-medium text-xs mb-1">Analysis Complete</p>
              <p className="text-slate-300 text-xs line-clamp-2">Recipe data extracted and form populated</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Analyze Button */}
      {recipeCapturedImage && !recipeImageAnalysisResult && (
        <button
          onClick={analyzeRecipeImage}
          disabled={isAnalyzingRecipeImage}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzingRecipeImage ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4" />
              Analyze Recipe Image
            </>
          )}
        </button>
      )}
    </div>
  );
}

function IngredientsSection({
  ingredients,
  setRecipeFormData,
}: {
  ingredients: RecipeIngredient[];
  setRecipeFormData: React.Dispatch<React.SetStateAction<RecipeFormDataInternal>>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-slate-300">Ingredients</h4>
        <button
          type="button"
          onClick={() =>
            setRecipeFormData((prev) => ({
              ...prev,
              ingredients: [...prev.ingredients, { name: "", quantity: "", unit: "", notes: "" }],
            }))
          }
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add Ingredient
        </button>
      </div>
      {ingredients.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
          No ingredients added yet. Click &quot;Add Ingredient&quot; to start.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <input
                type="text"
                value={ing.quantity}
                onChange={(e) => {
                  const newIngredients = [...ingredients];
                  newIngredients[idx] = { ...newIngredients[idx], quantity: e.target.value };
                  setRecipeFormData((prev) => ({ ...prev, ingredients: newIngredients }));
                }}
                placeholder="2"
                className="w-16 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => {
                  const newIngredients = [...ingredients];
                  newIngredients[idx] = { ...newIngredients[idx], unit: e.target.value };
                  setRecipeFormData((prev) => ({ ...prev, ingredients: newIngredients }));
                }}
                placeholder="cups"
                className="w-20 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                value={ing.name}
                onChange={(e) => {
                  const newIngredients = [...ingredients];
                  newIngredients[idx] = { ...newIngredients[idx], name: e.target.value };
                  setRecipeFormData((prev) => ({ ...prev, ingredients: newIngredients }));
                }}
                placeholder="Ingredient name"
                className="flex-1 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => {
                  const newIngredients = ingredients.filter((_, i) => i !== idx);
                  setRecipeFormData((prev) => ({ ...prev, ingredients: newIngredients }));
                }}
                className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InstructionsSection({
  instructions,
  setRecipeFormData,
}: {
  instructions: RecipeInstruction[];
  setRecipeFormData: React.Dispatch<React.SetStateAction<RecipeFormDataInternal>>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-slate-300">Instructions</h4>
        <button
          type="button"
          onClick={() =>
            setRecipeFormData((prev) => ({
              ...prev,
              instructions: [...prev.instructions, { step: prev.instructions.length + 1, description: "" }],
            }))
          }
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add Step
        </button>
      </div>
      {instructions.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
          No instructions added yet. Click &quot;Add Step&quot; to start.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {instructions.map((inst, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-medium shrink-0">
                {idx + 1}
              </div>
              <textarea
                value={inst.description}
                onChange={(e) => {
                  const newInstructions = [...instructions];
                  newInstructions[idx] = { ...newInstructions[idx], description: e.target.value };
                  setRecipeFormData((prev) => ({ ...prev, instructions: newInstructions }));
                }}
                placeholder="Describe this step..."
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <button
                type="button"
                onClick={() => {
                  const newInstructions = instructions
                    .filter((_, i) => i !== idx)
                    .map((inst, i) => ({ ...inst, step: i + 1 }));
                  setRecipeFormData((prev) => ({ ...prev, instructions: newInstructions }));
                }}
                className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TagsSection({
  tags,
  setRecipeFormData,
}: {
  tags: string[];
  setRecipeFormData: React.Dispatch<React.SetStateAction<RecipeFormDataInternal>>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, idx) => (
          <span key={idx} className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() =>
                setRecipeFormData((prev) => ({
                  ...prev,
                  tags: prev.tags.filter((_, i) => i !== idx),
                }))
              }
              className="hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          id="tag-input"
          placeholder="Add a tag (e.g., high-protein, quick)"
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const input = e.target as HTMLInputElement;
              const value = input.value.trim();
              if (value && !tags.includes(value)) {
                setRecipeFormData((prev) => ({ ...prev, tags: [...prev.tags, value] }));
                input.value = "";
              }
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            const input = document.getElementById("tag-input") as HTMLInputElement;
            const value = input?.value.trim();
            if (value && !tags.includes(value)) {
              setRecipeFormData((prev) => ({ ...prev, tags: [...prev.tags, value] }));
              input.value = "";
            }
          }}
          className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function DietaryFlagsSection({
  dietaryFlags,
  setRecipeFormData,
}: {
  dietaryFlags: string[];
  setRecipeFormData: React.Dispatch<React.SetStateAction<RecipeFormDataInternal>>;
}) {
  const allFlags = ["vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "paleo", "low-carb", "high-protein"];

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Dietary Flags</label>
      <div className="flex flex-wrap gap-2">
        {allFlags.map((flag) => (
          <button
            key={flag}
            type="button"
            onClick={() =>
              setRecipeFormData((prev) => ({
                ...prev,
                dietaryFlags: prev.dietaryFlags.includes(flag)
                  ? prev.dietaryFlags.filter((f) => f !== flag)
                  : [...prev.dietaryFlags, flag],
              }))
            }
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              dietaryFlags.includes(flag)
                ? "bg-emerald-500 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
            }`}
          >
            {flag}
          </button>
        ))}
      </div>
    </div>
  );
}
