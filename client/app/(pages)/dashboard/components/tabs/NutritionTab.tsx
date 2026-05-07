"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Utensils,
  Plus,
  Clock,
  Salad,
  Calendar,
  BarChart3,
} from "lucide-react";
import { NutritionAnalytics } from "./nutrition/NutritionAnalytics";
import { RecipeDetailsModal } from "./nutrition/RecipeDetailsModal";
import { TodayTab, PlansTab, RecipesTab } from "./nutrition/tabs";
import { MealHistoryTab } from "./nutrition/MealHistoryTab";
import { DashboardUnderlineTabs } from "../DashboardUnderlineTabs";
import { MacroHeroCard } from "./nutrition/MacroHeroCard";
import {
  DeleteConfirmModal,
  CreatePlanModal,
  CreateMealModal,
  CreateRecipeModal,
  ShoppingItemModal,
  AIGenerateShoppingModal,
  ViewAllShoppingModal,
} from "./nutrition/modals";
import { useNutritionData } from "./nutrition/hooks/useNutritionData";

// ============================================
// MAIN COMPONENT (thin orchestrator)
// ============================================

export function NutritionTab() {
  const [activeView, setActiveView] = useState<"today" | "plan" | "recipes" | "analytics" | "history">("today");

  const data = useNutritionData();

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header -- Title + Add Meal CTA */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 shrink-0">
            <Utensils className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] sm:text-[18px] font-bold text-white tracking-tight">Today&apos;s Nutrition</h2>
            <p className="text-slate-400 text-[12px] sm:text-[13px] truncate mt-0.5">
              {data.activePlan ? data.activePlan.name : "No active plan — create one to track macros"}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            data.resetMealForm();
            data.setEditingMeal(null);
            data.setShowCreateMealModal(true);
          }}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[13px] transition-all shadow-lg shadow-emerald-600/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span> Meal
        </motion.button>
      </motion.div>

      {/* Today's Nutrition -- 4 standalone macro cards with sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {(
          [
            { key: "calories", label: "Calories", accent: "#f97316", unitOverride: "Kcal" },
            { key: "protein",  label: "Protein",  accent: "#06b6d4", unitOverride: "g" },
            { key: "carbs",    label: "Carbs",    accent: "#a855f7", unitOverride: "g" },
            { key: "fat",      label: "Fat",      accent: "#fb7185", unitOverride: "g" },
          ] as const
        ).map((m, idx) => {
          const macroValue = data.macros[m.key];
          if (!macroValue) return null;
          return (
            <MacroHeroCard
              key={m.key}
              index={idx}
              label={m.label}
              current={macroValue.current}
              target={macroValue.target}
              unit={m.unitOverride}
              accent={m.accent}
            />
          );
        })}
      </div>

      {/* Sub-tabs */}
      <DashboardUnderlineTabs
        layoutId="nutritionSubTabUnderline"
        activeId={activeView}
        onTabChange={(id) => setActiveView(id as typeof activeView)}
        className="-mx-1 px-1"
        tabs={[
          { id: "today", label: "Today", icon: Utensils },
          { id: "plan", label: "Plans", icon: Clock },
          { id: "recipes", label: "Recipes", icon: Salad },
          { id: "history", label: "History", icon: Calendar },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
        ]}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeView === "today" && (
          <TodayTab
            key="today"
            meals={data.meals}
            mealsLoading={data.mealsLoading}
            macros={data.macros}
            activePlan={data.activePlan || null}
            waterLog={data.waterLog}
            waterLoading={data.waterLoading}
            waterUpdating={data.waterUpdating}
            shoppingItems={data.shoppingItems}
            shoppingLoading={data.shoppingLoading}
            expandedMeal={data.expandedMeal}
            onMealExpand={data.setExpandedMeal}
            onAddMeal={() => {
              data.resetMealForm();
              data.setEditingMeal(null);
              data.setShowCreateMealModal(true);
            }}
            onEditMeal={data.openEditMeal}
            onDeleteMeal={(mealId) => data.setShowDeleteConfirm(`meal-${mealId}`)}
            onAddWater={data.addWaterGlass}
            onRemoveWater={data.removeWaterGlass}
            onShoppingItemToggle={data.toggleShoppingItem}
            onShoppingItemEdit={data.openEditShoppingItem}
            onShoppingItemDelete={data.deleteShoppingItem}
            onShoppingAdd={() => {
              data.resetShoppingForm();
              data.setEditingShoppingItem(null);
              data.setShowShoppingModal(true);
            }}
            onShoppingAIGenerate={() => data.setShowAIGenerateModal(true)}
            onShoppingViewAll={() => data.setShowViewAllShoppingModal(true)}
            onShoppingClearPurchased={data.clearPurchasedItems}
          />
        )}

        {activeView === "plan" && (
          <PlansTab
            key="plan"
            plans={data.dietPlans}
            plansLoading={data.plansLoading}
            selectedPlanIds={data.selectedPlanIds}
            onPlanSelect={data.togglePlanSelection}
            onPlanDelete={(planId) => data.setShowDeleteConfirm(`plan-${planId}`)}
            onPlansDelete={data.deleteSelectedPlans}
            onPlanActivate={data.activateDietPlan}
            onPlanEdit={data.openEditPlan}
            onPlanCreate={() => {
              data.resetPlanForm();
              data.setEditingPlan(null);
              data.setShowCreatePlanModal(true);
            }}
            onAIGenerate={data.generateAIDietPlan}
            aiGenerating={data.aiPlanGenerating}
          />
        )}

        {activeView === "recipes" && (
          <RecipesTab
            key="recipes"
            recipes={data.recipes}
            recipesLoading={data.recipesLoading}
            selectedRecipeIds={data.selectedRecipeIds}
            recipeFilterCategory={data.recipeFilterCategory}
            showFavoritesOnly={data.showFavoritesOnly}
            onRecipeSelect={(recipeId) => {
              data.setSelectedRecipeIds((prev) => {
                const next = new Set(prev);
                if (next.has(recipeId)) {
                  next.delete(recipeId);
                } else {
                  next.add(recipeId);
                }
                return next;
              });
            }}
            onRecipesDelete={data.deleteSelectedRecipes}
            onRecipeFavorite={data.toggleRecipeFavorite}
            onRecipeEdit={data.openEditRecipe}
            onRecipeDelete={(recipeId) => data.setShowDeleteConfirm(`recipe-${recipeId}`)}
            onRecipeView={data.setViewingRecipe}
            onRecipeCreate={() => {
              data.resetRecipeForm();
              data.setEditingRecipe(null);
              data.setShowCreateRecipeModal(true);
            }}
            onFilterCategoryChange={data.setRecipeFilterCategory}
            onFavoritesToggle={() => data.setShowFavoritesOnly(!data.showFavoritesOnly)}
          />
        )}

        {activeView === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <MealHistoryTab
              onEditMeal={data.openEditMeal}
              onDeleteMeal={(mealId) => data.setShowDeleteConfirm(`meal-${mealId}`)}
            />
          </motion.div>
        )}

        {activeView === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <NutritionAnalytics />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODALS                                       */}
      {/* ============================================ */}

      {/* Create/Edit Meal Modal */}
      <CreateMealModal
        isOpen={data.showCreateMealModal}
        editingMeal={data.editingMeal}
        mealFormData={data.mealFormData}
        setMealFormData={data.setMealFormData}
        mealIconsList={data.mealIconsList}
        mealInputMode={data.mealInputMode}
        setMealInputMode={data.setMealInputMode}
        editingItemId={data.editingItemId}
        setEditingItemId={data.setEditingItemId}
        showCustomFood={data.showCustomFood}
        setShowCustomFood={data.setShowCustomFood}
        customFoodDraft={data.customFoodDraft}
        setCustomFoodDraft={data.setCustomFoodDraft}
        formTotals={data.formTotals}
        isMealFormValid={data.isMealFormValid ?? false}
        filteredFoods={data.filteredFoods}
        foodSearch={data.foodSearch}
        setFoodSearch={data.setFoodSearch}
        selectedCategory={data.selectedCategory}
        setSelectedCategory={data.setSelectedCategory}
        mealsSaving={data.mealsSaving}
        aiMealDescription={data.aiMealDescription}
        setAiMealDescription={data.setAiMealDescription}
        aiMealGenerating={data.aiMealGenerating}
        aiMealError={data.aiMealError}
        setAiMealError={data.setAiMealError}
        generateMealWithAI={data.generateMealWithAI}
        imageCaptureMode={data.imageCaptureMode}
        setImageCaptureMode={data.setImageCaptureMode}
        capturedImage={data.capturedImage}
        setCapturedImage={data.setCapturedImage}
        imageFile={data.imageFile}
        setImageFile={data.setImageFile}
        isAnalyzingImage={data.isAnalyzingImage}
        imageAnalysisResult={data.imageAnalysisResult}
        setImageAnalysisResult={data.setImageAnalysisResult}
        imageAnalysisError={data.imageAnalysisError}
        setImageAnalysisError={data.setImageAnalysisError}
        mealImageDescription={data.mealImageDescription}
        setMealImageDescription={data.setMealImageDescription}
        isCameraActive={data.isCameraActive}
        videoRef={data.videoRef}
        canvasRef={data.canvasRef}
        fileInputRef={data.fileInputRef}
        imageScanMode={data.imageScanMode}
        setImageScanMode={data.setImageScanMode}
        nutritionLabelData={data.nutritionLabelData}
        setNutritionLabelData={data.setNutritionLabelData}
        startCamera={data.startCamera}
        stopCamera={data.stopCamera}
        capturePhoto={data.capturePhoto}
        handleFileChange={data.handleFileChange}
        analyzeFoodImage={data.analyzeFoodImage}
        analyzeNutritionLabel={data.analyzeNutritionLabel}
        populateMealFromLabel={data.populateMealFromLabel}
        addFoodItem={data.addFoodItem}
        addCustomFood={data.addCustomFood}
        removeFoodItem={data.removeFoodItem}
        resetMealForm={data.resetMealForm}
        createMeal={data.createMeal}
        updateMeal={data.updateMeal}
        onClose={() => {
          data.setShowCreateMealModal(false);
          data.setEditingMeal(null);
        }}
      />

      {/* Create/Edit Plan Modal */}
      <CreatePlanModal
        isOpen={data.showCreatePlanModal}
        editingPlan={data.editingPlan}
        planFormData={data.planFormData}
        plansSaving={data.plansSaving}
        onClose={() => data.setShowCreatePlanModal(false)}
        onFormChange={data.setPlanFormData}
        onSave={data.editingPlan ? data.updateDietPlan : data.createDietPlan}
        onCancel={() => {
          data.setShowCreatePlanModal(false);
          data.setEditingPlan(null);
          data.resetPlanForm();
        }}
      />

      {/* Shopping Item Modal */}
      <ShoppingItemModal
        isOpen={data.showShoppingModal}
        editingItem={data.editingShoppingItem}
        formData={data.shoppingFormData}
        onClose={() => data.setShowShoppingModal(false)}
        onFormChange={data.setShoppingFormData}
        onSave={data.editingShoppingItem ? data.updateShoppingItem : data.createShoppingItem}
        onCancel={() => {
          data.setShowShoppingModal(false);
          data.setEditingShoppingItem(null);
          data.resetShoppingForm();
        }}
      />

      {/* AI Generate Shopping Modal */}
      <AIGenerateShoppingModal
        isOpen={data.showAIGenerateModal}
        prompt={data.shoppingAiPrompt}
        generating={data.shoppingAiGenerating}
        aiResponse={data.aiResponse}
        onClose={() => data.setShowAIGenerateModal(false)}
        onPromptChange={data.setShoppingAiPrompt}
        onGenerate={data.generateShoppingWithAI}
      />

      {/* View All Shopping Modal */}
      <ViewAllShoppingModal
        isOpen={data.showViewAllShoppingModal}
        shoppingItems={data.shoppingItems}
        pendingItems={data.pendingItems}
        purchasedItems={data.purchasedItems}
        totalCalories={data.totalCalories}
        onClose={() => data.setShowViewAllShoppingModal(false)}
        onToggleItem={data.toggleShoppingItem}
        onEditItem={data.openEditShoppingItem}
        onDeleteItem={data.deleteShoppingItem}
        onClearPurchased={data.clearPurchasedItems}
        onAIGenerate={() => data.setShowAIGenerateModal(true)}
        onAddItem={() => {
          data.resetShoppingForm();
          data.setEditingShoppingItem(null);
          data.setShowShoppingModal(true);
        }}
      />

      {/* Create/Edit Recipe Modal */}
      <CreateRecipeModal
        isOpen={data.showCreateRecipeModal}
        editingRecipe={data.editingRecipe}
        recipeFormData={data.recipeFormData}
        setRecipeFormData={data.setRecipeFormData}
        recipesSaving={data.recipesSaving}
        isUploadingRecipeImage={data.isUploadingRecipeImage}
        recipeImageInputRef={data.recipeImageInputRef}
        handleRecipeImageSelect={data.handleRecipeImageSelect}
        recipeImageCaptureMode={data.recipeImageCaptureMode}
        setRecipeImageCaptureMode={data.setRecipeImageCaptureMode}
        recipeCapturedImage={data.recipeCapturedImage}
        setRecipeCapturedImage={data.setRecipeCapturedImage}
        recipeImageFile={data.recipeImageFile}
        setRecipeImageFile={data.setRecipeImageFile}
        isAnalyzingRecipeImage={data.isAnalyzingRecipeImage}
        recipeImageAnalysisResult={data.recipeImageAnalysisResult}
        recipeImageAnalysisError={data.recipeImageAnalysisError}
        setRecipeImageAnalysisError={data.setRecipeImageAnalysisError}
        isRecipeCameraActive={data.isRecipeCameraActive}
        recipeVideoRef={data.recipeVideoRef}
        recipeCanvasRef={data.recipeCanvasRef}
        recipeFileInputRef={data.recipeFileInputRef}
        startRecipeCamera={data.startRecipeCamera}
        stopRecipeCamera={data.stopRecipeCamera}
        captureRecipePhoto={data.captureRecipePhoto}
        handleRecipeFileChange={data.handleRecipeFileChange}
        analyzeRecipeImage={data.analyzeRecipeImage}
        createRecipe={data.createRecipe}
        updateRecipe={data.updateRecipe}
        resetRecipeForm={data.resetRecipeForm}
        onClose={() => {
          data.setShowCreateRecipeModal(false);
          data.setEditingRecipe(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        showDeleteConfirm={data.showDeleteConfirm}
        onClose={() => data.setShowDeleteConfirm(null)}
        onDeleteMeal={data.deleteMeal}
        onDeletePlan={data.deleteDietPlan}
        onDeleteRecipe={data.deleteRecipe}
      />

      {/* Recipe Details Modal */}
      <RecipeDetailsModal
        recipe={data.viewingRecipe}
        isOpen={!!data.viewingRecipe}
        onClose={() => data.setViewingRecipe(null)}
        onEdit={data.openEditRecipe}
        onToggleFavorite={data.toggleRecipeFavorite}
      />
    </div>
  );
}
